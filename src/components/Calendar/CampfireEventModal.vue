<template>
    <BaseModal :show="show" title="Campfire Event Helper" scrollable size="lg" @close="closeModal">
        <div class="event-name-row mb-3">
            <span class="event-name">{{ eventName }}</span>
            <button type="button" class="btn btn-icon-ghost btn-sm" title="Copy event name" aria-label="Copy event name" @click="copyEventName">
                <Copy :size="16" />
            </button>
        </div>

        <CampfireEventImageSection :event="event" :show="show" />
        <CampfireEventDetailsSection :event="event" :show="show" />

        <div class="d-flex gap-2 mt-3 pt-3 border-top">
            <button type="button" class="btn btn-secondary flex-grow-1" @click="closeModal">Close</button>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { Copy } from '@lucide/vue';
import { computed } from 'vue';

import { useToastsStore } from '@/stores/toasts';
import { formatEventName } from '@/utils/eventName';
import { type PogoEvent } from '@/utils/eventTypes';

import BaseModal from '@/components/BaseModal.vue';
import CampfireEventDetailsSection from '@/components/Calendar/CampfireEventDetailsSection.vue';
import CampfireEventImageSection from '@/components/Calendar/CampfireEventImageSection.vue';

interface Props {
    show: boolean;
    event: PogoEvent;
}

interface Emits {
    (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const toastsStore = useToastsStore();

const eventName = computed(() => formatEventName(props.event.name));

async function copyEventName() {
    try {
        await navigator.clipboard.writeText(eventName.value);
        toastsStore.addToast({ type: 'success', title: '', message: 'Copied to clipboard' });
    } catch {
        toastsStore.addToast({ type: 'error', title: 'Copy failed', message: 'Select and copy the event name manually.' });
    }
}

function closeModal() {
    emit('close');
}
</script>

<style scoped>
.event-name-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.event-name {
    font-size: 1rem;
    font-weight: 400;
}
</style>
