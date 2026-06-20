<template>
    <div
        class="timeline-event-card timeline-event"
        :class="{
            'is-active': props.isActive,
            'event-id-highlighted': eventHighlight.hoveredEventID === props.event.eventID,
            'major-timeline-event': isMajorTimelineEvent,
            'major-timeline-global': isMajorTimelineEvent && majorTimelineVariant === 'global',
            'major-timeline-location': isMajorTimelineEvent && majorTimelineVariant === 'location-specific',
        }"
        :data-event-type="event.eventType"
        :data-timeline-event-id="event.eventID"
        :style="{
            '--event-color': eventColor,
        }"
        @mouseenter="debouncedHighlightEventID(props.event.eventID)"
        @mouseleave="debouncedClearEventIDHighlight"
    >
        <!-- Event type badge, actions, and toggle (clickable header) -->
        <div class="event-header-bar" @click="toggleActive">
            <div class="event-header-actions">
                <div class="event-type-badge">
                    {{ eventTypeName }}
                </div>

                <!-- Action buttons (when expanded) -->
                <template v-if="props.isActive">
                    <VTooltip :disabled="isTouchDevice" placement="top" :delay="{ show: 50, hide: 0 }" distance="10">
                        <template #popper>
                            <div class="tooltip-text">Customize event type color</div>
                        </template>
                        <button type="button" class="timeline-color-edit-btn" @click.stop="openColorModal">
                            <Palette :size="13" />
                        </button>
                    </VTooltip>

                    <div @click.stop>
                        <EventToggleButton :event-type="event.eventType" @hide="openHideModal" />
                    </div>
                </template>
            </div>

            <!-- Expand/collapse button (top-right) -->
            <button type="button" class="expand-toggle" @click.stop="toggleActive">
                <component :is="props.isActive ? ChevronsDownUp : ChevronsUpDown" :size="16" />
            </button>
        </div>

        <!-- Event body -->
        <div class="event-body">
            <div v-if="event.extraData?.parentEventId" class="parent-event-name">{{ parentEventName }}</div>

            <div class="event-header-row" @click="toggleActive">
                <span class="event-name" :class="{ 'text-truncate': !props.isActive }">
                    {{ formatEventName(event.name) }}
                </span>
                <!-- Spotlight bonus icons -->
                <div v-if="eventsStore.eventMetadata[event.eventID]?.spotlightBonus" class="spotlight-bonus-icons">
                    <EvolveIcon
                        v-if="eventsStore.eventMetadata[event.eventID]?.spotlightBonus?.category === 'evolve'"
                        :size="15"
                        class="evolve-icon"
                    />
                    <TransferIcon v-else-if="eventsStore.eventMetadata[event.eventID]?.spotlightBonus?.category === 'transfer'" :size="15" />
                    <img
                        v-if="eventsStore.eventMetadata[event.eventID]?.spotlightBonusIconUrl"
                        :src="eventsStore.eventMetadata[event.eventID]!.spotlightBonusIconUrl!"
                        class="bonus-type-icon"
                    />
                </div>
            </div>

            <div class="event-content" :class="{ 'flex-column gap-2': props.isActive || pokemonCount > 6 || collapsedScheduleDayGroups?.length }">
                <EventTimeDisplay :event="event" />

                <div
                    v-if="hasPokemon"
                    class="flex-grow-1 d-flex gap-1 align-items-start"
                    :class="[props.isActive || pokemonCount > 6 || collapsedScheduleDayGroups?.length ? 'w-100' : 'w-50 justify-content-end']"
                >
                    <PokemonEventImages
                        v-if="props.isActive ? !hasExpandedRaidSections : !collapsedScheduleDayGroups?.length"
                        :event="event"
                        :event-name="formatEventName(event.name)"
                        :height="40"
                        :use-animated="props.isActive ? true : false"
                        :show-placeholder="true"
                        :show-tooltips="true"
                        :show-c-p="props.isActive"
                        :overflow-badge-align="'right'"
                        :exclude-tiers="props.isActive ? [] : ['Tier 1', 'Tier 3']"
                    />

                    <div v-else-if="!props.isActive && collapsedScheduleDayGroups?.length" class="collapsed-schedule-days">
                        <div v-for="dayGroup in collapsedScheduleDayGroups" :key="dayGroup.id" class="collapsed-day-group">
                            <div class="collapsed-day-name">{{ dayGroup.date }}</div>
                            <div class="tier-images">
                                <PokemonImage
                                    v-for="boss in dayGroup.images"
                                    :key="`${dayGroup.id}-${boss.name}`"
                                    :pokemon-data="boss"
                                    :height="34"
                                    :use-animated="false"
                                    :show-tooltip="true"
                                    :show-c-p="false"
                                    :event-type="event.eventType"
                                    :is-shadow="isShadowRaid"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="event-extras-wrapper">
                    <Transition name="fade">
                        <EventExtras v-if="props.isActive" :event="event" />
                    </Transition>
                </div>

                <!-- Raid boss schedule sections grouped by day (expanded only) -->
                <div v-if="timelineScheduleDaySectionsWithTierGroups?.length && props.isActive" class="raid-boss-tiers">
                    <div v-for="daySection in timelineScheduleDaySectionsWithTierGroups" :key="daySection.id" class="schedule-day-section">
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
                                        :use-animated="true"
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

                <!-- Fallback raid boss tier groups (expanded only) -->
                <div v-else-if="defaultTierGroupsWithImages && props.isActive" class="raid-boss-tiers">
                    <div v-for="group in defaultTierGroupsWithImages" :key="group.label" class="tier-group">
                        <div v-if="group.showLabel" class="tier-label">{{ group.label }}</div>
                        <div class="tier-images">
                            <PokemonImage
                                v-for="boss in group.images"
                                :key="boss.name"
                                :pokemon-data="boss"
                                :height="60"
                                :use-animated="true"
                                :show-tooltip="true"
                                :show-c-p="true"
                                :event-type="event.eventType"
                                :is-shadow="isShadowRaid"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="props.isActive && event.link && !(event as any)._isGrouped" class="event-bottom-link">
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
    </div>
</template>

<script setup lang="ts">
import { ChevronsDownUp, ChevronsUpDown, ExternalLink, Palette } from '@lucide/vue';
import { breakpointsBootstrapV5, useBreakpoints } from '@vueuse/core';
import { computed } from 'vue';

import { useDeviceDetection } from '@/composables/useDeviceDetection';
import { useEditColorModal } from '@/composables/useEditColorModal';
import { useHideEventModal } from '@/composables/useHideEventModal';
import { useEventHighlightStore } from '@/stores/eventHighlight';
import { useEventsStore } from '@/stores/events';
import { formatEventName } from '@/utils/eventName';
import { getEventPokemonImages } from '@/utils/eventPokemon';
import {
    type MajorCalendarEventVariant,
    type PogoEvent,
    type PokemonBoss,
    type RaidScheduleEntry,
    getEventTypeInfo,
    getMajorCalendarEventVariant,
    getRaidSubType,
    isMajorCalendarEventType,
} from '@/utils/eventTypes';
import { buildRaidTierGroupsWithImages } from '@/utils/raidTierGroups';

import EvolveIcon from '../Icons/EvolveIcon.vue';
import TransferIcon from '../Icons/TransferIcon.vue';
import EventExtras from './EventExtras.vue';
import EventTimeDisplay from './EventTimeDisplay.vue';
import EventToggleButton from './EventToggleButton.vue';
import PokemonEventImages from './PokemonEventImages.vue';
import PokemonImage from './PokemonImage.vue';

interface Props {
    event: PogoEvent;
    isActive: boolean;
}

interface Emits {
    activate: [eventId: string];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const hideEventModal = useHideEventModal();
const editColorModal = useEditColorModal();
const eventsStore = useEventsStore();
const eventHighlight = useEventHighlightStore();
const { isTouchDevice } = useDeviceDetection();

const breakpoints = useBreakpoints(breakpointsBootstrapV5);
const isDesktopSidebar = breakpoints.greaterOrEqual('xxl'); // >= 1400px

function openColorModal() {
    editColorModal.openModal(props.event.eventType);
}

function toggleActive() {
    emit('activate', props.event.eventID);
}

function openHideModal() {
    hideEventModal.openModal(props.event);
}

let highlightTimeout: number | null = null;

function debouncedHighlightEventID(eventID: string) {
    if (highlightTimeout) {
        clearTimeout(highlightTimeout);
    }

    highlightTimeout = setTimeout(() => {
        // Only highlight calendar events when desktop sidebar is visible
        if (isDesktopSidebar.value) {
            eventHighlight.highlightEventID(eventID);
        }
        highlightTimeout = null;
    }, 200);
}

function debouncedClearEventIDHighlight() {
    if (highlightTimeout) {
        clearTimeout(highlightTimeout);
        highlightTimeout = null;
    }

    // Only clear calendar highlights when desktop sidebar is visible
    if (isDesktopSidebar.value) {
        eventHighlight.clearEventIDHighlight();
    }
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

function parseTimeStartSortKey(timeString?: string): number {
    if (!timeString) {
        return Number.MAX_SAFE_INTEGER;
    }

    const match = timeString.match(/(\d+):(\d+)\s*(a\.m\.|p\.m\.|am|pm)/i);
    if (!match) {
        return Number.MAX_SAFE_INTEGER;
    }

    const [, hourStr, minuteStr, period] = match;
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (period.toLowerCase().includes('p') && hour !== 12) {
        hour += 12;
    } else if (period.toLowerCase().includes('a') && hour === 12) {
        hour = 0;
    }

    return hour * 60 + minute;
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

function formatScheduleSectionLabel(label?: string, isAllDay: boolean = false): string {
    const normalizedLabel = label?.trim();

    if (isAllDay) {
        return normalizedLabel ? `${normalizedLabel} (All Day)` : 'All Day';
    }

    if (normalizedLabel) {
        return normalizedLabel;
    }

    return 'Scheduled';
}

function buildTimelineScheduleDaySectionsWithTierGroups(event: PogoEvent, useAnimatedImages: boolean = true) {
    const raidSchedule = event.extraData?.raidSchedule;
    if (!raidSchedule || raidSchedule.length === 0) {
        return undefined;
    }

    type TimelineScheduleSection = {
        id: string;
        labelText: string;
        time?: string;
        isAllDay: boolean;
        sortKey: number;
        tierGroups: NonNullable<ReturnType<typeof buildRaidTierGroupsWithImages>>;
    };

    type TimelineDaySection = {
        id: string;
        date: string;
        sections: TimelineScheduleSection[];
    };

    const daySectionMap = new Map<string, TimelineDaySection>();
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
        daySection: TimelineDaySection,
        id: string,
        labelText: string,
        time: string | undefined,
        isAllDay: boolean,
        bosses: PokemonBoss[],
    ) {
        const tierGroups = buildTierGroupsFromBosses(bosses);
        const tierGroupsWithImages = buildRaidTierGroupsWithImages(tierGroups, useAnimatedImages);

        if (!tierGroupsWithImages?.length) {
            return;
        }

        daySection.sections.push({
            id,
            labelText,
            time,
            isAllDay,
            sortKey: isAllDay ? -1 : parseTimeStartSortKey(time),
            tierGroups: tierGroupsWithImages,
        });
    }

    raidSchedule.forEach((schedule: RaidScheduleEntry, scheduleIndex) => {
        const daySection = ensureDaySection(schedule.date, scheduleIndex);

        if (schedule.bosses?.length) {
            const isAllDay = !schedule.time;
            appendScheduleSection(
                daySection,
                `schedule-${scheduleIndex}`,
                formatScheduleSectionLabel(schedule.label, isAllDay),
                schedule.time?.trim() || undefined,
                isAllDay,
                schedule.bosses,
            );
        }

        if (schedule.raidHours?.length) {
            schedule.raidHours.forEach((raidHour, hourIndex) => {
                if (!raidHour.bosses?.length) {
                    return;
                }

                appendScheduleSection(
                    daySection,
                    `schedule-${scheduleIndex}-raidhour-${hourIndex}`,
                    formatScheduleSectionLabel(raidHour.label, false),
                    raidHour.time?.trim() || undefined,
                    false,
                    raidHour.bosses,
                );
            });
        }
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
        .filter((section): section is TimelineDaySection => Boolean(section));

    if (daySections.length === 0) {
        return undefined;
    }

    return daySections;
}

function buildCollapsedScheduleDayGroups(event: PogoEvent) {
    const daySections = buildTimelineScheduleDaySectionsWithTierGroups(event, false);
    if (!daySections?.length) {
        return undefined;
    }

    return daySections
        .map(daySection => {
            const dedupedBosses = new Map<
                string,
                {
                    boss: (typeof daySection.sections)[number]['tierGroups'][number]['images'][number];
                    tierLabel: string;
                }
            >();

            daySection.sections.forEach(section => {
                section.tierGroups.forEach(group => {
                    group.images.forEach(boss => {
                        const dedupeKey = `${boss.name.toLowerCase()}|${(boss.formId ?? '').toLowerCase()}`;
                        const existing = dedupedBosses.get(dedupeKey);

                        if (!existing) {
                            dedupedBosses.set(dedupeKey, {
                                boss,
                                tierLabel: group.label,
                            });
                            return;
                        }

                        if (sortTierLabel(group.label, existing.tierLabel) < 0) {
                            dedupedBosses.set(dedupeKey, {
                                boss,
                                tierLabel: group.label,
                            });
                        }
                    });
                });
            });

            const sortedImages = Array.from(dedupedBosses.values())
                .sort((a, b) => {
                    return sortTierLabel(a.tierLabel, b.tierLabel);
                })
                .map(entry => entry.boss);

            return {
                id: daySection.id,
                date: daySection.date,
                images: sortedImages,
            };
        })
        .filter(daySection => daySection.images.length > 0);
}

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

const isShadowRaid = computed(() => {
    return getRaidSubType(props.event) === 'shadow-raids';
});

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

const isMajorTimelineEvent = computed(() => {
    return isMajorCalendarEventType(props.event.eventType);
});

const majorTimelineVariant = computed<MajorCalendarEventVariant>(() => {
    if (!isMajorTimelineEvent.value) {
        return 'location-specific';
    }

    return getMajorCalendarEventVariant(props.event);
});
</script>

<style lang="scss" scoped>
.timeline-event-card {
    position: relative;
    border: 1px solid color-mix(in srgb, var(--event-color) 42%, var(--bs-border-color));
    border-radius: 8px;
    overflow: hidden;
    background-color: color-mix(in srgb, var(--event-color) 5%, var(--calendar-cell-bg));
    transition:
        transform 0.15s ease,
        box-shadow 0.15s ease,
        background-color 0.15s ease,
        border-color 0.15s ease;
    -webkit-font-smoothing: antialiased;

    @media (pointer: fine) {
        &:hover {
            background-color: color-mix(in srgb, var(--event-color) 10%, var(--calendar-cell-bg));
            border-color: color-mix(in srgb, var(--event-color) 65%, var(--bs-border-color));
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

            .expand-toggle {
                opacity: 0.8;
            }
        }
    }

    &.is-active {
        transform-origin: top center;
        transform: scale3d(1.015, 1, 1);

        background-color: color-mix(in srgb, var(--event-color) 10%, var(--calendar-cell-bg));
        border-color: color-mix(in srgb, var(--event-color) 65%, var(--bs-border-color));
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }
}

.timeline-event-card.major-timeline-event {
    border-width: 2px;
    border-color: color-mix(in srgb, var(--calendar-cell-bg) 28%, var(--event-color) 72%);
    background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--calendar-cell-bg) 72%, var(--event-color) 28%),
        color-mix(in srgb, var(--calendar-cell-bg) 62%, var(--event-color) 38%)
    );

    @media (pointer: fine) {
        &:hover {
            background: linear-gradient(
                135deg,
                color-mix(in srgb, var(--calendar-hover-bg) 66%, var(--event-color) 34%),
                color-mix(in srgb, var(--calendar-cell-bg) 56%, var(--event-color) 44%)
            );
            border-color: color-mix(in srgb, var(--calendar-cell-bg) 20%, var(--event-color) 80%);
        }
    }

    &.is-active {
        border-color: color-mix(in srgb, var(--calendar-cell-bg) 16%, var(--event-color) 84%);
        background: linear-gradient(
            135deg,
            color-mix(in srgb, var(--calendar-hover-bg) 60%, var(--event-color) 40%),
            color-mix(in srgb, var(--calendar-cell-bg) 52%, var(--event-color) 48%)
        );
    }
}

.timeline-event-card.major-timeline-event::after {
    content: '';
    position: absolute;
    right: 1px;
    bottom: 0;
    width: 56px;
    height: 56px;
    pointer-events: none;
    opacity: 0.2;
    background-color: color-mix(in srgb, var(--event-color) 62%, var(--bs-body-color) 38%);
    mask-repeat: no-repeat;
    mask-position: center;
    mask-size: contain;
    z-index: 0;
}

@media (min-width: 768px) {
    .timeline-event-card.major-timeline-event::after {
        right: 2px;
        bottom: 0;
        width: 68px;
        height: 68px;
    }
}

@media (min-width: 1200px) {
    .timeline-event-card.major-timeline-event::after {
        right: 3px;
        bottom: -1px;
        width: 74px;
        height: 74px;
    }
}

.timeline-event-card.major-timeline-event.major-timeline-global::after {
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M2 12h20'/%3E%3Cpath d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'/%3E%3C/svg%3E");
}

.timeline-event-card.major-timeline-event.major-timeline-location::after {
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 1 1 16 0'/%3E%3Ccircle cx='12' cy='10' r='3'/%3E%3C/svg%3E");
}

[data-bs-theme='dark'] .timeline-event-card.major-timeline-event {
    border-color: color-mix(in srgb, #495057 32%, var(--event-color) 68%);
    background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--calendar-cell-bg) 76%, var(--event-color) 24%),
        color-mix(in srgb, var(--calendar-cell-bg) 66%, var(--event-color) 34%)
    );

    @media (pointer: fine) {
        &:hover {
            background: linear-gradient(
                135deg,
                color-mix(in srgb, var(--calendar-hover-bg) 62%, var(--event-color) 38%),
                color-mix(in srgb, var(--calendar-cell-bg) 58%, var(--event-color) 42%)
            );
        }
    }

    &.is-active {
        background: linear-gradient(
            135deg,
            color-mix(in srgb, var(--calendar-hover-bg) 56%, var(--event-color) 44%),
            color-mix(in srgb, var(--calendar-cell-bg) 52%, var(--event-color) 48%)
        );
    }
}

[data-bs-theme='dark'] .timeline-event-card.major-timeline-event::after {
    opacity: 0.24;
    background-color: color-mix(in srgb, var(--event-color) 70%, var(--bs-body-color) 30%);
}

.event-header-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    padding: 4px 4px;
    cursor: pointer;
    z-index: 3;

    .event-header-actions {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .event-type-badge {
        padding: 3px 8px;
        margin-left: 4px;
        font-size: 0.7rem;
        font-weight: 500;
        line-height: 1;
        color: white;
        background-color: var(--event-color);
        border-radius: 4px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        white-space: nowrap;
    }

    .timeline-color-edit-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 3px;
        height: 20px;
        border: none;
        border-radius: 3px;
        background-color: color-mix(in srgb, var(--bs-body-color) 15%, transparent);
        color: var(--bs-body-color);
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;

        &:hover {
            background-color: color-mix(in srgb, var(--bs-body-color) 20%, transparent);
            transform: scale(1.05);
        }

        &:active {
            transform: scale(0.95);
        }
    }

    .expand-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2px 3px;
        border: none;
        border-radius: 4px;
        background-color: color-mix(in srgb, var(--bs-body-color) 8%, transparent);
        color: var(--bs-body-color);
        cursor: pointer;
        opacity: 0.5;
        transition:
            opacity 0.2s ease,
            transform 0.2s ease,
            background-color 0.2s ease;

        @media (pointer: fine) {
            &:hover {
                opacity: 1;
                background-color: color-mix(in srgb, var(--bs-body-color) 15%, transparent);
                transform: scale(1.05);
            }
        }

        &:active {
            transform: scale(0.95);
        }
    }
}

.event-body {
    padding: 12px 10px 5px 10px;
    padding-top: 32px;
    text-align: left;

    .parent-event-name {
        font-size: 0.7rem;
        font-weight: 600;
        font-style: italic;
        color: color-mix(in srgb, var(--bs-body-color) 60%, transparent);
        line-height: 1.1;
        margin-bottom: 4px;
    }

    .event-header-row {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        margin: -5px -4px 2px -4px;
        padding: 4px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.15s ease;

        @media (pointer: fine) {
            &:hover {
                background-color: color-mix(in srgb, var(--bs-body-color) 3%, transparent);
            }

            &:hover .event-name {
                color: var(--bs-body-color);
            }
        }

        &:active {
            background-color: color-mix(in srgb, var(--bs-body-color) 5%, transparent);
        }
    }

    .event-name {
        flex: 1;
        font-size: 0.975rem;
        font-weight: 400;
        color: color-mix(in srgb, var(--bs-body-color) 90%, transparent);
        line-height: 1.3;
        transition: color 0.2s ease;
    }

    .event-content {
        display: flex;
        gap: 0px;
        align-items: flex-start;

        :deep(.event-time-display) {
            font-size: 0.75rem;
        }

        :deep(.pokemon-images) {
            justify-content: end;
            flex-grow: 1;
            flex-shrink: 1;
        }
    }

    .raid-boss-tiers {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        margin-top: 0.4rem;
        width: 100%;
    }

    .tier-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding-left: 0.5rem;
    }

    .schedule-section {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        padding: 0.1rem 0.2rem;
    }

    .schedule-section + .schedule-section {
        padding-top: 0.35rem;
        margin-top: 0.05rem;
    }

    .schedule-day-section {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        padding: 0.4rem;
        border-radius: 7px;
        border: 1px solid color-mix(in srgb, var(--bs-border-color) 15%, transparent);
        background-color: color-mix(in srgb, var(--calendar-cell-bg) 75%, var(--event-color) 5%);
    }

    .schedule-day-header {
        font-size: 0.925rem;
        text-transform: uppercase;
        font-weight: 700;
        line-height: 1.5;
        letter-spacing: 0.05em;
        color: color-mix(in srgb, var(--bs-body-color) 82%, transparent);
        padding: 0 0.1rem;
    }

    .schedule-section-header {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.35rem;
        padding-top: 0.2rem;
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

    .schedule-section-header:not(.is-all-day) .schedule-label {
        color: #3f86cc;
        border-bottom-color: rgba(63, 134, 204, 0.46);
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

    .tier-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: color-mix(in srgb, var(--bs-body-color) 70%, transparent);
    }

    .tier-images {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
    }

    .collapsed-schedule-days {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
    }

    .collapsed-day-group {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .collapsed-day-name {
        font-size: 0.7rem;
        font-weight: 700;
        line-height: 1.15;
        color: color-mix(in srgb, var(--bs-body-color) 76%, transparent);
    }

    .event-extras-wrapper {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease;

        :deep(.event-extras) {
            margin-top: 0.5rem;
        }

        :deep(.community-day-bonuses) {
            margin-top: 1rem;
        }
    }
}

.spotlight-bonus-icons {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    flex-shrink: 0;
    margin-top: 1px;
    filter: grayscale(20%);
}

.evolve-icon {
    color: #aa403a;
}

[data-bs-theme='dark'] .evolve-icon {
    color: #ee726e;
}

.spotlight-bonus-icons > svg {
    flex-shrink: 0;
}

.spotlight-bonus-icons .bonus-type-icon {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
    object-fit: contain;
    filter: drop-shadow(1px 1px 1px color-mix(in srgb, black 40%, transparent));
}

.timeline-event-card.is-active {
    .event-extras-wrapper {
        max-height: 180px;
    }
}

.event-bottom-link {
    padding-top: 0.15rem;
}
</style>
