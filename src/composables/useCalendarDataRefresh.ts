import { useWindowFocus } from '@vueuse/core';
import { onMounted, watch } from 'vue';

import { useCurrentTime } from '@/composables/useCurrentTime';
import { useEventsStore } from '@/stores/events';
import { useRaidsStore } from '@/stores/raids';
import { useSeasonsStore } from '@/stores/seasons';

/**
 * Keeps events + seasons + raid bosses data fresh:
 * - fetches on mount when data is stale
 * - refetches when the live hour ticks over (only while the window is focused)
 * - refetches when the window regains focus (in case hours passed while away)
 */
export function useCalendarDataRefresh() {
    const eventsStore = useEventsStore();
    const seasonsStore = useSeasonsStore();
    const raidsStore = useRaidsStore();
    const { liveHour } = useCurrentTime();
    const windowFocused = useWindowFocus();

    // Fetches are independent endpoints - run them concurrently rather than chained, so e.g. raids
    // isn't stuck waiting behind the (much larger) events payload.
    function refreshAll() {
        return Promise.all([
            eventsStore.hasFreshData ? Promise.resolve() : eventsStore.fetchEvents(),
            seasonsStore.hasFreshData ? Promise.resolve() : seasonsStore.fetchSeasons(),
            raidsStore.hasFreshData ? Promise.resolve() : raidsStore.fetchRaids(),
        ]);
    }

    onMounted(refreshAll);

    // Watch for hour changes and refetch events (only when window is focused)
    watch(liveHour, () => {
        if (!windowFocused.value) return; // Skip if window is not focused
        return Promise.all([eventsStore.fetchEvents(), seasonsStore.fetchSeasons(), raidsStore.fetchRaids()]);
    });

    // Refetch events when window regains focus (in case hours passed while unfocused)
    watch(windowFocused, focused => {
        if (focused) {
            return Promise.all([eventsStore.fetchEvents(), seasonsStore.fetchSeasons(), raidsStore.fetchRaids()]);
        }
    });
}
