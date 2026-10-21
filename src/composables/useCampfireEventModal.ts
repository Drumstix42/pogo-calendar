import { ref } from 'vue';

import type { PogoEvent } from '@/utils/eventTypes';

const showModal = ref(false);
const currentEvent = ref<PogoEvent | null>(null);
// `YYYY-MM-DD` when opened from one day of a major event, so its raid bosses scope to that day.
const currentDay = ref<string | undefined>(undefined);

export function useCampfireEventModal() {
    function openModal(event: PogoEvent, day?: string) {
        currentEvent.value = event;
        currentDay.value = day;
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
        currentDay,
        openModal,
        closeModal,
    };
}
