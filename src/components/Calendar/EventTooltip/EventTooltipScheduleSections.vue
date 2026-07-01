<template>
    <div v-for="section in sections" :key="section.id" class="schedule-section">
        <div class="schedule-section-header" :class="{ 'is-all-day': section.isAllDay }">
            <template v-if="labelMode === 'fallback'">
                <span class="schedule-label" :style="labelStyle(section.isAllDay)">{{ section.label || fallbackLabel(section.isAllDay) }}</span>
                <span v-if="section.time" class="schedule-time">
                    {{ targetDayName ? `${targetDayName} · ${section.time}` : section.time }}
                </span>
            </template>
            <template v-else>
                <span class="schedule-label">{{ section.labelText }}</span>
                <span v-if="section.time" class="schedule-time">{{ section.time }}</span>
            </template>
        </div>
        <RaidTierGroupImages :groups="section.tierGroups" :height="height" :event-type="eventType" :effect="effect" :use-animated="useAnimated" />
    </div>
</template>

<script setup lang="ts">
import { type SpriteEffect } from '@/utils/eventPokemon';
import { type EventTypeKey } from '@/utils/eventTypes';
import { type RaidTierGroupWithImages } from '@/utils/raidTierGroups';

import RaidTierGroupImages from '../RaidTierGroupImages.vue';

interface ScheduleSectionItem {
    id: string;
    label?: string;
    labelText?: string;
    time?: string;
    isAllDay: boolean;
    tierGroups: RaidTierGroupWithImages[];
}

interface Props {
    sections: ScheduleSectionItem[] | null | undefined;
    // 'fallback': derive label text + inline color (single/grouped, day-name aware).
    // 'plain': render pre-formatted `labelText`, color via `.is-all-day` CSS only (multi-day schedule).
    labelMode: 'fallback' | 'plain';
    targetDayName?: string;
    height: number;
    eventType: EventTypeKey;
    effect?: SpriteEffect;
    useAnimated: boolean;
}

const props = defineProps<Props>();

function fallbackLabel(isAllDay: boolean): string {
    if (isAllDay) {
        return props.targetDayName ? `All Day (${props.targetDayName})` : 'All Day';
    }

    return props.targetDayName ? `Scheduled (${props.targetDayName})` : 'Scheduled';
}

function labelStyle(isAllDay: boolean) {
    if (isAllDay) {
        return {
            color: '#2b9a47',
            borderBottomColor: 'rgba(43, 154, 71, 0.45)',
        };
    }

    return {
        color: '#3f86cc',
        borderBottomColor: 'rgba(63, 134, 204, 0.46)',
    };
}
</script>

<style scoped>
.schedule-section {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    margin-bottom: 0.1rem;
}

.schedule-section-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.35rem;
    padding-top: 0.2rem;
    position: sticky;
    top: 0;
    z-index: 10;
}

.schedule-label {
    display: block;
    align-items: center;
    width: 100%;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    line-height: 1.2;
    padding: 0.12rem 0 0.34rem 0;
    margin-bottom: 0.05rem;
    color: color-mix(in srgb, var(--bs-body-color) 82%, transparent);
    border-bottom: 1px solid color-mix(in srgb, var(--bs-body-color) 22%, transparent);
    text-shadow: none;
}

:global([data-bs-theme='dark']) .schedule-label {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
}

.schedule-section-header.is-all-day .schedule-label {
    color: color-mix(in srgb, #0f5132 88%, var(--bs-body-color));
    border-bottom-color: color-mix(in srgb, #198754 40%, transparent);
}

.schedule-time {
    display: inline-flex;
    align-items: center;
    font-size: 0.66rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    line-height: 1;
    border-radius: 999px;
    padding: 0.2rem 0.4rem;
    color: color-mix(in srgb, var(--bs-body-color) 56%, transparent);
    background: color-mix(in srgb, var(--bs-body-color) 4%, transparent);
    border: 1px solid color-mix(in srgb, var(--bs-body-color) 12%, transparent);
    margin-bottom: 0.24rem;
}

.schedule-section :deep(.tier-group) {
    margin-bottom: 0.55rem;
}

.schedule-section :deep(.tier-group:last-child) {
    margin-bottom: 0.2rem;
}
</style>
