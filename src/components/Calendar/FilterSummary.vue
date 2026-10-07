<template>
    <div v-if="isVisible" class="filter-summary">
        <VTooltip :disabled="isTouchDevice" placement="top" :delay="{ show: 50, hide: 0 }" distance="10" class="d-flex align-items-center ms-1">
            <template #popper>
                <div class="tooltip-text">Click to open Settings</div>
            </template>
            <button class="btn btn-icon-ghost filter-summary-btn" @click="emit('open-filters')" aria-label="Open settings to modify filters">
                <EyeOff :size="12" class="me-2" />
                <span v-if="hiddenEventCount !== undefined" class="filter-summary-text">
                    {{ hiddenEventCount }} event{{ hiddenEventCount === 1 ? '' : 's' }} normally hidden by filters
                </span>
                <span v-else class="filter-summary-text">
                    <span v-if="eventFilter.disabledEventTypeKeys.length > 0">
                        {{ eventFilter.disabledEventTypeKeys.length }} event type{{ eventFilter.disabledEventTypeKeys.length === 1 ? '' : 's' }}
                        hidden
                    </span>
                    <span v-if="eventFilter.disabledEventTypeKeys.length > 0 && eventFilter.hiddenEventIds.length > 0"> • </span>
                    <span v-if="eventFilter.hiddenEventIds.length > 0">
                        {{ eventFilter.hiddenEventIds.length }} specific event{{ eventFilter.hiddenEventIds.length === 1 ? '' : 's' }} hidden
                    </span>
                </span>
            </button>
        </VTooltip>
        <div v-if="isTouchDevice" class="touch-device-message">Tap to open Settings</div>
    </div>
</template>

<script setup lang="ts">
import { EyeOff } from '@lucide/vue';
import { computed } from 'vue';

import { useDeviceDetection } from '@/composables/useDeviceDetection';
import { useEventFilterStore } from '@/stores/eventFilter';

interface Props {
    /** Summarize these specific events (shown anyway, e.g. in a drawer) instead of the global filter counts. */
    hiddenEventCount?: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    'open-filters': [];
}>();

const eventFilter = useEventFilterStore();
const { isTouchDevice } = useDeviceDetection();

const isVisible = computed(() => {
    if (props.hiddenEventCount !== undefined) return props.hiddenEventCount > 0;
    return eventFilter.disabledEventTypeKeys.length > 0 || eventFilter.hiddenEventIds.length > 0;
});
</script>

<style scoped>
.filter-summary {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: 0.5rem;

    .filter-summary-text {
        font-size: 0.7rem;
        font-weight: 500;
        line-height: 1.3;
        /* font-style: italic; */
        color: var(--bs-secondary-color);
    }

    .touch-device-message {
        font-size: 0.6rem;
        margin-top: -2px;
        font-style: italic;
        color: var(--bs-secondary-color);
    }
}
</style>
