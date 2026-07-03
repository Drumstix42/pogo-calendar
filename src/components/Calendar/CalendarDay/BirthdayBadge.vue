<template>
    <VTooltip placement="top" :delay="{ show: 50, hide: 0 }" distance="8">
        <template #popper>
            <div class="tooltip-text white-space-nowrap text-center">
                Pokémon GO's {{ anniversaryOrdinal }} Birthday<br />
                <span class="birthday-tooltip-subtext">est. {{ POKEMON_GO_BIRTHDAY.year }}</span>
            </div>
        </template>
        <Cake class="birthday-badge" :class="{ vibrant: isToday }" :size="isToday ? 15 : 12" />
    </VTooltip>
</template>

<script setup lang="ts">
import { Cake } from '@lucide/vue';
import { computed } from 'vue';

import { POKEMON_GO_BIRTHDAY } from '@/constants/specialDates';
import { getPokemonGoAnniversaryOrdinal } from '@/utils/specialDates';

interface Props {
    isToday: boolean;
    year: number;
}

const props = defineProps<Props>();

const anniversaryOrdinal = computed(() => getPokemonGoAnniversaryOrdinal(props.year));
</script>

<style scoped>
/* floating-vue wraps the trigger in a block <div class="v-popper">; keep it hugging the
   icon so it doesn't disrupt the surrounding flex row alongside the day number. */
:deep(.v-popper) {
    display: inline-flex;
    align-items: center;
}

.birthday-tooltip-subtext {
    opacity: 0.75;
    font-size: 0.9em;
}

.birthday-badge {
    flex-shrink: 0;
    color: #d6488a;
    opacity: 0.45;
    margin-bottom: 2px;
    filter: grayscale(60%);
    width: 15px;
    height: 15px;
}

[data-bs-theme='dark'] .birthday-badge {
    color: #ef7ab0;
}

.birthday-badge.vibrant {
    opacity: 1;
    filter: none;
    animation: birthday-pulse 2s ease-in-out infinite;
}

@keyframes birthday-pulse {
    0%,
    100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.15);
    }
}
</style>
