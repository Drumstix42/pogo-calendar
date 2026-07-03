<template>
    <BaseModal :show="show" title="Hide Event" @close="closeModal">
        <p class="mb-3">Choose how you want to hide this event:</p>

        <div class="d-grid gap-2">
            <!-- Hide by Type Button -->
            <button
                type="button"
                class="btn btn-hide-type"
                :style="{
                    backgroundColor: eventColor,
                    borderColor: eventColorDark,
                    color: 'white',
                }"
                @click="hideByType"
            >
                <div class="btn-content">
                    <span class="btn-label">Hide <em>all</em> events for:</span>
                    <span class="btn-value">{{ eventTypeName }}</span>
                </div>
            </button>

            <!-- Hide Individual Event Button -->
            <button type="button" class="btn btn-outline-secondary btn-hide-event" @click="hideById">
                <div class="btn-content">
                    <span class="btn-label">Hide only <em>this</em> event:</span>
                    <span class="btn-value">{{ eventName }}</span>
                </div>
            </button>
        </div>

        <!-- Timeline Filter Toggle -->
        <div class="timeline-filter-section mt-3 pt-3">
            <div class="form-check form-switch">
                <input
                    id="modalFiltersApplyToTimeline"
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    :checked="calendarSettings.filtersApplyToTimeline"
                    @change="handleTimelineFilterToggle"
                />
                <label for="modalFiltersApplyToTimeline" class="form-check-label">Apply filters to Timeline</label>
            </div>
            <small class="text-muted d-block mt-1">Control whether hidden events are also filtered from the timeline</small>
        </div>

        <!-- Cancel Button -->
        <div class="d-flex gap-2 mt-3 pt-3 border-top">
            <button type="button" class="btn btn-secondary flex-grow-1" @click="closeModal">Cancel</button>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventsStore } from '@/stores/events';
import { formatEventName } from '@/utils/eventName';
import { type EventTypeKey, type PogoEvent, getEventTypeInfo } from '@/utils/eventTypes';

import BaseModal from '@/components/BaseModal.vue';

interface Props {
    show: boolean;
    event: PogoEvent;
}

interface Emits {
    (e: 'close'): void;
    (e: 'hide-by-type', eventType: EventTypeKey): void;
    (e: 'hide-by-id', eventId: string, eventName: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const calendarSettings = useCalendarSettingsStore();
const eventsStore = useEventsStore();

const eventName = computed(() => formatEventName(props.event.name));
const eventTypeName = computed(() => getEventTypeInfo(props.event.eventType).name);
const eventColor = computed(() => eventsStore.eventMetadata[props.event.eventID]?.color);
const eventColorDark = computed(() => `color-mix(in srgb, ${eventColor.value} 70%, black)`);

function closeModal() {
    emit('close');
}

function handleTimelineFilterToggle(event: Event) {
    const target = event.target as HTMLInputElement;
    calendarSettings.setFiltersApplyToTimeline(target.checked);
}

function hideByType() {
    emit('hide-by-type', props.event.eventType);
    closeModal();
}

function hideById() {
    emit('hide-by-id', props.event.eventID, eventName.value);
    closeModal();
}
</script>

<style scoped>
.modal-body p {
    color: var(--bs-body-color);
    font-size: 0.95rem;
}

/* Button styles */
.btn-hide-type,
.btn-hide-event {
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
    font-weight: 500;
    border-width: 2px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
}

.btn-hide-type {
    border-width: 2px;
}

.btn-hide-type:hover {
    filter: brightness(1.2);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-hide-type:active {
    transform: translateY(0);
}

.btn-hide-event:hover {
    background-color: var(--bs-secondary-bg);
    border-color: var(--bs-secondary);
}

.btn-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    text-align: center;
}

.btn-label {
    font-size: 0.85rem;
    font-weight: 400;
    opacity: 0.9;
}

.btn-value {
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.3;
}

.btn-hide-type .btn-label,
.btn-hide-type .btn-value {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.btn-hide-event .btn-label {
    color: var(--bs-body-color);
    opacity: 0.7;
}

.btn-hide-event .btn-value {
    color: var(--bs-body-color);
}

/* Timeline Filter Section */
.timeline-filter-section {
    border-top: 1px solid var(--bs-border-color);
}

.form-check.form-switch {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.form-check-input {
    margin-top: 0;
    cursor: pointer;
}

.form-check-label {
    cursor: pointer;
    user-select: none;
}

.form-check-input:checked {
    background-color: var(--bs-success);
    border-color: var(--bs-success);
}

.form-check-input:focus {
    box-shadow: 0 0 0 0.25rem rgba(var(--bs-success-rgb), 0.25);
    border-color: var(--bs-focus-ring-color);
}

/* Responsive adjustments */
@media (max-width: 576px) {
    .btn-content {
        gap: 0.15rem;
    }

    .btn-label {
        font-size: 0.8rem;
    }

    .btn-value {
        font-size: 0.9rem;
    }
}
</style>
