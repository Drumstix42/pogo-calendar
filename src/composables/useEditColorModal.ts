import { ref } from 'vue';

import type { EventTypeKey } from '@/utils/eventTypes';

const showModal = ref(false);
const currentEventTypeKey = ref<EventTypeKey>('event');

export function useEditColorModal() {
    function openModal(eventTypeKey: EventTypeKey) {
        currentEventTypeKey.value = eventTypeKey;
        showModal.value = true;
    }

    function closeModal() {
        showModal.value = false;
    }

    return {
        showModal,
        currentEventTypeKey,
        openModal,
        closeModal,
    };
}
