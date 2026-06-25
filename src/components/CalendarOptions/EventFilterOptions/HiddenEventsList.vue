<template>
    <div class="hidden-events-section mt-3">
        <small class="text-muted mb-2 d-block">Individually hidden events will appear here.</small>

        <div v-if="hiddenEvents.length === 0" class="text-muted text-center py-2" style="font-size: 0.85rem; font-style: italic">
            No events hidden yet!
        </div>

        <div v-else class="hidden-events-list">
            <div v-for="hiddenEvent in hiddenEvents" :key="hiddenEvent.id" class="hidden-event-item">
                <div class="hidden-event-content">
                    <div class="hidden-event-color-bar" :style="{ backgroundColor: hiddenEvent.color }" :title="hiddenEvent.typeName"></div>
                    <div class="hidden-event-text">
                        <div class="hidden-event-name">{{ hiddenEvent.name }}</div>
                        <div class="hidden-event-type">{{ hiddenEvent.typeName }}</div>
                    </div>
                </div>
                <button
                    type="button"
                    class="btn btn-icon-ghost btn-sm hidden-event-remove"
                    :title="`Show ${hiddenEvent.name}`"
                    @click="showHiddenEvent(hiddenEvent)"
                >
                    <X :size="16" />
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { X } from '@lucide/vue';

import { useHiddenEvents } from '@/composables/useHiddenEvents';

const { hiddenEvents, showHiddenEvent } = useHiddenEvents();
</script>

<style scoped>
.hidden-events-section {
    border-top: 1px solid var(--bs-border-color);
    padding-top: 1rem;
}

.hidden-events-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.hidden-event-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem;
    background-color: var(--bs-tertiary-bg);
    border: 1px solid var(--bs-border-color);
    border-radius: 0.375rem;
    transition: all 0.2s ease;
}

.hidden-event-item:hover {
    background-color: var(--bs-secondary-bg);
    border-color: var(--bs-border-color-translucent);
}

.hidden-event-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
}

.hidden-event-color-bar {
    width: 4px;
    height: 40px;
    border-radius: 2px;
    flex-shrink: 0;
}

.hidden-event-text {
    flex: 1;
    min-width: 0;
}

.hidden-event-name {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--bs-body-color);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.hidden-event-type {
    font-size: 0.75rem;
    color: var(--bs-secondary-color);
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.hidden-event-remove {
    flex-shrink: 0;
    opacity: 0.6;
    transition: opacity 0.2s ease;
}

.hidden-event-remove:hover {
    opacity: 1;
}
</style>
