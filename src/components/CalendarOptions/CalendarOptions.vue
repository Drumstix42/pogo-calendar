<template>
    <div class="offcanvas-header">
        <h5 class="offcanvas-title mb-0 d-flex align-items-center gap-2">
            <Settings :size="16" class="flex-grow-0" />
            Settings
        </h5>
        <button class="btn btn-icon-ghost btn-sm" @click="$emit('close')" aria-label="Close options">
            <X :size="16" />
        </button>
    </div>
    <div class="offcanvas-body">
        <div class="options-content-wrapper">
            <FirstDaySelector class="options-section" />
            <EventOptions class="options-section event-options-section" />
            <ImageOptions class="options-section" />
            <EventFilterOptions class="flex-grow-section options-section" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { Settings, X } from 'lucide-vue-next';
import { onMounted, onUnmounted } from 'vue';

import EventFilterOptions from './EventFilterOptions.vue';
import EventOptions from './EventOptions.vue';
import FirstDaySelector from './FirstDaySelector.vue';
import ImageOptions from './ImageOptions.vue';

defineEmits<{
    close: [];
}>();

let slider: HTMLElement | null = null;

const addSliderActiveClass = () => {
    document.body.classList.add('slider-interacting');
};

const removeSliderActiveClass = () => {
    document.body.classList.remove('slider-interacting');
};

onMounted(() => {
    slider = document.getElementById('eventBarFontSize');
    if (slider) {
        // Mouse events
        slider.addEventListener('mousedown', addSliderActiveClass);
        slider.addEventListener('mouseup', removeSliderActiveClass);
        slider.addEventListener('mouseleave', removeSliderActiveClass);

        // Touch events
        slider.addEventListener('touchstart', addSliderActiveClass);
        slider.addEventListener('touchend', removeSliderActiveClass);
        slider.addEventListener('touchcancel', removeSliderActiveClass);

        // Coverage for edge cases
        slider.addEventListener('blur', removeSliderActiveClass);
    }
});

onUnmounted(() => {
    if (slider) {
        slider.removeEventListener('mousedown', addSliderActiveClass);
        slider.removeEventListener('mouseup', removeSliderActiveClass);
        slider.removeEventListener('touchstart', addSliderActiveClass);
        slider.removeEventListener('touchend', removeSliderActiveClass);
        slider.removeEventListener('touchcancel', removeSliderActiveClass);
        slider.removeEventListener('blur', removeSliderActiveClass);
        slider.removeEventListener('mouseleave', removeSliderActiveClass);
    }
});
</script>

<style scoped>
.offcanvas-header {
    background-color: var(--bs-tertiary-bg);
    border-bottom: 1px solid var(--bs-border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
}

.offcanvas-title {
    font-weight: 600;
    color: var(--bs-body-color);
}

.offcanvas-body {
    padding: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
}

.options-content-wrapper {
    padding-top: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    height: 100%;
}

.flex-grow-section {
    flex: 1;
    min-height: 400px;
    display: flex;
    flex-direction: column;
}

/* Custom scrollbar for offcanvas body */
@media (pointer: fine) {
    .offcanvas-body::-webkit-scrollbar {
        width: 8px;
    }

    .offcanvas-body::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }

    .offcanvas-body::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
    }

    .offcanvas-body::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
    }
}
.btn {
    padding: 0.37rem;
}

@media (max-width: 399.98px) {
    .options-content-wrapper {
        padding: 0.75rem;
        gap: 1rem;
    }
}
</style>

<style>
/* JavaScript-controlled slider interaction class */
.slider-interacting .calendar-options-offcanvas {
    box-shadow: none !important;
    background-color: transparent !important;
}

.slider-interacting .calendar-options-backdrop {
    backdrop-filter: none !important;
}

.slider-interacting .offcanvas-header {
    opacity: 0;
}

.slider-interacting .options-content-wrapper > .options-section:not(.event-options-section) {
    opacity: 0;
    transition: opacity 0.1s ease;
}

.slider-interacting .option-content {
    background-color: color-mix(in srgb, var(--bs-body-bg) 95%, transparent);
}
</style>
