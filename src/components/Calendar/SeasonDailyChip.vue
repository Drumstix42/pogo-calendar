<template>
    <!-- Rendered only for the current week; reserves height (even on no-bonus days) so the
         horizontally-spanning multi-day bars stay aligned across the row. -->
    <div v-if="showChipArea" class="season-chip-area" :class="{ 'season-chip-past': isPastDay }">
        <VMenu
            v-if="seasonChip"
            :disabled="isTouchDevice || !seasonChip.event"
            placement="top"
            :delay="{ show: 100, hide: 100 }"
            :distance="4"
            :auto-hide="isTouchDevice"
        >
            <span class="season-chip" @click="handleClick(seasonChip.event)">
                <span class="season-chip-label">{{ seasonChip.label }}</span>
                <span v-if="seasonChip.extraCount" class="season-chip-extra">+{{ seasonChip.extraCount }}</span>
            </span>
            <template #popper>
                <EventTooltip v-if="seasonChip.event" :event="seasonChip.event" :target-date="dayInstance" />
            </template>
        </VMenu>
    </div>
</template>

<script setup lang="ts">
import { type Dayjs } from 'dayjs';
import { computed } from 'vue';

import { useCurrentTime } from '@/composables/useCurrentTime';
import { useDeviceDetection } from '@/composables/useDeviceDetection';
import { useUrlSync } from '@/composables/useUrlSync';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventTypeColorsStore } from '@/stores/eventTypeColors';
import { useEventsStore } from '@/stores/events';
import { useSeasonsStore } from '@/stores/seasons';
import { type PogoEvent } from '@/utils/eventTypes';
import { formatSeasonChipLabel } from '@/utils/seasonChipLabel';

import EventTooltip from './EventTooltip/EventTooltip.vue';

interface Props {
    dayInstance: Dayjs;
}

const props = defineProps<Props>();

const eventsStore = useEventsStore();
const seasonsStore = useSeasonsStore();
const eventTypeColorsStore = useEventTypeColorsStore();
const calendarSettings = useCalendarSettingsStore();

// The season event type's configured color (respects user overrides) — used as the chip text color.
const seasonColor = computed(() => eventTypeColorsStore.getEventTypeColor('season'));
const { isTouchDevice } = useDeviceDetection();
const { liveMinute } = useCurrentTime();
const { selectEvent } = useUrlSync();

const displayToday = computed(() => liveMinute.value.add(calendarSettings.manualTimeOffsetHours * 60, 'minute').startOf('day'));

const isInCurrentWeek = computed(() => {
    const firstDayIndex = calendarSettings.firstDayIndex;
    let weekStart = displayToday.value.clone();
    while (weekStart.day() !== firstDayIndex) {
        weekStart = weekStart.subtract(1, 'day');
    }
    const weekEnd = weekStart.add(6, 'day');

    const day = props.dayInstance.startOf('day');
    return !day.isBefore(weekStart.startOf('day')) && !day.isAfter(weekEnd.startOf('day'));
});

const isPastDay = computed(() => props.dayInstance.startOf('day').isBefore(displayToday.value));

const showChipArea = computed(() => calendarSettings.showSeasonDailyBonuses && isInCurrentWeek.value);

const seasonChip = computed(() => {
    if (!showChipArea.value) return null;

    const bonus = seasonsStore.getDailyBonusForDate(props.dayInstance);
    if (!bonus || !bonus.bonuses.length) return null;

    const firstTitle = bonus.bonuses[0].title;
    const label = firstTitle ? formatSeasonChipLabel(firstTitle, bonus.dayOfWeek) : 'Bonus';
    const season = seasonsStore.getSeasonForDate(props.dayInstance);
    const event = season ? eventsStore.getEventById(season.eventID) : undefined;

    return {
        label,
        extraCount: Math.max(0, bonus.bonuses.length - 1),
        event,
    };
});

function handleClick(event?: PogoEvent) {
    // Desktop hovers for the tooltip; touch opens the detail offcanvas via URL sync.
    if (!isTouchDevice.value || !event) return;
    selectEvent(event.eventID, props.dayInstance.format('YYYY-MM-DD'));
}
</script>

<style scoped>
.season-chip-area {
    min-height: 17px;
    margin: 0 2px 3px 2px;
    display: flex;
    align-items: center;
    overflow: hidden;
}

@media (min-width: 576px) {
    .season-chip-area {
        margin-left: 3px;
    }
}

.season-chip-area {
    &.season-chip-past {
        opacity: 0.5;
        filter: grayscale(35%);

        .season-chip {
            font-weight: 300;
        }
    }
}

/* floating-vue wraps the trigger in a block <div class="v-popper">; make it hug the chip
   so it doesn't span the cell width and introduce a block-margin effect. */
.season-chip-area :deep(.v-popper) {
    display: inline-flex;
    min-width: 0;
    max-width: 100%;
}

.season-chip {
    display: inline-flex;
    align-items: baseline;
    gap: 2px;
    max-width: 100%;
    padding: 2px 3px 2px 2px;
    border-radius: 4px;
    font-size: 0.6rem;
    font-weight: 500;
    line-height: 1.2;
    /* Base on the configured season color, but pull toward the theme's body text color so it
       stays readable on the gray chip — brightens on dark theme, darkens on light theme. */
    color: color-mix(in srgb, v-bind(seasonColor) 65%, var(--bs-body-color));
    background-color: color-mix(in srgb, var(--bs-body-color) 8%, transparent);
    cursor: pointer;
    overflow: hidden;
    transition: background-color 0.15s ease;
}

.season-chip:hover {
    background-color: color-mix(in srgb, var(--bs-body-color) 14%, transparent);
}

.season-chip-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.season-chip-extra {
    flex-shrink: 0;
    font-weight: 500;
    opacity: 0.8;
}
</style>
