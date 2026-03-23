import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import utc from 'dayjs/plugin/utc';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { DATE_FORMAT } from '../utils/dateFormat';
import { formatEventName, getSmartGroupDisplayName } from '../utils/eventName';
import { generateEventRaidHourSubEvents } from '../utils/eventRaidHours';
import {
    EventTypeInfoWithoutColor,
    type PogoEvent,
    type PokemonBoss,
    formatEventTime,
    getEventTypeInfo,
    getRaidSubType,
    isEventWithSubtype,
    parseEventDate,
    sortEventsByPriority,
} from '../utils/eventTypes';
import { type SpotlightBonusInfo, getSpotlightBonusInfo, getSpotlightBonusTypeIcon } from '../utils/spotlightBonus';
import { useCurrentTime } from '@/composables/useCurrentTime';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventTypeColorsStore } from '@/stores/eventTypeColors';

// Day.js plugins - extend adds functionality to the core library
dayjs.extend(utc); // Adds UTC timezone support for parsing/converting dates
dayjs.extend(isSameOrBefore); // Adds comparison method for date <= checks
dayjs.extend(isSameOrAfter); // Adds comparison method for date >= checks

export interface RaidBossTierGroup {
    label: string;
    bosses: PokemonBoss[];
}

// "Tier N" labels sort first (numerically), all others sort alphabetically after
function sortTierLabel(a: string, b: string): number {
    const tierA = a.match(/^Tier (\d+)$/i);
    const tierB = b.match(/^Tier (\d+)$/i);
    if (tierA && tierB) return parseInt(tierA[1]) - parseInt(tierB[1]);
    if (tierA) return -1;
    if (tierB) return 1;
    return a.localeCompare(b);
}

interface EventWithTypeInfo extends PogoEvent {
    typeInfo: EventTypeInfoWithoutColor;
}

export interface EventMetadata {
    // Precomputed dates
    startDate: dayjs.Dayjs;
    endDate: dayjs.Dayjs;

    // Classifications
    isMultiDayEvent: boolean;
    isSingleDayEvent: boolean;
    isPastEvent: boolean;
    isFutureEvent: boolean;

    // Type information
    typeInfo: EventTypeInfoWithoutColor;
    color: string;

    // Display helpers
    formattedStartTime: string;
    displayName: string;

    // Spotlight bonus (for spotlight hour events)
    spotlightBonus?: SpotlightBonusInfo | null;
    spotlightBonusIconUrl?: string | null;

    // Raid boss groupings by tier (for events with raidbattles data)
    raidBossTierGroups?: RaidBossTierGroup[];

    // Grouping metadata (for when grouping is enabled)
    isGrouped?: boolean;
    groupedEvents?: PogoEvent[];
    groupCount?: number;
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

    // Get reactive current time for event status calculations
    const { liveMinute } = useCurrentTime();
    const calendarSettings = useCalendarSettingsStore();

    function getDisplayNow() {
        return liveMinute.value.add(calendarSettings.manualTimeOffsetHours * 60, 'minute');
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
            const startDate = parseEventDate(event.start, manualOffsetHours);
            const endDate = parseEventDate(event.end, manualOffsetHours);
            const typeInfo = getEventTypeInfo(event.eventType);
            const isMultiDay = !startDate.startOf('day').isSame(endDate.startOf('day'));
            const spotlightBonus = getSpotlightBonusInfo(event);

            const bosses = event.extraData?.raidbattles?.bosses;
            let raidBossTierGroups: RaidBossTierGroup[] | undefined;
            if (bosses && bosses.length > 0) {
                const tierMap = new Map<string, PokemonBoss[]>();
                for (const boss of bosses) {
                    const label = boss.raidType || 'Other';
                    if (!tierMap.has(label)) tierMap.set(label, []);
                    tierMap.get(label)!.push(boss);
                }
                raidBossTierGroups = Array.from(tierMap.entries())
                    .sort(([a], [b]) => sortTierLabel(a, b))
                    .map(([label, bosses]) => ({ label, bosses }));
            }

            metadata[event.eventID] = {
                displayName: formatEventName(event.name),
                startDate,
                endDate,
                typeInfo,
                color: eventTypeColorsStore.getEventTypeColor(event.eventType),
                formattedStartTime: formatEventTime(event.start, manualOffsetHours),
                isMultiDayEvent: isMultiDay,
                isSingleDayEvent: !isMultiDay,
                isPastEvent: endDate.isBefore(now),
                isFutureEvent: startDate.isAfter(now),
                spotlightBonus,
                spotlightBonusIconUrl: spotlightBonus ? getSpotlightBonusTypeIcon(spotlightBonus.bonusType) : null,
                raidBossTierGroups,
            };
        });

        // Second pass: add grouping metadata for processed events
        processedEvents.value.forEach(event => {
            if ((event as any)._isGrouped && metadata[event.eventID]) {
                metadata[event.eventID].isGrouped = true;
                metadata[event.eventID].groupedEvents = (event as any)._groupedEvents;
                metadata[event.eventID].groupCount = (event as any)._groupedEvents?.length || 0;
            }
        });

        return metadata;
    });

    /**
     * Processed events with grouping applied based on settings.
     * Returns all events with _isGrouped, _groupedEvents, and _displayName properties when applicable.
     */
    const processedEvents = computed((): PogoEvent[] => {
        const allEvents = events.value;

        if (!calendarSettings.groupSimilarEvents) {
            return allEvents; // No grouping - return events as-is
        }

        // Group events by: eventType + start + end (accounting for raid subtypes)
        const eventGroups = new Map<string, PogoEvent[]>();

        allEvents.forEach(event => {
            // Create more specific grouping key for events with subtypes
            let groupingType = event.eventType;
            if (isEventWithSubtype(event.eventType)) {
                const raidSubType = getRaidSubType(event);
                if (raidSubType) {
                    groupingType = raidSubType;
                }
            }

            const timeKey = `${groupingType}:${event.start}:${event.end}`;
            if (!eventGroups.has(timeKey)) {
                eventGroups.set(timeKey, []);
            }
            eventGroups.get(timeKey)!.push(event);
        });

        // Convert groups to representative events
        const representativeEvents = Array.from(eventGroups.values()).map(group => {
            if (group.length === 1) {
                return group[0]; // Single event - no grouping needed
            }

            // Multiple identical events - create grouped representative
            // Sort the group to ensure consistent representative selection
            const sortedGroup = group.sort((a, b) => {
                // First by event type priority
                const aPriority = getEventTypeInfo(a.eventType).priority;
                const bPriority = getEventTypeInfo(b.eventType).priority;
                if (aPriority !== bPriority) {
                    return bPriority - aPriority; // Higher priority first
                }

                // Then by extraData richness (more keys = more complete event data)
                const aDataCount = a.extraData ? Object.keys(a.extraData).length : 0;
                const bDataCount = b.extraData ? Object.keys(b.extraData).length : 0;
                if (aDataCount !== bDataCount) {
                    return bDataCount - aDataCount; // More data first
                }

                // Finally by event name for consistency
                return formatEventName(a.name).localeCompare(formatEventName(b.name));
            });

            const representative = { ...sortedGroup[0] };
            (representative as any)._isGrouped = true;
            (representative as any)._groupedEvents = group;
            (representative as any)._displayName = getSmartGroupDisplayName(group);

            return representative;
        });

        return representativeEvents;
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

            // Generate pseudo raid hour events from events with raidSchedule
            const raidHourEvents: PogoEvent[] = [];
            fetchedEvents.forEach(event => {
                const pseudoEvents = generateEventRaidHourSubEvents(event);
                raidHourEvents.push(...pseudoEvents);
            });

            // Combine original events with generated raid hour events
            events.value = [...fetchedEvents, ...raidHourEvents];
            lastFetched.value = dayjs();
            error.value = null;

            console.log(`Loaded ${fetchedEvents.length} events from ScrapedDuck`);
            if (raidHourEvents.length > 0) {
                console.log(`Parsed ${raidHourEvents.length} Raid Hour pseudo sub-events`);
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
