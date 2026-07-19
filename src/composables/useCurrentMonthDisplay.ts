import { computed } from 'vue';

import { useDisplayTime } from '@/composables/useDisplayTime';
import { useUrlSync } from '@/composables/useUrlSync';
import { DATE_FORMAT } from '@/utils/dateFormat';

/** The currently viewed month/year (from the URL), formatted for display - shared by CalendarHeader's
 * nav row and the page-level "Calendar" collapsible section title (below the xxl breakpoint). */
export function useCurrentMonthDisplay() {
    const { urlMonth, urlYear } = useUrlSync();
    const { displayToday } = useDisplayTime();

    const currentMonthDisplay = computed(() => {
        const now = displayToday.value;
        return now.year(urlYear.value).month(urlMonth.value).format(DATE_FORMAT.MONTH_YEAR);
    });

    return { currentMonthDisplay };
}
