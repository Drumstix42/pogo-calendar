import dayjs, { type Dayjs } from 'dayjs';
import { computed } from 'vue';

import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventsStore } from '@/stores/events';
import { formatEventName } from '@/utils/eventName';
import { getRaidScheduleBossesForDate, getRaidScheduleSectionsForDate } from '@/utils/eventRaidHours';
import { buildFullRaidScheduleDaySections } from '@/utils/eventTooltipSchedule';
import {
    type MajorCalendarEventVariant,
    type PogoEvent,
    getMajorCalendarEventVariant,
    getRaidSubType,
    isEventWithSubtype,
    isMajorCalendarEventType,
} from '@/utils/eventTypes';
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

        return sections
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

    function isShadowRaidEvent(event: PogoEvent) {
        return getRaidSubType(event) === 'shadow-raids';
    }

    function isMajorEvent(event: PogoEvent) {
        return isMajorCalendarEventType(event.eventType);
    }

    function getMajorVariant(event: PogoEvent): MajorCalendarEventVariant {
        if (!isMajorEvent(event)) {
            return 'location-specific';
        }

        return getMajorCalendarEventVariant(event);
    }

    function getMajorTooltipClass(event: PogoEvent) {
        if (!isMajorEvent(event)) {
            return undefined;
        }

        return {
            'major-tooltip-event': true,
            'major-tooltip-global': getMajorVariant(event) === 'global',
            'major-tooltip-location': getMajorVariant(event) === 'location-specific',
        };
    }

    const isShadowRaid = computed(() => {
        return isShadowRaidEvent(props.event);
    });

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
        isShadowRaidEvent,
        getMajorTooltipClass,
        isShadowRaid,
        tierGroupsWithImages,
        scheduleSectionsWithTierGroups,
        scheduleTargetDayName,
        highlightDayOfWeek,
    };
}
