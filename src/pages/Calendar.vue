<template>
    <div class="container app-container mt-2 mb-4">
        <CollapsibleSection title="Calendar" storage-key="main/calendar-section" class="calendar-section">
            <template #icon>
                <CalendarIcon :size="18" />
            </template>
            <!-- Month Navigation Header -->
            <CalendarHeader />

            <!-- Calendar Grid Component -->
            <div class="row">
                <div class="col-12">
                    <!-- Main Calendar Grid -->
                    <CalendarGrid />

                    <!-- Mini Calendar underneath -->
                    <div class="mt-3">
                        <CalendarMobile />
                    </div>
                </div>
            </div>
        </CollapsibleSection>

        <!-- Event Timeline Section -->
        <div class="row mt-3">
            <div class="col-12">
                <CollapsibleSection title="Timeline" storage-key="main/timeline-section" class="timeline-section">
                    <template #icon>
                        <PanelTop :size="18" />
                    </template>

                    <EventTimeline />
                </CollapsibleSection>
            </div>
        </div>

        <!-- Calendar Options Offcanvas -->
        <Teleport to="body">
            <Transition name="offcanvas-fade">
                <div v-if="calendarSettings.optionsExpanded" class="calendar-options-backdrop" @click="handleBackdropClick">
                    <div class="offcanvas offcanvas-end show calendar-options-offcanvas" @click.stop>
                        <CalendarOptions @close="handleCloseOptions" />
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { breakpointsBootstrapV5, useBreakpoints } from '@vueuse/core';
import { Calendar as CalendarIcon, PanelTop } from 'lucide-vue-next';
import { onMounted, onUnmounted, watchEffect } from 'vue';

import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventsStore } from '@/stores/events';

import CalendarGrid from '@/components/Calendar/CalendarGrid.vue';
import CalendarHeader from '@/components/Calendar/CalendarHeader.vue';
import CalendarMobile from '@/components/Calendar/CalendarMobile.vue';
import EventTimeline from '@/components/Calendar/EventTimeline.vue';
import CalendarOptions from '@/components/CalendarOptions/CalendarOptions.vue';
import CollapsibleSection from '@/components/CollapsibleSection.vue';

const eventsStore = useEventsStore();
const calendarSettings = useCalendarSettingsStore();

// responsive breakpoints https://getbootstrap.com/docs/5.0/layout/breakpoints/#available-breakpoints
const breakpoints = useBreakpoints(breakpointsBootstrapV5);
const isMobile = breakpoints.smaller('md'); // < 768px
// const isDesktop = breakpoints.greaterOrEqual('md'); // >= 768px

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
.offcanvas-fade-enter-active,
.offcanvas-fade-leave-active {
    transition: all 0.3s ease-in-out;
}

.offcanvas-fade-enter-from,
.offcanvas-fade-leave-to {
    opacity: 0;
}

.offcanvas-fade-enter-to,
.offcanvas-fade-leave-from {
    opacity: 1;
}

.calendar-options-backdrop {
    z-index: 1045;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(0.5px);
}

.calendar-options-offcanvas {
    z-index: 1050;
    width: 100%;
    max-width: 400px;
    border: none;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
    background-color: var(--bs-body-bg);
}

@media (max-width: 575.98px) {
    .calendar-options-offcanvas {
        /* Mobile: full width */
        max-width: 100%;
    }
}

/* Offcanvas slide-in animation */
.offcanvas-fade-enter-active .calendar-options-offcanvas {
    transition: transform 0.3s ease-in-out;
}

.offcanvas-fade-enter-from .calendar-options-offcanvas {
    transform: translateX(100%);
}

.offcanvas-fade-enter-to .calendar-options-offcanvas {
    transform: translateX(0);
}

.offcanvas-fade-leave-active .calendar-options-offcanvas {
    transition: transform 0.3s ease-in-out;
}

.offcanvas-fade-leave-from .calendar-options-offcanvas {
    transform: translateX(0);
}

.offcanvas-fade-leave-to .calendar-options-offcanvas {
    transform: translateX(100%);
}
</style>
