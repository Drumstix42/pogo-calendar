<template>
    <div v-if="cpData" class="pokemon-cp-badge">
        <VTooltip placement="top" :delay="{ show: 50, hide: 0 }" distance="8">
            <template #popper>
                <div class="tooltip-text white-space-nowrap">
                    {{ tooltipText }}
                </div>
            </template>
            <span>{{ formattedCP }}</span>
        </VTooltip>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { usePokemonDataStore } from '@/stores/pokemonData';
import { calculateRaidCP, formatCPDisplay } from '@/utils/pokemonCP';

interface Props {
    pokemonName: string;
    eventType: string;
    isRaidHourSubEvent?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    isRaidHourSubEvent: false,
});

const pokemonDataStore = usePokemonDataStore();

// Event types that support weather boosting (show two CP values)
const WEATHER_BOOST_EVENT_TYPES = ['raid-battles', 'raid-day', 'raid-weekend', 'raid-hour'];

// Event types that should show CP (raids and max battles)
const CP_SUPPORTED_EVENT_TYPES = ['raid-battles', 'raid-day', 'raid-weekend', 'raid-hour', 'max-battles', 'max-mondays'];

const shouldShowWeatherBoost = computed(() => {
    // Pseudo raid hour events from parent events also support weather boost
    if (props.isRaidHourSubEvent) return true;
    return WEATHER_BOOST_EVENT_TYPES.includes(props.eventType);
});

const shouldShowCP = computed(() => {
    // Pseudo raid hour events from parent events should show CP
    if (props.isRaidHourSubEvent) return true;
    return CP_SUPPORTED_EVENT_TYPES.includes(props.eventType);
});

// Reactively get CP data from store - will update automatically when data loads
const cpData = computed(() => {
    if (!shouldShowCP.value || !props.pokemonName) return null;

    const pokemon = pokemonDataStore.searchCatchablePokemon(props.pokemonName);
    if (!pokemon || !pokemon.stats) return null;

    return calculateRaidCP(pokemon.stats);
});

const formattedCP = computed(() => {
    if (!cpData.value) return '';
    return formatCPDisplay(cpData.value.level20Max, cpData.value.level25Max, shouldShowWeatherBoost.value);
});

// just show text no the numbers again
const tooltipText = computed(() => {
    if (!cpData.value) return '';
    if (shouldShowWeatherBoost.value) {
        return 'Hundo CP: Normal / Weather Boosted';
    } else {
        return 'Hundo CP';
    }
});
</script>

<style scoped>
.pokemon-cp-badge {
    display: inline-block;
    padding: 2px 3px;
    font-size: 0.675rem;
    font-weight: 400;
    line-height: 1.1;
    border-radius: 2px;
    text-align: center;
    white-space: nowrap;
}

/* Dark mode - light text on dark background */
[data-bs-theme='dark'] .pokemon-cp-badge {
    color: #ffffff;
    background-color: rgba(255, 255, 255, 0.25);
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.4);
}

/* Light mode - dark text on light background */
[data-bs-theme='light'] .pokemon-cp-badge {
    color: #000000;
    background-color: rgba(0, 0, 0, 0.15);
    text-shadow: 0 0.5px 1px rgba(255, 255, 255, 0.5);
}
</style>
