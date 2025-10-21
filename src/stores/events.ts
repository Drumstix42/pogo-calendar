import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import utc from 'dayjs/plugin/utc';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { DATE_FORMAT } from '../utils/dateFormat';
import { formatEventName } from '../utils/eventName';
import {
    EventTypeInfoWithoutColor,
    type PogoEvent,
    formatEventTime,
    getEventTypeInfo,
    isMultiDayEvent,
    parseEventDate,
    sortEventsByPriority,
} from '../utils/eventTypes';
import { useEventTypeColorsStore } from '@/stores/eventTypeColors';

// Day.js plugins - extend adds functionality to the core library
dayjs.extend(utc); // Adds UTC timezone support for parsing/converting dates
dayjs.extend(isSameOrBefore); // Adds comparison method for date <= checks
dayjs.extend(isSameOrAfter); // Adds comparison method for date >= checks

interface EventWithTypeInfo extends PogoEvent {
    typeInfo: EventTypeInfoWithoutColor;
}

export interface EventMetadata {
    // Precomputed dates
    startDate: dayjs.Dayjs;
    endDate: dayjs.Dayjs;

    // Classifications
    isMultiDayEvent: boolean;
    isPastEvent: boolean;
    isFutureEvent: boolean;

    // Type information
    typeInfo: EventTypeInfoWithoutColor;
    color: string;

    // Display helpers
    formattedStartTime: string;
    displayName: string;

    // Grouping metadata (for when grouping is enabled)
    isGrouped?: boolean;
    groupedEvents?: PogoEvent[];
    groupCount?: number;
}

const SCRAPED_EVENTS_URL = 'https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.min.json';

export const useEventsStore = defineStore('eventsStore', () => {
    // State
    const events = ref<PogoEvent[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const lastFetched = ref<number | null>(null);
    const currentMonth = ref(dayjs().month());
    const currentYear = ref(dayjs().year());

    // Getters (computed)
    const currentMonthEvents = computed((): PogoEvent[] => {
        const startOfMonth = dayjs().year(currentYear.value).month(currentMonth.value).startOf('month');
        const endOfMonth = dayjs().year(currentYear.value).month(currentMonth.value).endOf('month');

        return events.value.filter(event => {
            if (!event.start || !event.end) return false;

            const eventStart = dayjs.utc(event.start).local();
            const eventEnd = dayjs.utc(event.end).local();

            return eventStart.isSameOrBefore(endOfMonth) && eventEnd.isSameOrAfter(startOfMonth);
        });
    });

    const eventsByDate = computed((): Record<string, EventWithTypeInfo[]> => {
        const grouped: Record<string, EventWithTypeInfo[]> = {};
        const startOfMonth = dayjs().year(currentYear.value).month(currentMonth.value).startOf('month');
        const endOfMonth = dayjs().year(currentYear.value).month(currentMonth.value).endOf('month');

        // Initialize all dates in month
        for (let d = startOfMonth; d.isSameOrBefore(endOfMonth); d = d.add(1, 'day')) {
            const dateKey = d.format(DATE_FORMAT.CALENDAR_DATE);
            grouped[dateKey] = [];
        }

        // Add events to their respective dates
        events.value.forEach(event => {
            if (!event.start || !event.end) return;

            const eventStart = dayjs.utc(event.start).local();
            const eventEnd = dayjs.utc(event.end).local();

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

    // Check if we have fresh data (less than 1 hour old)
    const hasFreshData = computed((): boolean => {
        if (!lastFetched.value) return false;
        const oneHour = 60 * 60 * 1000;
        return Date.now() - lastFetched.value < oneHour;
    });

    const currentMonthName = computed((): string => {
        return dayjs().year(currentYear.value).month(currentMonth.value).format(DATE_FORMAT.MONTH_YEAR);
    });

    /** Event metadata with precomputed values for performance */
    const eventMetadata = computed((): Record<string, EventMetadata> => {
        const metadata: Record<string, EventMetadata> = {};
        const now = dayjs();
        const eventTypeColorsStore = useEventTypeColorsStore();

        events.value.forEach(event => {
            const startDate = parseEventDate(event.start);
            const endDate = parseEventDate(event.end);
            const typeInfo = getEventTypeInfo(event.eventType);
            const isMultiDay = isMultiDayEvent(event);

            metadata[event.eventID] = {
                displayName: formatEventName(event.name), // Can be enhanced with grouping logic later
                startDate,
                endDate,
                typeInfo,
                color: eventTypeColorsStore.getEventTypeColor(event.eventType),
                formattedStartTime: formatEventTime(event.start),
                isMultiDayEvent: isMultiDay,
                isPastEvent: endDate.isBefore(now),
                isFutureEvent: startDate.isAfter(now),
            };
        });

        return metadata;
    });

    // Actions (including function-based getters)
    function getEventsForDate(date: Date | string | dayjs.Dayjs): PogoEvent[] {
        const targetDate = dayjs(date);

        return events.value.filter(event => {
            if (!event.start || !event.end) return false;

            const eventStart = dayjs.utc(event.start).local();
            const eventEnd = dayjs.utc(event.end).local();

            return targetDate.isSameOrAfter(eventStart.startOf('day')) && targetDate.isSameOrBefore(eventEnd.startOf('day'));
        });
    }

    async function fetchEvents(force: boolean = false): Promise<void> {
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

            events.value = fetchedEvents;
            lastFetched.value = Date.now();
            error.value = null;

            console.log(`Loaded ${fetchedEvents.length} events from ScrapedDuck`);

            // Log some sample events and date analysis
            if (fetchedEvents.length > 0) {
                const sampleEvent = fetchedEvents[0];
                console.log('Sample event:', {
                    name: sampleEvent.name,
                    type: sampleEvent.eventType,
                    start: sampleEvent.start,
                    end: sampleEvent.end,
                    startParsed: dayjs.utc(sampleEvent.start).local().format(DATE_FORMAT.DATE_TIME),
                    endParsed: dayjs.utc(sampleEvent.end).local().format(DATE_FORMAT.DATE_TIME),
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
        eventsByDate,
        hasFreshData,
        currentMonthName,
        eventMetadata: eventMetadata,

        // Actions
        getEventsForDate,
        getEventById,
        fetchEvents,
        setCurrentMonth,
        navigateToNextMonth,
        navigateToPreviousMonth,
        goToToday,
        clearEvents,
    };
});
