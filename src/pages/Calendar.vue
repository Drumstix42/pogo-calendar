<template>
    <div class="calendar">
        <div class="container mt-2 mb-4">
            <!-- Month Navigation Header -->
            <CalendarHeader />

            <!-- Desktop: Calendar Options -->
            <Transition v-if="isDesktop" name="slide-down">
                <div v-if="calendarSettings.optionsExpanded" class="row">
                    <div class="col-12">
                        <CalendarOptions @close="handleCloseOptions" />
                    </div>
                </div>
            </Transition>

            <!-- Desktop: Calendar Grid Component -->
            <div v-if="isDesktop" class="row">
                <div class="col-12">
                    <CalendarGrid />
                </div>
            </div>

            <!-- Mobile: Calendar Mobile Component -->
            <div v-if="isMobile" class="row">
                <div class="col-12">
                    <CalendarMobile />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { breakpointsBootstrapV5, useBreakpoints } from '@vueuse/core';
import { onMounted } from 'vue';

import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventsStore } from '@/stores/events';

import CalendarGrid from '@/components/Calendar/CalendarGrid.vue';
import CalendarHeader from '@/components/Calendar/CalendarHeader.vue';
import CalendarMobile from '@/components/Calendar/CalendarMobile.vue';
import CalendarOptions from '@/components/CalendarOptions/CalendarOptions.vue';

const eventsStore = useEventsStore();
const calendarSettings = useCalendarSettingsStore();

// Responsive breakpoints https://getbootstrap.com/docs/5.0/layout/breakpoints/#available-breakpoints
const breakpoints = useBreakpoints(breakpointsBootstrapV5);
const isMobile = breakpoints.smaller('md'); // < 768px
const isDesktop = breakpoints.greaterOrEqual('md'); // >= 768px

// Handle close options event from CalendarOptions component
const handleCloseOptions = () => {
    calendarSettings.setOptionsExpanded(false);
};

// Auto-load events when the page mounts
onMounted(async () => {
    // Only fetch if we don't have fresh data
    if (!eventsStore.hasFreshData) {
        await eventsStore.fetchEvents();
    }
});
</script>

<style scoped>
/* Slide down transition for Calendar Options */
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.15s ease-in-out;
    overflow: hidden;
}

.slide-down-enter-from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
}

.slide-down-enter-to {
    opacity: 1;
    max-height: 800px; /* Generous height to accommodate all options */
    transform: translateY(0);
}

.slide-down-leave-from {
    opacity: 1;
    max-height: 800px;
    transform: translateY(0);
}

.slide-down-leave-to {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
}
</style>
