// Web calendar "add event" link builders (no Vue reactivity). Apple Calendar has no equivalent
// web link format — it opens whatever .ics file it's given, so that path is `downloadEventIcs()`.
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { parseEventDate } from './eventDate';
import type { PogoEvent } from './eventTypes';

dayjs.extend(utc);

const BASIC_UTC_FORMAT = 'YYYYMMDD[T]HHmmss[Z]';

function getUtcRange(event: PogoEvent) {
    return {
        start: parseEventDate(event.start).utc(),
        end: parseEventDate(event.end).utc(),
    };
}

export function getGoogleCalendarUrl(event: PogoEvent) {
    const { start, end } = getUtcRange(event);
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.name,
        dates: `${start.format(BASIC_UTC_FORMAT)}/${end.format(BASIC_UTC_FORMAT)}`,
        details: event.link,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function getYahooCalendarUrl(event: PogoEvent) {
    const { start, end } = getUtcRange(event);
    const params = new URLSearchParams({
        v: '60',
        title: event.name,
        st: start.format(BASIC_UTC_FORMAT),
        et: end.format(BASIC_UTC_FORMAT),
        desc: event.link,
    });

    return `https://calendar.yahoo.com/?${params.toString()}`;
}

function getOutlookDeeplinkUrl(host: string, event: PogoEvent) {
    const { start, end } = getUtcRange(event);
    const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        startdt: start.toISOString(),
        enddt: end.toISOString(),
        subject: event.name,
        body: event.link,
    });

    return `https://${host}/calendar/0/deeplink/compose?${params.toString()}`;
}

export function getOutlookComUrl(event: PogoEvent) {
    return getOutlookDeeplinkUrl('outlook.live.com', event);
}

export function getOffice365Url(event: PogoEvent) {
    return getOutlookDeeplinkUrl('outlook.office.com', event);
}
