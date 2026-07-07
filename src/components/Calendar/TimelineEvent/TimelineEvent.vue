<template>
    <div
        class="timeline-event-card timeline-event"
        :class="{
            'is-active': props.isActive,
            'event-id-highlighted': eventHighlight.hoveredEventID === props.event.eventID,
            'major-timeline-event': isMajorTimelineEvent,
            'major-timeline-global': isMajorTimelineEvent && majorTimelineVariant === 'global',
            'major-timeline-location': isMajorTimelineEvent && majorTimelineVariant === 'location-specific',
        }"
        :data-event-type="event.eventType"
        :data-timeline-event-id="event.eventID"
        :style="{
            '--event-color': eventColor,
        }"
        @mouseenter="debouncedHighlightEventID(props.event.eventID)"
        @mouseleave="debouncedClearEventIDHighlight"
    >
        <TimelineEventHeader
            :event-type="event.eventType"
            :event-type-name="eventTypeName"
            :is-active="props.isActive"
            :is-touch-device="isTouchDevice"
            @toggle="toggleActive"
            @add-to-calendar="openAddToCalendarModal"
            @edit-color="openColorModal"
            @hide="openHideModal"
        />

        <!-- Event body -->
        <div class="event-body">
            <div v-if="event.extraData?.parentEventId" class="parent-event-name">{{ parentEventName }}</div>

            <div class="event-header-row" @click="toggleActive">
                <span class="event-name" :class="{ 'text-truncate': !props.isActive }">
                    {{ formatEventName(event.name) }}
                </span>
                <!-- Spotlight bonus icons -->
                <div v-if="eventsStore.eventMetadata[event.eventID]?.spotlightBonus" class="spotlight-bonus-icons">
                    <EvolveIcon
                        v-if="eventsStore.eventMetadata[event.eventID]?.spotlightBonus?.category === 'evolve'"
                        :size="15"
                        class="evolve-icon"
                    />
                    <TransferIcon v-else-if="eventsStore.eventMetadata[event.eventID]?.spotlightBonus?.category === 'transfer'" :size="15" />
                    <img
                        v-if="eventsStore.eventMetadata[event.eventID]?.spotlightBonusIconUrl"
                        :src="eventsStore.eventMetadata[event.eventID]!.spotlightBonusIconUrl!"
                        class="bonus-type-icon"
                    />
                </div>
            </div>

            <div class="event-content" :class="{ 'flex-column gap-2': props.isActive || pokemonCount > 6 || collapsedScheduleDayGroups?.length }">
                <EventTimeDisplay :event="event" />

                <div
                    v-if="showPokemonRow"
                    class="flex-grow-1 d-flex gap-1 align-items-start"
                    :class="[props.isActive || pokemonCount > 6 || collapsedScheduleDayGroups?.length ? 'w-100' : 'w-50 justify-content-end']"
                >
                    <PokemonEventImages
                        v-if="showInlinePokemonImages"
                        :event="event"
                        :height="40"
                        :use-animated="props.isActive ? true : false"
                        :show-placeholder="true"
                        :show-tooltips="true"
                        :show-c-p="props.isActive"
                        :overflow-badge-align="'right'"
                        :exclude-tiers="props.isActive ? [] : ['Tier 1', 'Tier 3']"
                    />

                    <TimelineCollapsedSchedule
                        v-else-if="showCollapsedScheduleDays"
                        :day-groups="collapsedScheduleDayGroups"
                        :event-type="event.eventType"
                        :effect="spriteEffect"
                    />
                </div>

                <Transition name="fade">
                    <div v-if="props.isActive && hasExtras" class="event-extras-wrapper">
                        <EventExtras :event="event" />
                    </div>
                </Transition>

                <!-- Raid boss schedule (expanded only) -->
                <TimelineRaidSchedule
                    v-if="props.isActive"
                    :day-sections="timelineScheduleDaySectionsWithTierGroups"
                    :default-tier-groups="defaultTierGroupsWithImages"
                    :event-type="event.eventType"
                    :effect="spriteEffect"
                />
            </div>

            <div v-if="props.isActive && event.link && !event._isGrouped" class="event-bottom-link">
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
    </div>
</template>

<script setup lang="ts">
import { ExternalLink } from '@lucide/vue';

import { useTimelineEvent } from '@/composables/useTimelineEvent';
import { useEventHighlightStore } from '@/stores/eventHighlight';
import { useEventsStore } from '@/stores/events';
import { formatEventName } from '@/utils/eventName';
import { type PogoEvent } from '@/utils/eventTypes';

import EventExtras from '@/components/Calendar/EventExtras/EventExtras.vue';
import EventTimeDisplay from '@/components/Calendar/EventTimeDisplay.vue';
import PokemonEventImages from '@/components/Calendar/PokemonEventImages.vue';
import TimelineCollapsedSchedule from '@/components/Calendar/TimelineEvent/TimelineCollapsedSchedule.vue';
import TimelineEventHeader from '@/components/Calendar/TimelineEvent/TimelineEventHeader.vue';
import TimelineRaidSchedule from '@/components/Calendar/TimelineEvent/TimelineRaidSchedule.vue';
import EvolveIcon from '@/components/Icons/EvolveIcon.vue';
import TransferIcon from '@/components/Icons/TransferIcon.vue';

interface Props {
    event: PogoEvent;
    isActive: boolean;
}

interface Emits {
    activate: [eventId: string];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const eventsStore = useEventsStore();
const eventHighlight = useEventHighlightStore();

const {
    isTouchDevice,
    openColorModal,
    openAddToCalendarModal,
    toggleActive,
    openHideModal,
    debouncedHighlightEventID,
    debouncedClearEventIDHighlight,
    eventColor,
    eventTypeName,
    parentEventName,
    pokemonCount,
    collapsedScheduleDayGroups,
    spriteEffect,
    defaultTierGroupsWithImages,
    timelineScheduleDaySectionsWithTierGroups,
    showCollapsedScheduleDays,
    showInlinePokemonImages,
    showPokemonRow,
    hasExtras,
    isMajorTimelineEvent,
    majorTimelineVariant,
} = useTimelineEvent(props, emit);
</script>

<style lang="scss" scoped>
.timeline-event-card {
    position: relative;
    border: 1px solid color-mix(in srgb, var(--event-color) 42%, var(--bs-border-color));
    border-radius: 8px;
    background-color: color-mix(in srgb, var(--event-color) 5%, var(--calendar-cell-bg));
    transition:
        transform 0.15s ease,
        box-shadow 0.15s ease,
        background-color 0.15s ease,
        border-color 0.15s ease;
    -webkit-font-smoothing: antialiased;

    @media (pointer: fine) {
        &:hover {
            background-color: color-mix(in srgb, var(--event-color) 10%, var(--calendar-cell-bg));
            border-color: color-mix(in srgb, var(--event-color) 65%, var(--bs-border-color));
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

            // .expand-toggle lives in the child TimelineEventHeader; reach it via :deep
            :deep(.expand-toggle) {
                opacity: 0.8;
            }
        }
    }

    &.is-active {
        transform-origin: top center;
        transform: scale3d(1.015, 1, 1);

        background-color: color-mix(in srgb, var(--event-color) 10%, var(--calendar-cell-bg));
        border-color: color-mix(in srgb, var(--event-color) 65%, var(--bs-border-color));
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }
}

.timeline-event-card.major-timeline-event {
    border-width: 2px;
    border-color: color-mix(in srgb, var(--calendar-cell-bg) 28%, var(--event-color) 72%);
    background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--calendar-cell-bg) 72%, var(--event-color) 28%),
        color-mix(in srgb, var(--calendar-cell-bg) 62%, var(--event-color) 38%)
    );

    @media (pointer: fine) {
        &:hover {
            background: linear-gradient(
                135deg,
                color-mix(in srgb, var(--calendar-hover-bg) 66%, var(--event-color) 34%),
                color-mix(in srgb, var(--calendar-cell-bg) 56%, var(--event-color) 44%)
            );
            border-color: color-mix(in srgb, var(--calendar-cell-bg) 20%, var(--event-color) 80%);
        }
    }

    &.is-active {
        border-color: color-mix(in srgb, var(--calendar-cell-bg) 16%, var(--event-color) 84%);
        background: linear-gradient(
            135deg,
            color-mix(in srgb, var(--calendar-hover-bg) 60%, var(--event-color) 40%),
            color-mix(in srgb, var(--calendar-cell-bg) 52%, var(--event-color) 48%)
        );
    }
}

.timeline-event-card.major-timeline-event::after {
    content: '';
    position: absolute;
    right: 1px;
    bottom: 0;
    width: 56px;
    height: 56px;
    pointer-events: none;
    opacity: 0.2;
    background-color: color-mix(in srgb, var(--event-color) 62%, var(--bs-body-color) 38%);
    mask-repeat: no-repeat;
    mask-position: center;
    mask-size: contain;
    z-index: 0;
}

@media (min-width: 768px) {
    .timeline-event-card.major-timeline-event::after {
        right: 2px;
        bottom: 0;
        width: 68px;
        height: 68px;
    }
}

@media (min-width: 1200px) {
    .timeline-event-card.major-timeline-event::after {
        right: 3px;
        bottom: -1px;
        width: 74px;
        height: 74px;
    }
}

.timeline-event-card.major-timeline-event.major-timeline-global::after {
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M2 12h20'/%3E%3Cpath d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'/%3E%3C/svg%3E");
}

.timeline-event-card.major-timeline-event.major-timeline-location::after {
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 1 1 16 0'/%3E%3Ccircle cx='12' cy='10' r='3'/%3E%3C/svg%3E");
}

[data-bs-theme='dark'] .timeline-event-card.major-timeline-event {
    border-color: color-mix(in srgb, #495057 32%, var(--event-color) 68%);
    background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--calendar-cell-bg) 76%, var(--event-color) 24%),
        color-mix(in srgb, var(--calendar-cell-bg) 66%, var(--event-color) 34%)
    );

    @media (pointer: fine) {
        &:hover {
            background: linear-gradient(
                135deg,
                color-mix(in srgb, var(--calendar-hover-bg) 62%, var(--event-color) 38%),
                color-mix(in srgb, var(--calendar-cell-bg) 58%, var(--event-color) 42%)
            );
        }
    }

    &.is-active {
        background: linear-gradient(
            135deg,
            color-mix(in srgb, var(--calendar-hover-bg) 56%, var(--event-color) 44%),
            color-mix(in srgb, var(--calendar-cell-bg) 52%, var(--event-color) 48%)
        );
    }
}

[data-bs-theme='dark'] .timeline-event-card.major-timeline-event::after {
    opacity: 0.24;
    background-color: color-mix(in srgb, var(--event-color) 70%, var(--bs-body-color) 30%);
}

.event-body {
    padding: 12px 10px 5px 10px;
    padding-top: 32px;
    text-align: left;

    .parent-event-name {
        font-size: 0.7rem;
        font-weight: 600;
        font-style: italic;
        color: color-mix(in srgb, var(--bs-body-color) 60%, transparent);
        line-height: 1.1;
        margin-bottom: 4px;
    }

    .event-header-row {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        margin: -5px -4px 2px -4px;
        padding: 4px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.15s ease;

        @media (pointer: fine) {
            &:hover {
                background-color: color-mix(in srgb, var(--bs-body-color) 3%, transparent);
            }

            &:hover .event-name {
                color: var(--bs-body-color);
            }
        }

        &:active {
            background-color: color-mix(in srgb, var(--bs-body-color) 5%, transparent);
        }
    }

    .event-name {
        flex: 1;
        font-size: 0.975rem;
        font-weight: 400;
        color: color-mix(in srgb, var(--bs-body-color) 90%, transparent);
        line-height: 1.3;
        transition: color 0.2s ease;
    }

    .event-content {
        display: flex;
        gap: 0px;
        align-items: flex-start;

        :deep(.event-time-display) {
            font-size: 0.75rem;
        }

        :deep(.pokemon-images) {
            justify-content: end;
            flex-grow: 1;
            flex-shrink: 1;
        }
    }

    .event-extras-wrapper {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease;

        :deep(.event-extras) {
            margin-top: 0.5rem;
        }

        :deep(.community-day-bonuses) {
            margin-top: 1rem;
        }
    }
}

.spotlight-bonus-icons {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    flex-shrink: 0;
    margin-top: 1px;
    filter: grayscale(20%);
}

.evolve-icon {
    color: #aa403a;
}

[data-bs-theme='dark'] .evolve-icon {
    color: #ee726e;
}

.spotlight-bonus-icons > svg {
    flex-shrink: 0;
}

.spotlight-bonus-icons .bonus-type-icon {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
    object-fit: contain;
    filter: drop-shadow(1px 1px 1px color-mix(in srgb, black 40%, transparent));
}

.timeline-event-card.is-active {
    .event-extras-wrapper {
        max-height: 180px;
    }
}

.event-bottom-link {
    padding-top: 0.15rem;
}
</style>
