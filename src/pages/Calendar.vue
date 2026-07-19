<template>
    <TimeOffsetIndicator v-if="calendarSettings.hasManualTimeOffset" />

    <div class="page-layout" :class="{ 'sidebar-layout': isXxlScreenSize }">
        <!-- Calendar Section -->
        <div class="calendar-wrapper pt-1">
            <CollapsibleSection
                :title="currentMonthDisplay"
                storage-key="main/calendar-section"
                class="calendar-section"
                :hide-header="isXxlScreenSize"
            >
                <template #icon>
                    <CalendarRange :size="18" />
                </template>
                <!-- Month Navigation Header -->
                <CalendarHeader />

                <!-- Calendar Grid Component -->
                <!-- Main Calendar Grid -->
                <CalendarGrid />

                <!-- Filter Summary Button -->
                <FilterSummary @open-filters="openSettingsAndScrollToFilters" />
            </CollapsibleSection>
        </div>

        <!-- Timeline Sidebar (right at >=1400px, below calendar at <1400px) -->
        <div class="timeline-wrapper pt-1" :class="{ 'sidebar-collapsed': isXxlScreenSize && calendarSettings.timelineSidebarCollapsed }">
            <!-- Timeline content -->
            <div v-if="!isXxlScreenSize || !calendarSettings.timelineSidebarCollapsed" class="timeline-content">
                <CollapsibleSection title="Timeline" storage-key="main/timeline-section" class="timeline-section" :hide-header="isXxlScreenSize">
                    <template #icon>
                        <PanelTop :size="18" />
                    </template>

                    <!-- <div class="mb-3">
                            <CalendarMobile />
                        </div> -->

                    <EventTimeline :is-sidebar-mode="isXxlScreenSize" />
                </CollapsibleSection>
            </div>
        </div>
    </div>

    <!-- Calendar Options Offcanvas -->
    <CalendarOptionsOffcanvas :show="calendarSettings.optionsExpanded" @close="closeSettings" />

    <!-- Event Detail Offcanvas (Mobile) -->
    <EventDetailDrawer
        :show="!!selectedEventId && isTouchDevice && !eventsStore.loading"
        :event="selectedEvent"
        :is-single-day="selectedEventIsSingleDay"
        :target-date="selectedEventDay"
        @close="clearEvent"
    />

    <!-- Hide Event Modal -->
    <HideEventModal
        v-if="hideEventModal.currentEvent.value"
        :show="hideEventModal.showModal.value"
        :event="hideEventModal.currentEvent.value"
        @close="hideEventModal.closeModal"
        @hide-by-type="handleHideByType"
        @hide-by-id="handleHideById"
    />

    <!-- Edit Event Color Modal -->
    <EditEventColorModal
        :show="editColorModal.showModal.value"
        :event-type-key="editColorModal.currentEventTypeKey.value"
        @close="editColorModal.closeModal"
    />

    <!-- Add to Calendar Modal -->
    <AddToCalendarModal
        v-if="addToCalendarModal.currentEvent.value"
        :show="addToCalendarModal.showModal.value"
        :event="addToCalendarModal.currentEvent.value"
        @close="addToCalendarModal.closeModal"
    />
</template>

<script setup lang="ts">
import { CalendarRange, PanelTop } from '@lucide/vue';
import { breakpointsBootstrapV5, useBreakpoints, useEventListener, useScrollLock } from '@vueuse/core';
import { hideAllPoppers } from 'floating-vue';
import { computed, nextTick, watch, watchEffect } from 'vue';

import { useAddToCalendarModal } from '@/composables/useAddToCalendarModal';
import { useCalendarDataRefresh } from '@/composables/useCalendarDataRefresh';
import { useCurrentMonthDisplay } from '@/composables/useCurrentMonthDisplay';
import { useDeviceDetection } from '@/composables/useDeviceDetection';
import { useEditColorModal } from '@/composables/useEditColorModal';
import { useEventFilterToasts } from '@/composables/useEventFilterToasts';
import { useHideEventModal } from '@/composables/useHideEventModal';
import { useUrlSync } from '@/composables/useUrlSync';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventsStore } from '@/stores/events';
import { type EventTypeKey } from '@/utils/eventTypes';

import AddToCalendarModal from '@/components/Calendar/AddToCalendarModal.vue';
import CalendarGrid from '@/components/Calendar/CalendarGrid.vue';
import CalendarHeader from '@/components/Calendar/CalendarHeader.vue';
import CalendarOptionsOffcanvas from '@/components/Calendar/CalendarOptionsOffcanvas.vue';
import EditEventColorModal from '@/components/Calendar/EditEventColorModal.vue';
import EventDetailDrawer from '@/components/Calendar/EventDetailDrawer.vue';
/* import CalendarMobile from '@/components/Calendar/CalendarMobile.vue'; */
import EventTimeline from '@/components/Calendar/EventTimeline/EventTimeline.vue';
import FilterSummary from '@/components/Calendar/FilterSummary.vue';
import HideEventModal from '@/components/Calendar/HideEventModal.vue';
import TimeOffsetIndicator from '@/components/Calendar/TimeOffsetIndicator.vue';
import CollapsibleSection from '@/components/CollapsibleSection.vue';

const eventsStore = useEventsStore();
const calendarSettings = useCalendarSettingsStore();
const { currentMonthDisplay } = useCurrentMonthDisplay();
const hideEventModal = useHideEventModal();
const editColorModal = useEditColorModal();
const addToCalendarModal = useAddToCalendarModal();
const { hideEventTypeWithToast, hideEventByIdWithToast } = useEventFilterToasts();
const {
    settingsOpen,
    openSettings,
    closeSettings,
    selectedEventId,
    selectedEventDay,
    clearEvent,
    addToCalendarEventId,
    openAddToCalendar,
    closeAddToCalendar,
} = useUrlSync();
const { isTouchDevice } = useDeviceDetection();

useCalendarDataRefresh();

// responsive breakpoints https://getbootstrap.com/docs/5.0/layout/breakpoints/#available-breakpoints
const breakpoints = useBreakpoints(breakpointsBootstrapV5);
const isXxlScreenSize = breakpoints.greaterOrEqual('xxl'); // >= 1400px
// const isDesktop = breakpoints.greaterOrEqual('md'); // >= 768px

// Settings panel ⇄ URL sync — delay initial sync to allow animation
let isInitialSync = true;
watch(
    settingsOpen,
    isOpen => {
        if (isInitialSync && isOpen) {
            // Delay opening settings on page load to show animation
            setTimeout(() => {
                calendarSettings.setOptionsExpanded(isOpen);
            }, 100);
            isInitialSync = false;
        } else {
            calendarSettings.setOptionsExpanded(isOpen);
            isInitialSync = false;
        }
    },
    { immediate: true },
);

// Sync store changes back to URL (for programmatic opens)
watch(
    () => calendarSettings.optionsExpanded,
    isExpanded => {
        if (isExpanded && !settingsOpen.value) {
            openSettings();
        } else if (!isExpanded && settingsOpen.value) {
            closeSettings();
        }
    },
);

// Add to Calendar modal ⇄ URL sync
// Resolve reactively (not just on URL change) — events may still be loading when the URL is first read.
const addToCalendarEventFromUrl = computed(() => {
    if (!addToCalendarEventId.value) {
        return undefined;
    }
    return eventsStore.getProcessedEventById(addToCalendarEventId.value);
});

watch(
    addToCalendarEventFromUrl,
    event => {
        if (event) {
            addToCalendarModal.openModal(event);
        } else if (!addToCalendarEventId.value && addToCalendarModal.showModal.value) {
            addToCalendarModal.closeModal();
        }
    },
    { immediate: true },
);

// Sync store changes back to URL (for programmatic opens, e.g. from the event tooltip)
watch(
    () => addToCalendarModal.showModal.value,
    isOpen => {
        if (isOpen && addToCalendarModal.currentEvent.value && !addToCalendarEventId.value) {
            openAddToCalendar(addToCalendarModal.currentEvent.value.eventID);
        } else if (!isOpen && addToCalendarEventId.value) {
            closeAddToCalendar();
        }
    },
);

// Selected event (detail drawer)
const selectedEvent = computed(() => {
    if (!selectedEventId.value) {
        return undefined;
    }
    return eventsStore.getProcessedEventById(selectedEventId.value);
});

const selectedEventIsSingleDay = computed(() => {
    if (!selectedEvent.value) {
        return false;
    }
    return eventsStore.eventMetadata[selectedEvent.value.eventID]?.isSingleDayEvent ?? false;
});

// Event actions
function openSettingsAndScrollToFilters() {
    const storageKey = 'calendarSettings/event-filters';

    if (calendarSettings.isCollapsibleSectionCollapsed(storageKey)) {
        calendarSettings.toggleCollapsibleSection(storageKey);
    }

    openSettings();

    nextTick(() => {
        setTimeout(() => {
            const element = document.getElementById('event-type-filters-section');
            element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 350); // Wait for offcanvas slide-in animation (300ms + buffer)
    });
}

function handleHideByType(eventType: EventTypeKey) {
    hideEventTypeWithToast(eventType);
}

function handleHideById(eventId: string, eventName: string) {
    const event = hideEventModal.currentEvent.value;
    if (event) {
        hideEventByIdWithToast(eventId, eventName, event);
    }
}

// Overlays: body-scroll lock + Escape handling
// Lock body scroll on touch devices while an overlay is open; useScrollLock
// restores the original overflow automatically when the component unmounts.
const isBodyScrollLocked = useScrollLock(document.body);
watchEffect(() => {
    const isOverlayOpen = calendarSettings.optionsExpanded || !!selectedEventId.value;
    isBodyScrollLocked.value = isOverlayOpen && isTouchDevice.value;
});

function handleGlobalKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || event.defaultPrevented) {
        return;
    }

    // Close visible tooltips first so Escape dismisses the top-most UI layer.
    if (document.querySelector('.v-popper__popper--shown')) {
        hideAllPoppers();
        return;
    }

    if (!calendarSettings.optionsExpanded) {
        return;
    }

    // Let higher-priority overlays and native color pickers handle Escape first.
    const hasBlockingOverlay =
        hideEventModal.showModal.value || editColorModal.showModal.value || addToCalendarModal.showModal.value || !!selectedEventId.value;
    if (hasBlockingOverlay) {
        return;
    }

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLInputElement && activeElement.type === 'color') {
        return;
    }

    closeSettings();
}

// useEventListener auto-removes the handler on unmount.
useEventListener(window, 'keydown', handleGlobalKeydown);
</script>

<style scoped>
/* Sidebar Layout */
.page-layout {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

/* In vertical layout, calendar comes first */
.timeline-wrapper {
    order: 2;
}

.calendar-wrapper {
    order: 1;
}

@media (min-width: 1400px) {
    .page-layout.sidebar-layout {
        flex-direction: row;
        gap: 1rem;
        align-items: flex-start;
        transition: gap 0.3s ease;
    }

    /* Remove gap when timeline is collapsed */
    .page-layout.sidebar-layout:has(.timeline-wrapper.sidebar-collapsed) {
        gap: 0;
    }

    /* In sidebar layout, calendar comes first (left), timeline second (right) */
    .page-layout.sidebar-layout .calendar-wrapper {
        order: 1;
    }

    .page-layout.sidebar-layout .timeline-wrapper {
        order: 2;
    }

    .timeline-wrapper {
        flex-shrink: 0;
        width: 425px;
        transition: width 0.3s ease;
        position: sticky;
        top: var(--navbar-height-scrolled);
        align-self: flex-start;
    }

    .timeline-wrapper.sidebar-collapsed {
        width: 0;
    }

    .timeline-content {
        height: calc(100dvh - var(--navbar-height-scrolled) - 0.3rem);
        overflow-y: auto;
        overflow-x: hidden;
        padding-right: 6px;
    }

    /* Custom scrollbar for timeline sidebar */
    .timeline-content::-webkit-scrollbar {
        width: 6px;
    }

    .timeline-content::-webkit-scrollbar-track {
        background: transparent;
    }

    .timeline-content::-webkit-scrollbar-thumb {
        background: var(--bs-border-color);
        border-radius: 3px;
    }

    .timeline-content::-webkit-scrollbar-thumb:hover {
        background: var(--bs-secondary-color);
    }

    .calendar-wrapper {
        flex: 1;
        min-width: 0;
    }
}
</style>
