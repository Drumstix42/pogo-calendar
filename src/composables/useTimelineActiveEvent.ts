import { nextTick, ref } from 'vue';

import { scrollCardIntoView } from '@/utils/timelineScroll';

// getRoot scopes the card lookup, for lists that can share event IDs with the timeline (e.g. a drawer)
export function useTimelineActiveEvent(getRoot?: () => HTMLElement | null | undefined) {
    const activeEventId = ref<string | null>(null);

    function setActiveEvent(eventId: string) {
        const previousActiveId = activeEventId.value;
        activeEventId.value = activeEventId.value === eventId ? null : eventId;

        // scrollIntoView if we're expanding an event
        if (activeEventId.value && activeEventId.value !== previousActiveId) {
            // Wait for DOM update and animation
            setTimeout(() => {
                nextTick(() => {
                    const eventCard = (getRoot?.() ?? document).querySelector(`[data-timeline-event-id="${eventId}"]`);
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
