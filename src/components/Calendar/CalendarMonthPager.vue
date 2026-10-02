<template>
    <div ref="viewportRef" class="calendar-month-pager mb-2" :class="{ 'is-swiping': heightRange }" :style="viewportStyle">
        <div class="pager-track" :style="swipeStyle">
            <CalendarGrid
                v-for="page in pages"
                :key="page.key"
                :year="page.year"
                :month="page.month"
                :placeholder="!renderedKeys.has(page.key)"
                :load-sprites="spriteKeys.has(page.key)"
                :class="`pager-page--${page.position}`"
                :inert="page.offset !== 0"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { type Dayjs } from 'dayjs';
import { computed, shallowRef, useTemplateRef, watch } from 'vue';

import { type SwipeMonthOffset, useCalendarSwipe } from '@/composables/useCalendarSwipe';
import { useDeviceDetection } from '@/composables/useDeviceDetection';
import { useDisplayTime } from '@/composables/useDisplayTime';
import { useUrlSync } from '@/composables/useUrlSync';
import { useEventsStore } from '@/stores/events';
import { isMonthNavigable } from '@/utils/calendarGrid';

import CalendarGrid from './CalendarGrid.vue';

type PagePosition = 'previous' | 'current' | 'next';

interface Page {
    key: string;
    year: number;
    month: number;
    offset: SwipeMonthOffset | 0;
    position: PagePosition;
}

const POSITIONS: Record<Page['offset'], PagePosition> = { [-1]: 'previous', 0: 'current', 1: 'next' };

const viewportRef = useTemplateRef<HTMLElement>('viewportRef');
// Own instance: its refs update synchronously on commit, while the URL follows async.
const { urlMonth, urlYear } = useUrlSync();
const { displayToday } = useDisplayTime();
const { isTouchDevice } = useDeviceDetection();
const eventsStore = useEventsStore();

const activeMonth = computed(() => displayToday.value.year(urlYear.value).month(urlMonth.value).startOf('month'));

// Touch devices keep the neighbor months mounted beside the active one so swipes reveal them.
const pages = computed(() => {
    const offsets: Page['offset'][] = isTouchDevice.value ? [-1, 0, 1] : [0];
    return offsets.flatMap((offset): Page[] => {
        const month = activeMonth.value.add(offset, 'month');
        if (offset !== 0 && !isMonthNavigable(month, displayToday.value)) {
            return [];
        }
        return [{ key: monthKey(month), year: month.year(), month: month.month(), offset, position: POSITIONS[offset] }];
    });
});

const activeKey = computed(() => monthKey(activeMonth.value));

let lastCommitOffset: SwipeMonthOffset = 1;

const { swipeStyle, swipeProgress, transitionMs, revealingOffset, isSwiping } = useCalendarSwipe(viewportRef, {
    canSwipe: offset => pages.value.some(page => page.offset === offset),
    onCommit(offset) {
        const target = activeMonth.value.add(offset, 'month');
        lastCommitOffset = offset;
        urlMonth.value = target.month();
        urlYear.value = target.year();
    },
});

// Months rendered with full content (others show skeleton placeholders) and months allowed to load
// sprites. Entries persist while a month stays in `pages`, so the month you left is reused as-is.
const renderedKeys = shallowRef(new Set<string>());
const spriteKeys = shallowRef(new Set<string>());

watch(
    pages,
    currentPages => {
        const keys = new Set(currentPages.map(page => page.key));
        renderedKeys.value = retainKeys(renderedKeys.value, keys, activeKey.value);
        spriteKeys.value = retainKeys(spriteKeys.value, keys, activeKey.value);
    },
    { immediate: true },
);

watch(revealingOffset, offset => {
    const page = offset ? pages.value.find(p => p.offset === offset) : undefined;
    if (page && !spriteKeys.value.has(page.key)) {
        spriteKeys.value = new Set(spriteKeys.value).add(page.key);
    }
});

// Mid-swipe, the viewport height blends from the active month's to the revealed neighbor's by swipe
// progress (riding the slide/spring-back transition), so a taller month isn't cut off.
const heightRange = shallowRef<{ from: number; to: number }>();

watch(revealingOffset, offset => {
    const position = offset ? POSITIONS[offset] : undefined;
    const from = measurePageHeight('current');
    const to = position ? measurePageHeight(position) : undefined;
    heightRange.value = from !== undefined && to !== undefined ? { from, to } : undefined;
});

const viewportStyle = computed(() => {
    const range = heightRange.value;
    if (!range) {
        return undefined;
    }

    const height = range.from + (range.to - range.from) * swipeProgress.value;
    return {
        height: `${height}px`,
        transition: transitionMs.value ? `height ${transitionMs.value}ms ease-out` : 'none',
    };
});

// Neighbors are clipped to the active month's height at rest, so measure their inner grid instead.
function measurePageHeight(position: PagePosition) {
    const page = viewportRef.value?.querySelector(`.pager-page--${position}`);
    return (page?.firstElementChild as HTMLElement | null | undefined)?.offsetHeight;
}

let cancelPendingRender: (() => void) | undefined;

// One neighbor per idle slot, the last swipe direction first; never mid-gesture or while the feed
// is loading (so the initial render is just the active month).
watch([pages, renderedKeys, isSwiping, () => eventsStore.loading], scheduleNeighborRender, { immediate: true });

function scheduleNeighborRender() {
    cancelPendingRender?.();
    cancelPendingRender = undefined;
    if (isSwiping.value || eventsStore.loading) {
        return;
    }

    const pending = pages.value.filter(page => page.offset !== 0 && !renderedKeys.value.has(page.key));
    const next = pending.find(page => page.offset === lastCommitOffset) ?? pending[0];
    if (!next) {
        return;
    }

    cancelPendingRender = runWhenIdle(() => {
        renderedKeys.value = new Set(renderedKeys.value).add(next.key);
    });
}

function monthKey(month: Dayjs) {
    return month.format('YYYY-MM');
}

function retainKeys(current: Set<string>, visibleKeys: Set<string>, alwaysKey: string) {
    const next = new Set([...current].filter(key => visibleKeys.has(key)));
    next.add(alwaysKey);
    return next;
}

// iOS Safari has no requestIdleCallback.
function runWhenIdle(callback: () => void) {
    if ('requestIdleCallback' in window) {
        const id = window.requestIdleCallback(callback, { timeout: 2000 });
        return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(callback, 300);
    return () => clearTimeout(id);
}
</script>

<style scoped>
.calendar-month-pager {
    /* Horizontal touch movement is handled by the month swipe; keep vertical scroll and pinch-zoom native. */
    touch-action: pan-y pinch-zoom;
    /* Hides the neighbor months; `clip` (unlike `hidden`) isn't a scroll container, so the sticky
       day headers keep working. */
    overflow-x: clip;
}

.pager-track {
    position: relative;
}

/* At rest, neighbors take the active month's height (anything taller is clipped). */
.pager-page--previous,
.pager-page--next {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 100%;
    overflow: clip;
}

.pager-page--previous {
    left: -100%;
}

.pager-page--next {
    left: 100%;
}

/* Mid-swipe the viewport (with its blended height) does the clipping, so neighbors show at full height. */
.calendar-month-pager.is-swiping {
    overflow: clip;
}

.is-swiping .pager-page--previous,
.is-swiping .pager-page--next {
    bottom: auto;
}
</style>
