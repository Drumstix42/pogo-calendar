import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useEventHighlightStore = defineStore('eventHighlight', () => {
    const hoveredEventID = ref<string | null>(null);

    const highlightEventID = (eventID: string): void => {
        hoveredEventID.value = eventID;
    };

    const clearEventIDHighlight = (): void => {
        hoveredEventID.value = null;
    };

    const isEventHighlighted = (eventID: string): boolean => {
        return hoveredEventID.value === eventID;
    };

    return {
        hoveredEventID,
        highlightEventID,
        clearEventIDHighlight,
        isEventHighlighted,
    };
});
