<template>
    <div class="calendar-header d-flex align-items-center justify-content-between flex-wrap row-gap-2 mt-3 mb-2">
        <div class="d-flex align-items-center flex-wrap gap-2">
            <button
                class="btn btn-sm"
                :class="isCurrentMonth ? 'btn-outline-secondary' : 'btn-outline-dark'"
                @click="goToCurrentMonth"
                :disabled="isCurrentMonth"
            >
                Today
            </button>

            <div class="d-flex align-items-center">
                <button class="btn btn-icon-ghost btn-sm me-1" @click="goToPreviousMonth" :disabled="isPreviousDisabled">
                    <ChevronLeft :size="24" />
                </button>
                <button class="btn btn-icon-ghost btn-sm" @click="goToNextMonth" :disabled="isNextDisabled">
                    <ChevronRight :size="24" />
                </button>
            </div>

            <span class="month-label text-center">{{ currentMonthDisplay }}</span>
        </div>

        <button
            class="btn-options-toggle btn xfocus-ring d-flex align-items-center gap-1 ms-auto"
            :class="{ active: calendarSettings.optionsExpanded }"
            @click="calendarSettings.toggleOptionsExpanded"
        >
            <Settings :size="18" class="flex-grow-0" />
        </button>
    </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-vue-next';
import { computed } from 'vue';

import { useUrlSync } from '@/composables/useUrlSync';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { DATE_FORMAT } from '@/utils/dateFormat';

const { urlMonth, urlYear } = useUrlSync();
const calendarSettings = useCalendarSettingsStore();

// Current month display
const currentMonthDisplay = computed(() => {
    return dayjs().year(urlYear.value).month(urlMonth.value).format(DATE_FORMAT.MONTH_YEAR);
});

// Check if we're viewing the current month
const isCurrentMonth = computed(() => {
    const now = dayjs();
    return urlYear.value === now.year() && urlMonth.value === now.month();
});

// Check navigation boundaries
const isPreviousDisabled = computed(() => {
    const current = dayjs().year(urlYear.value).month(urlMonth.value);
    const earliest = dayjs().year(2016).month(0); // January 2016
    return current.isSameOrBefore(earliest, 'month');
});

const isNextDisabled = computed(() => {
    const current = dayjs().year(urlYear.value).month(urlMonth.value);
    const currentYear = dayjs().year();
    const latest = dayjs()
        .year(currentYear + 1)
        .month(11); // December of next year
    return current.isSameOrAfter(latest, 'month');
});

// Navigation methods
const goToPreviousMonth = () => {
    const prev = dayjs().year(urlYear.value).month(urlMonth.value).subtract(1, 'month');
    urlMonth.value = prev.month();
    urlYear.value = prev.year();
};

const goToNextMonth = () => {
    const next = dayjs().year(urlYear.value).month(urlMonth.value).add(1, 'month');
    urlMonth.value = next.month();
    urlYear.value = next.year();
};

const goToCurrentMonth = () => {
    const now = dayjs();
    urlMonth.value = now.month();
    urlYear.value = now.year();
};
</script>

<style scoped>
.month-label {
    font-size: 1.2rem;
    line-height: 1.4rem;
    font-weight: 500;
}

.icon-rotate {
    transition: transform 0.2s ease-in-out;
}
.rotate-180 {
    transform: rotate(180deg);
}

/* Options button styling - no border but normal padding and clear active state */
.btn-options-toggle {
    line-height: 1;
    color: color-mix(in srgb, var(--bs-body-color) 80%, transparent);
    background: transparent;
    transition: all 0.15s ease-in-out;
    padding: 0.4rem 0.6rem;
    border: none;
}

.btn-options-toggle:hover {
    color: var(--bs-body-color);
    background-color: var(--bs-secondary-bg);
}

.btn-options-toggle.active {
    color: var(--bs-white);
    background-color: var(--bs-secondary);
}
</style>
