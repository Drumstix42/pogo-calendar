import dayjs from 'dayjs';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { type CurrentRaidBoss, groupCurrentRaidBosses, summarizeCurrentRaidBosses } from '@/utils/currentRaidBosses';

const RAIDS_URL = 'https://raw.githubusercontent.com/Drumstix42/ScrapedDuck/refs/heads/data/raids.min.json';

/**
 * Pinia store for the current raid bosses feed (raids.min.json).
 */
export const useRaidsStore = defineStore('raidsStore', () => {
    const raids = ref<CurrentRaidBoss[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const lastFetched = ref<dayjs.Dayjs | null>(null);

    const calendarSettings = useCalendarSettingsStore();

    const hasFreshData = computed((): boolean => {
        if (!lastFetched.value) return false;
        return dayjs().diff(lastFetched.value, 'minute') < 10;
    });

    const tierGroups = computed(() => groupCurrentRaidBosses(raids.value, calendarSettings.useAnimatedImages));
    const tierSummary = computed(() => summarizeCurrentRaidBosses(raids.value));

    async function fetchRaids(force: boolean = false): Promise<void> {
        if (!force && hasFreshData.value) {
            return;
        }

        loading.value = true;
        error.value = null;

        try {
            const response = await fetch(RAIDS_URL);

            if (!response.ok) {
                throw new Error(`Failed to fetch raids: ${response.status} ${response.statusText}`);
            }

            const fetched: CurrentRaidBoss[] = await response.json();
            raids.value = Array.isArray(fetched) ? fetched : [];
            lastFetched.value = dayjs();
            error.value = null;

            console.log(`Loaded ${raids.value.length} raid boss(es) from ScrapedDuck`);
        } catch (fetchError) {
            console.error('Error fetching raids:', fetchError);
            error.value = fetchError instanceof Error ? fetchError.message : 'Unknown error occurred';
        } finally {
            loading.value = false;
        }
    }

    return {
        // State
        raids,
        loading,
        error,
        lastFetched,

        // Getters
        hasFreshData,
        tierGroups,
        tierSummary,

        // Actions
        fetchRaids,
    };
});
