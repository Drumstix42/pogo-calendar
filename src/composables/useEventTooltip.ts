import dayjs, { type Dayjs } from 'dayjs';
import { computed } from 'vue';

import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventsStore } from '@/stores/events';
import { formatEventName } from '@/utils/eventName';
import { getEventSpriteEffect } from '@/utils/eventPokemon';
import {
    EVENT_WIDE_RAIDS_LABEL,
    type RaidScheduleSection,
    getEventWideRaidBosses,
    getRaidScheduleBossesForDate,
    getRaidScheduleSectionsForDate,
} from '@/utils/eventRaidHours';
import { getRaidSubType, isEventWithSubtype } from '@/utils/eventSubtype';
import { buildFullRaidScheduleDaySections } from '@/utils/eventTooltipSchedule';
import { type PogoEvent } from '@/utils/eventTypes';
import { buildRaidTierGroupsWithImages, buildTierGroupsFromBosses } from '@/utils/raidTierGroups';

interface UseEventTooltipOptions {
    event: PogoEvent;
    targetDate?: Dayjs | string | Date;
}

/**
 * Schedule/tier-group resolution and tooltip display helpers, bound to the events + calendar-settings
 * stores. Accepts the reactive component props so its computeds track `event`/`targetDate`.
 */
export function useEventTooltip(props: UseEventTooltipOptions) {
    const calendarSettings = useCalendarSettingsStore();
    const eventsStore = useEventsStore();

    function lookupParentEventName(event: PogoEvent): string | null {
        const parentId = event.extraData?.parentEventId;
        if (!parentId) return null;

        const parentEvent = eventsStore.getEventById(parentId);
        return parentEvent ? `${formatEventName(parentEvent.name)} /` : null;
    }

    const parentEventName = computed(() => lookupParentEventName(props.event));

    function getParentEventName(event: PogoEvent): string | null {
        return lookupParentEventName(event);
    }

    function getTierGroupsWithImagesForEvent(event: PogoEvent) {
        if (props.targetDate && event.extraData?.raidSchedule?.length) {
            const scheduleBosses = getRaidScheduleBossesForDate(event, props.targetDate);
            if (scheduleBosses.length > 0) {
                const scheduleTierGroups = buildTierGroupsFromBosses(scheduleBosses);
                return buildRaidTierGroupsWithImages(scheduleTierGroups, calendarSettings.useAnimatedImages);
            }
        }

        return buildRaidTierGroupsWithImages(eventsStore.eventMetadata[event.eventID]?.raidBossTierGroups, calendarSettings.useAnimatedImages);
    }

    function getScheduleSectionsWithTierGroupsForEvent(event: PogoEvent) {
        if (!props.targetDate || !event.extraData?.raidSchedule?.length) {
            return undefined;
        }

        const sections = getRaidScheduleSectionsForDate(event, props.targetDate);
        if (sections.length === 0) {
            return undefined;
        }

        const eventWideBosses = getEventWideRaidBosses(event);
        const sectionsWithEventWide: RaidScheduleSection[] = eventWideBosses.length
            ? [
                  ...sections,
                  {
                      id: 'event-wide',
                      title: EVENT_WIDE_RAIDS_LABEL,
                      label: EVENT_WIDE_RAIDS_LABEL,
                      bosses: eventWideBosses,
                      isAllDay: true,
                      sortKey: Number.POSITIVE_INFINITY,
                  },
              ]
            : sections;

        return sectionsWithEventWide
            .map(section => {
                const tierGroups = buildTierGroupsFromBosses(section.bosses);
                const tierGroupsWithImages = buildRaidTierGroupsWithImages(tierGroups, calendarSettings.useAnimatedImages);

                return {
                    id: section.id,
                    title: section.title,
                    label: section.label,
                    time: section.time,
                    isAllDay: section.isAllDay,
                    tierGroups: tierGroupsWithImages ?? [],
                };
            })
            .filter(section => section.tierGroups.length > 0);
    }

    const shouldShowFullRaidSchedule = computed(() => {
        const raidSchedule = props.event.extraData?.raidSchedule;
        const uniqueScheduleDates = new Set(raidSchedule?.map(schedule => schedule.date?.trim()).filter((date): date is string => Boolean(date)));

        return (
            !!raidSchedule?.length &&
            uniqueScheduleDates.size > 1 &&
            (props.event.eventType === 'event' || isEventWithSubtype(props.event.eventType) || getRaidSubType(props.event) !== '')
        );
    });

    const scheduleDaySectionsWithTierGroups = computed(() => {
        if (!shouldShowFullRaidSchedule.value) {
            return undefined;
        }

        return buildFullRaidScheduleDaySections(props.event, calendarSettings.useAnimatedImages);
    });

    const spriteEffect = computed(() => getEventSpriteEffect(props.event));

    const tierGroupsWithImages = computed(() => {
        return getTierGroupsWithImagesForEvent(props.event);
    });

    const scheduleSectionsWithTierGroups = computed(() => {
        return getScheduleSectionsWithTierGroupsForEvent(props.event);
    });

    const scheduleTargetDayName = computed(() => {
        return props.targetDate ? dayjs(props.targetDate).format('dddd') : undefined;
    });

    // For season events, highlight the day-of-week the tooltip was opened from.
    const highlightDayOfWeek = computed<number | null>(() => {
        return props.targetDate ? dayjs(props.targetDate).day() : null;
    });

    return {
        parentEventName,
        getParentEventName,
        getTierGroupsWithImagesForEvent,
        getScheduleSectionsWithTierGroupsForEvent,
        scheduleDaySectionsWithTierGroups,
        spriteEffect,
        tierGroupsWithImages,
        scheduleSectionsWithTierGroups,
        scheduleTargetDayName,
        highlightDayOfWeek,
    };
}
