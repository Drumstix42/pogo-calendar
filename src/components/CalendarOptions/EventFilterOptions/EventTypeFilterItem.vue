<template>
    <label class="filter-item" :class="{ 'filter-item--enabled': isEnabled }">
        <input
            :id="`filter-option-${eventTypeKey}`"
            class="filter-checkbox"
            type="checkbox"
            :checked="isEnabled"
            @change="eventFilter.toggleEventType(eventTypeKey)"
        />
        <div class="filter-layout">
            <div class="filter-checkbox-area" :class="{ 'filter-checkbox-area--checked': isEnabled }">
                <Check :size="22" class="checkbox-icon" :class="{ 'checkbox-icon--checked': isEnabled }" />
            </div>
            <div class="filter-content" :style="{ backgroundColor: eventTypeColorsStore.getEventTypeColor(eventTypeKey) }">
                <span class="event-name">{{ info.name }}</span>
            </div>
            <button
                type="button"
                class="filter-color-edit-btn"
                :class="{ 'has-custom-color': eventTypeColorsStore.hasCustomColor(eventTypeKey) }"
                :title="`Customize ${info.name} color`"
                @click.prevent.stop="openColorModal"
            >
                <Palette :size="16" />
            </button>
        </div>
    </label>
</template>

<script setup lang="ts">
import { Check, Palette } from '@lucide/vue';
import { computed } from 'vue';

import { useEditColorModal } from '@/composables/useEditColorModal';
import { useEventFilterStore } from '@/stores/eventFilter';
import { useEventTypeColorsStore } from '@/stores/eventTypeColors';
import { getEventTypeInfo } from '@/utils/eventTypes';
import type { EventTypeKey } from '@/utils/eventTypes';

const props = defineProps<{
    eventTypeKey: EventTypeKey;
}>();

const eventFilter = useEventFilterStore();
const eventTypeColorsStore = useEventTypeColorsStore();
const editColorModal = useEditColorModal();

const isEnabled = computed(() => eventFilter.isEventTypeEnabled(props.eventTypeKey));
const info = computed(() => getEventTypeInfo(props.eventTypeKey));

function openColorModal() {
    editColorModal.openModal(props.eventTypeKey);
}
</script>

<style scoped>
.filter-item {
    position: relative;
    cursor: pointer;
    border-radius: 5px;
    overflow: hidden;
    transition: all 0.2s ease;
}

.filter-item:hover .filter-content {
    filter: brightness(1.05) saturate(1.1);
    transition: none;
}

.filter-item:active .filter-content {
    filter: brightness(1.2) saturate(1.1);
}

.filter-item:hover .filter-checkbox-area {
    border-color: var(--bs-border-color-translucent);
}

.filter-item:hover .filter-content {
    border-color: var(--bs-border-color-translucent);
}

.filter-checkbox {
    position: absolute;
    opacity: 0;
    pointer-events: none;
}

.filter-layout {
    display: flex;
    min-height: 30px;
}

.filter-checkbox-area {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    background-color: #fcfcfc;
    border: 1px solid var(--bs-border-color);
    border-right: none;
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
    transition: all 0.2s ease;
}

[data-bs-theme='dark'] .filter-checkbox-area {
    background-color: #8a8b8c;
}

.filter-checkbox-area--checked {
    background-color: #e4e6e7;
    border-color: var(--bs-border-color);
}

[data-bs-theme='dark'] .filter-checkbox-area--checked {
    background-color: #e2e3e4;
}

.checkbox-icon {
    color: transparent;
    transition: color 0.2s ease;
    stroke-width: 2.5;
    transform: scale(0.25);
    transition: transform 0.2s ease;
}

.checkbox-icon--checked {
    color: #1f2023;
    transform: scale(1);
}

.filter-item:hover .checkbox-icon--checked {
    transform: scale(1.06);
}

.filter-content {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    flex: 1;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-right: none;
    transition: all 0.2s ease;
}

.filter-item--enabled .filter-content {
    opacity: 1;
}

.filter-item:not(.filter-item--enabled) .filter-content {
    opacity: 0.5;
    filter: grayscale(0.6);
    transition: all 0.5s ease;
}

.filter-item:not(.filter-item--enabled):active .filter-content,
.filter-item:not(.filter-item--enabled):hover .filter-content {
    opacity: 0.7;
    filter: grayscale(0.5);
}

.event-name {
    font-size: 0.8rem;
    font-weight: 500;
    line-height: 1.1;
}

/* Color Edit Button */
.filter-color-edit-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    min-width: 30px;
    background-color: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-top-right-radius: 5px;
    border-bottom-right-radius: 5px;
    color: var(--bs-dark);
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0;
    opacity: 0.8;

    &.has-custom-color {
        opacity: 1;
    }
}

[data-bs-theme='dark'] .filter-color-edit-btn {
    color: var(--bs-light);
}

.filter-color-edit-btn:hover {
    background-color: rgba(255, 255, 255, 0.25);
    color: var(--bs-emphasis-color);
    transform: scale(1.05);
}

.filter-color-edit-btn:active {
    transform: scale(0.95);
}

.filter-color-edit-btn.has-custom-color::after {
    content: '';
    position: absolute;
    bottom: 3px;
    right: 3px;
    width: 5px;
    height: 5px;
    background-color: var(--bs-dark);
    border-radius: 50%;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
    opacity: 0.85;
}
[data-bs-theme='dark'] .filter-color-edit-btn.has-custom-color::after {
    background-color: var(--bs-light);
}

.filter-item:not(.filter-item--enabled) .filter-color-edit-btn {
    opacity: 0.5;
}

.filter-item:not(.filter-item--enabled):hover .filter-color-edit-btn {
    opacity: 0.7;
}
</style>
