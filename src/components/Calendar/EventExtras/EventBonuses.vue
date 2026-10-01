<template>
    <div v-if="groups.length" class="event-bonuses">
        <div class="bonus-header">
            <strong>{{ headerLabel }}:</strong>
        </div>
        <div
            class="scroll-shadow-hints"
            :class="{
                'can-scroll-up': canScrollUp,
                'can-scroll-down': canScrollDown,
            }"
        >
            <div ref="bonusListRef" class="event-bonus-list" @scroll="updateScrollState">
                <div v-for="(group, groupIndex) in displayGroups" :key="groupIndex" class="event-bonus-group">
                    <div v-if="group.label" class="event-bonus-group-title">{{ group.label }}</div>
                    <div v-for="(item, itemIndex) in group.items" :key="itemIndex" class="bonus-item">
                        <img v-if="item.image" :src="item.image" :alt="item.text" class="bonus-icon" />
                        <span class="bonus-text">{{ item.text }}</span>
                    </div>
                    <div v-if="group.notes?.length" class="event-bonus-notes">
                        <div v-for="(note, noteIndex) in group.notes" :key="noteIndex" class="event-bonus-note">{{ note }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { useScrollShadow } from '@/composables/useScrollShadow';
import { useEventTypeColorsStore } from '@/stores/eventTypeColors';
import { getEventBonusGroups } from '@/utils/eventBonuses';
import { type PogoEvent } from '@/utils/eventTypes';

interface Props {
    event: PogoEvent;
}

const props = defineProps<Props>();

const eventTypeColorsStore = useEventTypeColorsStore();

// The event type's configured color (respects user overrides), used for the bonus card accent border.
const eventColor = computed(() => eventTypeColorsStore.getEventTypeColor(props.event.eventType));

const bonusListRef = ref<HTMLElement>();
const { canScrollUp, canScrollDown, updateScrollState } = useScrollShadow(bonusListRef);

const groups = computed(() => getEventBonusGroups(props.event));

// The compact time range stands in for `description`, whose full sentences are too wordy for the card.
const displayGroups = computed(() =>
    groups.value.map(group => {
        const timeRange = group.startTime && group.endTime ? `${group.startTime} – ${group.endTime}` : null;
        return { ...group, label: [group.title, timeRange].filter(Boolean).join(' · ') };
    }),
);

const headerLabel = computed(() => {
    const itemCount = groups.value.reduce((count, group) => count + group.items.length, 0);
    return itemCount === 1 ? 'Bonus' : 'Bonuses';
});
</script>

<style scoped>
.bonus-header {
    font-size: 12px;
    line-height: 1;
    color: color-mix(in srgb, var(--bs-body-color) 80%, transparent);
    font-weight: 500;
    padding: 0 0.6rem 0.3rem 0;
}

.event-bonuses {
    margin: 0.1rem 0 0.1rem 0;
    padding: 0.4rem 0.6rem 0.3rem 0.6rem;
    background-color: color-mix(in srgb, var(--bs-body-color) 3%, transparent);
    border: 1px solid color-mix(in srgb, var(--bs-body-color) 12%, transparent);
    border-left: 3px solid color-mix(in srgb, v-bind(eventColor) 70%, transparent);
    border-radius: 0.25rem;
}

.event-bonus-list {
    max-height: 160px;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-right: 0.2rem;
}

.event-bonus-group {
    margin-bottom: 0.5rem;
}

.event-bonus-group:last-child {
    margin-bottom: 0;
}

.event-bonus-group-title {
    font-size: 0.65rem;
    font-weight: 600;
    color: color-mix(in srgb, var(--bs-body-color) 60%, transparent);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-bottom: 0.2rem;
    padding-bottom: 0.15rem;
    border-bottom: 1px solid color-mix(in srgb, var(--bs-body-color) 10%, transparent);
}

.event-bonus-notes {
    margin-top: 0.4rem;
}

.event-bonus-note {
    font-size: 0.65rem;
    color: color-mix(in srgb, var(--bs-body-color) 70%, transparent);
    line-height: 1.2;
    font-style: italic;
    margin-bottom: 0.2rem;
}

.event-bonus-note:last-child {
    margin-bottom: 0;
}
</style>
