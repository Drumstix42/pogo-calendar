import { breakpointsBootstrapV5, useBreakpoints } from '@vueuse/core';
import { computed } from 'vue';

import { useAddToCalendarModal } from '@/composables/useAddToCalendarModal';
import { useDeviceDetection } from '@/composables/useDeviceDetection';
import { useEditColorModal } from '@/composables/useEditColorModal';
import { useEventHighlightDebounce } from '@/composables/useEventHighlightDebounce';
import { useHideEventModal } from '@/composables/useHideEventModal';
import { useEventsStore } from '@/stores/events';
import { type MajorCalendarEventVariant, getMajorCalendarEventVariant, isMajorCalendarEventType } from '@/utils/eventMajor';
import { formatEventName } from '@/utils/eventName';
import { getEventPokemonImages, getEventSpriteEffect } from '@/utils/eventPokemon';
import { hasEventExtras } from '@/utils/eventSubtype';
import { type PogoEvent, getEventTypeInfo } from '@/utils/eventTypes';
import { buildRaidTierGroupsWithImages } from '@/utils/raidTierGroups';
import { buildCollapsedScheduleDayGroups, buildTimelineScheduleDaySectionsWithTierGroups } from '@/utils/timelineSchedule';

interface TimelineEventProps {
    event: PogoEvent;
    isActive: boolean;
}

type TimelineEventEmit = (event: 'activate', eventId: string) => void;

// Display state and interaction handlers for a single TimelineEvent card. Derived data
// (schedule/tier building) lives in @/utils/timelineSchedule; this owns the reactive glue.
export function useTimelineEvent(props: TimelineEventProps, emit: TimelineEventEmit) {
    const hideEventModal = useHideEventModal();
    const editColorModal = useEditColorModal();
    const addToCalendarModal = useAddToCalendarModal();
    const eventsStore = useEventsStore();
    const { isTouchDevice } = useDeviceDetection();

    const breakpoints = useBreakpoints(breakpointsBootstrapV5);
    const isDesktopSidebar = breakpoints.greaterOrEqual('xxl'); // >= 1400px

    function openColorModal() {
        editColorModal.openModal(props.event.eventType);
    }

    function openAddToCalendarModal() {
        addToCalendarModal.openModal(props.event);
    }

    function toggleActive() {
        emit('activate', props.event.eventID);
    }

    function openHideModal() {
        hideEventModal.openModal(props.event);
    }

    // Only highlight/clear calendar events when desktop sidebar is visible
    const { debouncedHighlightEventID, debouncedClearEventIDHighlight } = useEventHighlightDebounce({
        guard: () => isDesktopSidebar.value,
    });

    // Event type color and name
    const eventColor = computed(() => {
        return eventsStore.eventMetadata[props.event.eventID]?.color;
    });

    const eventTypeName = computed(() => {
        return getEventTypeInfo(props.event.eventType).name;
    });

    const parentEventName = computed(() => {
        const parentId = props.event.extraData?.parentEventId;
        if (!parentId) return null;

        const parentEvent = eventsStore.getEventById(parentId);
        return parentEvent ? `${formatEventName(parentEvent.name)} /` : null;
    });

    const pokemonCount = computed(() => {
        return getEventPokemonImages(props.event).length;
    });

    const collapsedScheduleDayGroups = computed(() => {
        if (props.isActive) {
            return undefined;
        }

        return buildCollapsedScheduleDayGroups(props.event);
    });

    const hasPokemon = computed(() => {
        return pokemonCount.value > 0 || Boolean(collapsedScheduleDayGroups.value?.length);
    });

    const spriteEffect = computed(() => getEventSpriteEffect(props.event));

    const defaultTierGroupsWithImages = computed(() => {
        return buildRaidTierGroupsWithImages(eventsStore.eventMetadata[props.event.eventID]?.raidBossTierGroups, props.isActive);
    });

    const timelineScheduleDaySectionsWithTierGroups = computed(() => {
        return buildTimelineScheduleDaySectionsWithTierGroups(props.event, true);
    });

    const hasExpandedRaidSections = computed(() => {
        return Boolean(
            (timelineScheduleDaySectionsWithTierGroups.value && timelineScheduleDaySectionsWithTierGroups.value.length > 0) ||
            defaultTierGroupsWithImages.value,
        );
    });

    const showCollapsedScheduleDays = computed(() => {
        return !props.isActive && Boolean(collapsedScheduleDayGroups.value?.length);
    });

    const showInlinePokemonImages = computed(() => {
        return props.isActive ? !hasExpandedRaidSections.value : !collapsedScheduleDayGroups.value?.length;
    });

    const showPokemonRow = computed(() => {
        return hasPokemon.value && (showInlinePokemonImages.value || showCollapsedScheduleDays.value);
    });

    const hasExtras = computed(() => hasEventExtras(props.event));

    const isMajorTimelineEvent = computed(() => {
        return isMajorCalendarEventType(props.event.eventType);
    });

    const majorTimelineVariant = computed<MajorCalendarEventVariant>(() => {
        if (!isMajorTimelineEvent.value) {
            return 'location-specific';
        }

        return getMajorCalendarEventVariant(props.event);
    });

    return {
        isTouchDevice,
        openColorModal,
        openAddToCalendarModal,
        toggleActive,
        openHideModal,
        debouncedHighlightEventID,
        debouncedClearEventIDHighlight,
        eventColor,
        eventTypeName,
        parentEventName,
        pokemonCount,
        collapsedScheduleDayGroups,
        spriteEffect,
        defaultTierGroupsWithImages,
        timelineScheduleDaySectionsWithTierGroups,
        showCollapsedScheduleDays,
        showInlinePokemonImages,
        showPokemonRow,
        hasExtras,
        isMajorTimelineEvent,
        majorTimelineVariant,
    };
}
