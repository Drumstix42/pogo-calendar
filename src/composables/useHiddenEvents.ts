import { computed } from 'vue';

import { useEventFilterToasts } from '@/composables/useEventFilterToasts';
import { useEventFilterStore } from '@/stores/eventFilter';
import { useEventsStore } from '@/stores/events';
import { getEventTypeInfo } from '@/utils/eventTypes';
import type { PogoEvent } from '@/utils/eventTypes';

export interface HiddenEventEntry {
    id: string;
    name: string;
    typeName: string;
    color?: string;
    event: PogoEvent | null;
}

export function useHiddenEvents() {
    const eventFilter = useEventFilterStore();
    const eventsStore = useEventsStore();
    const { showEventByIdWithToast } = useEventFilterToasts();

    const hiddenEvents = computed<HiddenEventEntry[]>(() =>
        eventFilter.hiddenEventIds.map(eventId => {
            const event = eventsStore.getEventById(eventId);

            if (!event) {
                // Event no longer exists in data - show fallback card with ID
                return {
                    id: eventId,
                    name: eventId,
                    typeName: 'old/missing event data',
                    color: '#6c757d', // Bootstrap secondary gray
                    event: null,
                };
            }

            const typeInfo = getEventTypeInfo(event.eventType);
            const metadata = eventsStore.eventMetadata[eventId];

            return {
                id: eventId,
                name: metadata?.displayName || event.name || event.eventID,
                typeName: typeInfo.name,
                color: metadata?.color,
                event,
            };
        }),
    );

    function showHiddenEvent(entry: HiddenEventEntry) {
        if (entry.event) {
            showEventByIdWithToast(entry.id, entry.name, entry.event);
        } else {
            // Event no longer exists, just remove from hidden list without toast
            eventFilter.showEventById(entry.id);
        }
    }

    return { hiddenEvents, showHiddenEvent };
}
