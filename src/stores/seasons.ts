import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import utc from 'dayjs/plugin/utc';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { useDisplayTime } from '@/composables/useDisplayTime';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { type Season, type SeasonDailyBonus, parseEventDate } from '@/utils/eventTypes';

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const SEASON_URL = 'https://raw.githubusercontent.com/Drumstix42/ScrapedDuck/refs/heads/data/season.json';

/**
 * Pinia store for season "Daily Discoveries" data (season.json).
 * Holds an array of seasons (sorted by start) so boundary weeks can resolve against prev/next.
 */
export const useSeasonsStore = defineStore('seasonsStore', () => {
    const seasons = ref<Season[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const lastFetched = ref<dayjs.Dayjs | null>(null);

    const { displayNow } = useDisplayTime();
    const calendarSettings = useCalendarSettingsStore();

    const hasFreshData = computed((): boolean => {
        if (!lastFetched.value) return false;
        return dayjs().diff(lastFetched.value, 'minute') < 10;
    });

    /** The season whose [start, end] window contains the given date (day granularity), or null. */
    function getSeasonForDate(date: dayjs.Dayjs | string | Date): Season | null {
        const offset = calendarSettings.manualTimeOffsetHours;
        const target = dayjs(date).startOf('day');

        return (
            seasons.value.find(season => {
                if (!season.start || !season.end) return false;
                const start = parseEventDate(season.start, offset).startOf('day');
                const end = parseEventDate(season.end, offset).startOf('day');
                return target.isSameOrAfter(start) && target.isSameOrBefore(end);
            }) ?? null
        );
    }

    /** The daily-discovery bonus for the given date's day-of-week, or null if none/uncertain. */
    function getDailyBonusForDate(date: dayjs.Dayjs | string | Date): SeasonDailyBonus | null {
        const season = getSeasonForDate(date);
        if (!season) return null;

        const dayOfWeek = dayjs(date).day();
        return season.dailyBonuses.find(bonus => bonus.dayOfWeek === dayOfWeek) ?? null;
    }

    /** The season active "now" (offset-adjusted), or null between seasons. */
    const activeSeason = computed((): Season | null => {
        return getSeasonForDate(displayNow.value);
    });

    async function fetchSeasons(force: boolean = false): Promise<void> {
        if (!force && hasFreshData.value) {
            return;
        }

        loading.value = true;
        error.value = null;

        try {
            const response = await fetch(SEASON_URL);

            if (!response.ok) {
                throw new Error(`Failed to fetch seasons: ${response.status} ${response.statusText}`);
            }

            const fetched: Season[] = await response.json();
            seasons.value = Array.isArray(fetched) ? fetched : [];
            lastFetched.value = dayjs();
            error.value = null;

            console.log(`Loaded ${seasons.value.length} season(s) from ScrapedDuck`);
        } catch (fetchError) {
            console.error('Error fetching seasons:', fetchError);
            error.value = fetchError instanceof Error ? fetchError.message : 'Unknown error occurred';
        } finally {
            loading.value = false;
        }
    }

    return {
        // State
        seasons,
        loading,
        error,
        lastFetched,

        // Getters
        hasFreshData,
        activeSeason,

        // Resolvers / actions
        getSeasonForDate,
        getDailyBonusForDate,
        fetchSeasons,
    };
});
