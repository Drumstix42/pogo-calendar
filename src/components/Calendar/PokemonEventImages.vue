<template>
    <div
        v-if="displayedImages.length > 0 || shouldShowPlaceholder"
        class="pokemon-images"
        :class="{ 'wrap-multiple': displayedImages.length >= 3, 'force-wrap': wrap }"
    >
        <PokemonImage
            v-for="(pokemonData, index) in displayedImages"
            :key="`pokemon-${index}`"
            :pokemon-data="pokemonData"
            :height="height"
            :use-animated="useAnimated"
            :show-tooltip="showTooltips"
            :show-c-p="showCP"
            :event-type="event.eventType"
            :is-raid-hour-sub-event="event.extraData?.isRaidHourSubEvent === true"
            :is-dynamax="showDynamaxOverlay"
            :is-shadow="showShadowEffect"
            :is-gigantamax="showGigantamaxEffect"
        />

        <!-- More indicator when there are additional images beyond the limit -->
        <span v-if="shouldShowMoreIndicator" class="pokemon-more-indicator">+</span>

        <!-- Overflow counter badge (mobile only) -->
        <span v-if="showOverflowBadge" class="overflow-counter-badge">{{ displayedImages.length }}</span>

        <PokemonImage
            v-if="shouldShowPlaceholder"
            :height="height"
            :use-animated="useAnimated"
            :show-tooltip="showTooltips"
            :event-type="event.eventType"
            :is-dynamax="showDynamaxOverlay"
            :is-shadow="showShadowEffect"
            is-placeholder
        />
    </div>
</template>

<script setup lang="ts">
import { breakpointsBootstrapV5, useBreakpoints } from '@vueuse/core';
import { computed } from 'vue';

import { type PokemonImageData, getEventPokemonImages } from '@/utils/eventPokemon';
import { type PogoEvent, getRaidSubType } from '@/utils/eventTypes';

import PokemonImage from './PokemonImage.vue';

interface Props {
    event: PogoEvent;
    eventName: string;
    height?: number;
    useAnimated?: boolean;
    showPlaceholder?: boolean;
    limit?: number;
    showTooltips?: boolean;
    showCP?: boolean;
    showOverflowCounter?: boolean;
    excludeTiers?: string[];
    wrap?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    height: 18, // Default to medium size (18px)
    useAnimated: false,
    showPlaceholder: false,
    limit: undefined,
    showTooltips: false,
    showCP: false,
    showOverflowCounter: false,
    excludeTiers: undefined,
    wrap: false,
});

const pokemonImages = computed(() => getEventPokemonImages(props.event, { useAnimated: props.useAnimated, excludeTiers: props.excludeTiers }));

const breakpoints = useBreakpoints(breakpointsBootstrapV5);

const displayedImages = computed((): PokemonImageData[] => {
    return props.limit === undefined || props.limit <= 0 ? pokemonImages.value : pokemonImages.value.slice(0, props.limit);
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

const showOverflowBadge = computed(() => {
    // Only show if explicitly enabled via prop
    if (!props.showOverflowCounter) return false;

    // Need at least 2 images to show badge
    if (displayedImages.value.length < 2) return false;

    // Only on mobile/tablet (< 768px) where wrapping is disabled
    return breakpoints.smaller('md').value;
});
</script>

<style lang="scss" scoped>
.pokemon-images {
    display: flex;
    align-items: flex-start;
    position: relative; /* For absolute positioning during transitions */
    gap: 6px;
}

.pokemon-images.wrap-multiple {
    flex-wrap: nowrap;
}

.pokemon-images.wrap-multiple.force-wrap {
    flex-wrap: wrap;
}

@media (min-width: 768px) {
    .pokemon-images.wrap-multiple {
        flex-wrap: wrap;
    }
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

.overflow-counter-badge {
    position: absolute;
    bottom: -2px;
    left: 0px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 12px;
    padding: 0 4px;
    font-size: 9px;
    font-weight: 500;
    line-height: 1;
    border-radius: 3px;
    color: rgba(255, 255, 255, 0.7);
    background-color: rgba(30, 30, 40, 0.75);
    backdrop-filter: blur(0.05rem);
    z-index: 10;
    pointer-events: none;
}

@media (min-width: 375px) {
    .overflow-counter-badge {
        left: -2px;
    }
}
</style>
