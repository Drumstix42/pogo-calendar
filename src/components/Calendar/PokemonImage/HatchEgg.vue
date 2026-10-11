<template>
    <img :src="src" alt="Egg" class="hatch-egg" :class="{ animated }" />
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { DEFAULT_EGG_DISTANCE, type EggDistance, getEggImageUrl } from '@/utils/hatchEgg';

interface Props {
    distance?: EggDistance;
    animated?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    distance: DEFAULT_EGG_DISTANCE,
    animated: false,
});

const src = computed(() => getEggImageUrl(props.distance));
</script>

<style scoped>
/* Sized by the host (behind a sprite vs. standing in for one) */
.hatch-egg {
    width: auto;
    transform-origin: 50% 95%;
}

.hatch-egg.animated {
    will-change: transform;
    animation: eggWobble 3.2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
    .hatch-egg.animated {
        animation: none;
    }
}

/* Mostly still, with a short in-game style wobble (~1.2s) */
@keyframes eggWobble {
    0%,
    62%,
    100% {
        transform: rotate(0deg);
    }
    68% {
        transform: rotate(-7deg);
    }
    76% {
        transform: rotate(6deg);
    }
    84% {
        transform: rotate(-4deg);
    }
    92% {
        transform: rotate(2deg);
    }
}
</style>
