<template>
    <div
        class="multi-day-event-bar calendar-event"
        :class="[
            barClass,
            {
                'event-id-highlighted': eventHighlight.hoveredEventID === event.eventID,
                'event-past': metadata?.isPastEvent,
            },
        ]"
        :data-event-type="event.eventType"
        :data-event-id="event.eventID"
        :style="{
            '--event-bg-color': metadata?.color,
            backgroundColor: metadata?.color,
            fontSize: `${calendarSettings.eventBarFontSize}px`,
            left: position.left,
            width: position.width,
            position: 'absolute',
            pointerEvents: 'auto',
            zIndex: 20 + slotTop,
        }"
        :data-debug="`Event: ${event.name} | ID: ${event.eventID} | Slot: ${slotIndex} | Grouped: ${event._isGrouped || false}`"
        @mouseenter="debouncedHighlightEventID(event.eventID)"
        @mouseleave="debouncedClearEventIDHighlight"
        @click="handleEventClick(event.eventID)"
    >
        <VMenu
            :disabled="isTouchDevice"
            placement="top"
            :delay="tooltipOptionsDefaults.delay"
            :distance="tooltipOptionsDefaults.distance"
            :auto-hide="tooltipOptionsDefaults.autoHide"
            :show-group="`multi-${event.eventID}`"
            @apply-show="handleMenuShow(event.eventID)"
            @apply-hide="handleMenuHide(event.eventID)"
        >
            <div class="multi-day-event-bar--inner">
                <TwitchIcon v-if="event.eventType === 'twitch-drops'" :size="iconHeight" class="twitch-drops-icon" />

                <!-- Show Pokemon images for grouped or individual events -->
                <template
                    v-else-if="
                        calendarSettings.useMultiDayEventSprites && !isMajorCalendarEventType(event.eventType) && shouldShowMultiDaySprites(event)
                    "
                >
                    <template v-if="calendarSettings.groupSimilarEvents && hasGroupedEvents(event)">
                        <PokemonEventImages :event="event" :height="iconHeight" :limit="2" :exclude-tiers="['Tier 1', 'Tier 3']" />
                    </template>
                    <template v-else>
                        <PokemonEventImages :event="event" :height="iconHeight" :exclude-tiers="['Tier 1', 'Tier 3']" />
                    </template>
                </template>

                <span class="event-name">{{ getEventDisplayName(event) }}</span>
                <span v-if="shouldShowBadge(event)" class="calendar-event-badge">{{ getEventCount(event) }}</span>
            </div>

            <template #popper>
                <EventTooltip :event="event" :target-date="dayInstance" />
            </template>
        </VMenu>
    </div>
</template>

<script setup lang="ts">
import { type Dayjs } from 'dayjs';
import { computed } from 'vue';

import { useCalendarDayEventInteraction } from '@/composables/useCalendarDayEventInteraction';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventHighlightStore } from '@/stores/eventHighlight';
import { useEventsStore } from '@/stores/events';
import { getEventCount, getEventDisplayName, shouldShowBadge, shouldShowMultiDaySprites } from '@/utils/eventDisplay';
import { hasGroupedEvents } from '@/utils/eventGrouping';
import { isMajorCalendarEventType } from '@/utils/eventMajor';
import { type PogoEvent } from '@/utils/eventTypes';

import EventTooltip from '@/components/Calendar/EventTooltip/EventTooltip.vue';
import PokemonEventImages from '@/components/Calendar/PokemonEventImages.vue';
import TwitchIcon from '@/components/Icons/TwitchIcon.vue';

interface Props {
    event: PogoEvent;
    dayInstance: Dayjs;
    barClass: string;
    position: { left: string; width: string };
    slotTop: number;
    slotIndex: number | undefined;
}

const props = defineProps<Props>();

const eventsStore = useEventsStore();
const calendarSettings = useCalendarSettingsStore();
const eventHighlight = useEventHighlightStore();

const {
    isTouchDevice,
    tooltipOptionsDefaults,
    debouncedHighlightEventID,
    debouncedClearEventIDHighlight,
    handleEventClick,
    handleMenuShow,
    handleMenuHide,
} = useCalendarDayEventInteraction(() => props.dayInstance);

const metadata = computed(() => eventsStore.eventMetadata[props.event.eventID]);
const iconHeight = computed(() => calendarSettings.eventBarHeight - 2);
</script>

<style scoped>
.multi-day-event-bar {
    display: flex;
    align-items: center;
    gap: 4px;
    border-radius: 6px;
    font-size: 11px;
    line-height: 1.2;
    color: #f2f2f2;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    height: 100%;
    min-width: 0;
    margin-bottom: 1px;
    overflow: hidden;
    position: relative;
    box-sizing: border-box; /* Use border-box for predictable sizing */
    pointer-events: auto; /* Ensure bars are interactive */
    transform: translate3d(0, 0, 0); /* Fixes some rendering issues in Chrome */
    transition: background-color 0.5s ease;
}

.multi-day-event-bar:hover {
    color: #ffffff;
    background-color: color-mix(in srgb, var(--event-bg-color) 80%, black) !important;

    .event-name {
        box-shadow: inset 1px 1px 9px 4px color-mix(in srgb, var(--event-bg-color) 80%, black);
    }
}

.multi-day-event-bar--inner {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    padding-left: 2px;
    padding-right: 0; /* apply padding to the text instead, so any kind of floating/transparent BG can render all the way to the edge */
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    gap: 4px;
    transform: translate3d(0, 0, 0); /* Fixes some rendering issues in Chrome */
}

.start-cap .multi-day-event-bar--inner {
    padding-left: 3px;

    @media (min-width: 768px) {
        padding-left: 5px;
    }
}

:deep(.multi-day-event-bar--inner .pokemon-images) {
    flex-shrink: 0;
    gap: 1px;
    max-width: 50px;
    overflow: visible;
    flex-wrap: nowrap;
}

.multi-day-event-bar--inner .twitch-drops-icon {
    flex-shrink: 0;
}

.multi-day-event-bar .event-name {
    z-index: 2;
    overflow: hidden;
    text-overflow: clip;
    white-space: nowrap;
    font-weight: 400;
    line-height: 1.5;
    min-width: min(28px, 100%);
    padding-right: 1px;

    /* text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.55); */ /* already a subtle shadow on the parent */
    box-shadow: inset 1px 1px 9px 4px var(--event-bg-color);

    @media (min-width: 768px) {
        text-overflow: ellipsis;
    }
}

.multi-day-event-bar:hover {
    .event-name {
        font-weight: 500;
    }
}

.multi-day-event-bar .v-popper--theme-tooltip,
.multi-day-event-bar .v-popper--theme-dropdown {
    width: 100%;
    height: 100%;
}

.multi-day-event-bar.event-past {
    .pokemon-images {
        transition:
            opacity 0.3s ease,
            filter 0.3s ease;
    }
    .event-name {
        transition:
            opacity 0.3s ease,
            color 0.3s ease;
    }
    &:not(:hover) {
        opacity: 0.9;
        .event-name {
            color: #ccc;
            text-shadow: none;
        }
        .pokemon-images {
            opacity: 0.9;
            filter: grayscale(80%);
        }
    }
}

/* Hide toggle button by default; show on hover */
.multi-day-event-bar :deep(.event-toggle-button) {
    display: none;
}

.multi-day-event-bar:hover :deep(.event-toggle-button) {
    display: inline-flex;
}

/* Multi-day event bar cap styles */
.multi-day-event-bar.start-cap {
    border-top-left-radius: 6px;
    border-bottom-left-radius: 6px;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}

.multi-day-event-bar.end-cap {
    border-top-right-radius: 6px;
    border-bottom-right-radius: 6px;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}

/* When both start-cap and end-cap are present, make it fully rounded */
.multi-day-event-bar.start-cap.end-cap {
    border-radius: 6px;
}

/* When week-continue has end-cap, add right border radius */
.multi-day-event-bar.week-continue.end-cap {
    border-top-right-radius: 6px;
    border-bottom-right-radius: 6px;
}

.multi-day-event-bar.week-continue {
    border-radius: 0;
}

.multi-day-event-bar.middle-continue {
    border-radius: 0;
}

.multi-day-event-bar.single-day-span {
    border-radius: 6px;
}
</style>
