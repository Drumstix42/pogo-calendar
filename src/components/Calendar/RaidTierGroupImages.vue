<template>
    <div v-for="group in groups" :key="group.label" class="tier-group">
        <RaidTierHeader v-if="group.showLabel" :label="group.label" />
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
                :effect="effect"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { type SpriteEffect } from '@/utils/eventPokemon';
import { type EventTypeKey } from '@/utils/eventTypes';
import { type RaidTierGroupWithImages } from '@/utils/raidTierGroups';

import PokemonImage from '@/components/Calendar/PokemonImage/PokemonImage.vue';
import RaidTierHeader from '@/components/Calendar/RaidTierHeader.vue';

interface Props {
    groups: RaidTierGroupWithImages[] | null | undefined;
    height: number;
    eventType: EventTypeKey;
    effect?: SpriteEffect;
    useAnimated: boolean;
}

defineProps<Props>();
</script>

<style scoped>
/* `.tier-group` / `.tier-label` styling is owned by each consumer (values differ) and reaches in
   via :deep(); only the identical `.tier-images` rule lives here. Sprites indent under a flush tier
   title. */
.tier-images {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding-left: 0.75rem;
}
</style>
