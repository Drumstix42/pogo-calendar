<template>
    <div v-if="cpData" class="pokemon-cp-badge">
        <VTooltip placement="top" :delay="{ show: 50, hide: 0 }" distance="8">
            <template #popper>
                <div class="tooltip-text white-space-nowrap">
                    {{ tooltipText }}
                </div>
            </template>
            <span class="cp-pill">
                <span class="cp-segment">{{ formattedCP.normal }}</span>
                <span v-if="formattedCP.boosted" class="cp-segment">
                    <CloudSun class="cp-boost-icon" :stroke-width="2.4" aria-hidden="true" />
                    {{ formattedCP.boosted }}
                </span>
            </span>
        </VTooltip>
    </div>
</template>

<script setup lang="ts">
import { CloudSun } from '@lucide/vue';
import { computed } from 'vue';

import { usePokemonDataStore } from '@/stores/pokemonData';
import { MAJOR_CALENDAR_EVENT_TYPES } from '@/utils/eventMajor';
import { calculateRaidCP, formatCP } from '@/utils/pokemonCP';

interface Props {
    pokemonName: string;
    eventType: string;
    isRaidHourSubEvent?: boolean;
    isSpotlightSubEvent?: boolean;
    /** Dynamax/Gigantamax boss - Max Battle catches are never weather boosted, whatever the event type. */
    isMaxBattle?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    isRaidHourSubEvent: false,
    isSpotlightSubEvent: false,
    isMaxBattle: false,
});

const pokemonDataStore = usePokemonDataStore();

// Event types that support weather boosting (show two CP values)
const WEATHER_BOOST_EVENT_TYPES = ['raid-battles', 'raid-day', 'raid-weekend', 'raid-hour', 'event', ...MAJOR_CALENDAR_EVENT_TYPES];

// Event types that should show CP (raids and max battles)
const CP_SUPPORTED_EVENT_TYPES = [
    'raid-battles',
    'raid-day',
    'raid-weekend',
    'raid-hour',
    'max-battles',
    'max-mondays',
    'event',
    ...MAJOR_CALENDAR_EVENT_TYPES,
];

const shouldShowWeatherBoost = computed(() => {
    if (props.isSpotlightSubEvent || props.isMaxBattle) return false;
    // Pseudo raid hour events from parent events also support weather boost
    if (props.isRaidHourSubEvent) return true;
    return WEATHER_BOOST_EVENT_TYPES.includes(props.eventType);
});

const shouldShowCP = computed(() => {
    if (props.isSpotlightSubEvent) return false;
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
    if (!cpData.value) return { normal: '', boosted: null };
    return {
        normal: formatCP(cpData.value.level20Max),
        boosted: shouldShowWeatherBoost.value ? formatCP(cpData.value.level25Max) : null,
    };
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
    margin-bottom: 5px;
}

.cp-pill {
    display: inline-flex;
    align-items: stretch;
    overflow: hidden;
    font-size: 0.75rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    white-space: nowrap;
    border: 1px solid var(--cp-pill-border);
    border-radius: 4px;
}

.cp-segment {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 3px 6px;
    background-color: var(--cp-segment-bg);
}

.cp-segment + .cp-segment {
    border-left: 1px solid var(--cp-pill-border);
}

/* Mixed against the badge's own text color, so it dims in both themes. */
.cp-boost-icon {
    flex: none;
    width: 1em;
    height: 1em;
    color: color-mix(in srgb, currentColor 55%, transparent);
}

[data-bs-theme='dark'] .pokemon-cp-badge {
    color: #ffffff;
    --cp-pill-border: rgba(255, 255, 255, 0.16);
    --cp-segment-bg: rgba(255, 255, 255, 0.14);
}

[data-bs-theme='light'] .pokemon-cp-badge {
    color: #000000;
    --cp-pill-border: rgba(0, 0, 0, 0.2);
    --cp-segment-bg: rgba(0, 0, 0, 0.08);
}
</style>
