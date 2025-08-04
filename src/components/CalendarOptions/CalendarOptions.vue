<template>
    <div class="calendar-options">
        <div
            role="button"
            class="options-header d-flex justify-content-between align-items-center"
            :class="{ expanded: isExpanded }"
            :aria-expanded="isExpanded"
            @click="isExpanded = !isExpanded"
        >
            <span class="fw-medium">Calendar Options</span>
            <div class="d-flex align-items-center">
                <Settings :size="16" class="me-2" />
                <span class="me-2">{{ isExpanded ? 'Hide' : 'Show' }} Options</span>
                <ChevronDown :size="14" :class="{ 'rotate-180': isExpanded }" />
            </div>
        </div>

        <div v-if="isExpanded" class="options-content mt-3">
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
import { ChevronDown, Settings } from 'lucide-vue-next';
import { ref } from 'vue';

import EventFilterOptions from './EventFilterOptions.vue';
import EventGroupingToggle from './EventGroupingToggle.vue';
import FirstDaySelector from './FirstDaySelector.vue';

const isExpanded = ref(false);
</script>

<style scoped>
.calendar-options {
    margin-bottom: 1.5rem;
    background-color: #fff;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
}

.options-header {
    padding: 1rem 1rem 0.75rem 1rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
    border-radius: 0.375rem;
}

.options-header.expanded {
    border-bottom: 1px solid #e9ecef;
    border-radius: 0.375rem 0.375rem 0 0;
}

.options-header:hover {
    background-color: #f8f9fa;
}

.options-content {
    padding: 0.75rem 1rem 1rem 1rem;
}

.rotate-180 {
    transform: rotate(180deg);
    transition: transform 0.2s ease-in-out;
}

@media (max-width: 767.98px) {
    .row.g-3 .col-md-3,
    .row.g-3 .col-md-6 {
        margin-bottom: 1rem;
    }
}
</style>
