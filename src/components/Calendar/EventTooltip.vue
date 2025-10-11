<template>
    <div class="event-tooltip">
        <div
            class="event-tooltip-type"
            :style="{
                backgroundColor: getEventColor(event),
                borderLeftColor: `color-mix(in srgb, ${getEventColor(event)} 70%, black)`,
            }"
        >
            <span class="event-type-name">{{ getEventTypeName(event) }}</span>
            <EventToggleButton :event-type="event.eventType" @hide="openHideModal" />
        </div>

        <!-- Show individual events if grouped -->
        <div v-if="(event as any)._isGrouped" class="grouped-events">
            <div v-for="groupedEvent in getGroupedEvents(event)" :key="groupedEvent.eventID" class="event-time-info">
                <div class="event-content">
                    <!-- Event text content -->
                    <div class="event-text">
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

                    <!-- Pokemon images -->
                    <PokemonImages
                        :event="groupedEvent"
                        :event-name="formatEventName(groupedEvent.name)"
                        :height="50"
                        :use-animated="calendarSettings.useAnimatedImages"
                        :show-tooltips="true"
                    />
                </div>
            </div>
        </div>

        <!-- Show time for single events -->
        <div v-else>
            <div class="event-time-info">
                <div class="event-content">
                    <!-- Event text content -->
                    <div class="event-text">
                        <div class="grouped-event-name">{{ formatEventName(event.name) }}</div>
                        <EventTimeDisplay :event="event" />
                    </div>

                    <!-- Pokemon images -->
                    <PokemonImages
                        :event="event"
                        :event-name="formatEventName(event.name)"
                        :height="60"
                        :use-animated="calendarSettings.useAnimatedImages"
                        :show-placeholder="isSingleDay"
                        :show-tooltips="true"
                    />
                </div>
            </div>
        </div>

        <div class="event-extras-wrapper">
            <EventExtras :event="event" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next';

import { useHideEventModal } from '@/composables/useHideEventModal';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { formatEventName } from '@/utils/eventName';
import { type PogoEvent, getEventTypeInfo, getGroupedEvents } from '@/utils/eventTypes';

import EventExtras from './EventExtras.vue';
import EventTimeDisplay from './EventTimeDisplay.vue';
import EventToggleButton from './EventToggleButton.vue';
import PokemonImages from './PokemonImages.vue';

interface Props {
    event: PogoEvent;
    isSingleDay?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    isSingleDay: false,
});

const calendarSettings = useCalendarSettingsStore();
const hideEventModal = useHideEventModal();

function openHideModal() {
    hideEventModal.openModal(props.event);
}

const getEventColor = (event: PogoEvent): string => {
    return getEventTypeInfo(event.eventType).color;
};

const getEventTypeName = (event: PogoEvent): string => {
    return getEventTypeInfo(event.eventType).name;
};
</script>

<style scoped>
.event-tooltip {
    max-width: 350px;
    min-width: 180px;
    padding: 0rem;
}

.event-tooltip-type {
    font-size: 0.8rem;
    line-height: 1.2;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 0.25rem;
    padding: 0.4rem 0.6rem 0.4rem 0.5rem;
    border-radius: 4px;
    border-left: 3px solid;
    text-shadow: 1px 2px 2px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.event-type-name {
    flex: 1;
}

.event-time-info {
    margin-bottom: 0.4rem;
    padding: 0.4rem 0.6rem 0.4rem 0.5rem;
    border-radius: 4px;
}

.event-content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.event-text {
    width: 100%;
}

.event-time-info:last-child {
    margin-bottom: 0;
}

.grouped-events {
    margin-top: 0.6rem;
    max-height: calc(45dvh - 45px);
    overflow-y: auto;
}

.grouped-event-name {
    font-size: 0.75rem;
    font-weight: 400;
    line-height: 1.3;
    color: color-mix(in srgb, var(--bs-body-color) 90%, transparent);
    margin-bottom: 0.5rem;
}

.event-extras-wrapper {
    padding-left: 0.5rem;
}
</style>
