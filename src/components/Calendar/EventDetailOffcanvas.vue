<template>
    <div class="offcanvas-header">
        <h5 class="offcanvas-title mb-0 d-flex align-items-center gap-2">
            <CalendarDays :size="16" class="flex-grow-0" />
            Event Details
        </h5>
        <button class="btn btn-icon-ghost btn-sm" @click="$emit('close')" aria-label="Close event details">
            <X :size="16" />
        </button>
    </div>
    <div class="offcanvas-body">
        <div v-if="event" class="event-detail-content">
            <EventTooltip :event="event" :is-single-day="isSingleDay" />
        </div>
        <div v-else class="event-not-found">
            <p class="text-muted">Event not found</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { CalendarDays, X } from 'lucide-vue-next';

import type { PogoEvent } from '@/utils/eventTypes';

import EventTooltip from './EventTooltip.vue';

interface Props {
    event?: PogoEvent;
    isSingleDay?: boolean;
}

withDefaults(defineProps<Props>(), {
    event: undefined,
    isSingleDay: false,
});

defineEmits<{
    close: [];
}>();
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
    padding: 1rem;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
}

.event-detail-content :deep(.event-tooltip) {
    max-width: none;
    padding: 0;
}

.event-not-found {
    padding: 2rem 1rem;
    text-align: center;
}

.btn {
    padding: 0.37rem;
}
</style>
