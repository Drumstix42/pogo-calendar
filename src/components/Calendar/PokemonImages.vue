<template>
    <div v-if="pokemonImages.length > 0" class="pokemon-images" :class="sizeClass">
        <div
            v-for="(imageUrl, index) in pokemonImages"
            :key="`pokemon-${eventId}-${index}`"
            class="pokemon-container"
            :class="{ 'has-dynamax-overlay': showDynamaxOverlay }"
        >
            <div v-if="showDynamaxOverlay" class="dynamax-overlay">
                <img src="/images/overlay/dynamax-clouds.png" alt="Dynamax effect" class="dynamax-clouds" />
            </div>
            <img :src="imageUrl" :alt="`${eventName} Pokemon ${index + 1}`" class="pokemon-icon" @error="handleImageError" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getEventPokemonImages } from '@/utils/eventPokemon';
import { type PogoEvent } from '@/utils/eventTypes';

interface Props {
    event: PogoEvent;
    eventName: string;
    size?: 'small' | 'medium' | 'large' | 'xl' | 'xxl';
}

const props = withDefaults(defineProps<Props>(), {
    size: 'medium',
});

// Compute Pokemon images once
const pokemonImages = computed(() => getEventPokemonImages(props.event));

// Determine if we should show the Dynamax overlay
const showDynamaxOverlay = computed(() => props.event.eventType === 'max-mondays');

// CSS class for sizing
const sizeClass = computed(() => `pokemon-images--${props.size}`);

// Unique event ID for keys
const eventId = computed(() => props.event.eventID);

const handleImageError = (event: Event): void => {
    const target = event.target as HTMLImageElement;
    if (target) {
        target.style.display = 'none';
    }
};
</script>

<style scoped>
.pokemon-images {
    display: flex;
    align-items: center;
    /* flex-wrap: wrap; */
    flex-shrink: 0;
}

.pokemon-container {
    position: relative;
    display: inline-block;
}

.dynamax-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
}

.dynamax-clouds {
    width: 100%;
    object-fit: contain;
}

.pokemon-icon {
    object-fit: contain;
    border-radius: 2px;
    position: relative;
    z-index: 2;
    flex-shrink: 0;
}

/* Size variants */
.pokemon-images--small .pokemon-icon {
    width: 16px;
    height: 16px;
}
.pokemon-images--medium .pokemon-icon {
    width: 18px;
    height: 18px;
}
.pokemon-images--large .pokemon-icon {
    width: 30px;
    height: 30px;
}
.pokemon-images--xl .pokemon-icon {
    width: 40px;
    height: 40px;
}
.pokemon-images--xxl .pokemon-icon {
    width: 50px;
    height: 50px;
}
</style>
