<template>
    <div
        class="timeline-event-card calendar-event"
        :class="{ 'is-active': props.isActive }"
        :data-event-type="event.eventType"
        :style="{
            borderColor: eventColor,
            backgroundColor: eventColor,
            '--event-color-dark': eventColorDark,
        }"
    >
        <!-- Colored header with event type -->
        <div class="event-header" :style="{ backgroundColor: eventColor }" @click="toggleActive">
            <div class="header-content">
                <span class="event-type">{{ eventTypeName }}</span>
                <!-- Hide event type button -->
                <div v-if="props.isActive" class="event-toggle-container">
                    <EventToggleButton :event-type="event.eventType" @hide="hideEventType" />
                    <div class="header-action-text">Hide?</div>
                </div>
                <component :is="props.isActive ? ChevronsDownUp : ChevronsUpDown" :size="14" class="chevron-icon" />
            </div>
        </div>

        <!-- Event body with event name and details -->
        <div class="event-body">
            <div class="event-name">{{ formatEventName(event.name) }}</div>

            <div class="event-content">
                <EventTimeDisplay :event="event" />

                <PokemonImages
                    :event="event"
                    :event-name="formatEventName(event.name)"
                    :height="40"
                    :use-animated="props.isActive ? true : false"
                    :show-placeholder="true"
                    :show-tooltips="true"
                />
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
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-vue-next';
import { computed } from 'vue';

import { useEventFilterToasts } from '@/composables/useEventFilterToasts';
import { formatEventName } from '@/utils/eventName';
import { type EventTypeKey, type PogoEvent, getEventTypeInfo } from '@/utils/eventTypes';

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
const { hideEventTypeWithToast } = useEventFilterToasts();

function toggleActive() {
    emit('activate', props.event.eventID);
}

// Event type color and name
const eventColor = computed(() => {
    return getEventTypeInfo(props.event.eventType).color;
});

const eventTypeName = computed(() => {
    return getEventTypeInfo(props.event.eventType).name;
});

// Darker color for active state
const eventColorDark = computed(() => {
    return `color-mix(in srgb, ${eventColor.value} 90%, black)`;
});

const hideEventType = (eventType: EventTypeKey): void => {
    hideEventTypeWithToast(eventType);
};
</script>

<style lang="scss" scoped>
.timeline-event-card {
    border: 1px solid;
    border-radius: 8px;
    overflow: hidden;

    transition:
        transform 0.15s ease,
        border-color 0.15s ease;

    @media (pointer: fine) {
        &:hover {
            border-color: var(--event-color-dark);
            background-color: var(--event-color-dark);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

            .event-header {
                background-color: var(--event-color-dark) !important;
            }
        }
    }

    &.is-active {
        transform: scale(1.02);
        border-width: 2px;
        border-color: var(--event-color-dark);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
    cursor: pointer;

    @media (pointer: fine) {
        &:hover {
            font-weight: 600;
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
        transition: opacity 0.2s ease;
        flex-shrink: 0;
        color: white;
        margin-left: auto;
    }

    .header-action-text {
        font-size: 11px;
        font-weight: 400;
        line-height: 1;
        opacity: 0.8;
        flex-shrink: 0;
        white-space: nowrap;
        font-style: italic;
    }

    .event-toggle-container {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 4px;
    }
}

.event-body {
    background: var(--calendar-cell-bg);
    padding: 12px 12px;
    text-align: left;

    .event-name {
        font-size: 0.85rem;
        font-weight: 500;
        color: color-mix(in srgb, var(--bs-body-color) 90%, transparent);
        line-height: 1.3;
        margin-bottom: 3px;
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
            margin-left: auto;
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

.timeline-event-card.is-active {
    .event-extras-wrapper {
        max-height: 180px;
    }
}
</style>
