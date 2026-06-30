import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import utc from 'dayjs/plugin/utc';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { DATE_FORMAT } from '../utils/dateFormat';
import { parseEventDate } from '../utils/eventDate';
import { groupEventsBySimilarity } from '../utils/eventGrouping';
import { buildEventMetadata } from '../utils/eventMetadata';
import { generateEventRaidHourSubEvents, generateEventSpotlightSubEvents } from '../utils/eventRaidHours';
import { sortEventsByPriority } from '../utils/eventSort';
import { type EventMetadata, EventTypeInfoWithoutColor, type PogoEvent, getEventTypeInfo } from '../utils/eventTypes';
import { useDisplayTime } from '@/composables/useDisplayTime';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventTypeColorsStore } from '@/stores/eventTypeColors';

// Day.js plugins - extend adds functionality to the core library
dayjs.extend(utc); // Adds UTC timezone support for parsing/converting dates
dayjs.extend(isSameOrBefore); // Adds comparison method for date <= checks
dayjs.extend(isSameOrAfter); // Adds comparison method for date >= checks

interface EventWithTypeInfo extends PogoEvent {
    typeInfo: EventTypeInfoWithoutColor;
}

//const SCRAPED_EVENTS_URL = 'https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.min.json';
const SCRAPED_EVENTS_URL = 'https://raw.githubusercontent.com/Drumstix42/ScrapedDuck/refs/heads/data/events.min.json';

export const useEventsStore = defineStore('eventsStore', () => {
    // State
    const events = ref<PogoEvent[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const lastFetched = ref<dayjs.Dayjs | null>(null);
    const currentMonth = ref(dayjs().month());
    const currentYear = ref(dayjs().year());

    // Reactive "now", adjusted by the user's manual time offset, for event status calculations
    const { displayNow } = useDisplayTime();
    const calendarSettings = useCalendarSettingsStore();

    function getDisplayNow() {
        return displayNow.value;
    }

    // Getters (computed)
    const currentMonthEvents = computed((): PogoEvent[] => {
        const startOfMonth = dayjs().year(currentYear.value).month(currentMonth.value).startOf('month');
        const endOfMonth = dayjs().year(currentYear.value).month(currentMonth.value).endOf('month');
        const manualOffsetHours = calendarSettings.manualTimeOffsetHours;

        return events.value.filter(event => {
            if (!event.start || !event.end) return false;

            const eventStart = parseEventDate(event.start, manualOffsetHours);
            const eventEnd = parseEventDate(event.end, manualOffsetHours);

            return eventStart.isSameOrBefore(endOfMonth) && eventEnd.isSameOrAfter(startOfMonth);
        });
    });

    const eventsByDate = computed((): Record<string, EventWithTypeInfo[]> => {
        const grouped: Record<string, EventWithTypeInfo[]> = {};
        const startOfMonth = dayjs().year(currentYear.value).month(currentMonth.value).startOf('month');
        const endOfMonth = dayjs().year(currentYear.value).month(currentMonth.value).endOf('month');
        const manualOffsetHours = calendarSettings.manualTimeOffsetHours;

        // Initialize all dates in month
        for (let d = startOfMonth; d.isSameOrBefore(endOfMonth); d = d.add(1, 'day')) {
            const dateKey = d.format(DATE_FORMAT.CALENDAR_DATE);
            grouped[dateKey] = [];
        }

        // Add events to their respective dates
        events.value.forEach(event => {
            if (!event.start || !event.end) return;

            const eventStart = parseEventDate(event.start, manualOffsetHours);
            const eventEnd = parseEventDate(event.end, manualOffsetHours);

            // Add event to each date it spans within the current month
            const spanStart = eventStart.isAfter(startOfMonth) ? eventStart : startOfMonth;
            const spanEnd = eventEnd.isBefore(endOfMonth) ? eventEnd : endOfMonth;

            for (let d = spanStart.startOf('day'); d.isSameOrBefore(spanEnd.startOf('day')); d = d.add(1, 'day')) {
                const dateKey = d.format(DATE_FORMAT.CALENDAR_DATE);
                if (grouped[dateKey]) {
                    grouped[dateKey].push({
                        ...event,
                        typeInfo: getEventTypeInfo(event.eventType),
                    });
                }
            }
        });

        // Sort events by priority within each date
        Object.keys(grouped).forEach(date => {
            grouped[date] = sortEventsByPriority(grouped[date]) as EventWithTypeInfo[];
        });

        return grouped;
    });

    // Check if we have fresh data (less than 10 minutes old)
    const hasFreshData = computed((): boolean => {
        if (!lastFetched.value) return false;
        return dayjs().diff(lastFetched.value, 'minute') < 10;
    });

    const currentMonthName = computed((): string => {
        return dayjs().year(currentYear.value).month(currentMonth.value).format(DATE_FORMAT.MONTH_YEAR);
    });

    /** Event metadata with precomputed values for performance */
    const eventMetadata = computed((): Record<string, EventMetadata> => {
        const metadata: Record<string, EventMetadata> = {};
        // Use liveMinute for reactive event status that updates every minute
        const now = getDisplayNow();
        const eventTypeColorsStore = useEventTypeColorsStore();
        const manualOffsetHours = calendarSettings.manualTimeOffsetHours;

        // First pass: create metadata for all raw events
        events.value.forEach(event => {
            metadata[event.eventID] = buildEventMetadata(event, {
                now,
                manualOffsetHours,
                color: eventTypeColorsStore.getEventTypeColor(event.eventType),
            });
        });

        // Second pass: add grouping metadata for processed events
        processedEvents.value.forEach(event => {
            if (event._isGrouped && metadata[event.eventID]) {
                metadata[event.eventID].isGrouped = true;
                metadata[event.eventID].groupedEvents = event._groupedEvents;
                metadata[event.eventID].groupCount = event._groupedEvents?.length || 0;
            }
        });

        return metadata;
    });

    /**
     * Processed events with grouping applied based on settings.
     * Returns all events with _isGrouped, _groupedEvents, and _displayName properties when applicable.
     */
    const processedEvents = computed((): PogoEvent[] => {
        return groupEventsBySimilarity(events.value, calendarSettings.groupSimilarEvents);
    });

    // Actions (including function-based getters)
    function getEventsForDate(date: Date | string | dayjs.Dayjs): PogoEvent[] {
        const targetDate = dayjs(date);
        const manualOffsetHours = calendarSettings.manualTimeOffsetHours;

        return events.value.filter(event => {
            if (!event.start || !event.end) return false;

            const eventStart = parseEventDate(event.start, manualOffsetHours);
            const eventEnd = parseEventDate(event.end, manualOffsetHours);

            return targetDate.isSameOrAfter(eventStart.startOf('day')) && targetDate.isSameOrBefore(eventEnd.startOf('day'));
        });
    }

    async function fetchEvents(force: boolean = false): Promise<void> {
        // Fetch data every hour, but consider it fresh for 10 minutes to avoid excessive requests
        // Skip if we have fresh data and not forcing
        if (!force && hasFreshData.value) {
            return;
        }

        loading.value = true;
        error.value = null;

        try {
            const response = await fetch(SCRAPED_EVENTS_URL);
            // const response = await fetch('/planning/events3.json');

            if (!response.ok) {
                throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
            }

            const fetchedEvents: PogoEvent[] = await response.json();

            // Generate pseudo raid hour and spotlight hour events from parent events
            const raidHourEvents: PogoEvent[] = [];
            const spotlightEvents: PogoEvent[] = [];
            fetchedEvents.forEach(event => {
                raidHourEvents.push(...generateEventRaidHourSubEvents(event));
                spotlightEvents.push(...generateEventSpotlightSubEvents(event));
            });

            // Combine original events with generated pseudo sub-events
            events.value = [...fetchedEvents, ...raidHourEvents, ...spotlightEvents];
            lastFetched.value = dayjs();
            error.value = null;

            console.log(`Loaded ${fetchedEvents.length} events from ScrapedDuck`);
            if (raidHourEvents.length > 0) {
                console.log(`Parsed ${raidHourEvents.length} Raid Hour pseudo sub-events`);
            }
            if (spotlightEvents.length > 0) {
                console.log(`Parsed ${spotlightEvents.length} Spotlight Hour pseudo sub-events`);
            }

            // Log some sample events and date analysis
            if (fetchedEvents.length > 0) {
                const sampleEvent = fetchedEvents[0];
                console.log('Sample event:', {
                    name: sampleEvent.name,
                    type: sampleEvent.eventType,
                    start: sampleEvent.start,
                    end: sampleEvent.end,
                    startParsed: parseEventDate(sampleEvent.start, calendarSettings.manualTimeOffsetHours).format(DATE_FORMAT.DATE_TIME),
                    endParsed: parseEventDate(sampleEvent.end, calendarSettings.manualTimeOffsetHours).format(DATE_FORMAT.DATE_TIME),
                });

                const currentMonthCount = currentMonthEvents.value.length;
                console.log(`Events for current month (${dayjs().format(DATE_FORMAT.MONTH_YEAR)}): ${currentMonthCount}`);
            }
        } catch (fetchError) {
            console.error('Error fetching events:', fetchError);
            error.value = fetchError instanceof Error ? fetchError.message : 'Unknown error occurred';
        } finally {
            loading.value = false;
        }
    }

    function setCurrentMonth(month: number, year: number): void {
        currentMonth.value = month;
        currentYear.value = year;
    }

    function navigateToNextMonth(): void {
        if (currentMonth.value === 11) {
            currentMonth.value = 0;
            currentYear.value++;
        } else {
            currentMonth.value++;
        }
    }

    function navigateToPreviousMonth(): void {
        if (currentMonth.value === 0) {
            currentMonth.value = 11;
            currentYear.value--;
        } else {
            currentMonth.value--;
        }
    }

    function goToToday(): void {
        const today = dayjs();
        currentMonth.value = today.month();
        currentYear.value = today.year();
    }

    // Clear all data (useful for testing or refresh)
    function clearEvents(): void {
        events.value = [];
        lastFetched.value = null;
        error.value = null;
    }

    function getEventById(eventId: string): PogoEvent | undefined {
        return events.value.find(event => event.eventID === eventId);
    }

    /**
     * Get processed event by ID - returns the grouped representative if event is part of a group.
     * Use this for looking up events by ID when you want grouping to be respected.
     */
    function getProcessedEventById(eventId: string): PogoEvent | undefined {
        return processedEvents.value.find(event => event.eventID === eventId);
    }

    return {
        // State
        events: events,
        loading,
        error,
        lastFetched,
        currentMonth,
        currentYear,

        // Getters
        currentMonthEvents,
        processedEvents,
        eventsByDate,
        hasFreshData,
        currentMonthName,
        eventMetadata,

        // Actions
        getEventsForDate,
        getEventById,
        getProcessedEventById,
        fetchEvents,
        setCurrentMonth,
        navigateToNextMonth,
        navigateToPreviousMonth,
        goToToday,
        clearEvents,
    };
});
