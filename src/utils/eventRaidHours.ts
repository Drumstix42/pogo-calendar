import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';

import type { PogoEvent, PokemonBoss, RaidScheduleEntry, SpotlightScheduleEntry } from './eventTypes';

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

    // Try parsing month + day format: "April 1"
    const monthDayMatch = dateString.match(/^([A-Za-z]+)\s+(\d{1,2})$/);
    if (monthDayMatch) {
        const [, month, day] = monthDayMatch;
        const dateStr = `${month} ${day}, ${parentYear}`;
        const parsed = dayjs(dateStr, 'MMMM D, YYYY');
        if (parsed.isValid()) {
            return parsed;
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

function parseTimeStartSortKey(timeString?: string): number {
    if (!timeString) {
        return Number.MAX_SAFE_INTEGER;
    }

    const match = timeString.match(/(\d+):(\d+)\s*(a\.m\.|p\.m\.|am|pm)/i);
    if (!match) {
        return Number.MAX_SAFE_INTEGER;
    }

    const [, hourStr, minuteStr, period] = match;
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (period.toLowerCase().includes('p') && hour !== 12) {
        hour += 12;
    } else if (period.toLowerCase().includes('a') && hour === 12) {
        hour = 0;
    }

    return hour * 60 + minute;
}

function formatScheduleSectionTitle(time?: string, label?: string, isAllDay: boolean = false): string {
    const normalizedTime = time?.trim();
    const normalizedLabel = label?.trim();

    if (isAllDay) {
        return normalizedLabel ? `${normalizedLabel} (All Day)` : 'All Day';
    }

    if (normalizedLabel && normalizedTime) {
        return `${normalizedLabel} - ${normalizedTime}`;
    }

    if (normalizedLabel) {
        return normalizedLabel;
    }

    if (normalizedTime) {
        return normalizedTime;
    }

    return 'Scheduled';
}

function matchesScheduleDate(schedule: RaidScheduleEntry, parentEvent: PogoEvent, targetDay: dayjs.Dayjs): boolean {
    const scheduleDateValue = (schedule.date || '').trim().toLowerCase();
    const isWeekdayLabelMatch = scheduleDateValue === targetDay.format('dddd').toLowerCase();

    const raidDate = parseRaidScheduleDate(schedule.date, parentEvent.start, parentEvent.end);
    const isParsedDateMatch = Boolean(raidDate && raidDate.isSame(targetDay, 'day'));

    return isWeekdayLabelMatch || isParsedDateMatch;
}

function dedupeBosses(bosses: PokemonBoss[]): PokemonBoss[] {
    if (bosses.length <= 1) {
        return bosses;
    }

    const deduped = new Map<string, PokemonBoss>();
    bosses.forEach(boss => {
        const key = `${boss.name.toLowerCase()}|${(boss.raidType ?? '').toLowerCase()}`;
        if (!deduped.has(key)) {
            deduped.set(key, boss);
        }
    });

    return Array.from(deduped.values());
}

export interface RaidScheduleSection {
    id: string;
    title: string;
    label?: string;
    time?: string;
    bosses: PokemonBoss[];
    isAllDay: boolean;
    sortKey: number;
}

export function getRaidScheduleSectionsForDate(parentEvent: PogoEvent, targetDate: dayjs.ConfigType): RaidScheduleSection[] {
    const raidSchedule = parentEvent.extraData?.raidSchedule;
    if (!raidSchedule || raidSchedule.length === 0) {
        return [];
    }

    const targetDay = dayjs(targetDate).startOf('day');
    const sections: RaidScheduleSection[] = [];

    raidSchedule.forEach((schedule, scheduleIndex) => {
        if (!matchesScheduleDate(schedule, parentEvent, targetDay)) {
            return;
        }

        if (schedule.bosses && schedule.bosses.length > 0) {
            const isAllDay = !schedule.time;
            sections.push({
                id: `schedule-${scheduleIndex}`,
                title: formatScheduleSectionTitle(schedule.time, schedule.label, isAllDay),
                label: schedule.label?.trim() || undefined,
                time: schedule.time?.trim() || undefined,
                bosses: dedupeBosses(schedule.bosses),
                isAllDay,
                sortKey: isAllDay ? -1 : parseTimeStartSortKey(schedule.time),
            });
        }

        if (schedule.raidHours && schedule.raidHours.length > 0) {
            schedule.raidHours.forEach((raidHour, hourIndex) => {
                if (!raidHour.bosses || raidHour.bosses.length === 0) {
                    return;
                }

                sections.push({
                    id: `schedule-${scheduleIndex}-raidhour-${hourIndex}`,
                    title: formatScheduleSectionTitle(raidHour.time, raidHour.label, false),
                    label: raidHour.label?.trim() || undefined,
                    time: raidHour.time?.trim() || undefined,
                    bosses: dedupeBosses(raidHour.bosses),
                    isAllDay: false,
                    sortKey: parseTimeStartSortKey(raidHour.time),
                });
            });
        }
    });

    return sections.sort((a, b) => {
        if (a.isAllDay !== b.isAllDay) {
            return a.isAllDay ? -1 : 1;
        }
        if (a.sortKey !== b.sortKey) {
            return a.sortKey - b.sortKey;
        }
        return a.title.localeCompare(b.title);
    });
}

/**
 * Format spotlight hour event name
 */
function formatSpotlightEventName(pokemon: PokemonBoss): string {
    return `${pokemon.name} Spotlight Hour`;
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
    if (bosses.length > 6) return `${bosses.length} Bosses Raid Hour`;

    // 3–6
    const allButLast = bosses
        .slice(0, -1)
        .map(b => b.name)
        .join(', ');
    const last = bosses[bosses.length - 1].name;
    return `${allButLast}, and ${last} Raid Hour`;
}

/**
 * Get raid bosses for a specific local calendar day from an event's raid schedule.
 * Includes bosses from both top-level schedule entries and nested raidHours entries.
 */
export function getRaidScheduleBossesForDate(parentEvent: PogoEvent, targetDate: dayjs.ConfigType): PokemonBoss[] {
    const sections = getRaidScheduleSectionsForDate(parentEvent, targetDate);
    if (sections.length === 0) {
        return [];
    }

    const mergedBosses = sections.flatMap(section => section.bosses);
    return dedupeBosses(mergedBosses);
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
        // Only process entries with raid hours
        if (!schedule.raidHours || schedule.raidHours.length === 0) {
            return;
        }

        // Parse the date
        const raidDate = parseRaidScheduleDate(schedule.date, parentEvent.start, parentEvent.end);
        if (!raidDate) {
            console.warn(`Could not parse raid schedule date: "${schedule.date}" for event ${parentEvent.eventID}`);
            return;
        }

        // Process each raid hour
        schedule.raidHours.forEach((raidHour, index) => {
            if (!raidHour.bosses || raidHour.bosses.length === 0) {
                return;
            }

            // Parse the time
            const { startHour, endHour } = parseRaidHourTime(raidHour.time || '');

            // Create start and end times
            const startDateTime = raidDate.hour(startHour).minute(0).second(0);
            const endDateTime = raidDate.hour(endHour).minute(0).second(0);

            // Format event name
            const eventName = formatPokemonList(raidHour.bosses);

            // Generate unique ID
            const dateKey = raidDate.format('YYYY-MM-DD');
            const eventID = `${parentEvent.eventID}-raid-hour-${dateKey}-${index}`;

            // Create pseudo event
            const pseudoEvent: PogoEvent = {
                eventID,
                name: eventName,
                eventType: 'event',
                heading: 'Event',
                link: parentEvent.link,
                image: raidHour.bosses[0]?.image || parentEvent.image,
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
                        bosses: raidHour.bosses,
                    },
                    ...(schedule.bonuses && schedule.bonuses.length > 0 && { raidHourBonuses: schedule.bonuses }),
                },
            };

            pseudoEvents.push(pseudoEvent);
        });
    });

    return pseudoEvents;
}

/**
 * Generate pseudo Spotlight Hour sub events from a parent event's spotlight schedule
 */
export function generateEventSpotlightSubEvents(parentEvent: PogoEvent): PogoEvent[] {
    // Only process events with eventType "event"
    if (parentEvent.eventType !== 'event') {
        return [];
    }

    const spotlightSchedule = parentEvent.extraData?.spotlightSchedule;
    if (!spotlightSchedule || spotlightSchedule.length === 0) {
        return [];
    }

    const pseudoEvents: PogoEvent[] = [];

    spotlightSchedule.forEach((schedule: SpotlightScheduleEntry, index) => {
        if (!schedule.pokemon || !schedule.pokemon.name) {
            return;
        }

        const spotlightDate = parseRaidScheduleDate(schedule.date, parentEvent.start, parentEvent.end);
        if (!spotlightDate) {
            console.warn(`Could not parse spotlight schedule date: "${schedule.date}" for event ${parentEvent.eventID}`);
            return;
        }

        const { startHour, endHour } = parseRaidHourTime(schedule.time || '');
        const startDateTime = spotlightDate.hour(startHour).minute(0).second(0);
        const endDateTime = spotlightDate.hour(endHour).minute(0).second(0);

        const eventName = formatSpotlightEventName(schedule.pokemon);
        const dateKey = spotlightDate.format('YYYY-MM-DD');
        const eventID = `${parentEvent.eventID}-spotlight-hour-${dateKey}-${index}`;

        const pseudoEvent: PogoEvent = {
            eventID,
            name: eventName,
            eventType: parentEvent.eventType,
            heading: parentEvent.heading,
            link: parentEvent.link,
            image: schedule.pokemon.image || parentEvent.image,
            start: startDateTime.format('YYYY-MM-DDTHH:mm:ss.SSS'),
            end: endDateTime.format('YYYY-MM-DDTHH:mm:ss.SSS'),
            extraData: {
                isSpotlightSubEvent: true,
                parentEventId: parentEvent.eventID,
                generic: {
                    hasSpawns: false,
                    hasFieldResearchTasks: false,
                },
                spotlight: {
                    name: schedule.pokemon.name,
                    image: schedule.pokemon.image,
                    canBeShiny: schedule.pokemon.canBeShiny,
                },
            },
        };

        pseudoEvents.push(pseudoEvent);
    });

    return pseudoEvents;
}
