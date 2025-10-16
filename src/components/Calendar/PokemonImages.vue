<template>
    <div v-if="displayedImages.length > 0 || shouldShowPlaceholder" class="pokemon-images" :class="{ 'wrap-multiple': displayedImages.length >= 3 }">
        <Transition name="fade" :duration="{ enter: 250, leave: 150 }">
            <div :key="useAnimated ? 'animated' : 'static'" class="pokemon-images" :class="{ 'wrap-multiple': displayedImages.length >= 3 }">
                <VTooltip
                    v-for="(pokemonData, index) in displayedImages"
                    :key="`pokemon-${index}`"
                    placement="top"
                    :delay="{ show: 50, hide: 0 }"
                    distance="8"
                    :disabled="!showTooltips"
                >
                    <div
                        class="pokemon-container"
                        :class="{
                            'has-dynamax-overlay': showDynamaxOverlay,
                            'has-shadow-effect': showShadowEffect,
                            'placeholder-container': !pokemonData.imageUrl,
                        }"
                    >
                        <div v-if="showDynamaxOverlay" class="dynamax-overlay" :class="{ animated: useAnimated }">
                            <img src="/images/overlay/dynamax-clouds.png" alt="Dynamax effect" class="dynamax-clouds" />
                        </div>
                        <div v-if="showShadowEffect" class="shadow-overlay" :class="{ animated: useAnimated }">
                            <img src="/images/overlay/shadow-aura.png" alt="Shadow effect" class="shadow-aura" />
                        </div>
                        <img
                            v-if="pokemonData.imageUrl && !pokemonData.hasError"
                            :src="pokemonData.imageUrl"
                            :alt="`${eventName} Pokemon ${index + 1}`"
                            class="pokemon-icon"
                            :style="{ height: `${height}px`, width: `${height}px` }"
                            @error="() => handleImageError(index)"
                        />
                        <BadgeQuestionMark v-else class="placeholder-icon" :size="height" />
                    </div>

                    <template #popper>
                        <div class="tooltip-text">
                            {{ pokemonData.name }}{{ !pokemonData.imageUrl || pokemonData.hasError ? ' (missing sprite)' : '' }}
                        </div>
                    </template>
                </VTooltip>
            </div>
        </Transition>

        <!-- More indicator when there are additional images beyond the limit -->
        <span v-if="shouldShowMoreIndicator" class="pokemon-more-indicator">+</span>

        <VTooltip v-if="shouldShowPlaceholder" placement="top" :delay="{ show: 50, hide: 0 }" distance="8" :disabled="!showTooltips">
            <div
                class="pokemon-container placeholder-container"
                :class="{
                    'has-dynamax-overlay': showDynamaxOverlay,
                    'has-shadow-effect': showShadowEffect,
                }"
            >
                <div v-if="showDynamaxOverlay" class="dynamax-overlay" :class="{ animated: useAnimated }">
                    <img src="/images/overlay/dynamax-clouds.png" alt="Dynamax effect" class="dynamax-clouds" />
                </div>
                <div v-if="showShadowEffect" class="shadow-overlay" :class="{ animated: useAnimated }">
                    <img src="/images/overlay/shadow-aura.png" alt="Shadow effect" class="shadow-aura" />
                </div>
                <CircleHelpIcon class="placeholder-icon" :size="height" />
            </div>

            <template #popper>
                <div class="tooltip-text">Unknown pokemon</div>
            </template>
        </VTooltip>
    </div>
</template>

<script setup lang="ts">
import { BadgeQuestionMark, CircleHelpIcon } from 'lucide-vue-next';
import { computed, ref } from 'vue';

import { type PokemonImageData, getEventPokemonImages } from '@/utils/eventPokemon';
import { type PogoEvent, getRaidSubType } from '@/utils/eventTypes';

interface Props {
    event: PogoEvent;
    eventName: string;
    height?: number;
    useAnimated?: boolean;
    showPlaceholder?: boolean;
    limit?: number;
    showTooltips?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    height: 18, // Default to medium size (18px)
    useAnimated: false,
    showPlaceholder: false,
    limit: undefined,
    showTooltips: false,
});

interface ExtendedPokemonImageData extends PokemonImageData {
    hasError?: boolean;
}

const pokemonImages = computed(() => getEventPokemonImages(props.event, { useAnimated: props.useAnimated }));
const imageErrors = ref<Set<number>>(new Set());

const displayedImages = computed((): ExtendedPokemonImageData[] => {
    const images = props.limit === undefined || props.limit <= 0 ? pokemonImages.value : pokemonImages.value.slice(0, props.limit);

    return images.map((img, index) => ({
        ...img,
        hasError: imageErrors.value.has(index),
    }));
});

const shouldShowMoreIndicator = computed(() => {
    return props.limit !== undefined && props.limit > 0 && pokemonImages.value.length > props.limit;
});

const shouldShowPlaceholder = computed(() => {
    if (!props.showPlaceholder) return false;

    const relevantEventTypes = [
        'raid-day',
        'raid-battles',
        'raid-weekend',
        'raid-hour',
        'max-mondays',
        'pokemon-spotlight-hour',
        'community-day',
        'pokestop-showcase',
    ];
    return pokemonImages.value.length === 0 && relevantEventTypes.includes(props.event.eventType);
});

const showDynamaxOverlay = computed(() => props.event.eventType === 'max-mondays');
const showShadowEffect = computed(() => getRaidSubType(props.event) === 'shadow-raids');

function handleImageError(index: number): void {
    imageErrors.value.add(index);
}
</script>

<style lang="scss" scoped>
.pokemon-images {
    display: flex;
    align-items: center;
    position: relative; /* For absolute positioning during transitions */
}

.pokemon-images.wrap-multiple {
    flex-wrap: wrap;
}

/* Handle simultaneous fade transitions */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Position leaving elements absolutely during transition */
.fade-leave-active {
    position: absolute;
    top: 0;
    left: 0;
}

.pokemon-more-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: start;
    height: 16px;
    color: rgba(230, 230, 230, 0.9);
    font-size: 0.7rem;
    font-weight: 800;
    line-height: 1;
    flex-shrink: 0;
    margin-right: 0.1rem;
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
.shadow-aura {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.dynamax-overlay.animated .dynamax-clouds {
    will-change: transform, opacity;
    animation: dynamaxClouds 6s ease-in-out infinite;
}

.shadow-aura {
    transform: scale(1.3);
    will-change: transform, opacity;
}

.shadow-overlay.animated .shadow-aura {
    animation: shadowAura 8s ease-in-out infinite;
}

@keyframes dynamaxClouds {
    /* just floats up  and down, no scale rotation changes*/
    0% {
        transform: translateY(-1px);
    }
    50% {
        transform: translateY(1px);
    }
    100% {
        transform: translateY(-1px);
    }
}

@keyframes shadowAura {
    0% {
        opacity: 0.8;
        transform: scale(1.25) translate(1px, 0.5px) rotate(-1deg);
    }
    25% {
        opacity: 0.9;
        transform: scale(1.38) translate(0px, -0.5px) rotate(0.5deg);
    }
    50% {
        opacity: 0.95;
        transform: scale(1.3) translate(-1px, 0.5px) rotate(1deg);
    }
    75% {
        opacity: 0.9;
        transform: scale(1.38) translate(0px, -0.5px) rotate(0.5deg);
    }
    100% {
        opacity: 0.8;
        transform: scale(1.25) translate(1px, 0.5px) rotate(-1deg);
    }
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

.placeholder-container {
    opacity: 0.6;
}

.placeholder-icon {
    color: #a7adbd;
    position: relative;
    z-index: 2;
}

.has-dynamax-overlay .placeholder-icon {
    margin-top: 4px;
}

.tooltip-text {
    font-size: 0.75rem;
    line-height: 1.2;
    white-space: nowrap;
}
</style>
