import { nextTick, ref } from 'vue';

import { scrollCardIntoView } from '@/utils/timelineScroll';

export function useTimelineActiveEvent() {
    const activeEventId = ref<string | null>(null);

    function setActiveEvent(eventId: string) {
        const previousActiveId = activeEventId.value;
        activeEventId.value = activeEventId.value === eventId ? null : eventId;

        // scrollIntoView if we're expanding an event
        if (activeEventId.value && activeEventId.value !== previousActiveId) {
            // Wait for DOM update and animation
            setTimeout(() => {
                nextTick(() => {
                    const eventCard = document.querySelector(`[data-timeline-event-id="${eventId}"]`);
                    if (eventCard instanceof HTMLElement) {
                        scrollCardIntoView(eventCard);
                    }
                });
            }, 200);
        }
    }

    return {
        activeEventId,
        setActiveEvent,
    };
}
