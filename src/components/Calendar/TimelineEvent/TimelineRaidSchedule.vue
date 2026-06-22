<template>
    <!-- Raid boss schedule sections grouped by day -->
    <div v-if="daySections?.length" class="raid-boss-tiers">
        <div v-for="daySection in daySections" :key="daySection.id" class="schedule-day-section">
            <div class="schedule-day-header">{{ daySection.date }}</div>

            <div v-for="section in daySection.sections" :key="section.id" class="schedule-section">
                <div class="schedule-section-header" :class="{ 'is-all-day': section.isAllDay }">
                    <span class="schedule-label">{{ section.labelText }}</span>
                    <span v-if="section.time" class="schedule-time">{{ section.time }}</span>
                </div>

                <div v-for="group in section.tierGroups" :key="`${section.id}-${group.label}`" class="tier-group">
                    <div v-if="group.showLabel" class="tier-label">{{ group.label }}</div>
                    <div class="tier-images">
                        <PokemonImage
                            v-for="boss in group.images"
                            :key="boss.name"
                            :pokemon-data="boss"
                            :height="60"
                            :use-animated="true"
                            :show-tooltip="true"
                            :show-c-p="true"
                            :event-type="eventType"
                            :is-shadow="isShadow"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Fallback raid boss tier groups -->
    <div v-else-if="defaultTierGroups" class="raid-boss-tiers">
        <div v-for="group in defaultTierGroups" :key="group.label" class="tier-group">
            <div v-if="group.showLabel" class="tier-label">{{ group.label }}</div>
            <div class="tier-images">
                <PokemonImage
                    v-for="boss in group.images"
                    :key="boss.name"
                    :pokemon-data="boss"
                    :height="60"
                    :use-animated="true"
                    :show-tooltip="true"
                    :show-c-p="true"
                    :event-type="eventType"
                    :is-shadow="isShadow"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { type EventTypeKey } from '@/utils/eventTypes';
import { type RaidTierGroupWithImages } from '@/utils/raidTierGroups';
import { type TimelineScheduleDaySection } from '@/utils/timelineSchedule';

import PokemonImage from '@/components/Calendar/PokemonImage.vue';

interface Props {
    daySections: TimelineScheduleDaySection[] | undefined;
    defaultTierGroups: RaidTierGroupWithImages[] | null;
    eventType: EventTypeKey;
    isShadow: boolean;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.raid-boss-tiers {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-top: 0.4rem;
    width: 100%;
}

.tier-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding-left: 0.5rem;
}

.schedule-section {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.1rem 0.2rem;
}

.schedule-section + .schedule-section {
    padding-top: 0.35rem;
    margin-top: 0.05rem;
}

.schedule-day-section {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.4rem;
    border-radius: 7px;
    border: 1px solid color-mix(in srgb, var(--bs-border-color) 15%, transparent);
    background-color: color-mix(in srgb, var(--calendar-cell-bg) 75%, var(--event-color) 5%);
}

.schedule-day-header {
    font-size: 0.925rem;
    text-transform: uppercase;
    font-weight: 700;
    line-height: 1.5;
    letter-spacing: 0.05em;
    color: color-mix(in srgb, var(--bs-body-color) 82%, transparent);
    padding: 0 0.1rem;
}

.schedule-section-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.35rem;
    padding-top: 0.2rem;
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

.schedule-section-header:not(.is-all-day) .schedule-label {
    color: #3f86cc;
    border-bottom-color: rgba(63, 134, 204, 0.46);
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

.tier-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: color-mix(in srgb, var(--bs-body-color) 70%, transparent);
}

.tier-images {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}
</style>
