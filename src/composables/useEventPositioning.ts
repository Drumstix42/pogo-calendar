import dayjs from 'dayjs';
import { computed, onMounted, onUnmounted, ref } from 'vue';

import type { EventGroup, PogoEvent } from '@/utils/eventTypes';

export interface EventPosition {
    left: string;
    width: string;
    top?: string;
    zIndex?: number;
}

export interface MultiDayEventLayout {
    event: PogoEvent | EventGroup;
    position: EventPosition;
    startColumn: number;
    spanColumns: number;
    isGrouped: boolean;
}

export const useEventPositioning = () => {
    const calendarGridRef = ref<HTMLElement | null>(null);
    const gridWidth = ref(0);
    const columnWidth = ref(0);

    // Calculate grid dimensions
    const updateGridDimensions = () => {
        if (calendarGridRef.value) {
            const rect = calendarGridRef.value.getBoundingClientRect();
            gridWidth.value = rect.width;
            columnWidth.value = rect.width / 7; // 7 days per week
        }
    };

    // Get column index for a given date within the current calendar view
    const getColumnIndex = (date: dayjs.Dayjs, firstDayOfMonth: dayjs.Dayjs, firstDayOfWeek: number): number => {
        // Calculate the first day shown in the calendar (which might be from previous month)
        const firstCalendarDay = firstDayOfMonth.startOf('week').add(firstDayOfWeek, 'day');
        if (firstCalendarDay.isAfter(firstDayOfMonth)) {
            firstCalendarDay.subtract(7, 'day');
        }

        // Calculate column index (0-6 for each week)
        const daysDiff = date.diff(firstCalendarDay, 'day');
        return daysDiff % 7;
    };

    // Get week row index for a given date
    const getRowIndex = (date: dayjs.Dayjs, firstDayOfMonth: dayjs.Dayjs, firstDayOfWeek: number): number => {
        const firstCalendarDay = firstDayOfMonth.startOf('week').add(firstDayOfWeek, 'day');
        if (firstCalendarDay.isAfter(firstDayOfMonth)) {
            firstCalendarDay.subtract(7, 'day');
        }

        const daysDiff = date.diff(firstCalendarDay, 'day');
        return Math.floor(daysDiff / 7);
    };

    // Calculate position for multi-day events
    const calculateMultiDayEventPosition = (
        event: PogoEvent | EventGroup,
        currentMonth: dayjs.Dayjs,
        firstDayOfWeek: number,
    ): MultiDayEventLayout => {
        const isGroup = 'events' in event;
        const startDate = isGroup ? event.startDate : dayjs.utc(event.start).local();
        const endDate = isGroup ? event.endDate : dayjs.utc(event.end).local();

        const firstDayOfMonth = currentMonth.startOf('month');
        const startColumn = getColumnIndex(startDate, firstDayOfMonth, firstDayOfWeek);
        const endColumn = getColumnIndex(endDate, firstDayOfMonth, firstDayOfWeek);

        // Calculate span (handling events that cross week boundaries)
        let spanColumns: number;
        if (endColumn >= startColumn) {
            spanColumns = endColumn - startColumn + 1;
        } else {
            // Event crosses into next week
            spanColumns = 7 - startColumn + endColumn + 1;
        }

        // Ensure minimum width and maximum width
        spanColumns = Math.max(1, Math.min(7, spanColumns));

        const position: EventPosition = {
            left: `${startColumn * columnWidth.value}px`,
            width: `${spanColumns * columnWidth.value}px`,
            zIndex: 10,
        };

        return {
            event,
            position,
            startColumn,
            spanColumns,
            isGrouped: isGroup,
        };
    };

    // Setup resize observer
    let resizeObserver: ResizeObserver | null = null;

    onMounted(() => {
        updateGridDimensions();

        // Watch for grid size changes
        if (window.ResizeObserver && calendarGridRef.value) {
            resizeObserver = new ResizeObserver(() => {
                updateGridDimensions();
            });
            resizeObserver.observe(calendarGridRef.value);
        }

        // Fallback for browsers without ResizeObserver
        window.addEventListener('resize', updateGridDimensions);
    });

    onUnmounted(() => {
        if (resizeObserver) {
            resizeObserver.disconnect();
        }
        window.removeEventListener('resize', updateGridDimensions);
    });

    return {
        calendarGridRef,
        gridWidth: computed(() => gridWidth.value),
        columnWidth: computed(() => columnWidth.value),
        updateGridDimensions,
        calculateMultiDayEventPosition,
        getColumnIndex,
        getRowIndex,
    };
};
