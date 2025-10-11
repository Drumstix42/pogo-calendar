import dayjs from 'dayjs';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

/**
 * Composable for synchronizing calendar state with URL query parameters
 * Enables shareable calendar links and browser navigation support
 *
 * Manages:
 * - Calendar navigation (month/year)
 * - Settings panel state
 * - Event detail panel state
 */
export const useUrlSync = () => {
    const route = useRoute();
    const router = useRouter();

    // Parse current URL parameters or use current date as fallback
    const getCurrentMonth = (): number => {
        const monthParam = route.query.month;
        if (monthParam && typeof monthParam === 'string') {
            const parsed = parseInt(monthParam, 10);
            // Expect 1-12 in URL, convert to 0-11 for internal use
            if (parsed >= 1 && parsed <= 12) {
                return parsed - 1;
            }
        }
        return dayjs().month();
    };

    const getCurrentYear = (): number => {
        const yearParam = route.query.year;
        if (yearParam && typeof yearParam === 'string') {
            const parsed = parseInt(yearParam, 10);
            const currentYear = dayjs().year();
            if (parsed >= 2016 && parsed <= currentYear + 1) {
                return parsed;
            }
        }
        return dayjs().year();
    };

    const urlMonth = ref(getCurrentMonth());
    const urlYear = ref(getCurrentYear());

    const isCurrentMonth = () => {
        const current = dayjs();
        return urlMonth.value === current.month() && urlYear.value === current.year();
    };

    const clearMonthYearParams = () => {
        const currentQuery = { ...route.query };
        delete currentQuery.month;
        delete currentQuery.year;
        router.replace({ query: currentQuery });
    };

    onMounted(() => {
        if (isCurrentMonth() && (route.query.month || route.query.year)) {
            // Clear params if we loaded with current month params
            clearMonthYearParams();
        }
    });

    const updateUrl = () => {
        if (isCurrentMonth()) {
            clearMonthYearParams();
        } else {
            router.push({
                query: {
                    ...route.query,
                    month: (urlMonth.value + 1).toString(), // Convert 0-11 to 1-12 for URL
                    year: urlYear.value.toString(),
                },
            });
        }
    };

    watch([urlMonth, urlYear], updateUrl);

    // Watch for route changes to update our values
    watch(
        () => route.query,
        () => {
            urlMonth.value = getCurrentMonth();
            urlYear.value = getCurrentYear();
        },
    );

    const isCurrentMonthYear = computed(() => isCurrentMonth());

    // ============================================
    // Settings Panel State
    // ============================================
    const settingsOpen = computed(() => route.query.settings === '1');

    function openSettings() {
        router.push({
            query: {
                ...route.query,
                settings: '1',
            },
        });
    }

    function closeSettings() {
        const currentQuery = { ...route.query };
        delete currentQuery.settings;
        router.replace({ query: currentQuery });
    }

    // ============================================
    // Event Detail State
    // ============================================
    const selectedEventId = computed(() => {
        const eventId = route.query.event;
        return typeof eventId === 'string' ? eventId : undefined;
    });

    function selectEvent(eventId: string) {
        router.push({
            query: {
                ...route.query,
                event: eventId,
            },
        });
    }

    function clearEvent() {
        const currentQuery = { ...route.query };
        delete currentQuery.event;
        router.replace({ query: currentQuery });
    }

    return {
        // Calendar navigation
        urlMonth,
        urlYear,
        isCurrentMonthYear,

        // Settings panel
        settingsOpen,
        openSettings,
        closeSettings,

        // Event detail panel
        selectedEventId,
        selectEvent,
        clearEvent,
    };
};
