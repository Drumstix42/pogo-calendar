import { ref } from 'vue';

import type { PogoEvent } from '@/utils/eventTypes';

const showModal = ref(false);
const currentEvent = ref<PogoEvent | null>(null);

export function useHideEventModal() {
    function openModal(event: PogoEvent) {
        currentEvent.value = event;
        showModal.value = true;
    }

    function closeModal() {
        showModal.value = false;
        // Keep event data briefly to avoid flicker during close animation
        setTimeout(() => {
            currentEvent.value = null;
        }, 300);
    }

    return {
        showModal,
        currentEvent,
        openModal,
        closeModal,
    };
}
