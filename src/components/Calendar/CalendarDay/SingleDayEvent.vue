<template>
    <VMenu
        :disabled="isTouchDevice"
        placement="top"
        :delay="tooltipOptionsDefaults.delay"
        :distance="tooltipOptionsDefaults.distance"
        :auto-hide="tooltipOptionsDefaults.autoHide"
        :show-group="`single-${event.eventID}`"
        @apply-show="handleMenuShow(sourceEventId)"
        @apply-hide="handleMenuHide(sourceEventId)"
    >
        <div
            class="single-day-event calendar-event"
            :class="{
                'event-past': metadata?.isPastEvent,
                'event-id-highlighted': eventHighlight.hoveredEventID === sourceEventId,
                'has-bonus-icons': calendarSettings.useSingleDayEventSprites && metadata?.spotlightBonus,
                'major-daily-display-event': isMajorDaily,
                'major-daily-global': isMajorDaily && majorVariant === 'global',
                'major-daily-location': isMajorDaily && majorVariant === 'location-specific',
            }"
            :style="{
                '--major-event-color': metadata?.color,
            }"
            :data-event-type="event.eventType"
            :data-event-id="sourceEventId"
            @mouseenter="debouncedHighlightEventID(sourceEventId)"
            @mouseleave="debouncedClearEventIDHighlight"
            @click="handleEventClick(sourceEventId)"
        >
            <div class="event-content">
                <div class="event-text-wrap d-flex align-items-start gap-2">
                    <div class="event-text-content flex-shrink-1 overflow-hidden">
                        <div class="event-name-container">
                            <div class="event-name">
                                {{ displayName }}
                                <span v-if="showBadge" class="calendar-event-badge">{{ eventCount }}</span>
                            </div>
                        </div>
                        <div class="event-time">
                            <div class="event-dot" :style="{ backgroundColor: metadata?.color }"></div>
                            {{ metadata?.formattedStartTime }}
                            <span v-if="isToday && metadata?.isPastEvent" class="event-ended-label">Ended</span>
                        </div>
                    </div>

                    <SpotlightBonusIcons
                        v-if="!isMajorDaily && metadata?.spotlightBonus"
                        :category="metadata?.spotlightBonus?.category"
                        :icon-url="metadata?.spotlightBonusIconUrl"
                    />
                </div>
                <TwitchIcon
                    v-if="event.eventType === 'twitch-drops'"
                    :size="twitchIconHeight"
                    class="twitch-drops-icon"
                    :style="{ color: metadata?.color }"
                />
                <PokemonEventImages
                    v-else-if="calendarSettings.useSingleDayEventSprites"
                    :event="event"
                    :height="singleDayPokemonHeight"
                    :show-placeholder="true"
                    :show-overflow-counter="true"
                    :exclude-tiers="['Tier 1', 'Tier 3']"
                />
            </div>
        </div>

        <template #popper>
            <EventTooltip :event="detailsEvent" :is-single-day="true" :target-date="dayInstance" />
        </template>
    </VMenu>
</template>

<script setup lang="ts">
import { breakpointsBootstrapV5, useBreakpoints } from '@vueuse/core';
import { type Dayjs } from 'dayjs';
import { computed } from 'vue';

import { useCalendarDayEventInteraction } from '@/composables/useCalendarDayEventInteraction';
import { useDailyEventDisplay } from '@/composables/useDailyEventDisplay';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventHighlightStore } from '@/stores/eventHighlight';
import { getEventCount, shouldShowBadge } from '@/utils/eventDisplay';
import { type PogoEvent } from '@/utils/eventTypes';

import SpotlightBonusIcons from '@/components/Calendar/CalendarDay/SpotlightBonusIcons.vue';
import EventTooltip from '@/components/Calendar/EventTooltip/EventTooltip.vue';
import PokemonEventImages from '@/components/Calendar/PokemonEventImages.vue';
import TwitchIcon from '@/components/Icons/TwitchIcon.vue';

interface Props {
    event: PogoEvent;
    dayInstance: Dayjs;
    isToday: boolean;
}

const props = defineProps<Props>();

const calendarSettings = useCalendarSettingsStore();
const eventHighlight = useEventHighlightStore();

const {
    getSourceEventID,
    isMajorDailyDisplayEvent,
    getEventMetadataForDisplay,
    getMajorDailyVariant,
    getEventDisplayNameForSingleDay,
    getEventForDetails,
} = useDailyEventDisplay();

const {
    isTouchDevice,
    tooltipOptionsDefaults,
    debouncedHighlightEventID,
    debouncedClearEventIDHighlight,
    handleEventClick,
    handleMenuShow,
    handleMenuHide,
} = useCalendarDayEventInteraction(() => props.dayInstance);

// Pokemon image height based on breakpoint
const breakpoints = useBreakpoints(breakpointsBootstrapV5);
const singleDayPokemonHeight = computed(() => {
    if (breakpoints.greaterOrEqual('xxl').value) {
        return 50; // >= 1400px
    } else if (breakpoints.greaterOrEqual('xl').value) {
        return 45; // >= 1200px
    }
    return 40; // < 1200px
});
const twitchIconHeight = computed(() => singleDayPokemonHeight.value - 10);

const sourceEventId = computed(() => getSourceEventID(props.event));
const metadata = computed(() => getEventMetadataForDisplay(props.event));
const isMajorDaily = computed(() => isMajorDailyDisplayEvent(props.event));
const majorVariant = computed(() => getMajorDailyVariant(props.event));
const displayName = computed(() => getEventDisplayNameForSingleDay(props.event));
const detailsEvent = computed(() => getEventForDetails(props.event));
const showBadge = computed(() => shouldShowBadge(props.event));
const eventCount = computed(() => getEventCount(props.event));
</script>

<style scoped>
.single-day-event {
    position: relative;
    min-height: 40px;
    display: flex;
    align-items: flex-start;
    /* gap: 2px; */
    padding: 2px 0 2px 1px;
    border-radius: 3px;
    cursor: pointer;
    min-width: 0;
    overflow: hidden;

    @media (min-width: 375px) {
        /* gap: 4px; */
        padding: 2px 1px 2px 1px;
    }

    @media (min-width: 425px) {
        /* gap: 4px; */
        padding: 2px 1px 2px 2px;
    }

    @media (min-width: 768px) {
        /* gap: 4px; */
        padding: 2px 1px 2px 4px;
    }
}

.single-day-event:hover {
    background-color: var(--calendar-hover-bg);
}

.single-day-event.event-past {
    .event-content {
        transition:
            filter 0.3s ease,
            opacity 0.3s ease;
    }

    :deep(.spotlight-bonus-icons) {
        transition:
            filter 0.3s ease,
            opacity 0.3s ease;
    }

    &:not(:hover) {
        .event-content {
            opacity: 0.6;
            filter: grayscale(50%);

            .event-name {
                text-shadow: none;
            }
        }

        :deep(.spotlight-bonus-icons) {
            opacity: 0.6;
            filter: grayscale(100%);
        }
    }
}

.single-day-event :deep(.pokemon-images.wrap-multiple) {
    min-width: max(80px, 100%);
}

.single-day-event .twitch-drops-icon {
    flex-shrink: 0;
}

.single-day-event :deep(.overflow-counter-badge) {
    top: -2px;
    bottom: auto;
    left: 0;
    right: auto;
    height: 12px;
    padding: 0 4px;
    font-size: 10px;
    font-weight: 500;
    background-color: rgba(30, 30, 40, 0.75);
}

@media (min-width: 375px) {
    .single-day-event :deep(.overflow-counter-badge) {
        left: -2px;
    }
}

/* Hide toggle button by default; show on hover */
.single-day-event :deep(.event-toggle-button) {
    display: none;
}

.single-day-event:hover :deep(.event-toggle-button) {
    display: inline-flex;
}

.event-content {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
    max-height: 140px;
    /* overflow: hidden; */
}

.event-content :deep(.pokemon-images) {
    margin-left: 0;
    max-height: 40px;
}

@media (min-width: 375px) {
    .single-day-event:not(.has-bonus-icons) .event-content :deep(.pokemon-images) {
        margin-left: 2px;
    }
}

@media (min-width: 576px) {
    .event-content :deep(.pokemon-images) {
        margin-left: 2px;
    }
}

@media (min-width: 768px) {
    .event-content :deep(.pokemon-images) {
        max-height: none;
    }
}

.single-day-event .event-name {
    font-size: 0.7rem;
    font-weight: 400;
    color: #333;
    min-height: 15px;
    line-height: 15px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-shadow: none;
    margin-top: 1px;
    flex: 1;
}

[data-bs-theme='dark'] .single-day-event .event-name {
    color: #e9ecef;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
}

.single-day-event .event-time {
    flex-shrink: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 1px;
    row-gap: 3px;
    font-size: 0.7rem;
    font-weight: 600;
    color: #444;
    line-height: 0.8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 1px;
    margin-bottom: 7px;

    &:has(.event-ended-label) {
        margin-bottom: 2px;
    }

    @media (min-width: 375px) {
        column-gap: 2px;
    }

    @media (min-width: 576px) {
        column-gap: 3px;
        &:has(.event-ended-label) {
            margin-bottom: 7px;
        }
    }

    .event-dot {
        display: inline-flex;
        flex-shrink: 0;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-top: -1px;
        margin-right: 1px;
        margin-left: 1px;

        @media (min-width: 375px) {
            margin-left: 1px;
        }

        @media (min-width: 425px) {
            width: 9px;
            height: 9px;
        }
    }
}

[data-bs-theme='dark'] .single-day-event .event-time {
    color: #adb5bd;
}

.event-ended-label {
    margin-left: 3px;
    font-size: 0.65rem;
    line-height: 1;
    font-weight: 500;
    color: color-mix(in srgb, var(--bs-secondary-color) 70%, var(--bs-danger) 50%);
    font-style: italic;
}

.event-name-container {
    display: flex;
    align-items: center;
    /* gap: 3px; */
    min-width: 0;
}

.single-day-event:hover .event-name-container {
    gap: 3px;
}

.single-day-event .calendar-event-badge {
    background-color: #6c757d;
    color: white;
    font-size: 0.6rem;
    min-width: 14px;
    height: 14px;
    padding: 0 3px;
}

.single-day-event.major-daily-display-event {
    margin-top: -1px;
    position: relative;
    isolation: isolate;
    min-height: 82px;
    border-radius: 5px;
    border: 2px solid color-mix(in srgb, var(--calendar-cell-bg) 22%, var(--major-event-color) 78%);
    background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--calendar-cell-bg) 70%, var(--major-event-color) 20%),
        color-mix(in srgb, var(--calendar-cell-bg) 66%, var(--major-event-color) 28%)
    );

    .event-content {
        position: relative;
        z-index: 1;
        max-height: none;
    }

    .event-name {
        white-space: normal;
        line-height: 0.875rem;
        text-overflow: unset;
        font-weight: 600;
    }

    .event-time {
        margin-top: 3px;
        margin-bottom: 2px;
        font-size: 0.68rem;
    }

    &:hover {
        background: linear-gradient(
            135deg,
            color-mix(in srgb, var(--calendar-hover-bg) 60%, var(--major-event-color) 25%),
            color-mix(in srgb, var(--calendar-cell-bg) 64%, var(--major-event-color) 33%)
        );
    }
}

@media (min-width: 576px) {
    .single-day-event.major-daily-display-event {
        min-height: 82px;
    }
}

@media (min-width: 768px) {
    .single-day-event.major-daily-display-event {
        min-height: 82px;
    }
}

@media (min-width: 1200px) {
    .single-day-event.major-daily-display-event {
        min-height: 86px;
    }
}

@media (min-width: 1400px) {
    .single-day-event.major-daily-display-event {
        min-height: 92px;
    }
}

.single-day-event.major-daily-display-event::after {
    content: '';
    position: absolute;
    right: -12px;
    bottom: 0px;
    width: 38px;
    height: 38px;
    pointer-events: none;
    opacity: 0.24;
    background-color: color-mix(in srgb, var(--major-event-color) 60%, var(--bs-body-color) 40%);
    mask-repeat: no-repeat;
    mask-position: center;
    mask-size: contain;
    z-index: 0;
}

@media (min-width: 375px) {
    .single-day-event.major-daily-display-event::after {
        right: -10px;
        bottom: -1px;
        width: 42px;
        height: 42px;
        opacity: 0.28;
    }
}

@media (min-width: 576px) {
    .single-day-event.major-daily-display-event::after {
        right: -8px;
        bottom: -2px;
        width: 50px;
        height: 50px;
        opacity: 0.34;
    }
}

@media (min-width: 768px) {
    .single-day-event.major-daily-display-event::after {
        right: -6px;
        bottom: -2px;
        width: 58px;
        height: 58px;
        opacity: 0.4;
    }
}

.single-day-event.major-daily-display-event.major-daily-global::after {
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M2 12h20'/%3E%3Cpath d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'/%3E%3C/svg%3E");
}

.single-day-event.major-daily-display-event.major-daily-location::after {
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 1 1 16 0'/%3E%3Ccircle cx='12' cy='10' r='3'/%3E%3C/svg%3E");
}

[data-bs-theme='dark'] .single-day-event.major-daily-display-event {
    border-color: color-mix(in srgb, #495057 35%, var(--major-event-color) 65%);
    background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--calendar-cell-bg) 74%, var(--major-event-color) 20%),
        color-mix(in srgb, var(--calendar-cell-bg) 70%, var(--major-event-color) 28%)
    );
}

/* [data-bs-theme='dark'] .single-day-event.major-daily-display-event:hover {
    background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--calendar-hover-bg) 60%, var(--major-event-color) 25%),
        color-mix(in srgb, var(--calendar-cell-bg) 64%, var(--major-event-color) 33%)
    );
} */

[data-bs-theme='dark'] .single-day-event.major-daily-display-event::after {
    background-color: color-mix(in srgb, var(--major-event-color) 70%, var(--bs-body-color) 30%);
}
</style>
