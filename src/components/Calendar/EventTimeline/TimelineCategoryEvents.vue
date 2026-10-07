<template>
    <!-- Grouped by start date (upcoming/future) -->
    <TransitionGroup v-if="dateGroups" name="fade" tag="div" class="category-events">
        <div v-for="dateGroup in dateGroups" :key="dateGroup.dateKey" class="date-group">
            <div class="date-divider">
                <span class="day-of-week">{{ dateGroup.dayOfWeek }}</span> {{ dateGroup.dateStr }}
            </div>
            <TransitionGroup name="fade" tag="div" :key="dateGroup.dateKey" class="date-events">
                <TimelineEvent
                    v-for="event in dateGroup.events"
                    :key="event.eventID"
                    :event="event"
                    :is-active="activeEventId === event.eventID"
                    :filtered-out="filteredOutIds?.has(event.eventID)"
                    @activate="emit('activate', $event)"
                />
            </TransitionGroup>
        </div>
    </TransitionGroup>

    <!-- Flat list (today/ongoing); the slot holds keyed extras like an empty-state message -->
    <TransitionGroup v-else name="fade" tag="div" class="category-events">
        <TimelineEvent
            v-for="event in events"
            :key="event.eventID"
            :event="event"
            :is-active="activeEventId === event.eventID"
            :filtered-out="filteredOutIds?.has(event.eventID)"
            @activate="emit('activate', $event)"
        />
        <slot />
    </TransitionGroup>
</template>

<script setup lang="ts">
import { type TimelineDateGroup } from '@/composables/useTimelineCategories';
import { type PogoEvent } from '@/utils/eventTypes';

import TimelineEvent from '../TimelineEvent/TimelineEvent.vue';

interface Props {
    events: PogoEvent[];
    /** When set, renders these date groups instead of the flat `events` list. */
    dateGroups?: TimelineDateGroup[];
    activeEventId: string | null;
    /** Events shown despite the filters hiding them, drawn with a dashed border. */
    filteredOutIds?: Set<string>;
}

defineProps<Props>();

const emit = defineEmits<{
    activate: [eventId: string];
}>();
</script>

<style lang="scss" scoped>
.category-events {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 8px;
    padding: 0 4px;
}

.date-events {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.date-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
    transition: all 0.3s ease;

    &:last-child {
        margin-bottom: 0;
    }
}

.date-divider {
    margin: 4px 0 1px 0;
    padding: 0 4px;
    font-size: 0.85rem;
    letter-spacing: 0.5px;
    color: var(--bs-secondary-color);
    line-height: 1.3;
    transition: all 0.3s ease;

    .day-of-week {
        font-weight: 600;
    }
}

/* Improve fade transitions for timeline events */
.category-events > *,
.date-events > * {
    transition: all 0.3s ease;
}

.category-events,
.date-events {
    position: relative;
    transition: all 0.3s ease;
}

/* Ensure fade-in happens at final position without sliding */
.category-events .fade-enter-active,
.date-events .fade-enter-active {
    transition: opacity 0.3s ease;
}

.category-events .fade-enter-from,
.date-events .fade-enter-from {
    opacity: 0;
}

/* Use absolute positioning during leave to prevent layout shift */
.category-events .fade-leave-active,
.date-events .fade-leave-active {
    position: absolute;
    width: 100%;
}

.date-events .fade-enter-active {
    /* Override to ensure no transform/position changes during enter */
    transition: opacity 0.3s ease !important;
    transform: none !important;
}
</style>
