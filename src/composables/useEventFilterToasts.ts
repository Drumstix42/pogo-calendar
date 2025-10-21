import { useEventFilterStore } from '@/stores/eventFilter';
import { useEventTypeColorsStore } from '@/stores/eventTypeColors';
import { useToastsStore } from '@/stores/toasts';
import { type EventTypeKey, type PogoEvent, getEventTypeInfo } from '@/utils/eventTypes';

export const useEventFilterToasts = () => {
    const eventFilter = useEventFilterStore();
    const eventTypeColorsStore = useEventTypeColorsStore();
    const toasts = useToastsStore();

    const hideEventTypeWithToast = (eventType: EventTypeKey) => {
        const eventTypeInfo = getEventTypeInfo(eventType);
        eventFilter.disableEventType(eventType);

        toasts.addEventFilterToast({
            eventTypeName: eventTypeInfo.name,
            eventTypeColor: eventTypeColorsStore.getEventTypeColor(eventType),
            action: 'hidden',
            undoAction() {
                eventFilter.enableEventType(eventType);
                toasts.addEventFilterToast({
                    eventTypeName: eventTypeInfo.name,
                    eventTypeColor: eventTypeColorsStore.getEventTypeColor(eventType),
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
            eventTypeColor: eventTypeColorsStore.getEventTypeColor(eventType),
            action: 'shown',
            undoAction() {
                eventFilter.disableEventType(eventType);
                toasts.addEventFilterToast({
                    eventTypeName: eventTypeInfo.name,
                    eventTypeColor: eventTypeColorsStore.getEventTypeColor(eventType),
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

    const hideEventByIdWithToast = (eventId: string, eventName: string, event: PogoEvent) => {
        eventFilter.hideEventById(eventId);

        toasts.addEventFilterToast({
            eventTypeName: eventName,
            eventTypeColor: eventTypeColorsStore.getEventTypeColor(event.eventType),
            action: 'hidden',
            isIndividualEvent: true,
            undoAction() {
                eventFilter.showEventById(eventId);
                toasts.addEventFilterToast({
                    eventTypeName: eventName,
                    eventTypeColor: eventTypeColorsStore.getEventTypeColor(event.eventType),
                    action: 'shown',
                    isIndividualEvent: true,
                    duration: 2000,
                });
            },
        });
    };

    const showEventByIdWithToast = (eventId: string, eventName: string, event: PogoEvent) => {
        eventFilter.showEventById(eventId);

        toasts.addEventFilterToast({
            eventTypeName: eventName,
            eventTypeColor: eventTypeColorsStore.getEventTypeColor(event.eventType),
            action: 'shown',
            isIndividualEvent: true,
            undoAction() {
                eventFilter.hideEventById(eventId);
                toasts.addEventFilterToast({
                    eventTypeName: eventName,
                    eventTypeColor: eventTypeColorsStore.getEventTypeColor(event.eventType),
                    action: 'hidden',
                    isIndividualEvent: true,
                    duration: 2000,
                });
            },
        });
    };

    return {
        hideEventTypeWithToast,
        showEventTypeWithToast,
        toggleEventTypeWithToast,
        hideAllEventTypesWithToast,
        showAllEventTypesWithToast,
        hideEventByIdWithToast,
        showEventByIdWithToast,
    };
};
