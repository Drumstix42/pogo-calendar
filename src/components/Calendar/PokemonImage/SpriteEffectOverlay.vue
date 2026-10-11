<template>
    <div v-if="effect === SPRITE_EFFECTS.DYNAMAX" class="dynamax-overlay" :class="{ animated }">
        <img src="/images/overlay/dynamax-clouds.png" alt="Dynamax effect" class="dynamax-clouds" />
    </div>
    <div v-else-if="effect === SPRITE_EFFECTS.SHADOW" class="shadow-overlay" :class="{ animated }">
        <img src="/images/overlay/shadow-aura.png" alt="Shadow effect" class="shadow-aura" />
    </div>
    <div v-else-if="effect === SPRITE_EFFECTS.HATCH" class="hatch-overlay">
        <HatchEgg :distance="eggDistance" :animated="animated" />
    </div>
</template>

<script setup lang="ts">
import { SPRITE_EFFECTS, type SpriteEffect } from '@/utils/eventPokemon';
import { type EggDistance } from '@/utils/hatchEgg';

import HatchEgg from './HatchEgg.vue';

// Background layer drawn behind a sprite; the host positions it within the sprite box.
interface Props {
    effect: SpriteEffect;
    animated?: boolean;
    eggDistance?: EggDistance;
}

withDefaults(defineProps<Props>(), {
    animated: false,
    eggDistance: undefined,
});
</script>

<style lang="scss" scoped>
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

@media (prefers-reduced-motion: reduce) {
    .dynamax-overlay.animated .dynamax-clouds,
    .shadow-overlay.animated .shadow-aura {
        animation: none;
    }
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

/* Egg sits behind the sprite, nudged right of center; fully centered, wide sprites read as wrapped around it */
.hatch-overlay {
    position: absolute;
    inset: 0;
    z-index: 0;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    transform: translateX(16%);
    pointer-events: none;

    .hatch-egg {
        height: 90%;
        opacity: 0.9;
    }
}
</style>
