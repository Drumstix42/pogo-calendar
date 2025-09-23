import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useEventHighlightStore = defineStore('eventHighlight', () => {
    const hoveredEventID = ref<string | null>(null);

    function highlightEventID(eventID: string): void {
        hoveredEventID.value = eventID;
    }

    function clearEventIDHighlight(): void {
        hoveredEventID.value = null;
    }

    return {
        hoveredEventID,
        highlightEventID,
        clearEventIDHighlight,
    };
});
