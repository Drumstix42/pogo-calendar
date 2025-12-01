<template>
    <div v-if="displayedImages.length > 0 || shouldShowPlaceholder" class="pokemon-images" :class="{ 'wrap-multiple': displayedImages.length >= 3 }">
        <div v-for="(pokemonData, index) in displayedImages" :key="`pokemon-${index}`" class="pokemon-item">
            <VTooltip placement="top" :delay="{ show: 50, hide: 0 }" distance="8" :disabled="!showTooltips">
                <div
                    class="pokemon-container"
                    :class="{
                        'has-dynamax-overlay': showDynamaxOverlay,
                        'has-shadow-effect': showShadowEffect,
                        'has-gigantamax-effect': showGigantamaxEffect,
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
                    <div class="tooltip-text white-space-nowrap">
                        {{ pokemonData.name }}{{ !pokemonData.imageUrl || pokemonData.hasError ? ' (missing sprite)' : '' }}
                    </div>
                </template>
            </VTooltip>

            <!-- CP badge below the image with transition -->
            <Transition name="slide-fade">
                <PokemonCPBadge
                    v-if="showCP"
                    :pokemon-name="pokemonData.name"
                    :event-type="event.eventType"
                    :is-raid-hour-sub-event="event.extraData?.isRaidHourSubEvent === true"
                />
            </Transition>
        </div>

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

import PokemonCPBadge from './PokemonCPBadge.vue';

interface Props {
    event: PogoEvent;
    eventName: string;
    height?: number;
    useAnimated?: boolean;
    showPlaceholder?: boolean;
    limit?: number;
    showTooltips?: boolean;
    showCP?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    height: 18, // Default to medium size (18px)
    useAnimated: false,
    showPlaceholder: false,
    limit: undefined,
    showTooltips: false,
    showCP: false,
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

const showDynamaxOverlay = computed(() => {
    // Always show for max-mondays
    if (props.event.eventType === 'max-mondays') return true;

    // For max-battles, only show if it's a regular Dynamax (not Gigantamax)
    if (props.event.eventType === 'max-battles') {
        const eventName = props.eventName;
        const gigantamaxMatch = eventName.match(/^Gigantamax\s+(.+?)\s+Max\s+Battle\s+Day$/i);
        const dynamaxMatch = eventName.match(/^Dynamax\s+(.+?)\s+Max\s+Battle\s+(?:Weekend|Day)$/i);
        return dynamaxMatch !== null && gigantamaxMatch === null;
    }

    return false;
});
const showShadowEffect = computed(() => getRaidSubType(props.event) === 'shadow-raids');
const showGigantamaxEffect = computed(() => {
    if (props.event.eventType !== 'max-battles') return false;

    const eventName = props.eventName;
    const gigantamaxMatch = eventName.match(/^Gigantamax\s+(.+?)\s+Max\s+Battle\s+Day$/i);
    return gigantamaxMatch !== null;
});

function handleImageError(index: number): void {
    imageErrors.value.add(index);
}
</script>

<style lang="scss" scoped>
.pokemon-images {
    display: flex;
    align-items: flex-start;
    position: relative; /* For absolute positioning during transitions */
    gap: 6px;
}

.pokemon-images.wrap-multiple {
    flex-wrap: wrap;
}

.pokemon-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    overflow: visible;
}

/* Slide-fade transition for CP badge */
.slide-fade-enter-active {
    transition:
        opacity 0.2s ease-out,
        transform 0.2s ease-out;
}

.slide-fade-enter-from {
    opacity: 0;
    transform: translateY(-6px);
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
    top: -1px;
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
        transform: translateY(-2px);
    }
    50% {
        transform: translateY(1px);
    }
    100% {
        transform: translateY(-2px);
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

.has-dynamax-overlay {
    .pokemon-icon {
        /* margin-top: 4px; */
        filter: drop-shadow(0 -1px 1px rgba(0, 0, 0, 0.25));
    }
    /* .dynamax-overlay {
        opacity: 0.5;
    } */
}

.has-gigantamax-effect {
    .pokemon-icon {
        /* red glow effect */
        filter: drop-shadow(0 -1px 4px rgba(200, 0, 0, 0.2));
    }
}

.placeholder-container {
    opacity: 0.6;
}

.placeholder-icon {
    color: #a7adbd;
    position: relative;
    z-index: 2;
}

/* .has-dynamax-overlay .placeholder-icon {
    margin-top: 4px;
} */
</style>
