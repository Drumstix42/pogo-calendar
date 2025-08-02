<template>
    <div class="calendar-header d-flex justify-content-between align-items-center mb-2">
        <button class="btn btn-outline-secondary" @click="goToPreviousMonth" :disabled="isPreviousDisabled">
            <ChevronLeft :size="16" />
            Previous
        </button>

        <div class="d-flex flex-column align-items-center">
            <h3 class="mb-1">{{ currentMonthDisplay }}</h3>
            <button
                class="btn btn-sm"
                :class="isCurrentMonth ? 'btn-outline-secondary' : 'btn-outline-primary'"
                @click="goToCurrentMonth"
                :disabled="isCurrentMonth"
            >
                Today
            </button>
        </div>

        <button class="btn btn-outline-secondary" @click="goToNextMonth" :disabled="isNextDisabled">
            Next
            <ChevronRight :size="16" />
        </button>
    </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { useUrlSync } from '@/composables/useUrlSync';
import { DATE_FORMAT } from '@/utils/dateFormat';

const { urlMonth, urlYear } = useUrlSync();
const router = useRouter();

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
    const now = dayjs();

    // If navigating to current month, clear query params for clean URL
    if (prev.month() === now.month() && prev.year() === now.year()) {
        router.push({ query: {} });
    } else {
        urlMonth.value = prev.month();
        urlYear.value = prev.year();
    }
};

const goToNextMonth = () => {
    const next = dayjs().year(urlYear.value).month(urlMonth.value).add(1, 'month');
    const now = dayjs();

    // If navigating to current month, clear query params for clean URL
    if (next.month() === now.month() && next.year() === now.year()) {
        router.push({ query: {} });
    } else {
        urlMonth.value = next.month();
        urlYear.value = next.year();
    }
};

const goToCurrentMonth = () => {
    // Clear query params to show current month with clean URL
    router.push({ query: {} });
};
</script>

<style scoped>
.calendar-header {
    padding: 1rem 0;
}
</style>
