<template>
    <div class="calendar-header d-flex align-items-center justify-content-between flex-wrap row-gap-2 my-3">
        <div class="d-flex align-items-center flex-wrap row-gap-2">
            <button
                class="btn btn-sm me-3"
                :class="isCurrentMonth ? 'btn-outline-secondary' : 'btn-outline-dark'"
                @click="goToCurrentMonth"
                :disabled="isCurrentMonth"
            >
                Today
            </button>

            <div class="d-flex align-items-center me-3">
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
            class="btn-options-toggle btn btn-sm d-flex align-items-center gap-2 ms-auto"
            :class="[calendarSettings.optionsExpanded ? 'btn-secondary' : 'btn-outline-secondary']"
            @click="calendarSettings.toggleOptionsExpanded"
        >
            <Settings :size="16" class="flex-grow-0" />
            <span class="flex-grow-1">Options</span>
            <ChevronDown :size="14" class="icon-rotate" :class="{ 'rotate-180': calendarSettings.optionsExpanded }" />
        </button>
    </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { ChevronDown, ChevronLeft, ChevronRight, Settings } from 'lucide-vue-next';
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
</style>
