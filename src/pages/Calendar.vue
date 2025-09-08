<template>
    <div class="calendar">
        <div class="container mt-2 mb-4">
            <!-- Month Navigation Header -->
            <CalendarHeader />

            <!-- Calendar Options Overlay -->
            <Teleport to="body">
                <Transition name="overlay-fade">
                    <div v-if="calendarSettings.optionsExpanded" class="calendar-options-overlay" @click="handleBackdropClick">
                        <div class="container" @click.stop>
                            <CalendarOptions @close="handleCloseOptions" />
                        </div>
                    </div>
                </Transition>
            </Teleport>

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
import { onMounted, onUnmounted, watchEffect } from 'vue';

import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventsStore } from '@/stores/events';

import CalendarGrid from '@/components/Calendar/CalendarGrid.vue';
import CalendarHeader from '@/components/Calendar/CalendarHeader.vue';
import CalendarMobile from '@/components/Calendar/CalendarMobile.vue';
import CalendarOptions from '@/components/CalendarOptions/CalendarOptions.vue';

const eventsStore = useEventsStore();
const calendarSettings = useCalendarSettingsStore();

// responsive breakpoints https://getbootstrap.com/docs/5.0/layout/breakpoints/#available-breakpoints
const breakpoints = useBreakpoints(breakpointsBootstrapV5);
const isMobile = breakpoints.smaller('md'); // < 768px
const isDesktop = breakpoints.greaterOrEqual('md'); // >= 768px

const handleCloseOptions = () => {
    calendarSettings.setOptionsExpanded(false);
};

const handleBackdropClick = () => {
    calendarSettings.setOptionsExpanded(false);
};

watchEffect(() => {
    const isModalOpen = calendarSettings.optionsExpanded;
    const isMobileSize = isMobile.value;

    if (isModalOpen && isMobileSize) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
});

onMounted(async () => {
    // Auto-load events when the page mounts
    // only fetch if we don't have fresh data
    if (!eventsStore.hasFreshData) {
        await eventsStore.fetchEvents();
    }
});

onUnmounted(() => {
    document.body.style.overflow = '';
});
</script>

<style scoped>
.overlay-fade-enter-active,
.overlay-fade-leave-active {
    transition: all 0.2s ease-in-out;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
    opacity: 0;
}

.overlay-fade-enter-to,
.overlay-fade-leave-from {
    opacity: 1;
}

.calendar-options-overlay {
    z-index: 1050;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 1rem;
    padding-top: 60px;
    background-color: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(0.7px);
}

.calendar-options-overlay .container {
    transform: translateY(0);
    transition: transform 0.2s ease-in-out;
}

/* Mobile adjustments */
@media (max-width: 767.98px) {
    .calendar-options-overlay {
        padding: 0.5rem;
        padding-top: 20px;
        align-items: flex-start;
    }
}

.overlay-fade-enter-active .container {
    transform: translateY(-10px);
}

.overlay-fade-enter-to .container {
    transform: translateY(0);
}
</style>
