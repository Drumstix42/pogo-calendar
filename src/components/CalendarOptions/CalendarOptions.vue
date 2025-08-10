<template>
    <div class="calendar-options">
        <div class="options-header">
            <h5 class="mb-0">Calendar Options</h5>
            <button class="btn btn-icon-ghost btn-sm close-btn" @click="$emit('close')" aria-label="Close options">
                <X :size="16" />
            </button>
        </div>
        <div class="options-content p-3">
            <div class="row g-3">
                <div class="col-md-3">
                    <FirstDaySelector />
                </div>
                <div class="col-md-3">
                    <EventGroupingToggle />
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
    margin-bottom: 1.5rem;
    background-color: #fff;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
}

.options-header {
    padding: 0.5rem 1rem;
    border-bottom: 1px solid #e9ecef;
    background-color: #f8f9fa;
    border-radius: 0.375rem 0.375rem 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.close-btn {
    padding: 0.37rem;
}

.close-btn:hover {
    color: #495057;
}

@media (max-width: 767.98px) {
    .row.g-3 .col-md-3,
    .row.g-3 .col-md-6 {
        margin-bottom: 1rem;
    }
}
</style>
