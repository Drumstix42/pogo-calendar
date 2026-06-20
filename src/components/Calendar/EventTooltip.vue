<template>
    <div class="event-tooltip" :class="{ 'is-scrollable': scrollable }">
        <div
            class="event-tooltip-type"
            :style="{
                backgroundColor: eventsStore.eventMetadata[event.eventID]?.color,
                borderLeftColor: `color-mix(in srgb, ${eventsStore.eventMetadata[event.eventID]?.color} 70%, black)`,
            }"
        >
            <span class="event-type-name">{{ getEventTypeName(event) }}</span>
            <VTooltip :disabled="isTouchDevice" placement="top" :delay="{ show: 50, hide: 0 }" distance="10" class="d-flex align-items-center">
                <template #popper>
                    <div class="tooltip-text">Customize event type color</div>
                </template>
                <button type="button" class="tooltip-color-edit-btn" :title="`Customize ${getEventTypeName(event)} color`" @click="openColorModal">
                    <Palette :size="13" />
                </button>
            </VTooltip>
            <EventToggleButton :event-type="event.eventType" @hide="openHideModal" />
        </div>

        <div class="event-tooltip-body">
            <!-- Show individual events if grouped -->
            <div v-if="(event as any)._isGrouped" class="grouped-events">
                <div
                    v-for="groupedEvent in getGroupedEvents(event)"
                    :key="groupedEvent.eventID"
                    class="event-time-info"
                    :class="getMajorTooltipClass(groupedEvent)"
                >
                    <div class="event-content">
                        <!-- Event text content -->
                        <div class="event-text">
                            <div v-if="groupedEvent.extraData?.parentEventId" class="parent-event-name">{{ getParentEventName(groupedEvent) }}</div>
                            <div class="grouped-event-name">{{ formatEventName(groupedEvent.name) }}</div>
                            <EventTimeDisplay :event="groupedEvent" />
                            <div v-if="groupedEvent.link" class="lh-1">
                                <a
                                    :href="groupedEvent.link"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="link-secondary link-underline-opacity-0 link-underline-opacity-100-hover d-inline-flex align-items-center gap-1"
                                    style="font-size: 0.7rem"
                                >
                                    View on LeekDuck <ExternalLink :size="11" />
                                </a>
                            </div>
                        </div>

                        <PokemonEventImages
                            v-if="!getTierGroupsWithImagesForEvent(groupedEvent)"
                            :event="groupedEvent"
                            :event-name="formatEventName(groupedEvent.name)"
                            :height="50"
                            :use-animated="calendarSettings.useAnimatedImages"
                            :show-tooltips="true"
                            :show-c-p="true"
                            :wrap="true"
                        />

                        <div v-if="getScheduleSectionsWithTierGroupsForEvent(groupedEvent)?.length" class="raid-boss-tiers">
                            <div
                                v-for="section in getScheduleSectionsWithTierGroupsForEvent(groupedEvent)"
                                :key="`${groupedEvent.eventID}-${section.id}`"
                                class="schedule-section"
                            >
                                <div class="schedule-section-header" :class="{ 'is-all-day': section.isAllDay }">
                                    <span
                                        v-if="section.label"
                                        class="schedule-label"
                                        :style="getScheduleLabelStyle(section.label, section.isAllDay)"
                                        >{{ section.label }}</span
                                    >
                                    <span v-else class="schedule-label" :style="getScheduleLabelStyle(undefined, section.isAllDay)">{{
                                        section.isAllDay
                                            ? scheduleTargetDayName
                                                ? `All Day (${scheduleTargetDayName})`
                                                : 'All Day'
                                            : scheduleTargetDayName
                                              ? `Scheduled (${scheduleTargetDayName})`
                                              : 'Scheduled'
                                    }}</span>
                                    <span v-if="section.time" class="schedule-time">
                                        {{ scheduleTargetDayName ? `${scheduleTargetDayName} · ${section.time}` : section.time }}
                                    </span>
                                </div>
                                <div
                                    class="tier-group"
                                    v-for="group in section.tierGroups"
                                    :key="`${groupedEvent.eventID}-${section.id}-${group.label}`"
                                >
                                    <div v-if="group.showLabel" class="tier-label">{{ group.label }}</div>
                                    <div class="tier-images">
                                        <PokemonImage
                                            v-for="boss in group.images"
                                            :key="boss.name"
                                            :pokemon-data="boss"
                                            :height="50"
                                            :use-animated="calendarSettings.useAnimatedImages"
                                            :show-tooltip="true"
                                            :show-c-p="true"
                                            :event-type="groupedEvent.eventType"
                                            :is-shadow="isShadowRaidEvent(groupedEvent)"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-else-if="getTierGroupsWithImagesForEvent(groupedEvent)" class="raid-boss-tiers">
                            <div
                                v-for="group in getTierGroupsWithImagesForEvent(groupedEvent)"
                                :key="`${groupedEvent.eventID}-${group.label}`"
                                class="tier-group"
                            >
                                <div v-if="group.showLabel" class="tier-label">{{ group.label }}</div>
                                <div class="tier-images">
                                    <PokemonImage
                                        v-for="boss in group.images"
                                        :key="boss.name"
                                        :pokemon-data="boss"
                                        :height="50"
                                        :use-animated="calendarSettings.useAnimatedImages"
                                        :show-tooltip="true"
                                        :show-c-p="true"
                                        :event-type="groupedEvent.eventType"
                                        :is-shadow="isShadowRaidEvent(groupedEvent)"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Show time for single events -->
            <div class="event-time-info" :class="getMajorTooltipClass(event)">
                <div class="event-content">
                    <!-- Event text content -->
                    <div class="event-text">
                        <div v-if="event.extraData?.parentEventId" class="parent-event-name">{{ parentEventName }}</div>
                        <div class="grouped-event-name">{{ formatEventName(event.name) }}</div>
                        <EventTimeDisplay :event="event" />
                    </div>

                    <PokemonEventImages
                        v-if="!tierGroupsWithImages"
                        :event="event"
                        :event-name="formatEventName(event.name)"
                        :height="60"
                        :use-animated="calendarSettings.useAnimatedImages"
                        :show-placeholder="isSingleDay"
                        :show-tooltips="true"
                        :show-c-p="true"
                        :wrap="true"
                    />
                </div>
            </div>

            <div class="event-extras-wrapper">
                <EventExtras :event="event" />
            </div>

            <!-- Raid boss tier groups -->
            <div v-if="scheduleDaySectionsWithTierGroups?.length" class="raid-boss-tiers">
                <div v-for="daySection in scheduleDaySectionsWithTierGroups" :key="daySection.id" class="schedule-day-section">
                    <div class="schedule-day-header">{{ daySection.date }}</div>

                    <div v-for="section in daySection.sections" :key="section.id" class="schedule-section">
                        <div class="schedule-section-header" :class="{ 'is-all-day': section.isAllDay }">
                            <span class="schedule-label">{{ section.labelText }}</span>
                            <span v-if="section.time" class="schedule-time">{{ section.time }}</span>
                        </div>

                        <div v-for="group in section.tierGroups" :key="`${section.id}-${group.label}`" class="tier-group">
                            <div v-if="group.showLabel" class="tier-label">{{ group.label }}</div>
                            <div class="tier-images">
                                <PokemonImage
                                    v-for="boss in group.images"
                                    :key="boss.name"
                                    :pokemon-data="boss"
                                    :height="60"
                                    :use-animated="calendarSettings.useAnimatedImages"
                                    :show-tooltip="true"
                                    :show-c-p="true"
                                    :event-type="event.eventType"
                                    :is-shadow="isShadowRaid"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else-if="scheduleSectionsWithTierGroups?.length" class="raid-boss-tiers">
                <div v-for="section in scheduleSectionsWithTierGroups" :key="section.id" class="schedule-section">
                    <div class="schedule-section-header" :class="{ 'is-all-day': section.isAllDay }">
                        <span v-if="section.label" class="schedule-label" :style="getScheduleLabelStyle(section.label, section.isAllDay)">{{
                            section.label
                        }}</span>
                        <span v-else class="schedule-label" :style="getScheduleLabelStyle(undefined, section.isAllDay)">{{
                            section.isAllDay
                                ? scheduleTargetDayName
                                    ? `All Day (${scheduleTargetDayName})`
                                    : 'All Day'
                                : scheduleTargetDayName
                                  ? `Scheduled (${scheduleTargetDayName})`
                                  : 'Scheduled'
                        }}</span>
                        <span v-if="section.time" class="schedule-time">
                            {{ scheduleTargetDayName ? `${scheduleTargetDayName} · ${section.time}` : section.time }}
                        </span>
                    </div>
                    <div v-for="group in section.tierGroups" :key="`${section.id}-${group.label}`" class="tier-group">
                        <div v-if="group.showLabel" class="tier-label">{{ group.label }}</div>
                        <div class="tier-images">
                            <PokemonImage
                                v-for="boss in group.images"
                                :key="boss.name"
                                :pokemon-data="boss"
                                :height="60"
                                :use-animated="calendarSettings.useAnimatedImages"
                                :show-tooltip="true"
                                :show-c-p="true"
                                :event-type="event.eventType"
                                :is-shadow="isShadowRaid"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div v-else-if="tierGroupsWithImages" class="raid-boss-tiers">
                <div v-for="group in tierGroupsWithImages" :key="group.label" class="tier-group">
                    <div v-if="group.showLabel" class="tier-label">{{ group.label }}</div>
                    <div class="tier-images">
                        <PokemonImage
                            v-for="boss in group.images"
                            :key="boss.name"
                            :pokemon-data="boss"
                            :height="60"
                            :use-animated="calendarSettings.useAnimatedImages"
                            :show-tooltip="true"
                            :show-c-p="true"
                            :event-type="event.eventType"
                            :is-shadow="isShadowRaid"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showBottomLink && event.link && !(event as any)._isGrouped" class="event-bottom-link">
            <a
                :href="event.link"
                target="_blank"
                rel="noopener noreferrer"
                class="link-neutral link-underline-opacity-0 link-underline-opacity-100-hover d-inline-flex align-items-center gap-1"
                style="font-size: 0.75rem"
            >
                View on LeekDuck <ExternalLink :size="12" />
            </a>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ExternalLink, Palette } from '@lucide/vue';
import dayjs, { type Dayjs } from 'dayjs';
import { hideAllPoppers } from 'floating-vue';
import { computed, nextTick } from 'vue';

import { useDeviceDetection } from '@/composables/useDeviceDetection';
import { useEditColorModal } from '@/composables/useEditColorModal';
import { useHideEventModal } from '@/composables/useHideEventModal';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventsStore } from '@/stores/events';
import { formatEventName } from '@/utils/eventName';
import { getRaidScheduleBossesForDate, getRaidScheduleSectionsForDate } from '@/utils/eventRaidHours';
import {
    type MajorCalendarEventVariant,
    type PogoEvent,
    type PokemonBoss,
    getEventTypeInfo,
    getGroupedEvents,
    getMajorCalendarEventVariant,
    getRaidSubType,
    isEventWithSubtype,
    isMajorCalendarEventType,
} from '@/utils/eventTypes';
import { buildRaidTierGroupsWithImages } from '@/utils/raidTierGroups';

import EventExtras from './EventExtras.vue';
import EventTimeDisplay from './EventTimeDisplay.vue';
import EventToggleButton from './EventToggleButton.vue';
import PokemonEventImages from './PokemonEventImages.vue';
import PokemonImage from './PokemonImage.vue';

interface Props {
    event: PogoEvent;
    isSingleDay?: boolean;
    targetDate?: Dayjs | string | Date;
    showBottomLink?: boolean;
    scrollable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    isSingleDay: false,
    targetDate: undefined,
    showBottomLink: true,
    scrollable: true,
});

const calendarSettings = useCalendarSettingsStore();
const hideEventModal = useHideEventModal();
const editColorModal = useEditColorModal();
const eventsStore = useEventsStore();
const { isTouchDevice } = useDeviceDetection();

function openColorModal() {
    editColorModal.openModal(props.event.eventType);
}

function openHideModal() {
    hideEventModal.openModal(props.event);
    // Hide tooltip after a short delay to ensure it closes even with mouse still hovering
    nextTick(() => {
        setTimeout(() => {
            hideAllPoppers();
        }, 50);
    });
}

const getEventTypeName = (event: PogoEvent): string => {
    return getEventTypeInfo(event.eventType).name;
};

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

function sortTierLabel(a: string, b: string): number {
    const normalizedA = a.trim().toLowerCase();
    const normalizedB = b.trim().toLowerCase();

    if (normalizedA === 'super mega' && normalizedB !== 'super mega') return -1;
    if (normalizedB === 'super mega' && normalizedA !== 'super mega') return 1;

    const tierA = a.match(/^Tier (\d+)$/i);
    const tierB = b.match(/^Tier (\d+)$/i);
    if (tierA && tierB) return parseInt(tierA[1]) - parseInt(tierB[1]);
    if (tierA) return -1;
    if (tierB) return 1;
    return a.localeCompare(b);
}

function buildTierGroupsFromBosses(bosses: PokemonBoss[]) {
    if (!bosses || bosses.length === 0) {
        return undefined;
    }

    const tierMap = new Map<string, PokemonBoss[]>();
    bosses.forEach(boss => {
        const label = boss.raidType || 'Other';
        if (!tierMap.has(label)) {
            tierMap.set(label, []);
        }
        tierMap.get(label)!.push(boss);
    });

    return Array.from(tierMap.entries())
        .sort(([a], [b]) => sortTierLabel(a, b))
        .map(([label, groupedBosses]) => ({
            label,
            bosses: groupedBosses,
        }));
}

type TooltipScheduleSection = {
    id: string;
    labelText: string;
    time?: string;
    isAllDay: boolean;
    sortKey: number;
    tierGroups: NonNullable<ReturnType<typeof buildRaidTierGroupsWithImages>>;
};

type TooltipScheduleDaySection = {
    id: string;
    date: string;
    sections: TooltipScheduleSection[];
};

function buildFullRaidScheduleDaySections(event: PogoEvent) {
    const raidSchedule = event.extraData?.raidSchedule;
    if (!raidSchedule?.length) {
        return undefined;
    }

    const daySectionMap = new Map<string, TooltipScheduleDaySection>();
    const orderedDates: string[] = [];

    function ensureDaySection(date: string | undefined, scheduleIndex: number) {
        const normalizedDate = (date ?? '').trim() || 'Scheduled Day';
        if (!daySectionMap.has(normalizedDate)) {
            daySectionMap.set(normalizedDate, {
                id: `schedule-day-${scheduleIndex}-${normalizedDate}`,
                date: normalizedDate,
                sections: [],
            });
            orderedDates.push(normalizedDate);
        }

        return daySectionMap.get(normalizedDate)!;
    }

    function appendScheduleSection(
        daySection: TooltipScheduleDaySection,
        id: string,
        labelText: string,
        time: string | undefined,
        isAllDay: boolean,
        bosses: PokemonBoss[],
    ) {
        const tierGroups = buildTierGroupsFromBosses(bosses);
        const tierGroupsWithImages = buildRaidTierGroupsWithImages(tierGroups, calendarSettings.useAnimatedImages);

        if (!tierGroupsWithImages?.length) {
            return;
        }

        daySection.sections.push({
            id,
            labelText,
            time,
            isAllDay,
            sortKey: isAllDay ? -1 : 0,
            tierGroups: tierGroupsWithImages,
        });
    }

    raidSchedule.forEach((schedule: NonNullable<PogoEvent['extraData']>['raidSchedule'][number], scheduleIndex) => {
        const daySection = ensureDaySection(schedule.date, scheduleIndex);

        if (schedule.bosses?.length) {
            const isAllDay = !schedule.time;
            appendScheduleSection(
                daySection,
                `schedule-${scheduleIndex}`,
                schedule.label?.trim() || (isAllDay ? 'All Day' : 'Scheduled'),
                schedule.time?.trim() || undefined,
                isAllDay,
                schedule.bosses,
            );
        }
        // Raid-hour rows are shown by generated pseudo events, not the parent event.
    });

    const daySections = orderedDates
        .map(date => {
            const daySection = daySectionMap.get(date);
            if (!daySection || daySection.sections.length === 0) {
                return undefined;
            }

            daySection.sections.sort((a, b) => {
                if (a.isAllDay !== b.isAllDay) {
                    return a.isAllDay ? -1 : 1;
                }
                if (a.sortKey !== b.sortKey) {
                    return a.sortKey - b.sortKey;
                }
                return a.labelText.localeCompare(b.labelText);
            });

            return daySection;
        })
        .filter((section): section is TooltipScheduleDaySection => Boolean(section));

    return daySections.length > 0 ? daySections : undefined;
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

    return buildFullRaidScheduleDaySections(props.event);
});

function getScheduleLabelStyle(_label?: string, isAllDay: boolean = false) {
    if (isAllDay) {
        return {
            color: '#2b9a47',
            borderBottomColor: 'rgba(43, 154, 71, 0.45)',
        };
    }

    return {
        color: '#3f86cc',
        borderBottomColor: 'rgba(63, 134, 204, 0.46)',
    };
}

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
</script>

<style scoped>
.event-tooltip {
    max-width: 350px;
    min-width: 200px;
    padding: 0rem;
    display: flex;
    flex-direction: column;
}

.event-tooltip.is-scrollable {
    max-height: min(45dvh, 520px);
}

.event-tooltip-body {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.event-tooltip.is-scrollable .event-tooltip-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
}

.event-tooltip-type {
    font-size: 0.8rem;
    line-height: 1.2;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 0.25rem;
    padding: 0.4rem 0.6rem 0.4rem 0.5rem;
    border-radius: 4px;
    border-left: 3px solid;
    text-shadow: 1px 2px 2px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    gap: 8px;
}

.tooltip-color-edit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3px;
    border: none;
    border-radius: 3px;
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.tooltip-color-edit-btn:hover {
    background-color: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
}

.tooltip-color-edit-btn:active {
    transform: scale(0.95);
}

.event-time-info {
    margin-bottom: 0.4rem;
    padding: 0.4rem 0.6rem 0.4rem 0.5rem;
    border-radius: 4px;
}

.event-time-info.major-tooltip-event {
    position: relative;
}

.event-time-info.major-tooltip-event::after {
    content: '';
    position: absolute;
    right: 1px;
    bottom: 0;
    width: 56px;
    height: 56px;
    pointer-events: none;
    opacity: 0.22;
    background-color: color-mix(in srgb, var(--bs-body-color) 62%, transparent);
    mask-repeat: no-repeat;
    mask-position: center;
    mask-size: contain;
    z-index: 0;
}

@media (min-width: 768px) {
    .event-time-info.major-tooltip-event::after {
        right: 2px;
        bottom: 0;
        width: 68px;
        height: 68px;
    }
}

@media (min-width: 1200px) {
    .event-time-info.major-tooltip-event::after {
        right: 3px;
        bottom: -1px;
        width: 74px;
        height: 74px;
    }
}

.event-time-info.major-tooltip-global::after {
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M2 12h20'/%3E%3Cpath d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'/%3E%3C/svg%3E");
}

.event-time-info.major-tooltip-location::after {
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 1 1 16 0'/%3E%3Ccircle cx='12' cy='10' r='3'/%3E%3C/svg%3E");
}

[data-bs-theme='dark'] .event-time-info.major-tooltip-event::after {
    opacity: 0.26;
    background-color: color-mix(in srgb, var(--bs-body-color) 70%, transparent);
}

.event-content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    position: relative;
    z-index: 1;
}

.event-text {
    width: 100%;
}

.event-time-info:last-child {
    margin-bottom: 0;
}

.grouped-events {
    margin-top: 0.6rem;
}

.grouped-event-name {
    font-size: 0.975rem;
    font-weight: 400;
    line-height: 1.3;
    color: color-mix(in srgb, var(--bs-body-color) 90%, transparent);
    margin-bottom: 0.7rem;
}

.parent-event-name {
    font-size: 0.7rem;
    font-weight: 600;
    font-style: italic;
    color: color-mix(in srgb, var(--bs-body-color) 60%, transparent);
    line-height: 1.1;
    margin-bottom: 2px;
}

.event-extras-wrapper {
    padding-left: 0.5rem;
}

.event-bottom-link {
    padding: 0 0.5rem;
}

.schedule-day-header {
    font-size: 0.925rem;
    text-transform: uppercase;
    font-weight: 700;
    line-height: 1.5;
    letter-spacing: 0.05em;
    color: color-mix(in srgb, var(--bs-body-color) 82%, transparent);
    padding: 0 0.1rem;
    position: sticky;
    top: 0;
    z-index: 11;
}

.raid-boss-tiers {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.4rem 0.6rem 0.4rem 0.5rem;

    .schedule-section {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        margin-bottom: 0.1rem;
    }

    .schedule-section-header {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.35rem;
        padding-top: 0.2rem;
        position: sticky;
        top: 0;
        z-index: 10;
    }

    .schedule-label {
        display: block;
        align-items: center;
        width: 100%;
        font-size: 0.82rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        line-height: 1.2;
        padding: 0.12rem 0 0.34rem 0;
        margin-bottom: 0.05rem;
        color: color-mix(in srgb, var(--bs-body-color) 82%, transparent);
        border-bottom: 1px solid color-mix(in srgb, var(--bs-body-color) 22%, transparent);
        text-shadow: none;
    }

    :global([data-bs-theme='dark']) & .schedule-label {
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
    }

    .schedule-section-header.is-all-day .schedule-label {
        color: color-mix(in srgb, #0f5132 88%, var(--bs-body-color));
        border-bottom-color: color-mix(in srgb, #198754 40%, transparent);
    }

    .schedule-time {
        display: inline-flex;
        align-items: center;
        font-size: 0.66rem;
        font-weight: 600;
        letter-spacing: 0.01em;
        line-height: 1;
        border-radius: 999px;
        padding: 0.2rem 0.4rem;
        color: color-mix(in srgb, var(--bs-body-color) 56%, transparent);
        background: color-mix(in srgb, var(--bs-body-color) 4%, transparent);
        border: 1px solid color-mix(in srgb, var(--bs-body-color) 12%, transparent);
        margin-bottom: 0.24rem;
    }

    .schedule-section .tier-group {
        margin-bottom: 0.55rem;
    }

    .schedule-section .tier-group:last-child {
        margin-bottom: 0.2rem;
    }
}

.tier-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 0.75rem;
}

.tier-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: color-mix(in srgb, var(--bs-body-color) 70%, transparent);
}

.tier-images {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.event-tooltip.is-scrollable .schedule-section-header {
    background-color: var(--calendar-cell-bg);
}

.event-tooltip.is-scrollable .schedule-day-header {
    background-color: var(--calendar-cell-bg);
}

.event-tooltip:not(.is-scrollable) .schedule-section-header {
    background-color: var(--bs-body-bg);
    top: -1rem;
}

.event-tooltip:not(.is-scrollable) .schedule-day-header {
    background-color: var(--bs-body-bg);
    top: -1rem;
}
</style>
