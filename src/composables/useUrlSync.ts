import { useRouteQuery } from '@vueuse/router';
import dayjs from 'dayjs';
import { computed } from 'vue';

/**
 * Composable for synchronizing calendar state with URL query parameters
 * Enables shareable calendar links and browser navigation support
 */
export const useUrlSync = () => {
    // Use VueUse's useRouteQuery for reactive URL sync
    const urlMonth = useRouteQuery('month', dayjs().month().toString(), {
        transform: (value: string | null): number => {
            if (value !== null) {
                const parsed = parseInt(value, 10);
                if (parsed >= 0 && parsed <= 11) {
                    return parsed;
                }
            }
            return dayjs().month();
        },
    });

    const urlYear = useRouteQuery('year', dayjs().year().toString(), {
        transform: (value: string | null): number => {
            if (value !== null) {
                const parsed = parseInt(value, 10);
                if (parsed >= 2020 && parsed <= 2030) {
                    return parsed;
                }
            }
            return dayjs().year();
        },
    });

    // Computed to check if we're showing current month/year
    const isCurrentMonthYear = computed(() => {
        const current = dayjs();
        return urlMonth.value === current.month() && urlYear.value === current.year();
    });

    return {
        urlMonth,
        urlYear,
        isCurrentMonthYear,
    };
};
