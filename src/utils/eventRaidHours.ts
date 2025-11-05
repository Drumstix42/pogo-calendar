import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';

import type { PogoEvent, PokemonBoss, RaidScheduleEntry } from './eventTypes';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

/**
 * Parse raid schedule date string to dayjs object
 * Handles two formats:
 * 1. "Monday, November 10" - Full date with day of week
 * 2. "Monday" - Just day of week (find within parent event's date range)
 */
function parseRaidScheduleDate(dateString: string, parentEventStart: string, parentEventEnd: string): dayjs.Dayjs | null {
    const parentStart = dayjs.utc(parentEventStart).local();
    const parentEnd = dayjs.utc(parentEventEnd).local();
    const parentYear = parentStart.year();

    // Try parsing full date format: "Monday, November 10"
    const fullDateMatch = dateString.match(/([A-Za-z]+),\s+([A-Za-z]+)\s+(\d+)/);
    if (fullDateMatch) {
        const [, , month, day] = fullDateMatch;
        const dateStr = `${month} ${day}, ${parentYear}`;
        const parsed = dayjs(dateStr, 'MMMM D, YYYY');
        if (parsed.isValid()) {
            return parsed;
        }
    }

    // Try parsing just day of week: "Monday"
    const dayOfWeekMatch = dateString.match(/^([A-Za-z]+)$/);
    if (dayOfWeekMatch) {
        const targetDayName = dayOfWeekMatch[1];
        const dayNameToNumber: Record<string, number> = {
            Sunday: 0,
            Monday: 1,
            Tuesday: 2,
            Wednesday: 3,
            Thursday: 4,
            Friday: 5,
            Saturday: 6,
        };

        const targetDayNum = dayNameToNumber[targetDayName];
        if (targetDayNum !== undefined) {
            // Find the first occurrence of this day within the event range
            let current = parentStart.startOf('day');
            const maxSearchDays = 7; // Assume event is within 7 days

            for (let i = 0; i < maxSearchDays; i++) {
                if (current.day() === targetDayNum && current.isSameOrBefore(parentEnd)) {
                    return current;
                }
                current = current.add(1, 'day');
            }
        }
    }

    return null;
}

/**
 * Parse raid hour time string to extract start and end hours
 * Example: "6:00 p.m. to 7:00 p.m. local time" -> { start: 18, end: 19 }
 */
function parseRaidHourTime(timeString: string): { startHour: number; endHour: number } {
    // Default to 6pm-7pm if parsing fails
    const defaultTime = { startHour: 18, endHour: 19 };

    if (!timeString) return defaultTime;

    // Extract times like "6:00 p.m. to 7:00 p.m."
    const timeMatch = timeString.match(/(\d+):(\d+)\s*(a\.m\.|p\.m\.|am|pm)\s+to\s+(\d+):(\d+)\s*(a\.m\.|p\.m\.|am|pm)/i);
    if (timeMatch) {
        const [, startHourStr, , startPeriod, endHourStr, , endPeriod] = timeMatch;
        let startHour = parseInt(startHourStr, 10);
        let endHour = parseInt(endHourStr, 10);

        // Convert to 24-hour format
        if (startPeriod.toLowerCase().includes('p') && startHour !== 12) {
            startHour += 12;
        } else if (startPeriod.toLowerCase().includes('a') && startHour === 12) {
            startHour = 0;
        }

        if (endPeriod.toLowerCase().includes('p') && endHour !== 12) {
            endHour += 12;
        } else if (endPeriod.toLowerCase().includes('a') && endHour === 12) {
            endHour = 0;
        }

        return { startHour, endHour };
    }

    return defaultTime;
}

/**
 * Format Pokemon names grammatically
 * 1 Pokemon: "Lugia Raid Hour"
 * 2 Pokemon: "Lugia and Ho-Oh Raid Hour"
 * 3+ Pokemon: "Tapu Koko, Tapu Lele, and Tapu Bulu Raid Hour"
 */
function formatPokemonList(bosses: PokemonBoss[]): string {
    if (bosses.length === 0) return 'Raid Hour';
    if (bosses.length === 1) return `${bosses[0].name} Raid Hour`;
    if (bosses.length === 2) return `${bosses[0].name} and ${bosses[1].name} Raid Hour`;

    // 3 or more
    const allButLast = bosses
        .slice(0, -1)
        .map(b => b.name)
        .join(', ');
    const last = bosses[bosses.length - 1].name;
    return `${allButLast}, and ${last} Raid Hour`;
}

/**
 * Generate pseudo Raid Hour sub events from a parent event's raid schedule
 */
export function generateEventRaidHourSubEvents(parentEvent: PogoEvent): PogoEvent[] {
    // Only process events with eventType "event"
    if (parentEvent.eventType !== 'event') {
        return [];
    }

    const raidSchedule = parentEvent.extraData?.raidSchedule;
    if (!raidSchedule || raidSchedule.length === 0) {
        return [];
    }

    const pseudoEvents: PogoEvent[] = [];

    raidSchedule.forEach((schedule: RaidScheduleEntry) => {
        // Only process entries with raid hour
        if (!schedule.hasRaidHour || !schedule.bosses || schedule.bosses.length === 0) {
            return;
        }

        // Parse the date
        const raidDate = parseRaidScheduleDate(schedule.date, parentEvent.start, parentEvent.end);
        if (!raidDate) {
            console.warn(`Could not parse raid schedule date: "${schedule.date}" for event ${parentEvent.eventID}`);
            return;
        }

        // Parse the time
        const { startHour, endHour } = parseRaidHourTime(schedule.raidHourTime || '');

        // Create start and end times
        const startDateTime = raidDate.hour(startHour).minute(0).second(0);
        const endDateTime = raidDate.hour(endHour).minute(0).second(0);

        // Format event name
        const eventName = formatPokemonList(schedule.bosses);

        // Generate unique ID
        const dateKey = raidDate.format('YYYY-MM-DD');
        const eventID = `${parentEvent.eventID}-raid-hour-${dateKey}`;

        // Create pseudo event
        const pseudoEvent: PogoEvent = {
            eventID,
            name: eventName,
            eventType: 'event',
            heading: 'Event',
            link: parentEvent.link,
            image: schedule.bosses[0]?.image || parentEvent.image,
            start: startDateTime.format('YYYY-MM-DDTHH:mm:ss.SSS'),
            end: endDateTime.format('YYYY-MM-DDTHH:mm:ss.SSS'),
            extraData: {
                isRaidHourSubEvent: true,
                parentEventId: parentEvent.eventID,
                generic: {
                    hasSpawns: false,
                    hasFieldResearchTasks: false,
                },
                raidbattles: {
                    bosses: schedule.bosses,
                },
            },
        };

        pseudoEvents.push(pseudoEvent);
    });

    return pseudoEvents;
}
