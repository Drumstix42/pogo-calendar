// Ad-hoc single-event .ics generation + download (no Vue reactivity).
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { parseEventDate } from './eventDate';
import type { PogoEvent } from './eventTypes';

dayjs.extend(utc);

const ICS_DATE_FORMAT = 'YYYYMMDD[T]HHmmss[Z]';
const REMINDER_MINUTES_BEFORE = 15;

function escapeIcsText(text: string) {
    return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function generateEventIcs(event: PogoEvent) {
    const start = parseEventDate(event.start).utc();
    const end = parseEventDate(event.end).utc();
    const now = dayjs.utc();

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//pogo-calendar//EN',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `UID:${event.eventID}@pogo-calendar`,
        `DTSTAMP:${now.format(ICS_DATE_FORMAT)}`,
        `DTSTART:${start.format(ICS_DATE_FORMAT)}`,
        `DTEND:${end.format(ICS_DATE_FORMAT)}`,
        `SUMMARY:${escapeIcsText(event.name)}`,
        `URL:${event.link}`,
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'DESCRIPTION:Reminder',
        `TRIGGER:-PT${REMINDER_MINUTES_BEFORE}M`,
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR',
    ];

    return lines.join('\r\n') + '\r\n';
}

export function downloadEventIcs(event: PogoEvent) {
    const icsContent = generateEventIcs(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '')}.ics`;
    link.click();

    URL.revokeObjectURL(url);
}
