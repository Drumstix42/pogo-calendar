import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export const DATE_FORMAT = {
    // Calendar display formats
    CALENDAR_DATE: 'YYYY-MM-DD',
    MONTH_YEAR: 'MMMM YYYY',
    DISPLAY_DATE: 'MMM D',
    DISPLAY_DATE_RANGE: 'MMM D',

    // Event time formats
    DATE_TIME: 'YYYY-MM-DD HH:mm',
    TIME_ONLY: 'HH:mm',
    TIME_12H: 'h A',

    // Debug/logging formats
    ISO_DATE: 'YYYY-MM-DD',
    FULL_DATETIME: 'YYYY-MM-DD HH:mm:ss',
} as const;

export type DateFormat = (typeof DATE_FORMAT)[keyof typeof DATE_FORMAT];

// Event date/time formatting utilities
export const formatEventDateRange = (
    startDate: string,
    endDate: string,
): string => {
    const start = dayjs.utc(startDate).local();
    const end = dayjs.utc(endDate).local();

    if (start.isSame(end, 'day')) {
        // Same day: "Aug 15 @ 2pm - 5pm"
        return `${start.format(DATE_FORMAT.DISPLAY_DATE)} @ ${start.format(DATE_FORMAT.TIME_12H)} - ${end.format(DATE_FORMAT.TIME_12H)}`;
    } else {
        // Multi-day: "Aug 15 @ 2pm - Aug 17 @ 5pm"
        return `${start.format(DATE_FORMAT.DISPLAY_DATE)} @ ${start.format(DATE_FORMAT.TIME_12H)} - ${end.format(DATE_FORMAT.DISPLAY_DATE)} @ ${end.format(DATE_FORMAT.TIME_12H)}`;
    }
};
