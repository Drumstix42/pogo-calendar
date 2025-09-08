<template>
    <div class="calendar-options">
        <div class="options-header">
            <h5 class="mb-0">Configuration</h5>
            <button class="btn btn-icon-ghost btn-sm close-btn" @click="$emit('close')" aria-label="Close options">
                <X :size="16" />
            </button>
        </div>
        <div class="options-content p-2">
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="options-flex-container">
                        <FirstDaySelector />
                        <EventGroupingToggle />
                        <AnimatedImagesToggle />
                    </div>
                </div>
                <div class="col-md-6">
                    <EventFilterOptions />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next';

import AnimatedImagesToggle from './AnimatedImagesToggle.vue';
import EventFilterOptions from './EventFilterOptions.vue';
import EventGroupingToggle from './EventGroupingToggle.vue';
import FirstDaySelector from './FirstDaySelector.vue';

// Define emits
defineEmits<{
    close: [];
}>();
</script>

<style scoped>
.calendar-options {
    /* sub-component backgrounds */
    --calendar-options-item-bg: rgba(248, 249, 250, 0.9);

    /* Fixed height with scrollable content */
    max-height: calc(100vh - 120px); /* Account for overlay padding */
    display: flex;
    flex-direction: column;

    margin: 0 2rem;
    border: 1px solid rgba(222, 226, 230, 0.3);
    border-radius: 0.5rem;
    background-color: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(1px);
    box-shadow: 0 10px 10px rgba(0, 0, 0, 0.05);
}

.options-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(233, 236, 239, 0.6);
    border-radius: 0.5rem 0.5rem 0 0;
    background-color: rgba(248, 249, 250, 0.9);
}

.options-content {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
}

@media (pointer: fine) {
    .options-content::-webkit-scrollbar {
        width: 8px;
    }

    .options-content::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }

    .options-content::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
    }

    .options-content::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
    }
}

.close-btn {
    padding: 0.37rem;
}

.close-btn:hover {
    color: #495057;
}

.options-flex-container {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.options-flex-container > * {
    flex: 1 1 280px;
    min-width: 280px;
}

@media (max-width: 767.98px) {
    .calendar-options {
        margin: 0 0.5rem;
        max-height: calc(100vh - 40px);
        background-color: #ffffff;
    }

    .row.g-3 .col-md-6 {
        margin-bottom: 0;
    }

    .options-flex-container > * {
        min-width: 100%;
        flex-basis: 100%;
    }
}
</style>
