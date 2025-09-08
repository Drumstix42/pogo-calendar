import { useEventFilterStore } from '@/stores/eventFilter';
import { useToastsStore } from '@/stores/toasts';
import { type EventTypeKey, getEventTypeInfo } from '@/utils/eventTypes';

export const useEventFilterToasts = () => {
    const eventFilter = useEventFilterStore();
    const toasts = useToastsStore();

    const hideEventTypeWithToast = (eventType: EventTypeKey) => {
        const eventTypeInfo = getEventTypeInfo(eventType);
        eventFilter.disableEventType(eventType);

        toasts.addEventFilterToast({
            eventTypeName: eventTypeInfo.name,
            eventTypeColor: eventTypeInfo.color,
            action: 'hidden',
            undoAction() {
                eventFilter.enableEventType(eventType);
                toasts.addEventFilterToast({
                    eventTypeName: eventTypeInfo.name,
                    eventTypeColor: eventTypeInfo.color,
                    action: 'shown',
                    duration: 2000,
                });
            },
        });
    };

    const showEventTypeWithToast = (eventType: EventTypeKey) => {
        const eventTypeInfo = getEventTypeInfo(eventType);
        eventFilter.enableEventType(eventType);

        toasts.addEventFilterToast({
            eventTypeName: eventTypeInfo.name,
            eventTypeColor: eventTypeInfo.color,
            action: 'shown',
            undoAction() {
                eventFilter.disableEventType(eventType);
                toasts.addEventFilterToast({
                    eventTypeName: eventTypeInfo.name,
                    eventTypeColor: eventTypeInfo.color,
                    action: 'hidden',
                    duration: 2000,
                });
            },
        });
    };

    const toggleEventTypeWithToast = (eventType: EventTypeKey) => {
        const isCurrentlyEnabled = eventFilter.isEventTypeEnabled(eventType);

        if (isCurrentlyEnabled) {
            hideEventTypeWithToast(eventType);
        } else {
            showEventTypeWithToast(eventType);
        }
    };

    const hideAllEventTypesWithToast = () => {
        eventFilter.disableAllEventTypes();
        toasts.addToast({
            type: 'warning',
            title: 'Hidden all event types',
        });
    };

    const showAllEventTypesWithToast = () => {
        eventFilter.enableAllEventTypes();
        toasts.addToast({
            type: 'success',
            title: 'Showing all event types',
        });
    };

    return {
        hideEventTypeWithToast,
        showEventTypeWithToast,
        toggleEventTypeWithToast,
        hideAllEventTypesWithToast,
        showAllEventTypesWithToast,
    };
};
