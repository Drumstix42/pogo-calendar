import dayjs from 'dayjs';
import { computed } from 'vue';

import { useDisplayTime } from '@/composables/useDisplayTime';
import { useUrlSync } from '@/composables/useUrlSync';

/**
 * Month navigation for the calendar (buttons + swipe), bounded to January 2016 through
 * December of next year.
 */
export function useMonthNavigation() {
    const { urlMonth, urlYear } = useUrlSync();
    const { displayToday } = useDisplayTime();

    const viewedMonth = computed(() => displayToday.value.year(urlYear.value).month(urlMonth.value));

    const isCurrentMonth = computed(() => {
        const now = displayToday.value;
        return urlYear.value === now.year() && urlMonth.value === now.month();
    });

    const isPreviousDisabled = computed(() => {
        const earliest = dayjs().year(2016).month(0);
        return viewedMonth.value.isSameOrBefore(earliest, 'month');
    });

    const isNextDisabled = computed(() => {
        const now = displayToday.value;
        const latest = now.year(now.year() + 1).month(11);
        return viewedMonth.value.isSameOrAfter(latest, 'month');
    });

    function setMonth(target: dayjs.Dayjs) {
        urlMonth.value = target.month();
        urlYear.value = target.year();
    }

    function goToPreviousMonth() {
        setMonth(viewedMonth.value.subtract(1, 'month'));
    }

    function goToNextMonth() {
        setMonth(viewedMonth.value.add(1, 'month'));
    }

    function goToCurrentMonth() {
        setMonth(displayToday.value);
    }

    return {
        isCurrentMonth,
        isPreviousDisabled,
        isNextDisabled,
        goToPreviousMonth,
        goToNextMonth,
        goToCurrentMonth,
    };
}
