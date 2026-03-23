import dayjs from 'dayjs';

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
