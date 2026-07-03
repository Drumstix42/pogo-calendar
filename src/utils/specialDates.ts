import { type Dayjs } from 'dayjs';

import { POKEMON_GO_BIRTHDAY } from '@/constants/specialDates';
import { getOrdinalSuffix } from '@/utils/numberFormat';

// Matches month/day only, ignoring year, so it recurs every year.
export function isPokemonGoBirthday(day: Dayjs) {
    return day.month() === POKEMON_GO_BIRTHDAY.month - 1 && day.date() === POKEMON_GO_BIRTHDAY.day;
}

// e.g. year 2026 -> "10th" (years since the 2016 launch)
export function getPokemonGoAnniversaryOrdinal(year: number) {
    return getOrdinalSuffix(year - POKEMON_GO_BIRTHDAY.year);
}
