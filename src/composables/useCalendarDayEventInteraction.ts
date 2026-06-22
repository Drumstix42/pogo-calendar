import { type Dayjs } from 'dayjs';
import { computed } from 'vue';

import { useDeviceDetection } from '@/composables/useDeviceDetection';
import { useEventHighlightDebounce } from '@/composables/useEventHighlightDebounce';
import { useUrlSync } from '@/composables/useUrlSync';

// Shared hover/tooltip/tap interaction for the event bars and blocks in a CalendarDay cell.
// Callers pass the already-resolved (canonical) event id.
export function useCalendarDayEventInteraction(getDayInstance: () => Dayjs) {
    const { isTouchDevice } = useDeviceDetection();
    const { selectEvent, clearEvent, selectedEventId } = useUrlSync();
    const { debouncedHighlightEventID, debouncedClearEventIDHighlight } = useEventHighlightDebounce();

    const tooltipOptionsDefaults = computed(() => ({
        autoHide: isTouchDevice.value,
        delay: { show: 100, hide: 100 },
        distance: 4,
    }));

    // Mobile: opens drawer on tap
    function handleEventClick(eventId: string) {
        if (!isTouchDevice.value) return;
        selectEvent(eventId, getDayInstance().format('YYYY-MM-DD'));
    }

    // Desktop: updates URL when tooltip shows
    function handleMenuShow(eventId: string) {
        selectEvent(eventId, getDayInstance().format('YYYY-MM-DD'));
    }

    // Clears URL when tooltip closes
    function handleMenuHide(eventId: string) {
        if (selectedEventId.value === eventId) {
            clearEvent();
        }
    }

    return {
        isTouchDevice,
        tooltipOptionsDefaults,
        debouncedHighlightEventID,
        debouncedClearEventIDHighlight,
        handleEventClick,
        handleMenuShow,
        handleMenuHide,
    };
}
