<template>
    <div class="season-bonuses">
        <!-- Daily Discoveries -->
        <div v-if="sortedDailyBonuses.length" class="season-section">
            <div class="season-header"><strong>Daily Discoveries</strong></div>
            <div
                class="scroll-shadow-hints"
                :class="{
                    'can-scroll-up': canScrollUp,
                    'can-scroll-down': canScrollDown,
                }"
            >
                <div ref="listRef" class="season-daily-list" @scroll="updateScrollState">
                    <div
                        v-for="day in sortedDailyBonuses"
                        :key="day.dayOfWeek"
                        :ref="day.dayOfWeek === highlightDayOfWeek ? setHighlightedRef : undefined"
                        class="season-daily-day"
                        :class="{ 'is-highlighted': day.dayOfWeek === highlightDayOfWeek }"
                    >
                        <div class="season-daily-day-name">{{ day.day }}</div>
                        <div v-for="(group, index) in day.bonuses" :key="index" class="season-daily-group">
                            <div v-if="group.title" class="season-daily-group-title">{{ group.title }}</div>
                            <ul class="season-daily-items">
                                <li v-for="item in group.items" :key="item" class="season-daily-item">{{ item }}</li>
                            </ul>
                        </div>
                        <div v-if="day.footnote" class="season-daily-footnote">{{ day.footnote }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Season-long bonuses -->
        <div v-if="season.seasonBonuses?.length" class="season-section">
            <div class="season-header"><strong>Season Bonuses</strong></div>
            <div class="season-bonus-list">
                <template v-if="hasMilestones">
                    <div v-for="tier in milestoneTiers" :key="tier.milestone ?? 'flat'" class="season-bonus-tier">
                        <div v-if="tier.milestone" class="season-bonus-milestone">{{ tier.milestone }}</div>
                        <div v-for="entry in tier.entries" :key="entry.text" class="bonus-item">
                            <img v-if="entry.image" :src="entry.image" :alt="entry.text" class="bonus-icon" />
                            <span class="bonus-text">{{ entry.text }}</span>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div v-for="entry in season.seasonBonuses" :key="entry.text" class="bonus-item">
                        <img v-if="entry.image" :src="entry.image" :alt="entry.text" class="bonus-icon" />
                        <span class="bonus-text">{{ entry.text }}</span>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { type ComponentPublicInstance, computed, nextTick, onMounted, ref, watch } from 'vue';

import { useScrollShadow } from '@/composables/useScrollShadow';
import { useEventTypeColorsStore } from '@/stores/eventTypeColors';
import { type SeasonBonusEntry, type SeasonData } from '@/utils/eventTypes';

interface Props {
    season: SeasonData;
    highlightDayOfWeek?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
    highlightDayOfWeek: null,
});

const eventTypeColorsStore = useEventTypeColorsStore();

// The season event type's configured color (respects user overrides), used for accents below.
const seasonColor = computed(() => eventTypeColorsStore.getEventTypeColor('season'));

const listRef = ref<HTMLElement | null>(null);
const highlightedRef = ref<HTMLElement | null>(null);

const { canScrollUp, canScrollDown, updateScrollState } = useScrollShadow(listRef);

const setHighlightedRef = (el: Element | ComponentPublicInstance | null) => {
    highlightedRef.value = (el as HTMLElement) ?? null;
};

// Center the highlighted day by adjusting ONLY the list's scrollTop — unlike scrollIntoView,
// this never scrolls ancestor containers (page, offcanvas body, etc.).
function scrollHighlightedIntoView() {
    const container = listRef.value;
    const target = highlightedRef.value;
    if (!container || !target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    container.scrollTop += targetRect.top - containerRect.top - (container.clientHeight - target.clientHeight) / 2;
}

onMounted(() => nextTick(scrollHighlightedIntoView));

watch(
    () => props.highlightDayOfWeek,
    () => nextTick(scrollHighlightedIntoView),
);

const sortedDailyBonuses = computed(() => {
    return [...(props.season.dailyBonuses ?? [])].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
});

const hasMilestones = computed(() => (props.season.seasonBonuses ?? []).some(entry => entry.milestone != null));

const milestoneTiers = computed(() => {
    const tiers: Array<{ milestone: string | null; entries: SeasonBonusEntry[] }> = [];
    const indexByMilestone = new Map<string | null, number>();

    for (const entry of props.season.seasonBonuses ?? []) {
        const key = entry.milestone ?? null;
        let tierIndex = indexByMilestone.get(key);
        if (tierIndex === undefined) {
            tierIndex = tiers.length;
            indexByMilestone.set(key, tierIndex);
            tiers.push({ milestone: key, entries: [] });
        }
        tiers[tierIndex].entries.push(entry);
    }

    return tiers;
});
</script>

<style scoped>
.season-bonuses {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.season-section {
    margin: 0.1rem 0;
    padding: 0.4rem 0.2rem 0.4rem 0.4rem;
    background-color: color-mix(in srgb, var(--bs-body-color) 3%, transparent);
    border: 1px solid color-mix(in srgb, var(--bs-body-color) 12%, transparent);
    border-left: 3px solid color-mix(in srgb, v-bind(seasonColor) 70%, transparent);
    border-radius: 0.25rem;
}

.season-header {
    font-size: 14px;
    line-height: 1;
    color: color-mix(in srgb, var(--bs-body-color) 80%, transparent);
    font-weight: 400;
    padding-bottom: 0.35rem;
}

.season-daily-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    max-height: 260px;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-right: 0.2rem;
}

.season-daily-day {
    padding: 0.2rem 0.4rem;
    border-radius: 0.2rem;
}

.season-daily-day.is-highlighted {
    background-color: color-mix(in srgb, v-bind(seasonColor) 12%, transparent);
}

.season-daily-day-name {
    font-size: 0.75rem;
    font-weight: 600;
    /* Pull toward body text color so the season hue stays readable on the tooltip/offcanvas bg. */
    color: color-mix(in srgb, v-bind(seasonColor) 65%, var(--bs-body-color));
    margin-bottom: 0.1rem;
}

.season-daily-group {
    margin-left: 1px;
    margin-bottom: 0.2rem;
}

.season-daily-group:last-child {
    margin-bottom: 0;
}

.season-daily-group-title {
    font-size: 0.68rem;
    font-weight: 500;
    color: color-mix(in srgb, var(--bs-body-color) 85%, transparent);
}

.season-daily-items {
    margin: 0.1rem 0 0;
    padding-left: 1rem;
}

.season-daily-item {
    font-size: 0.7rem;
    color: color-mix(in srgb, var(--bs-body-color) 80%, transparent);
    line-height: 1.25;
}

.season-daily-footnote {
    font-size: 0.65rem;
    color: color-mix(in srgb, var(--bs-body-color) 70%, transparent);
    line-height: 1.2;
    font-style: italic;
    margin-top: 0.2rem;
}

.season-bonus-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.season-bonus-tier {
    margin-bottom: 0.3rem;
}

.season-bonus-tier:last-child {
    margin-bottom: 0;
}

.season-bonus-milestone {
    font-size: 0.65rem;
    font-weight: 600;
    color: color-mix(in srgb, var(--bs-body-color) 60%, transparent);
    letter-spacing: 0.03em;
    margin-bottom: 0.15rem;
}

.season-bonus-tier {
    padding-left: 0.5rem;

    .bonus-item {
        padding-left: 0.25rem;
    }
}
</style>
