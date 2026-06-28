import dayjs from 'dayjs';

export function formatManualOffsetLabel(offsetHours: number) {
    if (offsetHours === 0) return 'Local time';

    const sign = offsetHours > 0 ? '+' : '-';
    const absoluteOffset = Math.abs(offsetHours);
    const wholeHours = Math.floor(absoluteOffset);
    const hasHalfHour = absoluteOffset % 1 !== 0;

    if (hasHalfHour && wholeHours === 0) {
        return `Local ${sign}30m`;
    }

    if (hasHalfHour) {
        return `Local ${sign}${wholeHours}h 30m`;
    }

    return `Local ${sign}${wholeHours}h`;
}

export function getEffectiveTimezoneLabel(manualOffsetHours: number) {
    const effectiveOffsetMinutes = dayjs().utcOffset() + manualOffsetHours * 60;
    const sign = effectiveOffsetMinutes >= 0 ? '+' : '-';
    const absoluteMinutes = Math.abs(effectiveOffsetMinutes);
    const hours = Math.floor(absoluteMinutes / 60)
        .toString()
        .padStart(2, '0');
    const minutes = (absoluteMinutes % 60).toString().padStart(2, '0');

    return `UTC${sign}${hours}:${minutes}`;
}
