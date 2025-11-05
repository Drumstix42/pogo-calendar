<template>
    <div
        class="timeline-event-card timeline-event"
        :class="{
            'is-active': props.isActive,
            'event-id-highlighted': eventHighlight.hoveredEventID === props.event.eventID,
        }"
        :data-event-type="event.eventType"
        :data-timeline-event-id="event.eventID"
        :style="{
            '--event-bg-color': eventColor,
        }"
        @mouseenter="debouncedHighlightEventID(props.event.eventID)"
        @mouseleave="debouncedClearEventIDHighlight"
    >
        <!-- Colored header with event type -->
        <div class="event-header" @click="toggleActive">
            <div class="header-content">
                <span class="event-type">{{ eventTypeName }}</span>
                <!-- Color customization button -->
                <VTooltip
                    v-if="props.isActive"
                    :disabled="isTouchDevice"
                    placement="top"
                    :delay="{ show: 50, hide: 0 }"
                    distance="10"
                    class="d-flex align-items-center"
                >
                    <template #popper>
                        <div class="tooltip-text">Customize event type color</div>
                    </template>

                    <button type="button" class="timeline-color-edit-btn" @click.stop="openColorModal">
                        <Palette :size="13" />
                    </button>
                </VTooltip>
                <!-- Hide event type button -->
                <div v-if="props.isActive" class="event-toggle-container">
                    <EventToggleButton :event-type="event.eventType" @hide="openHideModal" />
                    <!-- <div class="header-action-text">Hide?</div> -->
                </div>
                <component :is="props.isActive ? ChevronsDownUp : ChevronsUpDown" :size="14" class="chevron-icon" />
            </div>
        </div>

        <!-- Event body with event name and details -->
        <div class="event-body">
            <div v-if="event.extraData?.parentEventId" class="parent-event-name">{{ parentEventName }}</div>
            <div class="event-name">{{ formatEventName(event.name) }}</div>

            <div class="event-content">
                <EventTimeDisplay :event="event" />

                <div class="flex-grow-1 d-flex gap-1 align-items-start justify-content-end">
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

                    <PokemonImages
                        :event="event"
                        :event-name="formatEventName(event.name)"
                        :height="40"
                        :use-animated="props.isActive ? true : false"
                        :show-placeholder="true"
                        :show-tooltips="true"
                    />
                </div>
            </div>

            <div class="event-extras-wrapper">
                <Transition name="fade">
                    <EventExtras v-if="props.isActive" :event="event" />
                </Transition>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { breakpointsBootstrapV5, useBreakpoints } from '@vueuse/core';
import { ChevronsDownUp, ChevronsUpDown, Palette } from 'lucide-vue-next';
import { computed } from 'vue';

import { useDeviceDetection } from '@/composables/useDeviceDetection';
import { useEditColorModal } from '@/composables/useEditColorModal';
import { useHideEventModal } from '@/composables/useHideEventModal';
import { useEventHighlightStore } from '@/stores/eventHighlight';
import { useEventsStore } from '@/stores/events';
import { formatEventName } from '@/utils/eventName';
import { type PogoEvent, getEventTypeInfo } from '@/utils/eventTypes';

import EvolveIcon from '../Icons/EvolveIcon.vue';
import TransferIcon from '../Icons/TransferIcon.vue';
import EventExtras from './EventExtras.vue';
import EventTimeDisplay from './EventTimeDisplay.vue';
import EventToggleButton from './EventToggleButton.vue';
import PokemonImages from './PokemonImages.vue';

interface Props {
    event: PogoEvent;
    isActive: boolean;
}

interface Emits {
    activate: [eventId: string];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const hideEventModal = useHideEventModal();
const editColorModal = useEditColorModal();
const eventsStore = useEventsStore();
const eventHighlight = useEventHighlightStore();
const { isTouchDevice } = useDeviceDetection();

const breakpoints = useBreakpoints(breakpointsBootstrapV5);
const isDesktopSidebar = breakpoints.greaterOrEqual('xxl'); // >= 1400px

function openColorModal() {
    editColorModal.openModal(props.event.eventType);
}

function toggleActive() {
    emit('activate', props.event.eventID);
}

function openHideModal() {
    hideEventModal.openModal(props.event);
}

let highlightTimeout: number | null = null;

function debouncedHighlightEventID(eventID: string) {
    if (highlightTimeout) {
        clearTimeout(highlightTimeout);
    }

    highlightTimeout = setTimeout(() => {
        // Only highlight calendar events when desktop sidebar is visible
        if (isDesktopSidebar.value) {
            eventHighlight.highlightEventID(eventID);
        }
        highlightTimeout = null;
    }, 200);
}

function debouncedClearEventIDHighlight() {
    if (highlightTimeout) {
        clearTimeout(highlightTimeout);
        highlightTimeout = null;
    }

    // Only clear calendar highlights when desktop sidebar is visible
    if (isDesktopSidebar.value) {
        eventHighlight.clearEventIDHighlight();
    }
}

// Event type color and name
const eventColor = computed(() => {
    return eventsStore.eventMetadata[props.event.eventID]?.color;
});

const eventTypeName = computed(() => {
    return getEventTypeInfo(props.event.eventType).name;
});

const parentEventName = computed(() => {
    const parentId = props.event.extraData?.parentEventId;
    if (!parentId) return null;

    const parentEvent = eventsStore.getEventById(parentId);
    return parentEvent ? `${formatEventName(parentEvent.name)} /` : null;
});
</script>

<style lang="scss" scoped>
.timeline-event-card {
    border: 1px solid;
    border-radius: 8px;
    overflow: hidden;
    border-color: var(--event-bg-color);
    background-color: var(--event-bg-color);

    transition:
        transform 0.15s ease,
        border-color 0.15s ease;

    @media (pointer: fine) {
        &:hover {
            border-color: color-mix(in srgb, var(--event-bg-color) 90%, black);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

            /* .event-body {
                background-color: color-mix(in srgb, var(--calendar-cell-bg) 92%, black);
            } */

            .chevron-icon {
                opacity: 0.8;
            }
        }
    }

    &.is-active {
        transform: scale(1.02);
        border-width: 1px;
        border-color: color-mix(in srgb, var(--event-bg-color) 90%, black);
        background-color: color-mix(in srgb, var(--event-bg-color) 90%, black);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

        .event-header {
            background-color: color-mix(in srgb, var(--event-bg-color) 90%, black);
            @media (pointer: fine) {
                &:hover {
                    background-color: color-mix(in srgb, var(--event-bg-color) 80%, black) !important;
                }
            }
        }
    }
}

.event-header {
    padding: 10px 12px;
    color: white;
    font-weight: 500;
    font-size: 0.9rem;
    line-height: 1.2rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
    background-color: var(--event-bg-color);
    cursor: pointer;
    transition: background-color 0.5s ease;

    @media (pointer: fine) {
        &:hover {
            font-weight: 600;
            background-color: color-mix(in srgb, var(--event-bg-color) 90%, black) !important;

            .chevron-icon {
                transform: scale(1.1);
            }
        }
    }

    .header-content {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        min-width: 0;
        line-height: 1;
    }

    .event-type {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
    }

    .chevron-icon {
        opacity: 0.6;
        transition:
            opacity 0.2s ease,
            transform 0.2s ease;
        flex-shrink: 0;
        color: white;
        margin-left: auto;
        pointer-events: none;
    }

    .header-action-text {
        font-size: 11px;
        font-weight: 400;
        line-height: 1;
        opacity: 0.8;
        flex-shrink: 0;
        white-space: nowrap;
        font-style: italic;
        pointer-events: none;
    }

    .event-toggle-container {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .timeline-color-edit-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 3px;
        height: 20px;
        border: none;
        border-radius: 3px;
        background-color: rgba(255, 255, 255, 0.2);
        color: white;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
    }

    .timeline-color-edit-btn:hover {
        background-color: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
    }

    .timeline-color-edit-btn:active {
        transform: scale(0.95);
    }
}

.event-body {
    background: var(--calendar-cell-bg);
    padding: 10px 12px;
    text-align: left;

    .event-name {
        font-size: 0.85rem;
        font-weight: 500;
        color: color-mix(in srgb, var(--bs-body-color) 90%, transparent);
        line-height: 1.3;
        margin-bottom: 5px;
    }

    .parent-event-name {
        font-size: 0.7rem;
        font-weight: 600;
        font-style: italic;
        color: color-mix(in srgb, var(--bs-body-color) 60%, transparent);
        line-height: 1.1;
        margin-bottom: 2px;
    }

    .event-content {
        display: flex;
        gap: 0px;
        align-items: flex-start;
        /* flex-wrap: wrap; */

        :deep(.pokemon-images) {
            justify-content: end;
            flex-grow: 0;
            flex-shrink: 1;
            flex-wrap: nowrap;
        }
    }

    .event-details {
        flex-grow: 1;
        flex-shrink: 0;
        margin-top: 4px;
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
    position: relative;
    top: 2px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 0;
    flex-shrink: 0;
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
</style>
