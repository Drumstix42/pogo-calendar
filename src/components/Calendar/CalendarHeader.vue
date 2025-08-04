<template>
    <div class="calendar-header d-flex align-items-center justify-content-between mb-2">
        <div class="d-flex align-items-center">
            <button
                class="btn btn-sm me-3"
                :class="isCurrentMonth ? 'btn-outline-secondary' : 'btn-outline-dark'"
                @click="goToCurrentMonth"
                :disabled="isCurrentMonth"
            >
                Today
            </button>

            <div class="d-flex align-items-center me-3">
                <button class="btn btn-ghost btn-sm me-1" @click="goToPreviousMonth" :disabled="isPreviousDisabled">
                    <ChevronLeft :size="24" />
                </button>
                <button class="btn btn-ghost btn-sm" @click="goToNextMonth" :disabled="isNextDisabled">
                    <ChevronRight :size="24" />
                </button>
            </div>

            <span class="month-label">{{ currentMonthDisplay }}</span>
        </div>

        <button
            class="btn btn-outline-secondary btn-sm d-flex align-items-center"
            @click="toggleOptions"
        >
            <Settings :size="16" class="me-2" />
            <span class="me-2">{{ isOptionsExpanded ? 'Hide' : 'Show' }} Options</span>
            <ChevronDown :size="14" :class="{ 'rotate-180': isOptionsExpanded }" />
        </button>
    </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { ChevronDown, ChevronLeft, ChevronRight, Settings } from 'lucide-vue-next';
import { computed, ref } from 'vue';

import { useUrlSync } from '@/composables/useUrlSync';
import { DATE_FORMAT } from '@/utils/dateFormat';

const { urlMonth, urlYear } = useUrlSync();

// Options toggle state
const isOptionsExpanded = ref(false);

const toggleOptions = () => {
    isOptionsExpanded.value = !isOptionsExpanded.value;
};

// Expose the options state for parent component
defineExpose({
    isOptionsExpanded,
});

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
.calendar-header {
    padding: 1rem 0;
}

.month-label {
    font-size: 1rem;
    font-weight: 500;
}

.btn-ghost {
    background-color: transparent;
    border: none;
    color: var(--bs-body-color);
    transition: background-color 0.15s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem 0.25rem;
}

.btn-ghost:hover:not(:disabled) {
    background-color: var(--bs-secondary-bg, rgba(108, 117, 125, 0.1));
    color: var(--bs-body-color);
}

.btn-ghost:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.rotate-180 {
    transform: rotate(180deg);
    transition: transform 0.2s ease-in-out;
}
</style>
