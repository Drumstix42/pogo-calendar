<template>
    <div v-if="pokemonImages.length > 0" class="multi-day-pokemon-images">
        <img
            v-for="(imageUrl, index) in pokemonImages"
            :key="`multi-pokemon-${index}`"
            :src="imageUrl"
            :alt="`${eventName} Pokemon ${index + 1}`"
            class="multi-day-pokemon-icon"
            @error="handleImageError"
        />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getMultiDayPokemonImages } from '@/utils/eventPokemon';
import { type PogoEvent } from '@/utils/eventTypes';

interface Props {
    event: PogoEvent;
    eventName: string;
    useAnimated?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    useAnimated: false,
});

// Compute Pokemon images once - this is the "business logic" we do once
const pokemonImages = computed(() => getMultiDayPokemonImages(props.event, { useAnimated: props.useAnimated }));

const handleImageError = (event: Event): void => {
    const target = event.target as HTMLImageElement;
    if (target) {
        target.style.display = 'none';
    }
};
</script>

<style scoped>
.multi-day-pokemon-images {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
}

.multi-day-pokemon-icon {
    width: 18px;
    height: 18px;
    object-fit: contain;
    border-radius: 2px;
    flex-shrink: 0;
}
</style>
