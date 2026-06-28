import type { Dayjs } from 'dayjs';

export interface TimeDisplayParts {
    prefix: string;
    startTime: string;
    separator: string;
    endTime: string;
    focusPrefix: boolean;
    focusStart: boolean;
    focusEnd: boolean;
    startIsPast: boolean;
    endIsPast: boolean;
    isCompleted: boolean;
}

export type EventStatusType = 'ended' | 'upcoming' | 'normal' | 'urgent';

export interface EventStatusInfo {
    prefix: string | null;
    text: string;
    type: EventStatusType;
}

export function formatSingleDayTimes(startDate: Dayjs, endDate: Dayjs) {
    const startTime = startDate.minute() === 0 ? startDate.format('ha') : startDate.format('h:mma');
    const endTime = endDate.minute() === 0 ? endDate.format('ha') : endDate.format('h:mma');

    // Parse the times to check if they're in the same AM/PM period
    const startPeriod = startDate.format('A'); // 'AM' or 'PM'
    const endPeriod = endDate.format('A'); // 'AM' or 'PM'

    // If both times are in the same AM/PM period, omit AM/PM from start time
    if (startPeriod === endPeriod) {
        const startTimeWithoutPeriod = startDate.minute() === 0 ? startDate.format('h') : startDate.format('h:mm');
        return {
            startTime: startTimeWithoutPeriod,
            endTime: endTime,
        };
    }

    // Different periods, keep both AM/PM
    return {
        startTime: startTime,
        endTime: endTime,
    };
}

type TimePhase = 'ended' | 'live' | 'upcoming';

// Focus / past / completed flags keyed on the event's timing phase. Identical across single-day and
// multi-day display; for multi-day the `prefix` is always empty, so `focusPrefix` is never rendered.
const PHASE_FLAGS: Record<TimePhase, Omit<TimeDisplayParts, 'prefix' | 'startTime' | 'separator' | 'endTime'>> = {
    // Event is completely over - both times are past
    ended: { focusPrefix: false, focusStart: false, focusEnd: false, startIsPast: true, endIsPast: true, isCompleted: true },
    // Event is live - start time is past, end time is highlighted
    live: { focusPrefix: false, focusStart: false, focusEnd: true, startIsPast: true, endIsPast: false, isCompleted: false },
    // Event hasn't started - highlight the start (and date prefix, when present)
    upcoming: { focusPrefix: true, focusStart: true, focusEnd: false, startIsPast: false, endIsPast: false, isCompleted: false },
};

function resolveTimePhase(eventStart: Dayjs, eventEnd: Dayjs, currentTime: Dayjs): TimePhase {
    if (currentTime.isAfter(eventEnd)) return 'ended';
    if (currentTime.isAfter(eventStart) && currentTime.isBefore(eventEnd)) return 'live';
    return 'upcoming';
}

export function buildTimeDisplayParts(startDate: Dayjs, endDate: Dayjs, currentTime: Dayjs, isSingleDay: boolean): TimeDisplayParts {
    const flags = PHASE_FLAGS[resolveTimePhase(startDate, endDate, currentTime)];

    if (isSingleDay) {
        // Single day: "Tue Oct 7 • 6–7pm"
        const datePrefix = `${startDate.format('ddd')} ${startDate.format('MMM D')} • `;
        // Get formatted times with smart AM/PM handling
        const { startTime, endTime } = formatSingleDayTimes(startDate, endDate);

        return { prefix: datePrefix, startTime, separator: '-', endTime, ...flags };
    }

    // Multi-day: "Sep 7, 12am → Nov 30, 11:59pm"
    const startDateStr = startDate.format('MMM D, h:mma').replace(':00', '');
    const endDateStr = endDate.format('MMM D, h:mma').replace(':00', '');

    return { prefix: '', startTime: startDateStr, separator: ' → ', endTime: endDateStr, ...flags };
}

export function buildEventStatusInfo(eventStart: Dayjs, eventEnd: Dayjs, currentTime: Dayjs, isSingleDay: boolean): EventStatusInfo | null {
    const totalDays = isSingleDay ? null : eventEnd.diff(eventStart, 'day') + 1;
    const prefix = totalDays ? `${totalDays} day${totalDays > 1 ? 's' : ''} • ` : null;

    // Check if event is completely over
    if (currentTime.isAfter(eventEnd)) {
        const text = isSingleDay ? 'Event ended' : 'event ended';
        return { prefix, text, type: 'ended' };
    }
    // Check if event hasn't started yet
    else if (eventStart.isAfter(currentTime)) {
        const daysUntilStart = eventStart.startOf('day').diff(currentTime.startOf('day'), 'day');

        if (eventStart.startOf('day').isSame(currentTime.startOf('day'))) {
            // Starts today
            const hoursUntilStart = eventStart.diff(currentTime, 'hour', true);
            if (hoursUntilStart < 1) {
                const minutesUntilStart = Math.ceil(eventStart.diff(currentTime, 'minute', true));
                const text = isSingleDay ? `Starts in ${minutesUntilStart}m` : `starts in ${minutesUntilStart}m`;
                return { prefix, text, type: 'upcoming' };
            } else {
                const roundedHours = Math.ceil(hoursUntilStart);
                const text = isSingleDay ? `Starts in ${roundedHours}h` : `starts in ${roundedHours}h`;
                return { prefix, text, type: 'upcoming' };
            }
        } else if (daysUntilStart === 1) {
            const text = isSingleDay ? 'Starts tomorrow' : 'starts tomorrow';
            return { prefix, text, type: 'upcoming' };
        } else {
            const text = isSingleDay ? `Starts in ${daysUntilStart}d` : `starts in ${daysUntilStart}d`;
            return { prefix, text, type: 'normal' };
        }
    }
    // Check if event is currently live
    else if (currentTime.isAfter(eventStart) && currentTime.isBefore(eventEnd)) {
        const daysUntilEnd = eventEnd.startOf('day').diff(currentTime.startOf('day'), 'day');
        // Single-day live events show "Live • " (totalDays is always null here, so no day-count prefix);
        // multi-day live events keep the day-count prefix.
        const livePrefix = isSingleDay ? 'Live • ' : prefix;

        if (eventEnd.startOf('day').isSame(currentTime.startOf('day'))) {
            // Ends today
            const hoursUntilEnd = eventEnd.diff(currentTime, 'hour', true);
            if (hoursUntilEnd < 1) {
                const minutesUntilEnd = Math.ceil(eventEnd.diff(currentTime, 'minute', true));
                return { prefix: livePrefix, text: `ends in ${minutesUntilEnd}m`, type: 'urgent' };
            } else {
                const roundedHours = Math.ceil(hoursUntilEnd);
                return { prefix: livePrefix, text: `ends in ${roundedHours}h`, type: 'urgent' };
            }
        } else if (daysUntilEnd === 1) {
            return { prefix: livePrefix, text: 'ends tomorrow', type: 'urgent' };
        } else if (daysUntilEnd > 1) {
            return { prefix: livePrefix, text: `ends in ${daysUntilEnd}d`, type: 'normal' };
        } else {
            return { prefix: livePrefix, text: 'ends today', type: 'urgent' };
        }
    }

    return null;
}
