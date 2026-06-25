import { computed } from 'vue';

import { useCurrentTime } from '@/composables/useCurrentTime';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';

/**
 * The current time and day adjusted by the user's manual time offset, as reactive computeds.
 * Single source of truth for the `liveMinute + manualTimeOffsetHours` pattern used across the app.
 */
export function useDisplayTime() {
    const { liveMinute } = useCurrentTime();
    const calendarSettings = useCalendarSettingsStore();

    const displayNow = computed(() => liveMinute.value.add(calendarSettings.manualTimeOffsetHours * 60, 'minute'));
    const displayToday = computed(() => displayNow.value.startOf('day'));

    return { displayNow, displayToday };
}
