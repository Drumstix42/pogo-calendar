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
            '--event-color': eventColor,
        }"
        @mouseenter="debouncedHighlightEventID(props.event.eventID)"
        @mouseleave="debouncedClearEventIDHighlight"
    >
        <!-- Event type badge, actions, and toggle (clickable header) -->
        <div class="event-header-bar" @click="toggleActive">
            <div class="event-header-actions">
                <div class="event-type-badge">
                    {{ eventTypeName }}
                </div>

                <!-- Action buttons (when expanded) -->
                <template v-if="props.isActive">
                    <VTooltip :disabled="isTouchDevice" placement="top" :delay="{ show: 50, hide: 0 }" distance="10">
                        <template #popper>
                            <div class="tooltip-text">Customize event type color</div>
                        </template>
                        <button type="button" class="timeline-color-edit-btn" @click.stop="openColorModal">
                            <Palette :size="13" />
                        </button>
                    </VTooltip>

                    <div @click.stop>
                        <EventToggleButton :event-type="event.eventType" @hide="openHideModal" />
                    </div>
                </template>
            </div>

            <!-- Expand/collapse button (top-right) -->
            <button type="button" class="expand-toggle" @click.stop="toggleActive">
                <component :is="props.isActive ? ChevronsDownUp : ChevronsUpDown" :size="16" />
            </button>
        </div>

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

            <div class="event-content" :class="{ 'flex-column gap-2': props.isActive || pokemonCount > 6 }">
                <EventTimeDisplay :event="event" />

                <div
                    v-if="hasPokemon"
                    class="flex-grow-1 d-flex gap-1 align-items-start justify-content-end"
                    :class="[props.isActive || pokemonCount > 6 ? 'w-100' : 'w-50']"
                >
                    <PokemonImages
                        :event="event"
                        :event-name="formatEventName(event.name)"
                        :height="40"
                        :use-animated="props.isActive ? true : false"
                        :show-placeholder="true"
                        :show-tooltips="true"
                        :show-c-p="props.isActive"
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
import { getEventPokemonImages } from '@/utils/eventPokemon';
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

const pokemonCount = computed(() => {
    return getEventPokemonImages(props.event).length;
});

const hasPokemon = computed(() => {
    return pokemonCount.value > 0;
});
</script>

<style lang="scss" scoped>
.timeline-event-card {
    position: relative;
    border: 1px solid color-mix(in srgb, var(--event-color) 42%, var(--bs-border-color));
    border-radius: 8px;
    overflow: hidden;
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

            .expand-toggle {
                opacity: 0.8;
            }
        }
    }

    &.is-active {
        transform: scale3d(1.02, 1.02, 1);

        background-color: color-mix(in srgb, var(--event-color) 10%, var(--calendar-cell-bg));
        border-color: color-mix(in srgb, var(--event-color) 65%, var(--bs-border-color));
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }
}

.event-header-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    padding: 4px 4px;
    cursor: pointer;
    z-index: 1;

    .event-header-actions {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .event-type-badge {
        padding: 3px 8px;
        margin-left: 4px;
        font-size: 0.7rem;
        font-weight: 500;
        line-height: 1;
        color: white;
        background-color: var(--event-color);
        border-radius: 4px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        white-space: nowrap;
    }

    .timeline-color-edit-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 3px;
        height: 20px;
        border: none;
        border-radius: 3px;
        background-color: color-mix(in srgb, var(--bs-body-color) 15%, transparent);
        color: var(--bs-body-color);
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;

        &:hover {
            background-color: color-mix(in srgb, var(--bs-body-color) 20%, transparent);
            transform: scale(1.05);
        }

        &:active {
            transform: scale(0.95);
        }
    }

    .expand-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2px 3px;
        border: none;
        border-radius: 4px;
        background-color: color-mix(in srgb, var(--bs-body-color) 8%, transparent);
        color: var(--bs-body-color);
        cursor: pointer;
        opacity: 0.5;
        transition:
            opacity 0.2s ease,
            transform 0.2s ease,
            background-color 0.2s ease;

        @media (pointer: fine) {
            &:hover {
                opacity: 1;
                background-color: color-mix(in srgb, var(--bs-body-color) 15%, transparent);
                transform: scale(1.05);
            }
        }

        &:active {
            transform: scale(0.95);
        }
    }
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
        font-weight: 300;
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
</style>
