<template>
    <div class="calendar-header align-items-center row-gap-2 mb-2 px-1">
        <!-- Left: Month navigation -->
        <div class="d-flex align-items-center flex-nowrap gap-1 nav-cluster">
            <div class="d-flex align-items-center">
                <VTooltip :disabled="isTouchDevice" placement="top" :delay="{ show: 50, hide: 0 }" distance="10" class="d-flex align-items-center">
                    <template #popper>
                        <div class="tooltip-text">Previous month</div>
                    </template>
                    <button class="btn btn-icon-ghost btn-sm me-1" @click="goToPreviousMonth" :disabled="isPreviousDisabled">
                        <ChevronLeft :size="24" />
                    </button>
                </VTooltip>
                <VTooltip :disabled="isTouchDevice" placement="top" :delay="{ show: 50, hide: 0 }" distance="10" class="d-flex align-items-center">
                    <template #popper>
                        <div class="tooltip-text">Next month</div>
                    </template>
                    <button class="btn btn-icon-ghost btn-sm" @click="goToNextMonth" :disabled="isNextDisabled">
                        <ChevronRight :size="24" />
                    </button>
                </VTooltip>
            </div>

            <VTooltip
                v-if="!isCurrentMonth"
                :disabled="isTouchDevice"
                placement="top"
                :delay="{ show: 50, hide: 0 }"
                distance="10"
                class="d-flex align-items-center me-1"
            >
                <template #popper>
                    <div class="tooltip-text">Go to current month</div>
                </template>
                <button class="btn btn-icon-ghost btn-sm" :class="{ 'disabled-subtle': isCurrentMonth }" @click="goToCurrentMonth">
                    <Undo2 v-if="!isCurrentMonth" :size="22" class="calendar-reset-icon" />
                    <Calendar v-else :size="22" />
                </button>
            </VTooltip>

            <!-- Below xxl, the month/year shows in the "Calendar" collapsible section's title instead. -->
            <span v-if="isDesktopSidebar" class="month-label">{{ currentMonthDisplay }}</span>
        </div>

        <!-- Center: Current Raid Bosses -->
        <div class="raid-bosses-slot">
            <CurrentRaidBossesBar />
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
import { Calendar, ChevronLeft, ChevronRight, PanelRightClose, PanelRightOpen, Undo2 } from '@lucide/vue';
import { breakpointsBootstrapV5, useBreakpoints } from '@vueuse/core';
import dayjs from 'dayjs';
import { computed } from 'vue';

import { useCurrentMonthDisplay } from '@/composables/useCurrentMonthDisplay';
import { useDeviceDetection } from '@/composables/useDeviceDetection';
import { useDisplayTime } from '@/composables/useDisplayTime';
import { useUrlSync } from '@/composables/useUrlSync';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';

import CurrentRaidBossesBar from '@/components/CurrentRaidBossesBar.vue';

const { urlMonth, urlYear } = useUrlSync();
const calendarSettings = useCalendarSettingsStore();
const { isTouchDevice } = useDeviceDetection();
const { displayToday } = useDisplayTime();
const { currentMonthDisplay } = useCurrentMonthDisplay();

// Breakpoints
const breakpoints = useBreakpoints(breakpointsBootstrapV5);
const isDesktopSidebar = breakpoints.greaterOrEqual('xxl'); // >= 1400px

// Check if we're viewing the current month
const isCurrentMonth = computed(() => {
    const now = displayToday.value;
    return urlYear.value === now.year() && urlMonth.value === now.month();
});

// Check navigation boundaries
const isPreviousDisabled = computed(() => {
    const now = displayToday.value;
    const current = now.year(urlYear.value).month(urlMonth.value);
    const earliest = dayjs().year(2016).month(0); // January 2016
    return current.isSameOrBefore(earliest, 'month');
});

const isNextDisabled = computed(() => {
    const now = displayToday.value;
    const current = now.year(urlYear.value).month(urlMonth.value);
    const currentYear = now.year();
    const latest = now.year(currentYear + 1).month(11); // December of next year
    return current.isSameOrAfter(latest, 'month');
});

// Navigation methods
const goToPreviousMonth = () => {
    const now = displayToday.value;
    const prev = now.year(urlYear.value).month(urlMonth.value).subtract(1, 'month');
    urlMonth.value = prev.month();
    urlYear.value = prev.year();
};

const goToNextMonth = () => {
    const now = displayToday.value;
    const next = now.year(urlYear.value).month(urlMonth.value).add(1, 'month');
    urlMonth.value = next.month();
    urlYear.value = next.year();
};

const goToCurrentMonth = () => {
    const now = displayToday.value;
    urlMonth.value = now.month();
    urlYear.value = now.year();
};
</script>

<style scoped>
.calendar-header {
    display: grid;
    /* Nav column has a max-content floor so its buttons are never squeezed/overlapped by the
       centered raid-bosses column - if space is genuinely too tight, the row scrolls instead. */
    grid-template-columns: minmax(max-content, 1fr) auto minmax(0, 1fr);
    overflow-x: auto;
}

.raid-bosses-slot {
    display: flex;
    justify-content: center;
    min-width: 0;
}

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
    justify-self: end;
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
