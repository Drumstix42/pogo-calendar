import { defineStore } from 'pinia';
import { ref } from 'vue';

import type { EventTypeKey } from '@/utils/eventTypes';

export const useEventHighlightStore = defineStore('eventHighlight', () => {
    const hoveredEventID = ref<string | null>(null);
    const hoveredEventType = ref<EventTypeKey | null>(null);

    function highlightEventID(eventID: string): void {
        hoveredEventID.value = eventID;
    }

    function clearEventIDHighlight(): void {
        hoveredEventID.value = null;
    }

    function highlightEventType(eventType: EventTypeKey): void {
        hoveredEventType.value = eventType;
    }

    function clearEventTypeHighlight(): void {
        hoveredEventType.value = null;
    }

    return {
        hoveredEventID,
        hoveredEventType,
        highlightEventID,
        clearEventIDHighlight,
        highlightEventType,
        clearEventTypeHighlight,
    };
});
