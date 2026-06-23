<template>
    <div v-for="group in groups" :key="group.label" class="tier-group">
        <div v-if="group.showLabel" class="tier-label">{{ group.label }}</div>
        <div class="tier-images">
            <PokemonImage
                v-for="boss in group.images"
                :key="boss.name"
                :pokemon-data="boss"
                :height="height"
                :use-animated="useAnimated"
                :show-tooltip="true"
                :show-c-p="true"
                :event-type="eventType"
                :is-shadow="isShadow"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { type EventTypeKey } from '@/utils/eventTypes';
import { type RaidTierGroupWithImages } from '@/utils/raidTierGroups';

import PokemonImage from '@/components/Calendar/PokemonImage.vue';

interface Props {
    groups: RaidTierGroupWithImages[] | null | undefined;
    height: number;
    eventType: EventTypeKey;
    isShadow: boolean;
    useAnimated: boolean;
}

defineProps<Props>();
</script>

<style scoped>
/* `.tier-group` / `.tier-label` styling is owned by each consumer (values differ) and reaches in
   via :deep(); only the identical `.tier-images` rule lives here. */
.tier-images {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}
</style>
