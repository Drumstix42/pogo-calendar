import { type Dayjs } from 'dayjs';

export interface CalendarDayCell {
    date: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    dayInstance: Dayjs;
}

interface CalendarDaysOptions {
    year: number;
    month: number;
    firstDayIndex: number;
}

// Builds the day cells for the given month, padded to whole weeks aligned to firstDayIndex.
// referenceDay is the offset-adjusted "today" so the today-marker and month alignment match
// displayed event times.
export function buildCalendarDays(referenceDay: Dayjs, { year, month, firstDayIndex }: CalendarDaysOptions): CalendarDayCell[] {
    const currentDate = referenceDay.year(year).month(month);
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');

    // Find the first day of the week that contains the start of month
    let startDate = startOfMonth.clone();
    while (startDate.day() !== firstDayIndex) {
        startDate = startDate.subtract(1, 'day');
    }

    // Calculate end date - end of week containing last day of month
    let endDate = endOfMonth.clone();
    const lastDayIndex = (firstDayIndex + 6) % 7; // Last day of week
    while (endDate.day() !== lastDayIndex) {
        endDate = endDate.add(1, 'day');
    }

    const days: CalendarDayCell[] = [];
    let day = startDate;

    while (day.isBefore(endDate) || day.isSame(endDate, 'day')) {
        days.push({
            date: day.date(),
            month: day.month(),
            year: day.year(),
            isCurrentMonth: day.isSame(currentDate, 'month'),
            isToday: day.isSame(referenceDay, 'day'),
            dayInstance: day,
        });
        day = day.add(1, 'day');
    }

    return days;
}
