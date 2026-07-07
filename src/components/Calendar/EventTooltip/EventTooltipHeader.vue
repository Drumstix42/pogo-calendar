<template>
    <div
        class="event-tooltip-type"
        :style="{
            backgroundColor: eventsStore.eventMetadata[event.eventID]?.color,
            borderLeftColor: `color-mix(in srgb, ${eventsStore.eventMetadata[event.eventID]?.color} 70%, black)`,
        }"
    >
        <span class="event-type-name">{{ eventTypeName }}</span>
        <VTooltip :disabled="isTouchDevice" placement="top" :delay="{ show: 50, hide: 0 }" distance="10" class="d-flex align-items-center">
            <template #popper>
                <div class="tooltip-text">Add to calendar</div>
            </template>
            <button type="button" class="tooltip-color-edit-btn" title="Add to calendar" @click="addToCalendarModal.openModal(event)">
                <BellPlus :size="13" />
            </button>
        </VTooltip>
        <VTooltip :disabled="isTouchDevice" placement="top" :delay="{ show: 50, hide: 0 }" distance="10" class="d-flex align-items-center">
            <template #popper>
                <div class="tooltip-text">Customize event type color</div>
            </template>
            <button type="button" class="tooltip-color-edit-btn" :title="`Customize ${eventTypeName} color`" @click="openColorModal">
                <Palette :size="13" />
            </button>
        </VTooltip>
        <EventToggleButton :event-type="event.eventType" @hide="openHideModal" />
    </div>
</template>

<script setup lang="ts">
import { BellPlus, Palette } from '@lucide/vue';
import { hideAllPoppers } from 'floating-vue';
import { computed, nextTick } from 'vue';

import { useAddToCalendarModal } from '@/composables/useAddToCalendarModal';
import { useDeviceDetection } from '@/composables/useDeviceDetection';
import { useEditColorModal } from '@/composables/useEditColorModal';
import { useHideEventModal } from '@/composables/useHideEventModal';
import { useEventsStore } from '@/stores/events';
import { type PogoEvent, getEventTypeInfo } from '@/utils/eventTypes';

import EventToggleButton from '../EventToggleButton.vue';

interface Props {
    event: PogoEvent;
}

const props = defineProps<Props>();

const hideEventModal = useHideEventModal();
const editColorModal = useEditColorModal();
const addToCalendarModal = useAddToCalendarModal();
const eventsStore = useEventsStore();
const { isTouchDevice } = useDeviceDetection();

const eventTypeName = computed(() => getEventTypeInfo(props.event.eventType).name);

function openColorModal() {
    editColorModal.openModal(props.event.eventType);
}

function openHideModal() {
    hideEventModal.openModal(props.event);
    // Hide tooltip after a short delay to ensure it closes even with mouse still hovering
    nextTick(() => {
        setTimeout(() => {
            hideAllPoppers();
        }, 50);
    });
}
</script>

<style scoped>
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
    gap: 8px;
}

.tooltip-color-edit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3px;
    border: none;
    border-radius: 3px;
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.tooltip-color-edit-btn:hover {
    background-color: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
}

.tooltip-color-edit-btn:active {
    transform: scale(0.95);
}
</style>
