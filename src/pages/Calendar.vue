<template>
    <div class="container app-container">
        <div class="page-layout" :class="{ 'sidebar-layout': isXxlScreenSize }">
            <!-- Calendar Section -->
            <div class="calendar-wrapper pt-1">
                <CollapsibleSection title="Calendar" storage-key="main/calendar-section" class="calendar-section" :hide-header="isXxlScreenSize">
                    <template #icon>
                        <CalendarRange :size="18" />
                    </template>
                    <!-- Month Navigation Header -->
                    <CalendarHeader />

                    <!-- Calendar Grid Component -->
                    <!-- Main Calendar Grid -->
                    <CalendarGrid />

                    <!-- Filter Summary Button -->
                    <div v-if="eventFilter.disabledEventTypeKeys.length > 0 || eventFilter.hiddenEventIds.length > 0" class="filter-summary">
                        <VTooltip placement="top" :delay="{ show: 50, hide: 0 }" distance="10" class="d-flex align-items-center ms-1">
                            <template #popper>
                                <div class="tooltip-text">Click to open Settings</div>
                            </template>
                            <button class="btn btn-icon-ghost" @click="openSettingsAndScrollToFilters" aria-label="Open settings to modify filters">
                                <EyeOff :size="12" class="me-2" />
                                <span class="filter-summary-text">
                                    <span v-if="eventFilter.disabledEventTypeKeys.length > 0">
                                        {{ eventFilter.disabledEventTypeKeys.length }} event type{{
                                            eventFilter.disabledEventTypeKeys.length === 1 ? '' : 's'
                                        }}
                                        hidden
                                    </span>
                                    <span v-if="eventFilter.disabledEventTypeKeys.length > 0 && eventFilter.hiddenEventIds.length > 0"> • </span>
                                    <span v-if="eventFilter.hiddenEventIds.length > 0">
                                        {{ eventFilter.hiddenEventIds.length }} specific event{{ eventFilter.hiddenEventIds.length === 1 ? '' : 's' }}
                                        hidden
                                    </span>
                                </span>
                            </button>
                        </VTooltip>
                    </div>
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

        <!-- Footer Disclaimer -->
        <footer class="disclaimer-footer">
            <p class="disclaimer-text">
                This website is not affiliated with
                <a class="link-secondary" href="https://pokemongo.com/" target="_blank" rel="noopener noreferrer">Pokémon GO</a> and is intended to
                fall under Fair Use doctrine, similar to any other informational site such as a wiki. Pokémon and its trademarks are ©1995-2025
                Nintendo, Creatures, and GAMEFREAK. <br />All images and names are owned and trademarked by Nintendo, Niantic, The Pokémon Company,
                and GAMEFREAK and are property of their respective owners.
            </p>

            <p class="disclaimer-text mt-2">
                Event data is powered by
                <a class="link-secondary" href="https://leekduck.com/" target="_blank" rel="noopener noreferrer">Leekduck</a> via
                <a class="link-secondary" href="https://github.com/bigfoott/ScrapedDuck" target="_blank" rel="noopener noreferrer">ScrapedDuck</a>.
            </p>

            <p class="disclaimer-text mt-2">
                This site does not use cookies, tracking, or advertisements of any kind. All preferences are stored within
                <a
                    class="link-secondary"
                    href="https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage"
                    target="_blank"
                    rel="noopener noreferrer"
                    >localStorage</a
                >
                in your browser.
            </p>
        </footer>

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

        <!-- Event Detail Offcanvas (Mobile) -->
        <Teleport to="body">
            <Transition name="offcanvas-fade">
                <div v-if="selectedEventId && isMobile && !eventsStore.loading" class="event-detail-backdrop" @click="handleEventDetailBackdropClick">
                    <div class="offcanvas offcanvas-bottom show event-detail-offcanvas" @click.stop>
                        <EventDetailOffcanvas :event="selectedEvent" :is-single-day="selectedEventIsSingleDay" @close="handleCloseEventDetail" />
                    </div>
                </div>
            </Transition>
        </Teleport>

        <!-- Hide Event Modal -->
        <HideEventModal
            v-if="hideEventModal.currentEvent.value"
            :show="hideEventModal.showModal.value"
            :event="hideEventModal.currentEvent.value"
            @close="hideEventModal.closeModal"
            @hide-by-type="handleHideByType"
            @hide-by-id="handleHideById"
        />
    </div>
</template>

<script setup lang="ts">
import { breakpointsBootstrapV5, useBreakpoints } from '@vueuse/core';
import { CalendarRange, EyeOff, PanelTop } from 'lucide-vue-next';
import { computed, nextTick, onMounted, onUnmounted, watch, watchEffect } from 'vue';

import { useEventFilterToasts } from '@/composables/useEventFilterToasts';
import { useHideEventModal } from '@/composables/useHideEventModal';
import { useUrlSync } from '@/composables/useUrlSync';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventFilterStore } from '@/stores/eventFilter';
import { useEventsStore } from '@/stores/events';
import { type EventTypeKey, isSameDayEvent } from '@/utils/eventTypes';

import CalendarGrid from '@/components/Calendar/CalendarGrid.vue';
import CalendarHeader from '@/components/Calendar/CalendarHeader.vue';
import EventDetailOffcanvas from '@/components/Calendar/EventDetailOffcanvas.vue';
/* import CalendarMobile from '@/components/Calendar/CalendarMobile.vue'; */
import EventTimeline from '@/components/Calendar/EventTimeline.vue';
import HideEventModal from '@/components/Calendar/HideEventModal.vue';
import CalendarOptions from '@/components/CalendarOptions/CalendarOptions.vue';
import CollapsibleSection from '@/components/CollapsibleSection.vue';

const eventsStore = useEventsStore();
const calendarSettings = useCalendarSettingsStore();
const eventFilter = useEventFilterStore();
const hideEventModal = useHideEventModal();
const { hideEventTypeWithToast, hideEventByIdWithToast } = useEventFilterToasts();
const { settingsOpen, openSettings, closeSettings, selectedEventId, clearEvent } = useUrlSync();

// responsive breakpoints https://getbootstrap.com/docs/5.0/layout/breakpoints/#available-breakpoints
const breakpoints = useBreakpoints(breakpointsBootstrapV5);
const isMobile = breakpoints.smaller('md'); // < 768px
const isXxlScreenSize = breakpoints.greaterOrEqual('xxl'); // >= 1400px
// const isDesktop = breakpoints.greaterOrEqual('md'); // >= 768px

// Sync settings with URL - delay initial sync to allow animation
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

// Get selected event details
const selectedEvent = computed(() => {
    if (!selectedEventId.value) return undefined;
    return eventsStore.events.find(e => e.eventID === selectedEventId.value);
});

const selectedEventIsSingleDay = computed(() => {
    if (!selectedEvent.value) return false;
    return isSameDayEvent(selectedEvent.value);
});

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

const handleCloseOptions = () => {
    closeSettings();
};

const handleBackdropClick = () => {
    closeSettings();
};

const handleCloseEventDetail = () => {
    clearEvent();
};

const handleEventDetailBackdropClick = () => {
    clearEvent();
};

function handleHideByType(eventType: EventTypeKey) {
    hideEventTypeWithToast(eventType);
}

function handleHideById(eventId: string, eventName: string) {
    const event = hideEventModal.currentEvent.value;
    if (event) {
        hideEventByIdWithToast(eventId, eventName, event);
    }
}

watchEffect(() => {
    const isOptionsOpen = calendarSettings.optionsExpanded;
    const isEventDetailOpen = !!selectedEventId.value;
    const isMobileSize = isMobile.value;

    if ((isOptionsOpen || isEventDetailOpen) && isMobileSize) {
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

/* Event Detail Offcanvas (Bottom Drawer) */
.event-detail-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1070;
    display: flex;
    align-items: flex-end;
    backdrop-filter: blur(2px);
}

.event-detail-offcanvas {
    position: relative;
    width: 100%;
    min-height: min(max(310px, 45vh), 80vh);
    border: none;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
    background-color: var(--bs-body-bg);
    display: flex;
    flex-direction: column;
    /* iOS safe area support */
    padding-bottom: env(safe-area-inset-bottom);
}

/* Bottom offcanvas slide-up animation */
.offcanvas-fade-enter-active .event-detail-offcanvas {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.offcanvas-fade-enter-from .event-detail-offcanvas {
    transform: translateY(100%);
}

.offcanvas-fade-enter-to .event-detail-offcanvas {
    transform: translateY(0);
}

.offcanvas-fade-leave-active .event-detail-offcanvas {
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.6, 1);
}

.offcanvas-fade-leave-from .event-detail-offcanvas {
    transform: translateY(0);
}

.offcanvas-fade-leave-to .event-detail-offcanvas {
    transform: translateY(100%);
}

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
        height: calc(100dvh - var(--navbar-height-scrolled) - 0.5rem);
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

.filter-summary {
    display: flex;
    justify-content: center;
    margin-top: 0.5rem;
}

.filter-summary-text {
    font-size: 0.7rem;
    font-style: italic;
    color: var(--bs-secondary-color);
}

.disclaimer-footer {
    margin-top: 2rem;
    padding: 1.5rem 0;
    text-align: center;
    border-top: 1px solid var(--bs-border-color);
}

.disclaimer-text {
    margin: 0;
    font-size: 0.75rem;
    color: var(--bs-secondary-color);
    line-height: 1.5;
}
</style>
