<template>
    <div class="color-picker-container mt-3">
        <div ref="colorPickerEl" class="color-picker"></div>
    </div>

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

        <slot />
    </div>
</template>

<script setup lang="ts">
import iro from '@jaames/iro';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

interface Props {
    modelValue: string;
}

interface Emits {
    (e: 'update:modelValue', value: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const colorPickerEl = ref<HTMLElement | null>(null);
let colorPicker: any = null;
const hexInput = ref<string>('');
const isHexInputValid = ref<boolean>(true);

function isValidHex(hex: string): boolean {
    return /^[0-9A-Fa-f]{6}$/.test(hex);
}

function handleHexInput() {
    // hexInput.value is already updated by v-model, so just validate it
    const input = hexInput.value.trim().toUpperCase();

    if (isValidHex(input)) {
        isHexInputValid.value = true;
        // Drive the picker; its color:change handler emits the canonical update
        if (colorPicker) {
            colorPicker.color.hexString = `#${input}`;
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

    hexInput.value = props.modelValue.replace('#', '').toUpperCase();
    isHexInputValid.value = true;

    colorPicker = iro.ColorPicker(colorPickerEl.value, {
        width: 230,
        color: props.modelValue,
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
        hexInput.value = color.hexString.replace('#', '').toUpperCase();
        isHexInputValid.value = true;
        emit('update:modelValue', color.hexString);
    });
}

// External changes (reset-to-default / reset-to-original) drive the picker
watch(
    () => props.modelValue,
    value => {
        if (colorPicker && colorPicker.color.hexString.toLowerCase() !== value.toLowerCase()) {
            colorPicker.color.hexString = value;
        }
    },
);

onMounted(initializeColorPicker);

onBeforeUnmount(destroyColorPicker);
</script>

<style scoped>
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

/* Responsive adjustments */
@media (max-width: 576px) {
    .color-picker-container {
        padding: 0.5rem 0;
    }
}

:deep(.IroSlider) {
    background: none !important;
}
</style>
