import { type ComputedRef, computed, ref } from 'vue';

import { type TimelineDateGroup } from './useTimelineCategories';
import { eventMatchesSearch } from '@/utils/eventSearch';
import { type PogoEvent, type TimelineCategoryKey } from '@/utils/eventTypes';

export function useTimelineSearch(
    categorizedEvents: ComputedRef<Record<TimelineCategoryKey, PogoEvent[]>>,
    groupedByDate: ComputedRef<Partial<Record<TimelineCategoryKey, TimelineDateGroup[]>>>,
) {
    const searchQuery = ref('');
    const normalizedQuery = computed(() => searchQuery.value.trim().toLowerCase());
    const isSearching = computed(() => normalizedQuery.value.length > 0);

    const filteredCategorizedEvents = computed(() => {
        if (!isSearching.value) return categorizedEvents.value;

        const result = {} as Record<TimelineCategoryKey, PogoEvent[]>;
        (Object.keys(categorizedEvents.value) as TimelineCategoryKey[]).forEach(key => {
            result[key] = categorizedEvents.value[key].filter(event => eventMatchesSearch(event, normalizedQuery.value));
        });
        return result;
    });

    const filteredGroupedByDate = computed(() => {
        if (!isSearching.value) return groupedByDate.value;

        const result: Partial<Record<TimelineCategoryKey, TimelineDateGroup[]>> = {};
        (Object.keys(groupedByDate.value) as TimelineCategoryKey[]).forEach(key => {
            const groups = groupedByDate.value[key] ?? [];
            result[key] = groups
                .map(group => ({ ...group, events: group.events.filter(event => eventMatchesSearch(event, normalizedQuery.value)) }))
                .filter(group => group.events.length > 0);
        });
        return result;
    });

    // Across every category — drives the top-level "no matches" message.
    const hasMatches = computed(() => Object.values(filteredCategorizedEvents.value).some(events => events.length > 0));

    function clearSearch() {
        searchQuery.value = '';
    }

    return {
        searchQuery,
        isSearching,
        filteredCategorizedEvents,
        filteredGroupedByDate,
        hasMatches,
        clearSearch,
    };
}
