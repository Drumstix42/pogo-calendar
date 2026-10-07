<template>
    <div class="all-month-events" :style="{ '--all-month-bar-height': `${calendarSettings.eventBarHeight}px` }">
        <VTooltip :disabled="isTouchDevice" placement="top" :delay="{ show: 300, hide: 0 }" distance="6" class="all-month-toggle-wrapper">
            <template #popper>
                <div class="tooltip-text">Events running through this entire month</div>
            </template>
            <button
                type="button"
                class="btn btn-icon-ghost btn-sm all-month-toggle"
                :aria-expanded="!isCollapsed"
                @click="calendarSettings.toggleCollapsibleSection(COLLAPSE_KEY)"
            >
                <span class="badge rounded-pill bg-secondary">{{ events.length + hiddenCount }}</span>
                <span>All month</span>
                <ChevronDown v-if="isCollapsed" :size="16" />
                <ChevronUp v-else :size="16" />
            </button>
        </VTooltip>

        <div v-if="!isCollapsed" class="all-month-bars" :class="{ 'single-row': events.length <= 1 }">
            <div v-for="event in events" :key="event.eventID" class="all-month-bar-slot">
                <MultiDayEventBar
                    :event="event"
                    :day-instance="referenceDay"
                    bar-class="start-cap end-cap"
                    :slot-top="0"
                    :slot-index="undefined"
                    :date-range="getDateRange(event)"
                />
            </div>

            <VTooltip
                v-if="hiddenCount > 0"
                :disabled="isTouchDevice"
                placement="top"
                :delay="{ show: 300, hide: 0 }"
                distance="6"
                class="all-month-hidden-wrapper"
            >
                <template #popper>
                    <div class="tooltip-text">
                        {{ hiddenCount }} all-month event{{ hiddenCount === 1 ? '' : 's' }} hidden by filters. Click to see all
                    </div>
                </template>
                <button
                    type="button"
                    class="all-month-hidden"
                    aria-label="Show all all-month events, including hidden"
                    @click="openEventList(ALL_MONTH_EVENT_LIST)"
                >
                    +{{ hiddenCount }}<span class="d-none d-md-inline">hidden</span>
                </button>
            </VTooltip>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ChevronDown, ChevronUp } from '@lucide/vue';
import { type Dayjs } from 'dayjs';
import { computed } from 'vue';

import { useDeviceDetection } from '@/composables/useDeviceDetection';
import { ALL_MONTH_EVENT_LIST } from '@/composables/useEventList';
import { useUrlSync } from '@/composables/useUrlSync';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventsStore } from '@/stores/events';
import { DATE_FORMAT } from '@/utils/dateFormat';
import { parseEventDate } from '@/utils/eventDate';
import { type PogoEvent } from '@/utils/eventTypes';

import MultiDayEventBar from '@/components/Calendar/CalendarDay/MultiDayEventBar.vue';

interface Props {
    events: PogoEvent[];
    /** All-month events left out by the event filters, counted so the total stays honest. */
    hiddenCount: number;
    /** Day the bars act on for tooltips and deep links (today, or the month's first day). */
    referenceDay: Dayjs;
}

defineProps<Props>();

const COLLAPSE_KEY = 'calendar/all-month-events';

const calendarSettings = useCalendarSettingsStore();
const eventsStore = useEventsStore();
const { isTouchDevice } = useDeviceDetection();
const { openEventList } = useUrlSync();

const isCollapsed = computed(() => calendarSettings.isCollapsibleSectionCollapsed(COLLAPSE_KEY));

function getDateRange(event: PogoEvent) {
    const metadata = eventsStore.eventMetadata[event.eventID];
    const start = metadata?.startDate ?? parseEventDate(event.start, calendarSettings.manualTimeOffsetHours);
    const end = metadata?.endDate ?? parseEventDate(event.end, calendarSettings.manualTimeOffsetHours);
    return { start: start.format(DATE_FORMAT.DISPLAY_DATE), end: end.format(DATE_FORMAT.DISPLAY_DATE) };
}
</script>

<style scoped>
.all-month-events {
    /* The toggle is taller than the chips for an easier tap target; the chips are offset to center on it */
    --all-month-toggle-height: calc(var(--all-month-bar-height) + 8px);

    display: flex;
    align-items: flex-start;
    gap: 4px;
    padding: 3px 2px;
}

.all-month-toggle-wrapper,
.all-month-hidden-wrapper {
    display: flex; /* no inline line box around the content, which would add height below it */
    flex-shrink: 0;
}

.all-month-toggle {
    height: var(--all-month-toggle-height);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0 0.3rem;
    font-size: 0.8rem;
    font-weight: 500;
    line-height: 1rem;
    white-space: nowrap;

    .badge {
        font-size: 0.7rem;
        line-height: 1rem;
        padding: 0.1em 0.55em;
    }
}

.all-month-bars {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 2px 4px;
    padding-top: calc((var(--all-month-toggle-height) - var(--all-month-bar-height)) / 2);

    /* A lone event shares its line with the hidden chip, truncating its title rather than wrapping */
    &.single-row {
        flex-wrap: nowrap;
    }
}

.all-month-hidden {
    display: inline-flex;
    align-items: center;
    gap: 0.3em; /* spaces the "hidden" label, and collapses with it on small screens */
    height: var(--all-month-bar-height);
    padding: 0 6px;
    font-size: 0.7rem;
    font-style: italic;
    white-space: nowrap;
    /* Matches the timeline's .hidden-events-indicator */
    color: var(--bs-secondary-color);
    background: var(--bs-tertiary-bg);
    border: 1px dashed var(--bs-tertiary-color);
    border-radius: 4px;
    cursor: pointer;
    transition:
        color 0.2s ease,
        background-color 0.2s ease,
        border-color 0.2s ease;

    &:hover {
        color: var(--bs-body-color);
        background: var(--bs-secondary-bg);
        border-color: var(--bs-secondary-color);
    }
}

.all-month-bar-slot {
    position: relative;
    height: var(--all-month-bar-height);
    min-width: 0;
    max-width: 100%;
}
</style>
