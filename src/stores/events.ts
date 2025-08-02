import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import utc from 'dayjs/plugin/utc';
import { defineStore } from 'pinia';

import { DATE_FORMAT } from '../utils/dateFormat';
import {
    type EventTypeInfo,
    type PogoEvent,
    getEventTypeInfo,
    getEventsForDate,
    sortEventsByPriority,
} from '../utils/eventTypes';

// Day.js plugins - extend adds functionality to the core library
dayjs.extend(utc); // Adds UTC timezone support for parsing/converting dates
dayjs.extend(isSameOrBefore); // Adds comparison method for date <= checks
dayjs.extend(isSameOrAfter); // Adds comparison method for date >= checks

interface EventsState {
    events: PogoEvent[];
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
    currentMonth: number;
    currentYear: number;
}

interface EventWithTypeInfo extends PogoEvent {
    typeInfo: EventTypeInfo;
}

const SCRAPED_EVENTS_URL =
    'https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.min.json';

export const useEventsStore = defineStore('events', {
    state: (): EventsState => ({
        events: [],
        loading: false,
        error: null,
        lastFetched: null,
        currentMonth: dayjs().month(),
        currentYear: dayjs().year(),
    }),

    getters: {
        currentMonthEvents: (state): PogoEvent[] => {
            const startOfMonth = dayjs()
                .year(state.currentYear)
                .month(state.currentMonth)
                .startOf('month');
            const endOfMonth = dayjs()
                .year(state.currentYear)
                .month(state.currentMonth)
                .endOf('month');

            return state.events.filter(event => {
                if (!event.start || !event.end) return false;

                const eventStart = dayjs.utc(event.start).local();
                const eventEnd = dayjs.utc(event.end).local();

                return (
                    eventStart.isSameOrBefore(endOfMonth) &&
                    eventEnd.isSameOrAfter(startOfMonth)
                );
            });
        },

        getEventsForDate: state => {
            return (date: Date | string | dayjs.Dayjs): PogoEvent[] => {
                return getEventsForDate(state.events, date);
            };
        },

        eventsByDate: (state): Record<string, EventWithTypeInfo[]> => {
            const grouped: Record<string, EventWithTypeInfo[]> = {};
            const startOfMonth = dayjs()
                .year(state.currentYear)
                .month(state.currentMonth)
                .startOf('month');
            const endOfMonth = dayjs()
                .year(state.currentYear)
                .month(state.currentMonth)
                .endOf('month');

            // Initialize all dates in month
            for (
                let d = startOfMonth;
                d.isSameOrBefore(endOfMonth);
                d = d.add(1, 'day')
            ) {
                const dateKey = d.format(DATE_FORMAT.CALENDAR_DATE);
                grouped[dateKey] = [];
            }

            // Add events to their respective dates
            state.events.forEach(event => {
                if (!event.start || !event.end) return;

                const eventStart = dayjs.utc(event.start).local();
                const eventEnd = dayjs.utc(event.end).local();

                // Add event to each date it spans within the current month
                const spanStart = eventStart.isAfter(startOfMonth)
                    ? eventStart
                    : startOfMonth;
                const spanEnd = eventEnd.isBefore(endOfMonth)
                    ? eventEnd
                    : endOfMonth;

                for (
                    let d = spanStart.startOf('day');
                    d.isSameOrBefore(spanEnd.startOf('day'));
                    d = d.add(1, 'day')
                ) {
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
                grouped[date] = sortEventsByPriority(
                    grouped[date],
                ) as EventWithTypeInfo[];
            });

            return grouped;
        },

        // Check if we have fresh data (less than 1 hour old)
        hasFreshData: (state): boolean => {
            if (!state.lastFetched) return false;
            const oneHour = 60 * 60 * 1000;
            return Date.now() - state.lastFetched < oneHour;
        },

        currentMonthName: (state): string => {
            return dayjs()
                .year(state.currentYear)
                .month(state.currentMonth)
                .format(DATE_FORMAT.MONTH_YEAR);
        },
    },

    actions: {
        async fetchEvents(force: boolean = false): Promise<void> {
            // Skip if we have fresh data and not forcing
            if (!force && this.hasFreshData) {
                return;
            }

            this.loading = true;
            this.error = null;

            try {
                const response = await fetch(SCRAPED_EVENTS_URL);

                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch events: ${response.status} ${response.statusText}`,
                    );
                }

                const events: PogoEvent[] = await response.json();

                this.events = events;
                this.lastFetched = Date.now();
                this.error = null;

                console.log(`Loaded ${events.length} events from ScrapedDuck`);

                // Log some sample events and date analysis
                if (events.length > 0) {
                    const sampleEvent = events[0];
                    console.log('Sample event:', {
                        name: sampleEvent.name,
                        type: sampleEvent.eventType,
                        start: sampleEvent.start,
                        end: sampleEvent.end,
                        startParsed: dayjs
                            .utc(sampleEvent.start)
                            .local()
                            .format(DATE_FORMAT.DATE_TIME),
                        endParsed: dayjs
                            .utc(sampleEvent.end)
                            .local()
                            .format(DATE_FORMAT.DATE_TIME),
                    });

                    const currentMonthCount = this.currentMonthEvents.length;
                    console.log(
                        `Events for current month (${dayjs().format(DATE_FORMAT.MONTH_YEAR)}): ${currentMonthCount}`,
                    );
                }
            } catch (error) {
                console.error('Error fetching events:', error);
                this.error =
                    error instanceof Error
                        ? error.message
                        : 'Unknown error occurred';
            } finally {
                this.loading = false;
            }
        },

        setCurrentMonth(month: number, year: number): void {
            this.currentMonth = month;
            this.currentYear = year;
        },

        navigateToNextMonth(): void {
            if (this.currentMonth === 11) {
                this.currentMonth = 0;
                this.currentYear++;
            } else {
                this.currentMonth++;
            }
        },

        navigateToPreviousMonth(): void {
            if (this.currentMonth === 0) {
                this.currentMonth = 11;
                this.currentYear--;
            } else {
                this.currentMonth--;
            }
        },

        goToToday(): void {
            const today = dayjs();
            this.currentMonth = today.month();
            this.currentYear = today.year();
        },

        // Clear all data (useful for testing or refresh)
        clearEvents(): void {
            this.events = [];
            this.lastFetched = null;
            this.error = null;
        },
    },
});
