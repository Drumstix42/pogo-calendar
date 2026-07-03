import { EVENT_TYPES } from '@/utils/eventTypes';
import type { EventTypeKey } from '@/utils/eventTypes';

type EventCategory = (typeof EVENT_TYPES)[EventTypeKey]['category'];

export const CATEGORY_DISPLAY_NAMES: Record<EventCategory, string> = {
    'community-and-raids': 'Community & Raids',
    research: 'Research',
    'seasonal-and-premium': 'Seasonal & Premium',
    'events-and-misc': 'Events & Misc.',
};

// Order categories are displayed in the filter UI.
const CATEGORY_ORDER: EventCategory[] = ['seasonal-and-premium', 'research', 'community-and-raids', 'events-and-misc'];

export interface EventTypeGroup {
    title: string;
    eventTypes: EventTypeKey[];
}

// Groups every event type by its category, ordered per CATEGORY_ORDER, with each
// group's types sorted alphabetically by display name.
export function groupEventTypesByCategory(): EventTypeGroup[] {
    const groups = new Map<EventCategory, EventTypeKey[]>();

    for (const [eventTypeKey, info] of Object.entries(EVENT_TYPES)) {
        const list = groups.get(info.category) ?? [];
        list.push(eventTypeKey as EventTypeKey);
        groups.set(info.category, list);
    }

    return CATEGORY_ORDER.filter(category => groups.has(category)).map(category => ({
        title: CATEGORY_DISPLAY_NAMES[category],
        eventTypes: groups.get(category)!.sort((a, b) => EVENT_TYPES[a].name.localeCompare(EVENT_TYPES[b].name)),
    }));
}
