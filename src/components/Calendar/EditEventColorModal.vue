<template>
    <BaseModal :show="show" title="Event Type Color" scrollable inert-selector=".calendar-options-offcanvas" @close="closeModal">
        <!-- Event Preview Bar -->
        <div class="event-preview-section">
            <div class="preview-comparison">
                <div class="preview-item">
                    <small class="preview-label">Current</small>
                    <div
                        class="event-preview-bar clickable"
                        :style="{ backgroundColor: originalColor }"
                        title="Click to reset to current color"
                        @click="resetToOriginalColor"
                    >
                        <span class="event-preview-text">{{ eventTypeName }}</span>
                    </div>
                </div>
                <div class="preview-item">
                    <small class="preview-label">New</small>
                    <div class="event-preview-bar" :style="{ backgroundColor: currentColor }">
                        <span class="event-preview-text">{{ eventTypeName }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Color Picker + Hex Input -->
        <ColorPickerField v-model="currentColor">
            <div class="d-flex align-items-center gap-1">
                <div class="default-color-preview" :style="{ backgroundColor: defaultColor }" title="Default color" @click="resetToDefault"></div>
                <button
                    type="button"
                    class="btn btn-sm"
                    :class="isColorDifferentFromDefault ? 'btn-secondary' : 'btn-outline-secondary'"
                    @click="resetToDefault"
                >
                    Set to Default
                </button>
            </div>
        </ColorPickerField>

        <!-- Action Buttons -->
        <div class="d-flex gap-2 mt-3 pt-3 border-top">
            <button type="button" class="btn btn-sm btn-success flex-grow-1" @click="saveColor">Save</button>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useEventTypeColorsStore } from '@/stores/eventTypeColors';
import { EVENT_TYPES, type EventTypeKey } from '@/utils/eventTypes';

import BaseModal from '@/components/BaseModal.vue';
import ColorPickerField from '@/components/Calendar/ColorPickerField.vue';

interface Props {
    show: boolean;
    eventTypeKey: EventTypeKey;
}

interface Emits {
    (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const eventTypeColorsStore = useEventTypeColorsStore();

const currentColor = ref<string>('');
const originalColor = ref<string>('');

const eventTypeName = computed(() => EVENT_TYPES[props.eventTypeKey]?.name || props.eventTypeKey);
const defaultColor = computed(() => EVENT_TYPES[props.eventTypeKey]?.color || '#757575');
const isColorDifferentFromDefault = computed(() => currentColor.value.toLowerCase() !== defaultColor.value.toLowerCase());

function closeModal() {
    emit('close');
}

function saveColor() {
    // If the current color matches the default, remove any custom color override
    if (currentColor.value.toLowerCase() === defaultColor.value.toLowerCase()) {
        eventTypeColorsStore.resetToDefault(props.eventTypeKey);
    } else {
        eventTypeColorsStore.setCustomColor(props.eventTypeKey, currentColor.value);
    }
    closeModal();
}

function resetToDefault() {
    // Just update the picker to show the default color, don't modify localStorage yet
    currentColor.value = defaultColor.value;
}

function resetToOriginalColor() {
    // Reset the picker back to the original color (what it was when modal opened)
    currentColor.value = originalColor.value;
}

// Snapshot the active color when the modal opens; ColorPickerField initializes from currentColor on mount
watch(
    () => props.show,
    newShow => {
        if (newShow) {
            const initialColor = eventTypeColorsStore.getEventTypeColor(props.eventTypeKey);
            currentColor.value = initialColor;
            originalColor.value = initialColor;
        }
    },
    { immediate: true },
);
</script>

<style scoped>
.default-color-preview {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: 0px solid var(--bs-border-color);
    flex-shrink: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    cursor: pointer;

    @media (pointer: fine) {
        &:hover {
            filter: brightness(1.1);
            transform: scale(1.05);
        }
    }

    &:active {
        filter: brightness(0.95);
        transform: scale(0.95);
    }
}

/* Event Preview */
.preview-comparison {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.preview-item {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.preview-label {
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--bs-secondary-color);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    /* text-align: center; */
}

.event-preview-bar {
    display: flex;
    align-items: center;
    /* justify-content: center; */
    padding: 0.55rem 1rem;
    border-radius: 0.375rem;
    min-height: 35px;
    transition: background-color 0.15s ease;
}

.event-preview-bar.clickable {
    cursor: pointer;
    transition: all 0.15s ease;
}

@media (pointer: fine) {
    .event-preview-bar.clickable:hover {
        filter: brightness(1.1);
        transform: scale(1.02);
    }
}

.event-preview-bar.clickable:active {
    filter: brightness(1.15);
    transform: scale(0.98);
}

.event-preview-text {
    font-size: 13px;
    font-weight: 400;
    color: white;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
}

/* Action Buttons */
.btn {
    font-weight: 500;
}

/* Responsive adjustments */
@media (max-width: 576px) {
    .preview-comparison {
        grid-template-columns: 1fr;
        gap: 0.75rem;
    }

    .event-preview-text {
        font-size: 0.85rem;
    }
}
</style>
