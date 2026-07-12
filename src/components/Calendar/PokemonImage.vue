<template>
    <div class="pokemon-item">
        <VTooltip placement="top" :delay="{ show: 50, hide: 0 }" distance="8" :disabled="!showTooltip">
            <div
                class="pokemon-container"
                :class="{
                    'has-dynamax-overlay': resolvedEffect === SPRITE_EFFECTS.DYNAMAX,
                    'has-shadow-effect': resolvedEffect === SPRITE_EFFECTS.SHADOW,
                    'has-gigantamax-effect': resolvedEffect === SPRITE_EFFECTS.GIGANTAMAX,
                    'placeholder-container': isPlaceholder || !currentImageSrc,
                }"
            >
                <div v-if="resolvedEffect === SPRITE_EFFECTS.DYNAMAX" class="dynamax-overlay" :class="{ animated: useAnimated }">
                    <img src="/images/overlay/dynamax-clouds.png" alt="Dynamax effect" class="dynamax-clouds" />
                </div>
                <div v-if="resolvedEffect === SPRITE_EFFECTS.SHADOW" class="shadow-overlay" :class="{ animated: useAnimated }">
                    <img src="/images/overlay/shadow-aura.png" alt="Shadow effect" class="shadow-aura" />
                </div>

                <div v-if="shieldCount" class="shield-badge-anchor">
                    <div class="shield-badge">
                        <img src="/images/icons/super-mega-shield.png" alt="Super Mega Raid shield" class="shield-icon" />
                        <span class="shield-count">{{ shieldCount }}</span>
                    </div>
                </div>

                <template v-if="isPlaceholder">
                    <CircleHelpIcon class="placeholder-icon" :size="height" />
                </template>
                <template v-else>
                    <img
                        v-if="currentImageSrc && !hasError"
                        :src="currentImageSrc"
                        :alt="pokemonData?.name"
                        class="pokemon-icon"
                        :style="{ height: `${height}px`, width: `${height}px` }"
                        @error="onImageError"
                    />
                    <BadgeQuestionMark v-else class="placeholder-icon" :size="height" />
                </template>
            </div>

            <template #popper>
                <div class="tooltip-text white-space-nowrap text-center">
                    <template v-if="isPlaceholder">Unknown pokemon</template>
                    <template v-else> {{ pokemonData?.name }}{{ !currentImageSrc || hasError ? ' (missing sprite)' : '' }} </template>
                    <template v-if="shieldCount"
                        ><br /><span class="fw-bold">{{ shieldCount }} shields to break</span></template
                    >
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
import { BadgeQuestionMark, CircleHelpIcon } from '@lucide/vue';
import { computed, ref, watch } from 'vue';

import { SPRITE_EFFECTS } from '@/utils/eventPokemon';
import type { PokemonImageData, SpriteEffect } from '@/utils/eventPokemon';
import { getSprite256FallbackUrl, getSpriteFallbackUrl } from '@/utils/pokemonMapper';

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
    /**
     * Overlay for this sprite. `pokemonData.effect` (per-sprite, from the resolver) takes precedence;
     * this prop is the event-level fallback for callers whose image data doesn't carry one (raid tier
     * groups, placeholder).
     */
    effect?: SpriteEffect;
    isPlaceholder?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    pokemonData: undefined,
    height: 18,
    useAnimated: false,
    showTooltip: false,
    showCP: false,
    isRaidHourSubEvent: false,
    isSpotlightSubEvent: false,
    effect: undefined,
    isPlaceholder: false,
});

const errorLevel = ref(0);

// Per-sprite effect wins; fall back to the event-level prop.
const resolvedEffect = computed(() => props.pokemonData?.effect ?? props.effect);

const shieldCount = computed(() => props.pokemonData?.shieldCount);

const altFolderUrl = computed(() => {
    const url = props.pokemonData?.imageUrl;
    return url ? getSprite256FallbackUrl(url) : null;
});

const hubFallbackUrl = computed(() => {
    const url = props.pokemonData?.imageUrl;
    return url ? getSpriteFallbackUrl(url) : null;
});

const imageSources = computed(() => {
    const sources: string[] = [];
    const primary = props.pokemonData?.imageUrl;
    const altFolder = altFolderUrl.value;
    const hub = hubFallbackUrl.value;
    const jsonFallback = props.pokemonData?.fallbackImageUrl;

    if (primary) {
        sources.push(primary);
    }
    if (altFolder && !sources.includes(altFolder)) {
        sources.push(altFolder);
    }
    if (hub && !sources.includes(hub)) {
        sources.push(hub);
    }
    if (jsonFallback && !sources.includes(jsonFallback)) {
        sources.push(jsonFallback);
    }

    return sources;
});

const currentImageSrc = computed(() => {
    return imageSources.value[errorLevel.value] ?? null;
});

const hasError = computed(() => {
    return errorLevel.value >= imageSources.value.length;
});

watch(
    () => imageSources.value.join('|'),
    () => {
        errorLevel.value = 0;
    },
);

function onImageError() {
    errorLevel.value++;
}
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

.shield-badge-anchor {
    position: absolute;
    top: -2px;
    right: -5px;
    z-index: 3;
    display: inline-block;
}

.shield-badge {
    position: relative;
    width: 20px;
    height: 20px;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3));
}

.shield-icon {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    opacity: 0.8;
}

.shield-count {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 600;
    line-height: 1;
    color: #fff;
    text-shadow:
        0 1px 2px rgba(0, 0, 0, 0.9),
        0 -1px 2px rgba(0, 0, 0, 0.9);
}

.placeholder-icon {
    color: #a7adbd;
    position: relative;
    z-index: 2;
}
</style>
