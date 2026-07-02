import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';

import type { PogoEvent, PokemonBoss, RaidScheduleEntry } from './eventTypes';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

/**
 * Parse raid schedule date string to dayjs object
 * Handles three formats:
 * 1. "Monday, November 10" - Full date with day of week
 * 2. "Monday" - Just day of week (find within parent event's date range)
 * 3. "April 1" - Month and day (year inferred from parent event start)
 */
export function parseRaidScheduleDate(dateString: string, parentEventStart: string, parentEventEnd: string): dayjs.Dayjs | null {
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
            // If the date falls before the event start, the schedule crosses a year boundary (e.g. Dec→Jan)
            if (parsed.isBefore(parentStart, 'day')) {
                const nextYear = dayjs(`${month} ${day}, ${parentYear + 1}`, 'MMMM D, YYYY');
                if (nextYear.isValid()) return nextYear;
            }
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
            const maxSearchDays = parentEnd.diff(parentStart, 'day') + 2;

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
            if (parsed.isBefore(parentStart, 'day')) {
                const nextYear = dayjs(`${month} ${day}, ${parentYear + 1}`, 'MMMM D, YYYY');
                if (nextYear.isValid()) return nextYear;
            }
            return parsed;
        }
    }

    return null;
}

export function parseTimeStartSortKey(timeString?: string): number {
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
