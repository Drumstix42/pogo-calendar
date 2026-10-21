<template>
    <div
        v-if="displayedImages.length > 0 || shouldShowPlaceholder"
        class="pokemon-images"
        :class="{
            'wrap-multiple': displayedImages.length >= 3,
            'force-wrap': wrap,
            'overflow-badge-right': overflowBadgeAlign === 'right',
        }"
        :style="hatchGlowStyle"
    >
        <PokemonImage
            v-for="(pokemonData, index) in displayedImages"
            :key="`pokemon-${pokemonData.name}-${pokemonData.imageUrl ?? 'none'}-${pokemonData.fallbackImageUrl ?? 'none'}-${index}`"
            :pokemon-data="pokemonData"
            :height="height"
            :use-animated="useAnimated"
            :show-tooltip="showTooltips"
            :show-c-p="showCP"
            :event-type="event.eventType"
            :is-raid-hour-sub-event="event.extraData?.isRaidHourSubEvent === true"
            :is-spotlight-sub-event="event.extraData?.isSpotlightSubEvent === true"
            :egg-distance="eggDistance"
            :hide-symbol-effect="multiDay"
        />

        <!-- Overflow counter badge -->
        <span v-if="showOverflowBadge" class="overflow-counter-badge">{{ overflowBadgeCount }}</span>

        <PokemonImage
            v-if="shouldShowPlaceholder"
            :height="height"
            :use-animated="useAnimated"
            :show-tooltip="showTooltips"
            :event-type="event.eventType"
            :effect="eventEffect"
            :egg-distance="eggDistance"
            is-placeholder
        />
    </div>
</template>

<script setup lang="ts">
import { breakpointsBootstrapV5, useBreakpoints } from '@vueuse/core';
import { computed } from 'vue';

import { useEventTypeColorsStore } from '@/stores/eventTypeColors';
import { type PokemonImageData, SPRITE_EFFECTS, getEventPokemonImages, getEventSpriteEffect, getMultiDayPokemonImages } from '@/utils/eventPokemon';
import { type PogoEvent } from '@/utils/eventTypes';
import { getHatchDayEggDistance } from '@/utils/hatchEgg';

import PokemonImage from '@/components/Calendar/PokemonImage/PokemonImage.vue';

interface Props {
    event: PogoEvent;
    height?: number;
    useAnimated?: boolean;
    showPlaceholder?: boolean;
    showTooltips?: boolean;
    showCP?: boolean;
    showOverflowCounter?: boolean;
    overflowBadgeAlign?: 'left' | 'right';
    excludeTiers?: number[];
    wrap?: boolean;
    // Compact views show at most MAX_DISPLAYED_IMAGES, with a counter badge for the rest.
    capped?: boolean;
    // Narrows to bosses representative of the whole span (e.g. only ones recurring across every day
    // of a raid schedule) instead of a single day's full boss list - for multi-day event bars.
    multiDay?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    height: 18, // Default to medium size (18px)
    useAnimated: false,
    showPlaceholder: false,
    showTooltips: false,
    showCP: false,
    showOverflowCounter: false,
    overflowBadgeAlign: 'left',
    excludeTiers: undefined,
    wrap: false,
    capped: false,
    multiDay: false,
});

const pokemonImages = computed(() => {
    const options = { useAnimated: props.useAnimated, excludeTiers: props.excludeTiers };
    return props.multiDay ? getMultiDayPokemonImages(props.event, options) : getEventPokemonImages(props.event, options);
});

const breakpoints = useBreakpoints(breakpointsBootstrapV5);

const MAX_DISPLAYED_IMAGES = 3;

const displayedImages = computed((): PokemonImageData[] => {
    return props.capped ? pokemonImages.value.slice(0, MAX_DISPLAYED_IMAGES) : pokemonImages.value;
});

// Event types where a missing sprite warrants a placeholder (a Pokemon is expected).
const PLACEHOLDER_EVENT_TYPES = [
    'raid-day',
    'raid-battles',
    'raid-weekend',
    'raid-hour',
    'max-mondays',
    'pokemon-spotlight-hour',
    'community-day',
    'pokestop-showcase',
];

// Event-level effect: feeds the placeholder (which has no resolved sprite to carry one) and Hatch Day handling.
const eventEffect = computed(() => getEventSpriteEffect(props.event));
const isHatchDay = computed(() => eventEffect.value === SPRITE_EFFECTS.HATCH);
const eggDistance = computed(() => (isHatchDay.value ? getHatchDayEggDistance(props.event) : undefined));

const shouldShowPlaceholder = computed(() => {
    if (!props.showPlaceholder) return false;

    // Hatch Days are plain `event`s; their placeholder is an egg rather than a "?".
    return pokemonImages.value.length === 0 && (PLACEHOLDER_EVENT_TYPES.includes(props.event.eventType) || isHatchDay.value);
});

// Set once here and inherited by every sprite, rather than each sprite looking up the color.
const eventTypeColors = useEventTypeColorsStore();
const hatchGlowStyle = computed(() =>
    isHatchDay.value ? { '--hatch-glow-color': eventTypeColors.getEventTypeColor(props.event.eventType) } : undefined,
);

// True when tier exclusions are actively hiding raid bosses from the rendered set.
const hasTierExclusionOverflow = computed(() => {
    const totalRaidBosses = props.event.extraData?.raidbattles?.bosses?.length ?? 0;
    return (
        totalRaidBosses > pokemonImages.value.length && Boolean(props.excludeTiers && props.excludeTiers.length > 0) && pokemonImages.value.length > 0
    );
});

// True when there are more Pokemon than the display cap can show.
const hasCapOverflow = computed(() => pokemonImages.value.length > displayedImages.value.length);

const showOverflowBadge = computed(() => {
    // Always show when the display cap or tier exclusions are actively hiding Pokemon.
    if (hasCapOverflow.value || hasTierExclusionOverflow.value) return true;

    // Otherwise only show if explicitly enabled via prop.
    if (!props.showOverflowCounter) return false;

    // Need at least 2 images to show badge
    if (displayedImages.value.length < 2) return false;

    // Only on mobile/tablet (< 768px) where wrapping is disabled
    return breakpoints.smaller('md').value;
});

const overflowBadgeCount = computed(() => {
    // For tier-based overflow, show total available bosses so hidden count is implied.
    if (hasTierExclusionOverflow.value) {
        return props.event.extraData?.raidbattles?.bosses?.length ?? 0;
    }

    // For cap overflow, show the total resolved Pokemon count so the hidden count is implied.
    if (hasCapOverflow.value) return pokemonImages.value.length;

    return displayedImages.value.length;
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

.overflow-counter-badge {
    position: absolute;
    bottom: -1px;
    right: -2px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 10px;
    padding: 0 2px;
    font-size: 8px;
    font-weight: 300;
    line-height: 1;
    border-radius: 3px;
    color: rgba(255, 255, 255, 0.7);
    background-color: rgba(30, 30, 40, 0.5);
    backdrop-filter: blur(0.05rem);
    z-index: 10;
    pointer-events: none;
}

/* @media (min-width: 375px) {
    .overflow-counter-badge {
        right: -2px;
    }
} */

.pokemon-images.overflow-badge-right .overflow-counter-badge {
    left: auto;
    right: 0;
    height: 12px;
    padding: 0 4px;
    font-size: 10px;
    font-weight: 500;
}

@media (min-width: 375px) {
    .pokemon-images.overflow-badge-right .overflow-counter-badge {
        right: -2px;
    }
}
</style>
