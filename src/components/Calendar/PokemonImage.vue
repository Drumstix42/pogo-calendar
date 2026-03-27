<template>
    <div class="pokemon-item">
        <VTooltip placement="top" :delay="{ show: 50, hide: 0 }" distance="8" :disabled="!showTooltip">
            <div
                class="pokemon-container"
                :class="{
                    'has-dynamax-overlay': isDynamax,
                    'has-shadow-effect': isShadow,
                    'has-gigantamax-effect': isGigantamax,
                    'placeholder-container': isPlaceholder || !pokemonData?.imageUrl,
                }"
            >
                <div v-if="isDynamax" class="dynamax-overlay" :class="{ animated: useAnimated }">
                    <img src="/images/overlay/dynamax-clouds.png" alt="Dynamax effect" class="dynamax-clouds" />
                </div>
                <div v-if="isShadow" class="shadow-overlay" :class="{ animated: useAnimated }">
                    <img src="/images/overlay/shadow-aura.png" alt="Shadow effect" class="shadow-aura" />
                </div>

                <template v-if="isPlaceholder">
                    <CircleHelpIcon class="placeholder-icon" :size="height" />
                </template>
                <template v-else>
                    <img
                        v-if="pokemonData?.imageUrl && !hasError"
                        :src="pokemonData.imageUrl"
                        :alt="pokemonData.name"
                        class="pokemon-icon"
                        :style="{ height: `${height}px`, width: `${height}px` }"
                        @error="hasError = true"
                    />
                    <BadgeQuestionMark v-else class="placeholder-icon" :size="height" />
                </template>
            </div>

            <template #popper>
                <div class="tooltip-text white-space-nowrap">
                    <template v-if="isPlaceholder">Unknown pokemon</template>
                    <template v-else> {{ pokemonData?.name }}{{ !pokemonData?.imageUrl || hasError ? ' (missing sprite)' : '' }} </template>
                </div>
            </template>
        </VTooltip>

        <Transition name="slide-fade">
            <PokemonCPBadge
                v-if="showCP && !isPlaceholder && pokemonData"
                :pokemon-name="pokemonData.name"
                :event-type="eventType"
                :is-raid-hour-sub-event="isRaidHourSubEvent"
                :is-spotlight-sub-event="isSpotlightSubEvent"
            />
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { BadgeQuestionMark, CircleHelpIcon } from 'lucide-vue-next';
import { ref } from 'vue';

import type { PokemonImageData } from '@/utils/eventPokemon';

import PokemonCPBadge from './PokemonCPBadge.vue';

interface Props {
    pokemonData?: PokemonImageData;
    height?: number;
    useAnimated?: boolean;
    showTooltip?: boolean;
    showCP?: boolean;
    eventType: string;
    isRaidHourSubEvent?: boolean;
    isSpotlightSubEvent?: boolean;
    isDynamax?: boolean;
    isShadow?: boolean;
    isGigantamax?: boolean;
    isPlaceholder?: boolean;
}

withDefaults(defineProps<Props>(), {
    pokemonData: undefined,
    height: 18,
    useAnimated: false,
    showTooltip: false,
    showCP: false,
    isRaidHourSubEvent: false,
    isSpotlightSubEvent: false,
    isDynamax: false,
    isShadow: false,
    isGigantamax: false,
    isPlaceholder: false,
});

const hasError = ref(false);
</script>

<style lang="scss" scoped>
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
    width: auto;
}

.has-dynamax-overlay {
    .pokemon-icon {
        filter: drop-shadow(0 -1px 1px rgba(0, 0, 0, 0.25));
    }
}

.has-gigantamax-effect {
    .pokemon-icon {
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
</style>
