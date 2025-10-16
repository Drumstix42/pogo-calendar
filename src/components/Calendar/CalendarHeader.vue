<template>
    <div class="calendar-header d-flex align-items-center justify-content-between flex-wrap row-gap-2 mb-2 px-1">
        <!-- Left: Month navigation -->
        <div class="d-flex align-items-center flex-wrap gap-1" :class="{ 'flex-grow-1': !isDesktopSidebar }">
            <span class="month-label flex-grow-1">{{ currentMonthDisplay }}</span>

            <VTooltip v-if="!isCurrentMonth" placement="top" :delay="{ show: 50, hide: 0 }" distance="10" class="d-flex align-items-center ms-1">
                <template #popper>
                    <div class="tooltip-text">Go to current month</div>
                </template>
                <button class="btn btn-icon-ghost btn-sm" :class="{ 'disabled-subtle': isCurrentMonth }" @click="goToCurrentMonth">
                    <Undo2 v-if="!isCurrentMonth" :size="22" class="calendar-reset-icon" />
                    <Calendar v-else :size="22" />
                </button>
            </VTooltip>

            <div class="d-flex align-items-center">
                <VTooltip placement="top" :delay="{ show: 50, hide: 0 }" distance="10" class="d-flex align-items-center ms-1">
                    <template #popper>
                        <div class="tooltip-text">Previous month</div>
                    </template>
                    <button class="btn btn-icon-ghost btn-sm me-1" @click="goToPreviousMonth" :disabled="isPreviousDisabled">
                        <ChevronLeft :size="24" />
                    </button>
                </VTooltip>
                <VTooltip placement="top" :delay="{ show: 50, hide: 0 }" distance="10" class="d-flex align-items-center ms-1">
                    <template #popper>
                        <div class="tooltip-text">Next month</div>
                    </template>
                    <button class="btn btn-icon-ghost btn-sm" @click="goToNextMonth" :disabled="isNextDisabled">
                        <ChevronRight :size="24" />
                    </button>
                </VTooltip>
            </div>
        </div>

        <!-- Right: Timeline toggle (only visible at >=1400px) -->
        <Transition name="timeline-toggle">
            <div v-if="isDesktopSidebar" class="timeline-toggle-section">
                <button
                    type="button"
                    class="btn btn-icon-ghost d-flex align-items-center gap-2"
                    :title="calendarSettings.timelineSidebarCollapsed ? 'Show Timeline' : 'Hide Timeline'"
                    @click="calendarSettings.toggleTimelineSidebarCollapsed"
                >
                    <span class="timeline-toggle-label">{{ calendarSettings.timelineSidebarCollapsed ? 'Show Timeline' : 'Hide Timeline' }}</span>
                    <PanelRightOpen v-if="calendarSettings.timelineSidebarCollapsed" :size="18" />
                    <PanelRightClose v-else :size="18" />
                </button>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { breakpointsBootstrapV5, useBreakpoints } from '@vueuse/core';
import dayjs from 'dayjs';
import { Calendar, ChevronLeft, ChevronRight, PanelRightClose, PanelRightOpen, Undo2 } from 'lucide-vue-next';
import { computed } from 'vue';

import { useUrlSync } from '@/composables/useUrlSync';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { DATE_FORMAT } from '@/utils/dateFormat';

const { urlMonth, urlYear } = useUrlSync();
const calendarSettings = useCalendarSettingsStore();

// Breakpoints
const breakpoints = useBreakpoints(breakpointsBootstrapV5);
const isDesktopSidebar = breakpoints.greaterOrEqual('xxl'); // >= 1400px

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
    font-size: 1.1rem;
    line-height: 1;
    font-weight: 500;
}

.icon-rotate {
    transition: transform 0.2s ease-in-out;
}
.rotate-180 {
    transform: rotate(180deg);
}

.btn-icon-ghost {
    transition: all 0.2s ease;
}

.disabled-subtle {
    opacity: 0.2 !important;
    cursor: not-allowed;
}

.timeline-toggle-section {
    flex-shrink: 0;
}

.btn-timeline-toggle {
    padding: 0.375rem 0.75rem;
    background-color: var(--bs-tertiary-bg);
    border: 1px solid var(--bs-border-color);
    color: var(--bs-body-color);
    transition: all 0.2s ease;
}

.btn-timeline-toggle:hover {
    background-color: var(--bs-secondary-bg);
    border-color: var(--bs-border-color);
}

.timeline-toggle-label {
    font-size: 0.85rem;
    font-weight: 500;
}

.calendar-reset-icon {
    /* subtle undo light blue color using rgba */
    color: rgba(91, 192, 222, 0.7);
}

/* Vue Transition for timeline toggle */
.timeline-toggle-enter-active,
.timeline-toggle-leave-active {
    transition: all 0.3s ease;
}

.timeline-toggle-enter-from,
.timeline-toggle-leave-to {
    opacity: 0;
    transform: translateX(10px);
}
</style>
