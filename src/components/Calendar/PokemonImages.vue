<template>
    <div v-if="pokemonImages.length > 0" class="pokemon-images" :class="{ 'wrap-multiple': pokemonImages.length >= 3 }">
        <div
            v-for="(imageUrl, index) in pokemonImages"
            :key="`pokemon-${eventId}-${index}`"
            class="pokemon-container"
            :class="{
                'has-dynamax-overlay': showDynamaxOverlay,
                'has-shadow-effect': showShadowEffect,
            }"
        >
            <div v-if="showDynamaxOverlay" class="dynamax-overlay">
                <img src="/images/overlay/dynamax-clouds.png" alt="Dynamax effect" class="dynamax-clouds" />
            </div>
            <div v-if="showShadowEffect" class="shadow-overlay">
                <img src="/images/overlay/shadow-fire.svg" alt="Shadow effect" class="shadow-fire" />
            </div>
            <img
                :src="imageUrl"
                :alt="`${eventName} Pokemon ${index + 1}`"
                class="pokemon-icon"
                :style="{ height: `${height}px`, width: `${height}px` }"
                @error="handleImageError"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getEventPokemonImages, getRaidSubType } from '@/utils/eventPokemon';
import { type PogoEvent } from '@/utils/eventTypes';

interface Props {
    event: PogoEvent;
    eventName: string;
    height?: number;
    useAnimated?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    height: 18, // Default to medium size (18px)
    useAnimated: false,
});

// Compute Pokemon images once
const pokemonImages = computed(() => getEventPokemonImages(props.event, { useAnimated: props.useAnimated }));

// Determine if we should show the Dynamax overlay
const showDynamaxOverlay = computed(() => props.event.eventType === 'max-mondays');

// Determine if we should show the Shadow effect
const showShadowEffect = computed(() => getRaidSubType(props.event) === 'shadow-raids');

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

.pokemon-images.wrap-multiple {
    flex-wrap: wrap;
}

.pokemon-container {
    position: relative;
    display: inline-block;
}

.pokemon-container.has-shadow-effect {
    filter: drop-shadow(0 0 3px rgba(68, 57, 117, 0.75));
}

.dynamax-overlay,
.shadow-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    /* bottom: 0; */
    z-index: 0;
    scale: 1.1;
    opacity: 0.8;
}

.dynamax-clouds,
.shadow-fire {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.pokemon-icon {
    object-fit: contain;
    border-radius: 2px;
    position: relative;
    z-index: 2;
    flex-shrink: 0;
    width: auto; /* Let width be automatic based on aspect ratio */
}

.has-dynamax-overlay .pokemon-icon {
    margin-top: 4px;
}
</style>
