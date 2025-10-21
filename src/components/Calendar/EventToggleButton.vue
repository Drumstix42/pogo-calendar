<template>
    <VTooltip :disabled="isTouchDevice" placement="top" :delay="{ show: 50, hide: 0 }" distance="10" class="d-flex align-items-center">
        <button class="event-toggle-button" @click.stop="$emit('hide', eventType)">
            <EyeOff :size="13" />
        </button>

        <template #popper>
            <div class="tooltip-text">
                Hide event type: <strong>{{ eventTypeName }}</strong>
            </div>
        </template>
    </VTooltip>
</template>

<script setup lang="ts">
import { EyeOff } from 'lucide-vue-next';
import { computed } from 'vue';

import { useDeviceDetection } from '@/composables/useDeviceDetection';
import { type EventTypeKey, getEventTypeInfo } from '@/utils/eventTypes';

interface Props {
    eventType: EventTypeKey;
}

interface Emits {
    (e: 'hide', eventType: EventTypeKey): void;
}

const props = defineProps<Props>();
defineEmits<Emits>();

const { isTouchDevice } = useDeviceDetection();

const eventTypeName = computed(() => getEventTypeInfo(props.eventType).name);
</script>

<style scoped>
.event-toggle-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 20px;
    padding: 0;
    background-color: rgba(0, 0, 0, 0.2);
    color: rgba(255, 255, 255, 0.7);
    border: none;
    border-radius: 2px;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.2s ease;
}

.event-toggle-button:hover {
    background-color: rgba(0, 0, 0, 0.6);
    color: rgba(255, 255, 255, 0.9);
}
</style>
