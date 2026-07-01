<template>
    <div class="collapsed-schedule-days">
        <div v-for="dayGroup in dayGroups" :key="dayGroup.id" class="collapsed-day-group">
            <div class="collapsed-day-name">{{ dayGroup.date }}</div>
            <div class="tier-images">
                <PokemonImage
                    v-for="boss in dayGroup.images"
                    :key="`${dayGroup.id}-${boss.name}`"
                    :pokemon-data="boss"
                    :height="34"
                    :use-animated="false"
                    :show-tooltip="true"
                    :show-c-p="false"
                    :event-type="eventType"
                    :effect="effect"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { type SpriteEffect } from '@/utils/eventPokemon';
import { type EventTypeKey } from '@/utils/eventTypes';
import { type CollapsedScheduleDayGroup } from '@/utils/timelineSchedule';

import PokemonImage from '@/components/Calendar/PokemonImage.vue';

interface Props {
    dayGroups: CollapsedScheduleDayGroup[] | undefined;
    eventType: EventTypeKey;
    effect?: SpriteEffect;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.collapsed-schedule-days {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
}

.collapsed-day-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.collapsed-day-name {
    font-size: 0.7rem;
    font-weight: 700;
    line-height: 1.15;
    color: color-mix(in srgb, var(--bs-body-color) 76%, transparent);
}

.tier-images {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}
</style>
