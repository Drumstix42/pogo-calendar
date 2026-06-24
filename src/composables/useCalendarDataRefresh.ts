import { useWindowFocus } from '@vueuse/core';
import { onMounted, watch } from 'vue';

import { useCurrentTime } from '@/composables/useCurrentTime';
import { useEventsStore } from '@/stores/events';
import { useSeasonsStore } from '@/stores/seasons';

/**
 * Keeps events + seasons data fresh:
 * - fetches on mount when data is stale
 * - refetches when the live hour ticks over (only while the window is focused)
 * - refetches when the window regains focus (in case hours passed while away)
 */
export function useCalendarDataRefresh() {
    const eventsStore = useEventsStore();
    const seasonsStore = useSeasonsStore();
    const { liveHour } = useCurrentTime();
    const windowFocused = useWindowFocus();

    onMounted(async () => {
        // Auto-load events when the page mounts
        // only fetch if we don't have fresh data
        if (!eventsStore.hasFreshData) {
            await eventsStore.fetchEvents();
        }
        if (!seasonsStore.hasFreshData) {
            await seasonsStore.fetchSeasons();
        }
    });

    // Watch for hour changes and refetch events (only when window is focused)
    watch(liveHour, async () => {
        if (!windowFocused.value) return; // Skip if window is not focused
        await eventsStore.fetchEvents();
        await seasonsStore.fetchSeasons();
    });

    // Refetch events when window regains focus (in case hours passed while unfocused)
    watch(windowFocused, async focused => {
        if (focused) {
            await eventsStore.fetchEvents();
            await seasonsStore.fetchSeasons();
        }
    });
}
