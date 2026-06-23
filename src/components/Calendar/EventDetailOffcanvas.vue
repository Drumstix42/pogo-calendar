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
        <template v-if="event">
            <div class="event-detail-scrollable">
                <EventTooltip :event="event" :is-single-day="isSingleDay" :target-date="targetDate" :show-bottom-link="false" :scrollable="false" />
            </div>
            <div v-if="event.link && !(event as any)._isGrouped" class="event-detail-footer">
                <a
                    :href="event.link"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="link-neutral link-underline-opacity-0 link-underline-opacity-100-hover d-inline-flex align-items-center gap-1"
                    style="font-size: 0.75rem"
                >
                    View on LeekDuck <ExternalLink :size="12" />
                </a>
            </div>
        </template>
        <div v-else class="event-not-found">
            <p class="text-muted">Event not found</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { CalendarDays, ExternalLink, X } from '@lucide/vue';

import type { PogoEvent } from '@/utils/eventTypes';

import EventTooltip from './EventTooltip/EventTooltip.vue';

interface Props {
    event?: PogoEvent;
    isSingleDay?: boolean;
    targetDate?: string;
}

withDefaults(defineProps<Props>(), {
    event: undefined,
    isSingleDay: false,
    targetDate: undefined,
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
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 0;
}

.event-detail-scrollable {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    padding: 1rem 1rem 0.5rem 1rem;
}

.event-detail-footer {
    flex: 0 0 auto;
    padding: 0.5rem 1rem calc(0.75rem + env(safe-area-inset-bottom)) 1rem;
    background-color: var(--bs-body-bg);
}

.event-detail-footer a {
    display: inline-flex;
}

.event-not-found {
    padding: 2rem 1rem;
}

.event-detail-scrollable :deep(.event-tooltip) {
    max-width: none;
    padding: 0;
}

.event-not-found {
    text-align: center;
}

.btn {
    padding: 0.37rem;
}
</style>
