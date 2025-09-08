<template>
    <div class="offcanvas-header">
        <h5 class="offcanvas-title mb-0 d-flex align-items-center gap-1">
            <Settings :size="16" class="flex-grow-0" />
            Configuration
        </h5>
        <button class="btn btn-icon-ghost btn-sm" @click="$emit('close')" aria-label="Close options">
            <X :size="16" />
        </button>
    </div>
    <div class="offcanvas-body">
        <div class="options-content-wrapper">
            <FirstDaySelector />
            <EventGroupingToggle />
            <AnimatedImagesToggle />
            <EventFilterOptions class="flex-grow-section" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { Settings, X } from 'lucide-vue-next';

import AnimatedImagesToggle from './AnimatedImagesToggle.vue';
import EventFilterOptions from './EventFilterOptions.vue';
import EventGroupingToggle from './EventGroupingToggle.vue';
import FirstDaySelector from './FirstDaySelector.vue';

defineEmits<{
    close: [];
}>();
</script>

<style scoped>
.offcanvas-header {
    background-color: rgba(248, 249, 250, 0.9);
    border-bottom: 1px solid rgba(233, 236, 239, 0.6);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.offcanvas-title {
    font-weight: 600;
    color: #212529;
}

.offcanvas-body {
    padding: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
}

.options-content-wrapper {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
}

/* Shared option section styles */
.options-content-wrapper :deep(.option-section) {
    padding: 0;
    margin-bottom: 0.75rem;
}

.options-content-wrapper :deep(.section-title) {
    font-weight: 600;
    color: #343a40;
    font-size: 0.95rem;
    margin-bottom: 0;
    line-height: 1;
}

.options-content-wrapper :deep(.option-content) {
    padding-left: 1rem;
    margin-top: 0.5rem;
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

.btn:hover {
    color: #495057;
}

@media (max-width: 399.98px) {
    .options-content-wrapper {
        padding: 0.75rem;
        gap: 1rem;
    }
}
</style>
