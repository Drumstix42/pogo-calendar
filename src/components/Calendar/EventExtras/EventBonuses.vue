<template>
    <div v-if="bonuses" class="event-bonuses">
        <div class="bonus-header"><strong>Bonuses:</strong></div>
        <div
            class="scroll-shadow-hints"
            :class="{
                'can-scroll-up': canScrollUp,
                'can-scroll-down': canScrollDown,
            }"
        >
            <div ref="bonusListRef" class="event-bonus-list" @scroll="updateScrollState">
                <div v-for="group in bonuses" :key="group.description ?? group.startTime" class="event-bonus-group">
                    <div v-if="group.startTime && group.endTime" class="event-bonus-time-range">{{ group.startTime }} – {{ group.endTime }}</div>
                    <div v-for="item in group.items" :key="item.text" class="bonus-item">
                        <img v-if="item.image" :src="item.image" :alt="item.text" class="bonus-icon" />
                        <span class="bonus-text">{{ item.text }}</span>
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
import { type EventBonusGroup, type PogoEvent } from '@/utils/eventTypes';

interface Props {
    event: PogoEvent;
}

const props = defineProps<Props>();

const eventTypeColorsStore = useEventTypeColorsStore();

// The event type's configured color (respects user overrides), used for the bonus card accent border.
const eventColor = computed(() => eventTypeColorsStore.getEventTypeColor(props.event.eventType));

const bonusListRef = ref<HTMLElement>();
const { canScrollUp, canScrollDown, updateScrollState } = useScrollShadow(bonusListRef);

function parseBonusStartTimeMinutes(value?: string) {
    if (!value) return Number.POSITIVE_INFINITY;

    const normalized = value.trim().toLowerCase();
    const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(a\.m\.|p\.m\.)$/);
    if (!match) return Number.POSITIVE_INFINITY;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3];

    if (hours === 12) {
        hours = period === 'a.m.' ? 0 : 12;
    } else if (period === 'p.m.') {
        hours += 12;
    }

    return hours * 60 + minutes;
}

const bonuses = computed<EventBonusGroup[] | null>(() => {
    const bonuses = props.event.extraData?.bonuses;
    if (!bonuses?.length) return null;

    // Filter out groups with no items and sort earliest time window first.
    const filtered = bonuses
        .filter(g => g.items?.length)
        .map((group, index) => ({
            group,
            startMinutes: parseBonusStartTimeMinutes(group.startTime),
            index,
        }))
        .sort((a, b) => {
            if (a.startMinutes === b.startMinutes) {
                return a.index - b.index;
            }
            return a.startMinutes - b.startMinutes;
        })
        .map(entry => entry.group);

    return filtered.length ? filtered : null;
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

.event-bonus-group {
    margin-bottom: 0.5rem;
}

.event-bonus-group:last-child {
    margin-bottom: 0;
}

.event-bonus-list {
    max-height: 120px;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-right: 0.2rem;
}

.event-bonus-time-range {
    font-size: 0.65rem;
    font-weight: 600;
    color: color-mix(in srgb, var(--bs-body-color) 60%, transparent);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-bottom: 0.2rem;
    padding-bottom: 0.15rem;
    border-bottom: 1px solid color-mix(in srgb, var(--bs-body-color) 10%, transparent);
}
</style>
