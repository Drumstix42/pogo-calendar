<template>
    <div class="event-tooltip" :class="{ 'is-scrollable': scrollable }">
        <EventTooltipHeader :event="event" />

        <div class="event-tooltip-body">
            <!-- Show individual events if grouped -->
            <div v-if="event._isGrouped" class="grouped-events">
                <div
                    v-for="groupedEvent in getGroupedEvents(event)"
                    :key="groupedEvent.eventID"
                    class="event-time-info"
                    :class="getMajorTooltipClass(groupedEvent)"
                >
                    <div class="event-content">
                        <!-- Event text content -->
                        <div class="event-text">
                            <div v-if="groupedEvent.extraData?.parentEventId" class="parent-event-name">{{ getParentEventName(groupedEvent) }}</div>
                            <div class="grouped-event-name">{{ formatEventName(groupedEvent.name) }}</div>
                            <EventTimeDisplay :event="groupedEvent" />
                            <div v-if="groupedEvent.link" class="lh-1">
                                <a
                                    :href="groupedEvent.link"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="link-secondary link-underline-opacity-0 link-underline-opacity-100-hover d-inline-flex align-items-center gap-1"
                                    style="font-size: 0.7rem"
                                >
                                    View on LeekDuck <ExternalLink :size="11" />
                                </a>
                            </div>
                        </div>

                        <PokemonEventImages
                            v-if="!getTierGroupsWithImagesForEvent(groupedEvent)"
                            :event="groupedEvent"
                            :event-name="formatEventName(groupedEvent.name)"
                            :height="50"
                            :use-animated="calendarSettings.useAnimatedImages"
                            :show-tooltips="true"
                            :show-c-p="true"
                            :wrap="true"
                        />

                        <div v-if="getScheduleSectionsWithTierGroupsForEvent(groupedEvent)?.length" class="raid-boss-tiers">
                            <EventTooltipScheduleSections
                                :sections="getScheduleSectionsWithTierGroupsForEvent(groupedEvent)"
                                label-mode="fallback"
                                :target-day-name="scheduleTargetDayName"
                                :height="50"
                                :event-type="groupedEvent.eventType"
                                :is-shadow="isShadowRaidEvent(groupedEvent)"
                                :use-animated="calendarSettings.useAnimatedImages"
                            />
                        </div>

                        <div v-else-if="getTierGroupsWithImagesForEvent(groupedEvent)" class="raid-boss-tiers">
                            <RaidTierGroupImages
                                :groups="getTierGroupsWithImagesForEvent(groupedEvent)"
                                :height="50"
                                :event-type="groupedEvent.eventType"
                                :is-shadow="isShadowRaidEvent(groupedEvent)"
                                :use-animated="calendarSettings.useAnimatedImages"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Show time for single events -->
            <div class="event-time-info" :class="getMajorTooltipClass(event)">
                <div class="event-content">
                    <!-- Event text content -->
                    <div class="event-text">
                        <div v-if="event.extraData?.parentEventId" class="parent-event-name">{{ parentEventName }}</div>
                        <div class="grouped-event-name">{{ formatEventName(event.name) }}</div>
                        <EventTimeDisplay :event="event" />
                    </div>

                    <PokemonEventImages
                        v-if="!tierGroupsWithImages"
                        :event="event"
                        :event-name="formatEventName(event.name)"
                        :height="60"
                        :use-animated="calendarSettings.useAnimatedImages"
                        :show-placeholder="isSingleDay"
                        :show-tooltips="true"
                        :show-c-p="true"
                        :wrap="true"
                    />
                </div>
            </div>

            <div class="event-extras-wrapper">
                <EventExtras :event="event" :highlight-day-of-week="highlightDayOfWeek" />
            </div>

            <!-- Raid boss tier groups -->
            <div v-if="scheduleDaySectionsWithTierGroups?.length" class="raid-boss-tiers">
                <div v-for="daySection in scheduleDaySectionsWithTierGroups" :key="daySection.id" class="schedule-day-section">
                    <div class="schedule-day-header">{{ daySection.date }}</div>

                    <EventTooltipScheduleSections
                        :sections="daySection.sections"
                        label-mode="plain"
                        :height="60"
                        :event-type="event.eventType"
                        :is-shadow="isShadowRaid"
                        :use-animated="calendarSettings.useAnimatedImages"
                    />
                </div>
            </div>

            <div v-else-if="scheduleSectionsWithTierGroups?.length" class="raid-boss-tiers">
                <EventTooltipScheduleSections
                    :sections="scheduleSectionsWithTierGroups"
                    label-mode="fallback"
                    :target-day-name="scheduleTargetDayName"
                    :height="60"
                    :event-type="event.eventType"
                    :is-shadow="isShadowRaid"
                    :use-animated="calendarSettings.useAnimatedImages"
                />
            </div>

            <div v-else-if="tierGroupsWithImages" class="raid-boss-tiers">
                <RaidTierGroupImages
                    :groups="tierGroupsWithImages"
                    :height="60"
                    :event-type="event.eventType"
                    :is-shadow="isShadowRaid"
                    :use-animated="calendarSettings.useAnimatedImages"
                />
            </div>
        </div>

        <div v-if="showBottomLink && event.link && !event._isGrouped" class="event-bottom-link">
            <a
                :href="event.link"
                target="_blank"
                rel="noopener noreferrer"
                class="link-neutral link-underline-opacity-0 link-underline-opacity-100-hover d-inline-flex align-items-center gap-1"
                style="font-size: 0.75rem"
            >
                View on LeekDuck <ExternalLink :size="12" />
            </a>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ExternalLink } from '@lucide/vue';
import { type Dayjs } from 'dayjs';

import { useEventTooltip } from '@/composables/useEventTooltip';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { getGroupedEvents } from '@/utils/eventGrouping';
import { formatEventName } from '@/utils/eventName';
import { type PogoEvent } from '@/utils/eventTypes';

import EventExtras from '../EventExtras/EventExtras.vue';
import EventTimeDisplay from '../EventTimeDisplay.vue';
import PokemonEventImages from '../PokemonEventImages.vue';
import RaidTierGroupImages from '../RaidTierGroupImages.vue';
import EventTooltipHeader from './EventTooltipHeader.vue';
import EventTooltipScheduleSections from './EventTooltipScheduleSections.vue';

interface Props {
    event: PogoEvent;
    isSingleDay?: boolean;
    targetDate?: Dayjs | string | Date;
    showBottomLink?: boolean;
    scrollable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    isSingleDay: false,
    targetDate: undefined,
    showBottomLink: true,
    scrollable: true,
});

const calendarSettings = useCalendarSettingsStore();

const {
    parentEventName,
    getParentEventName,
    getTierGroupsWithImagesForEvent,
    getScheduleSectionsWithTierGroupsForEvent,
    scheduleDaySectionsWithTierGroups,
    isShadowRaidEvent,
    getMajorTooltipClass,
    isShadowRaid,
    tierGroupsWithImages,
    scheduleSectionsWithTierGroups,
    scheduleTargetDayName,
    highlightDayOfWeek,
} = useEventTooltip(props);
</script>

<style scoped>
.event-tooltip {
    max-width: 350px;
    min-width: 200px;
    padding: 0rem;
    display: flex;
    flex-direction: column;
}

.event-tooltip.is-scrollable {
    max-height: min(45dvh, 520px);
}

.event-tooltip-body {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.event-tooltip.is-scrollable .event-tooltip-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
}

.event-time-info {
    margin-bottom: 0.4rem;
    padding: 0.4rem 0.6rem 0.4rem 0.5rem;
    border-radius: 4px;
}

.event-time-info.major-tooltip-event {
    position: relative;
}

.event-time-info.major-tooltip-event::after {
    content: '';
    position: absolute;
    right: 1px;
    bottom: 0;
    width: 56px;
    height: 56px;
    pointer-events: none;
    opacity: 0.22;
    background-color: color-mix(in srgb, var(--bs-body-color) 62%, transparent);
    mask-repeat: no-repeat;
    mask-position: center;
    mask-size: contain;
    z-index: 0;
}

@media (min-width: 768px) {
    .event-time-info.major-tooltip-event::after {
        right: 2px;
        bottom: 0;
        width: 68px;
        height: 68px;
    }
}

@media (min-width: 1200px) {
    .event-time-info.major-tooltip-event::after {
        right: 3px;
        bottom: -1px;
        width: 74px;
        height: 74px;
    }
}

.event-time-info.major-tooltip-global::after {
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M2 12h20'/%3E%3Cpath d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'/%3E%3C/svg%3E");
}

.event-time-info.major-tooltip-location::after {
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 1 1 16 0'/%3E%3Ccircle cx='12' cy='10' r='3'/%3E%3C/svg%3E");
}

[data-bs-theme='dark'] .event-time-info.major-tooltip-event::after {
    opacity: 0.26;
    background-color: color-mix(in srgb, var(--bs-body-color) 70%, transparent);
}

.event-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: relative;
    z-index: 1;
}

.event-text {
    width: 100%;
}

.event-time-info:last-child {
    margin-bottom: 0;
}

.grouped-events {
    margin-top: 0.6rem;
}

.grouped-event-name {
    font-size: 0.975rem;
    font-weight: 400;
    line-height: 1.3;
    color: color-mix(in srgb, var(--bs-body-color) 90%, transparent);
    margin-bottom: 0.7rem;
}

.parent-event-name {
    font-size: 0.7rem;
    font-weight: 600;
    font-style: italic;
    color: color-mix(in srgb, var(--bs-body-color) 60%, transparent);
    line-height: 1.1;
    margin-bottom: 2px;
}

.event-extras-wrapper {
    padding-left: 0.5rem;
}

.event-bottom-link {
    padding: 0 0.5rem;
}

.schedule-day-header {
    font-size: 0.925rem;
    text-transform: uppercase;
    font-weight: 700;
    line-height: 1.5;
    letter-spacing: 0.05em;
    color: color-mix(in srgb, var(--bs-body-color) 82%, transparent);
    padding: 0 0.1rem;
    position: sticky;
    top: 0;
    z-index: 11;
}

.raid-boss-tiers {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.4rem 0.6rem 0.4rem 0.5rem;
}

/* `.tier-group` / `.tier-label` live in the RaidTierGroupImages child; reach in via :deep(). */
:deep(.tier-group) {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 0.75rem;
    padding-left: 0.5rem;
}

:deep(.tier-label) {
    font-size: 0.8rem;
    font-weight: 600;
    color: color-mix(in srgb, var(--bs-body-color) 70%, transparent);
}

/* `.schedule-section-header` lives in the EventTooltipScheduleSections child; reach in via :deep().
   Sticky-header backgrounds depend on the scrollable variant of this root element. Slight
   transparency echoes the layered feel of the Timeline schedule cards. */
.event-tooltip.is-scrollable {
    --tooltip-sticky-header-bg: color-mix(in srgb, var(--calendar-cell-bg) 90%, transparent);
}

.event-tooltip:not(.is-scrollable) {
    --tooltip-sticky-header-bg: color-mix(in srgb, var(--bs-body-bg) 90%, transparent);
}

.event-tooltip.is-scrollable :deep(.schedule-section-header),
.event-tooltip.is-scrollable .schedule-day-header {
    background-color: var(--tooltip-sticky-header-bg);
}

.event-tooltip:not(.is-scrollable) :deep(.schedule-section-header),
.event-tooltip:not(.is-scrollable) .schedule-day-header {
    background-color: var(--tooltip-sticky-header-bg);
    top: -1rem;
}
</style>
