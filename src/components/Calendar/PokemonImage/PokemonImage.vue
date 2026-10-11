<template>
    <div class="pokemon-item">
        <VTooltip placement="top" :delay="{ show: 50, hide: 0 }" distance="8" :disabled="!showTooltip">
            <div class="pokemon-container" :class="containerClass">
                <SpriteEffectOverlay
                    v-if="resolvedEffect && !isHatchPlaceholder"
                    :effect="resolvedEffect"
                    :animated="useAnimated"
                    :egg-distance="eggDistance"
                />

                <!-- Corner marker: the Super Mega shield, or the Mega/Primal symbol (never both) -->
                <div v-if="showShield" class="corner-badge-anchor">
                    <div class="corner-badge">
                        <img src="/images/icons/super-mega-shield.png" alt="Super Mega Raid shield" class="shield-icon" />
                        <span v-if="shieldCount" class="shield-count">{{ shieldCount }}</span>
                    </div>
                </div>
                <div v-else-if="cornerSymbol" class="corner-badge-anchor">
                    <div class="corner-badge">
                        <img :src="cornerSymbol.src" :alt="cornerSymbol.alt" class="symbol-icon" />
                    </div>
                </div>

                <template v-if="isPlaceholder">
                    <span v-if="isHatchPlaceholder" class="hatch-placeholder" :style="sizeStyle">
                        <HatchEgg :distance="eggDistance" :animated="useAnimated" />
                    </span>
                    <CircleHelpIcon v-else class="placeholder-icon" :size="height" />
                </template>
                <template v-else>
                    <!-- Sprite download held off (see useSpriteLoading) -->
                    <span v-if="!spritesEnabled" class="pokemon-icon deferred-sprite" :style="sizeStyle"></span>
                    <img
                        v-else-if="currentImageSrc && !hasError"
                        :src="currentImageSrc"
                        :alt="pokemonData?.name"
                        class="pokemon-icon"
                        :style="sizeStyle"
                        @error="onImageError"
                    />
                    <BadgeQuestionMark v-else class="placeholder-icon" :size="height" />
                </template>
            </div>

            <template #popper>
                <div class="tooltip-text white-space-nowrap text-center">
                    <template v-if="isHatchPlaceholder">Hatch Day</template>
                    <template v-else-if="isPlaceholder">Unknown pokemon</template>
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

import { useSpriteLoading } from '@/composables/useSpriteLoading';
import { SPRITE_EFFECTS } from '@/utils/eventPokemon';
import type { PokemonImageData, SpriteEffect } from '@/utils/eventPokemon';
import { type EggDistance } from '@/utils/hatchEgg';
import { getEffectSymbol } from '@/utils/megaPrimalSymbols';
import { getSprite256FallbackUrl, getSpriteFallbackUrl } from '@/utils/pokemonMapper';

import HatchEgg from './HatchEgg.vue';
import PokemonCPBadge from './PokemonCPBadge.vue';
import SpriteEffectOverlay from './SpriteEffectOverlay.vue';

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
    /** Which egg to draw for the Hatch effect (defaults to 2 km). */
    eggDistance?: EggDistance;
    /** Skips the Mega/Primal symbol, for sprites too small to read it (multi-day bars). */
    hideSymbolEffect?: boolean;
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
    eggDistance: undefined,
    hideSymbolEffect: false,
    isPlaceholder: false,
});

const spritesEnabled = useSpriteLoading();
const errorLevel = ref(0);

// Per-sprite effect wins; fall back to the event-level prop.
const resolvedEffect = computed(() => {
    const effect = props.pokemonData?.effect ?? props.effect;
    return props.hideSymbolEffect && getEffectSymbol(effect) ? undefined : effect;
});

// No Pokemon could be read from the Hatch Day title, so the egg itself is the image.
const isHatchPlaceholder = computed(() => props.isPlaceholder && resolvedEffect.value === SPRITE_EFFECTS.HATCH);

const sizeStyle = computed(() => ({ height: `${props.height}px`, width: `${props.height}px` }));

const shieldCount = computed(() => props.pokemonData?.shieldCount);
// Super Megas always get the shield; the count shows only when we know it.
const showShield = computed(() => Boolean(shieldCount.value) || resolvedEffect.value === SPRITE_EFFECTS.SUPER_MEGA);

const cornerSymbol = computed(() => getEffectSymbol(resolvedEffect.value));

const altFolderUrl = computed(() => {
    const url = props.pokemonData?.imageUrl;
    return url ? getSprite256FallbackUrl(url) : null;
});

const hubFallbackUrl = computed(() => {
    const url = props.pokemonData?.imageUrl;
    return url ? getSpriteFallbackUrl(url) : null;
});

// The @error fallback chain, in order; deduped so a failed URL isn't retried.
const imageSources = computed(() => {
    const candidates = [props.pokemonData?.imageUrl, altFolderUrl.value, hubFallbackUrl.value, props.pokemonData?.fallbackImageUrl];
    return [...new Set(candidates.filter((url): url is string => Boolean(url)))];
});

const currentImageSrc = computed(() => {
    return imageSources.value[errorLevel.value] ?? null;
});

const hasError = computed(() => {
    return errorLevel.value >= imageSources.value.length;
});

// Exhaustive over SpriteEffect, so a new effect fails type-check until it gets a class. Some are unstyled
// hooks (e.g. Mega/Primal/Super Mega, whose markers are corner badges rather than sprite styling).
const EFFECT_CLASSES: Record<SpriteEffect, string> = {
    [SPRITE_EFFECTS.DYNAMAX]: 'has-dynamax-overlay',
    [SPRITE_EFFECTS.SHADOW]: 'has-shadow-effect',
    [SPRITE_EFFECTS.GIGANTAMAX]: 'has-gigantamax-effect',
    [SPRITE_EFFECTS.HATCH]: 'has-hatch-effect',
    [SPRITE_EFFECTS.MEGA]: 'has-mega-effect',
    [SPRITE_EFFECTS.PRIMAL]: 'has-primal-effect',
    [SPRITE_EFFECTS.SUPER_MEGA]: 'has-super-mega-effect',
};

// At most one effect class; the placeholder class can stack with it (e.g. an unannounced Shadow Raid boss).
const containerClass = computed(() => [
    resolvedEffect.value && EFFECT_CLASSES[resolvedEffect.value],
    { 'placeholder-container': !isHatchPlaceholder.value && (props.isPlaceholder || !currentImageSrc.value) },
]);

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

.hatch-placeholder {
    position: relative;
    z-index: 2;
    display: inline-flex;
    align-items: flex-end;
    justify-content: center;

    .hatch-egg {
        height: 90%;
        filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.25));
    }
}

/* Shrunk toward the bottom-left so the egg behind gets room; the layout box stays full size */
.has-hatch-effect .pokemon-icon {
    scale: 0.82;
    transform-origin: 0 100%;
    /* Tight black shadow separates the sprite from the egg; the event-color glow ties it to the event */
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5))
        drop-shadow(0 0 3px color-mix(in srgb, var(--hatch-glow-color, transparent) 50%, rgba(0, 0, 0, 0.6)));
}

.pokemon-icon {
    object-fit: contain;
    border-radius: 2px;
    position: relative;
    z-index: 2;
    flex-shrink: 0;
    width: auto;
}

.deferred-sprite {
    display: inline-block;
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

.corner-badge-anchor {
    position: absolute;
    top: -2px;
    right: -5px;
    z-index: 3;
    display: inline-block;
}

.corner-badge {
    position: relative;
    width: 20px;
    height: 20px;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3));
}

.shield-icon,
.symbol-icon {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    opacity: 0.8;
}

.symbol-icon {
    opacity: 0.9;
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
