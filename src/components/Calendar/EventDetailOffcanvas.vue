<template>
    <div class="offcanvas-body">
        <template v-if="event">
            <div class="event-detail-scrollable">
                <EventTooltip :event="event" :is-single-day="isSingleDay" :target-date="targetDate" :show-bottom-link="false" :scrollable="false" />
            </div>
            <div v-if="event.link && !event._isGrouped" class="event-detail-footer">
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
import { ExternalLink } from '@lucide/vue';

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
</script>

<style scoped>
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
</style>
