import { type EventMetadata, type PogoEvent, getEventTypeInfo } from './eventTypes';

// Sort events by priority (higher number = higher priority)
export const sortEventsByPriority = (events: PogoEvent[]): PogoEvent[] => {
    return [...events].sort((a: PogoEvent, b: PogoEvent) => {
        const aPriority = getEventTypeInfo(a.eventType).priority;
        const bPriority = getEventTypeInfo(b.eventType).priority;
        return bPriority - aPriority;
    });
};

// Sort events by timing and priority for timeline display
export const sortEventsByTimingAndPriority = (events: PogoEvent[], eventMetadata: Record<string, EventMetadata>): PogoEvent[] => {
    return [...events].sort((a, b) => {
        const aMetadata = eventMetadata[a.eventID];
        const bMetadata = eventMetadata[b.eventID];

        if (!aMetadata || !bMetadata) return 0;

        // Determine if events are currently happening (not past, not future)
        const aIsHappening = !aMetadata.isPastEvent && !aMetadata.isFutureEvent;
        const bIsHappening = !bMetadata.isPastEvent && !bMetadata.isFutureEvent;

        // 1. Events happening now come first
        if (aIsHappening && !bIsHappening) return -1;
        if (!aIsHappening && bIsHappening) return 1;

        // 2. For events happening now, sort by end time (ending soonest first)
        if (aIsHappening && bIsHappening) {
            const endTimeDiff = aMetadata.endDate.diff(bMetadata.endDate);
            if (endTimeDiff !== 0) return endTimeDiff;

            // Tiebreaker: higher priority events first
            const aPriority = getEventTypeInfo(a.eventType).priority;
            const bPriority = getEventTypeInfo(b.eventType).priority;
            return bPriority - aPriority;
        }

        // 3. For future events, sort by start time (starting soonest first)
        const startTimeDiff = aMetadata.startDate.diff(bMetadata.startDate);
        if (startTimeDiff !== 0) return startTimeDiff;

        // Tiebreaker: higher priority events first
        const aPriority = getEventTypeInfo(a.eventType).priority;
        const bPriority = getEventTypeInfo(b.eventType).priority;
        return bPriority - aPriority;
    });
};
