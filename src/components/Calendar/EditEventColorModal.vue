<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="show" class="modal-backdrop" @click="handleBackdropClick">
                <div class="modal-dialog" @click.stop>
                    <div class="modal-content">
                        <!-- Modal Header -->
                        <div class="modal-header">
                            <h5 class="modal-title">Event Type Color</h5>
                            <button type="button" class="btn btn-icon-ghost" aria-label="Close" @click="closeModal">
                                <X :size="20" />
                            </button>
                        </div>

                        <!-- Modal Body -->
                        <div class="modal-body">
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

                            <!-- Color Picker -->
                            <div class="color-picker-container mt-3">
                                <div ref="colorPickerEl" class="color-picker"></div>
                            </div>

                            <!-- Hex Input -->
                            <div class="d-flex flex-column align-items-center justify-content-center hex-input-container mt-1 gap-3">
                                <div class="input-group input-group-sm">
                                    <span class="input-group-text">#</span>
                                    <input
                                        v-model="hexInput"
                                        type="text"
                                        class="form-control"
                                        :class="{ 'is-invalid': !isHexInputValid }"
                                        placeholder="RRGGBB"
                                        maxlength="6"
                                        aria-label="Hex color value"
                                        @input="handleHexInput"
                                    />
                                </div>

                                <div class="d-flex align-items-center gap-1">
                                    <div
                                        class="default-color-preview"
                                        :style="{ backgroundColor: defaultColor }"
                                        title="Default color"
                                        @click="resetToDefault"
                                    ></div>
                                    <button
                                        type="button"
                                        class="btn btn-sm"
                                        :class="isColorDifferentFromDefault ? 'btn-secondary' : 'btn-outline-secondary'"
                                        @click="resetToDefault"
                                    >
                                        Set to Default
                                    </button>
                                </div>
                            </div>

                            <!-- Action Buttons -->
                            <div class="d-flex gap-2 mt-3 pt-3 border-top">
                                <button type="button" class="btn btn-sm btn-success flex-grow-1" @click="saveColor">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import iro from '@jaames/iro';
import { X } from 'lucide-vue-next';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

import { useEventTypeColorsStore } from '@/stores/eventTypeColors';
import { EVENT_TYPES, type EventTypeKey } from '@/utils/eventTypes';

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

const colorPickerEl = ref<HTMLElement | null>(null);
let colorPicker: any = null;
const currentColor = ref<string>('');
const originalColor = ref<string>('');
const hexInput = ref<string>('');
const isHexInputValid = ref<boolean>(true);

const eventTypeName = computed(() => EVENT_TYPES[props.eventTypeKey]?.name || props.eventTypeKey);
const defaultColor = computed(() => EVENT_TYPES[props.eventTypeKey]?.color || '#757575');
const isColorDifferentFromDefault = computed(() => currentColor.value.toLowerCase() !== defaultColor.value.toLowerCase());

function isValidHex(hex: string): boolean {
    return /^[0-9A-Fa-f]{6}$/.test(hex);
}

function handleHexInput() {
    // hexInput.value is already updated by v-model, so just validate it
    const input = hexInput.value.trim().toUpperCase();

    if (isValidHex(input)) {
        isHexInputValid.value = true;
        const newColor = `#${input}`;
        currentColor.value = newColor;
        if (colorPicker) {
            colorPicker.color.hexString = newColor;
        }
    } else {
        // Still invalid - either empty or not a valid hex
        isHexInputValid.value = input.length === 0 || !isValidHex(input);
    }
}

function destroyColorPicker() {
    if (colorPicker) {
        colorPicker.off('color:change');
        if (colorPickerEl.value) {
            colorPickerEl.value.innerHTML = '';
        }
        colorPicker = null;
    }
}

function initializeColorPicker() {
    if (!colorPickerEl.value) return;

    // Clean up existing picker
    destroyColorPicker();

    const initialColor = eventTypeColorsStore.getEventTypeColor(props.eventTypeKey);
    currentColor.value = initialColor;
    originalColor.value = initialColor;
    hexInput.value = initialColor.replace('#', '').toUpperCase();
    isHexInputValid.value = true;

    colorPicker = iro.ColorPicker(colorPickerEl.value, {
        width: 230,
        color: initialColor,
        layout: [
            {
                component: iro.ui.Wheel,
                options: {},
            },
            {
                component: iro.ui.Slider,
                options: {
                    sliderType: 'value',
                },
            },
        ],
    });

    colorPicker.on('color:change', (color: any) => {
        currentColor.value = color.hexString;
        hexInput.value = color.hexString.replace('#', '').toUpperCase();
        isHexInputValid.value = true;
    });
}

function closeModal() {
    emit('close');
}

function handleBackdropClick() {
    closeModal();
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
    hexInput.value = defaultColor.value.replace('#', '').toUpperCase();
    isHexInputValid.value = true;
    if (colorPicker) {
        colorPicker.color.hexString = defaultColor.value;
    }
}

function resetToOriginalColor() {
    // Reset the picker back to the original color (what it was when modal opened)
    currentColor.value = originalColor.value;
    hexInput.value = originalColor.value.replace('#', '').toUpperCase();
    isHexInputValid.value = true;
    if (colorPicker) {
        colorPicker.color.hexString = originalColor.value;
    }
}

// Watch for modal show/hide to initialize/cleanup color picker
watch(
    () => props.show,
    async newShow => {
        if (newShow) {
            // Disable offcanvas focus trap by marking it inert
            const offcanvas = document.querySelector('.calendar-options-offcanvas');
            if (offcanvas) {
                offcanvas.setAttribute('inert', '');
            }

            // Wait for DOM to be ready
            await nextTick();
            initializeColorPicker();
        } else {
            // Re-enable offcanvas
            const offcanvas = document.querySelector('.calendar-options-offcanvas');
            if (offcanvas) {
                offcanvas.removeAttribute('inert');
            }

            // Clean up when modal closes
            destroyColorPicker();
        }
    },
);

onBeforeUnmount(() => {
    // Ensure we clean up inert attribute if component unmounts while modal is open
    const offcanvas = document.querySelector('.calendar-options-offcanvas');
    if (offcanvas) {
        offcanvas.removeAttribute('inert');
    }
    destroyColorPicker();
});
</script>

<style scoped>
/* Modal backdrop */
.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10055;
    backdrop-filter: blur(2px);
    overflow-y: auto;
    padding: 1rem 0;
}

/* Modal dialog */
.modal-dialog {
    max-width: 500px;
    width: 90%;
    margin: auto;
    max-height: calc(100vh - 2rem);
    display: flex;
    flex-direction: column;
}

/* Modal content */
.modal-content {
    background-color: var(--bs-body-bg);
    border: 1px solid var(--bs-border-color);
    border-radius: 0.5rem;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    max-height: 100%;
}

/* Modal header */
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--bs-border-color);
}

.modal-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--bs-body-color);
}

/* Modal body */
.modal-body {
    padding: 1.25rem;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
}

.modal-body p {
    color: var(--bs-body-color);
    font-size: 0.95rem;
}

/* Color Picker */
.color-picker-container {
    display: flex;
    justify-content: center;
    padding: 1rem 0;
}

/* Hex Input */
.hex-input-container .input-group {
    max-width: 130px;
}

.hex-input-container .form-control {
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    letter-spacing: 0.5px;
}

.hex-input-container .input-group-text {
    font-weight: 500;
}

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

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.2s ease;
}

.modal-enter-active .modal-dialog,
.modal-leave-active .modal-dialog {
    transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-from .modal-dialog,
.modal-leave-to .modal-dialog {
    transform: scale(0.95);
}

/* Responsive adjustments */
@media (max-width: 576px) {
    .modal-dialog {
        width: 95%;
        margin: 0.5rem;
    }

    .color-picker-container {
        padding: 0.5rem 0;
    }

    .preview-comparison {
        grid-template-columns: 1fr;
        gap: 0.75rem;
    }

    .event-preview-text {
        font-size: 0.85rem;
    }
}

:deep(.IroSlider) {
    background: none !important;
}
</style>
