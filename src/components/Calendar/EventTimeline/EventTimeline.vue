<template>
    <div class="event-timeline" :class="{ 'sidebar-mode': isSidebarMode }">
        <div class="timeline-search" :class="{ 'is-active': isSearching }">
            <Search :size="15" class="timeline-search-icon" />
            <input
                v-model="searchQuery"
                type="text"
                class="timeline-search-input"
                placeholder="Search events, Pokémon, etc"
                aria-label="Search timeline events"
            />
            <button v-if="isSearching" type="button" class="timeline-search-clear" aria-label="Clear search" @click="clearSearch">
                <X :size="14" />
            </button>
        </div>

        <div v-if="!hasAnyEvents" class="no-events">
            <p>No upcoming events found</p>
        </div>

        <div v-else-if="isSearching && !hasMatches" class="no-events">
            <p>No events match your search</p>
        </div>

        <TransitionGroup v-else name="fade" tag="div" class="timeline-events">
            <!-- Loop through categories in order -->
            <TimelineCategorySection
                v-for="category in eventCategories"
                :key="category.key"
                :category="category"
                :category-events="filteredCategorizedEvents[category.key]"
                :date-groups="filteredGroupedByDate[category.key] ?? []"
                :total-count="totalEventsCounts[category.key]"
                :hidden-count="hiddenEventsCounts[category.key]"
                :active-event-id="activeEventId"
                :search-active="isSearching"
                @activate="setActiveEvent"
            />
        </TransitionGroup>
    </div>
</template>

<script setup lang="ts">
import { Search, X } from '@lucide/vue';

import { useTimelineActiveEvent } from '@/composables/useTimelineActiveEvent';
import { useTimelineCategories } from '@/composables/useTimelineCategories';
import { useTimelineSearch } from '@/composables/useTimelineSearch';

import TimelineCategorySection from './TimelineCategorySection.vue';

interface Props {
    isSidebarMode?: boolean;
}

defineProps<Props>();

const { eventCategories, categorizedEvents, totalEventsCounts, hiddenEventsCounts, groupedByDate, hasAnyEvents } = useTimelineCategories();
const { activeEventId, setActiveEvent } = useTimelineActiveEvent();
const { searchQuery, isSearching, filteredCategorizedEvents, filteredGroupedByDate, hasMatches, clearSearch } = useTimelineSearch(
    categorizedEvents,
    groupedByDate,
);
</script>

<style lang="scss" scoped>
.event-timeline {
    padding: 0;

    /* Sticky offsets shared with the nested schedule headers in TimelineRaidSchedule (inherited via
       CSS custom props). --tl-sticky-top is where the category header parks; the day + section
       headers stack below it. Heights are approximate — nudge if headers gap or overlap. */
    --tl-sticky-top: 0px;
    --tl-category-header-h: 1.8rem;
    --tl-day-header-h: 1.7rem;
}

.event-timeline:not(.sidebar-mode) {
    --tl-sticky-top: var(--navbar-height-scrolled);
}

.timeline-search {
    position: relative;
    display: flex;
    align-items: center;
    max-width: 800px;
    margin: 0 auto 0.6rem auto;
}

.event-timeline:not(.sidebar-mode) .timeline-search {
    margin-top: 0.5rem;
    margin-bottom: 1rem;
}

.timeline-search-icon {
    position: absolute;
    left: 10px;
    color: var(--bs-secondary-color);
    pointer-events: none;
}

.timeline-search-input {
    width: 100%;
    padding: 0.5rem 2rem;
    font-size: 0.8rem;
    line-height: 0.8rem;
    color: var(--bs-body-color);
    background-color: var(--bs-body-bg);
    border: 1px solid var(--bs-border-color);
    border-radius: 6px;
    transition:
        border-color 0.15s ease,
        background-color 0.15s ease,
        box-shadow 0.15s ease;
}

.timeline-search-input:focus {
    outline: none;
    border-color: var(--bs-secondary-color);
    box-shadow: 0 0 0 0.2rem var(--bs-focus-ring-color);
}

.timeline-search-input::placeholder {
    color: color-mix(in srgb, var(--bs-secondary-color) 65%, transparent);
}

/* A search in progress acts as an active filter on the list below — tint it blue as a reminder. */
.timeline-search.is-active .timeline-search-icon {
    color: var(--bs-primary);
}

.timeline-search.is-active .timeline-search-input {
    background-color: color-mix(in srgb, var(--bs-primary) 10%, var(--bs-tertiary-bg));
    border-color: color-mix(in srgb, var(--bs-primary) 40%, var(--bs-border-color));
}

.timeline-search.is-active .timeline-search-input:focus {
    box-shadow: 0 0 0 0.2rem color-mix(in srgb, var(--bs-primary) 25%, transparent);
}

.timeline-search-clear {
    position: absolute;
    right: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    color: var(--bs-secondary-color);
    background-color: color-mix(in srgb, var(--bs-body-color) 8%, transparent);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition:
        color 0.15s ease,
        background-color 0.15s ease;
}

.timeline-search-clear:hover {
    color: var(--bs-body-color);
    background-color: color-mix(in srgb, var(--bs-body-color) 16%, transparent);
}

.no-events {
    text-align: center;
    padding: 2rem;
    color: var(--bs-secondary-color);
}

.no-events p {
    margin: 0;
    font-style: italic;
}

.timeline-events {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin: 0 auto 1rem auto;
    max-width: 800px;
}
</style>
