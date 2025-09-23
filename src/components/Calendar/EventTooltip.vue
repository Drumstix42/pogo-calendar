<template>
    <div class="event-tooltip">
        <div
            class="event-tooltip-type"
            :style="{
                backgroundColor: getEventColor(event),
                borderLeftColor: `color-mix(in srgb, ${getEventColor(event)} 70%, black)`,
            }"
        >
            <span class="event-type-name">{{ getEventTypeName(event) }}</span>
            <EventToggleButton :event-type="event.eventType" @hide="hideEventType" />
        </div>

        <!-- Show individual events if grouped -->
        <div v-if="(event as any)._isGrouped" class="grouped-events">
            <div v-for="groupedEvent in getGroupedEvents(event)" :key="groupedEvent.eventID" class="event-time-info">
                <div class="event-content">
                    <!-- Event text content -->
                    <div class="event-text">
                        <div class="grouped-event-name">{{ groupedEvent.name }}</div>
                        <div class="grouped-event-time">{{ formatEventDuration(groupedEvent) }}</div>
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

                    <!-- Pokemon images -->
                    <PokemonImages
                        :event="groupedEvent"
                        :event-name="groupedEvent.name"
                        :height="50"
                        :use-animated="calendarSettings.useAnimatedImages"
                    />
                </div>
            </div>
        </div>

        <!-- Show time for single events -->
        <div v-else>
            <div class="event-time-info">
                <div class="event-content">
                    <!-- Event text content -->
                    <div class="event-text">
                        <div class="grouped-event-name">{{ event.name }}</div>
                        <div :class="isSingleDay ? 'single-event-time' : 'grouped-event-time'">{{ formatEventDuration(event) }}</div>
                    </div>

                    <!-- Pokemon images -->
                    <PokemonImages
                        :event="event"
                        :event-name="event.name"
                        :height="60"
                        :use-animated="calendarSettings.useAnimatedImages"
                        :show-placeholder="isSingleDay"
                    />
                </div>
            </div>
        </div>

        <div v-if="spotlightBonus" class="spotlight-bonus"><strong>Bonus:</strong> {{ spotlightBonus }}</div>

        <!-- Bonuses for community day events -->
        <div v-if="communityDayBonuses" class="community-day-bonuses">
            <div class="bonus-header"><strong>Bonuses:</strong></div>
            <div
                class="bonus-list-container scroll-shadow-hints"
                :class="{
                    'can-scroll-up': canScrollUp,
                    'can-scroll-down': canScrollDown,
                }"
            >
                <div ref="bonusListRef" class="bonus-list" @scroll="updateScrollState">
                    <div v-for="bonus in communityDayBonuses" :key="bonus.text" class="bonus-item">
                        <img :src="bonus.image" :alt="bonus.text" class="bonus-icon" />
                        <span class="bonus-text">{{ bonus.text }}</span>
                    </div>
                    <div v-if="communityDayBonusDisclaimers" class="bonus-disclaimers">
                        <div v-for="disclaimer in communityDayBonusDisclaimers" :key="disclaimer" class="disclaimer-text" v-html="disclaimer"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- External link to LeekDuck for single events -->
        <div v-if="event.link && !(event as any)._isGrouped" class="px-2">
            <a
                :href="event.link"
                target="_blank"
                rel="noopener noreferrer"
                class="link-secondary link-underline-opacity-0 link-underline-opacity-100-hover d-inline-flex align-items-center gap-1"
                style="font-size: 0.75rem"
            >
                View on LeekDuck <ExternalLink :size="12" />
            </a>
        </div>
    </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { ExternalLink } from 'lucide-vue-next';
import { computed, nextTick, onMounted, ref } from 'vue';

import { useEventFilterToasts } from '@/composables/useEventFilterToasts';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import {
    type EventTypeKey,
    type PogoEvent,
    formatEventTime,
    getEventTypeInfo,
    getGroupedEvents,
    isSameDayEvent,
    parseEventDate,
} from '@/utils/eventTypes';

import EventToggleButton from './EventToggleButton.vue';
import PokemonImages from './PokemonImages.vue';

interface Props {
    event: PogoEvent;
    isSingleDay?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    isSingleDay: false,
});

const calendarSettings = useCalendarSettingsStore();
const { hideEventTypeWithToast } = useEventFilterToasts();

const bonusListRef = ref<HTMLElement>();
const canScrollUp = ref(false);
const canScrollDown = ref(false);

const updateScrollState = () => {
    const element = bonusListRef.value;
    if (!element) return;

    const { scrollTop, scrollHeight, clientHeight } = element;

    canScrollUp.value = scrollTop > 5;
    canScrollDown.value = scrollTop < scrollHeight - clientHeight - 5;
};

const spotlightBonus = computed(() => {
    if (props.event.eventType === 'pokemon-spotlight-hour' && props.event.extraData?.spotlight?.bonus) {
        return props.event.extraData.spotlight.bonus;
    }
    return null;
});

const communityDayBonuses = computed(() => {
    if (props.event.eventType === 'community-day' && props.event.extraData?.communityday?.bonuses) {
        return props.event.extraData.communityday.bonuses;
    }
    return null;
});

const communityDayBonusDisclaimers = computed(() => {
    if (props.event.eventType === 'community-day' && props.event.extraData?.communityday?.bonusDisclaimers) {
        return props.event.extraData.communityday.bonusDisclaimers;
    }
    return null;
});

onMounted(() => {
    nextTick(() => {
        setTimeout(updateScrollState, 50);
    });
});

const hideEventType = (eventType: EventTypeKey): void => {
    hideEventTypeWithToast(eventType);
};

const getEventColor = (event: PogoEvent): string => {
    return getEventTypeInfo(event.eventType).color;
};

const getEventTypeName = (event: PogoEvent): string => {
    return getEventTypeInfo(event.eventType).name;
};

const formatEventDuration = (event: PogoEvent): string => {
    const startTime = formatEventTime(event.start);
    const endTime = formatEventTime(event.end);

    if (isSameDayEvent(event)) {
        const eventDate = parseEventDate(event.start).format('MMM D');
        return `${eventDate}, ${startTime} - ${endTime}`;
    } else {
        // For multi-day events, show date and time range
        const startDate = parseEventDate(event.start).format('MMM D');
        const endDate = parseEventDate(event.end).format('MMM D');
        const totalDays = dayjs(event.end).diff(dayjs(event.start), 'day') + 1;
        return `${startDate}, ${startTime} - ${endDate}, ${endTime} (${totalDays} day${totalDays > 1 ? 's' : ''})`;
    }
};
</script>

<style scoped>
.event-tooltip {
    max-width: 350px;
    padding: 0rem;
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
    justify-content: space-between;
}

.event-type-name {
    flex: 1;
}

.event-time-info {
    margin-bottom: 0.4rem;
    padding: 0.4rem 0.6rem 0.4rem 0.5rem;
    border-radius: 4px;
}

.event-content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.event-text {
    width: 100%;
}

.event-time-info:last-child {
    margin-bottom: 0;
}

.grouped-events {
    margin-top: 0.6rem;
    max-height: calc(45dvh - 45px);
    overflow-y: auto;
}

.grouped-event-name {
    font-size: 0.75rem;
    font-weight: 400;
    line-height: 1.3;
    color: color-mix(in srgb, var(--bs-body-color) 90%, transparent);
    margin-bottom: 0.15rem;
}

.grouped-event-time {
    font-size: 0.8rem;
    color: color-mix(in srgb, var(--bs-body-color) 90%, transparent);
    font-weight: 600;
}

.single-event-time {
    font-size: 0.8rem;
    color: color-mix(in srgb, var(--bs-body-color) 95%, transparent);
    font-weight: 600;
}

.spotlight-bonus {
    font-size: 12px;
    color: color-mix(in srgb, var(--bs-body-color) 80%, transparent);
    padding: 0 0.6rem 0.3rem 0.5rem;
    margin-top: 0.2rem;
}

.community-day-bonuses {
    margin-top: 0.3rem;
}

.bonus-header {
    font-size: 12px;
    line-height: 1;
    color: color-mix(in srgb, var(--bs-body-color) 80%, transparent);
    font-weight: 00;
    padding: 0 0.6rem 0.2rem 0.5rem;
}

.bonus-list-container {
    position: relative;
}

.bonus-list {
    max-height: 107px;
    overflow-y: auto;
    padding: 0 0.6rem 0.3rem 0.5rem;
}

.bonus-item {
    display: flex;
    align-items: start;
    gap: 0.4rem;
    margin-bottom: 0.18rem;
}

.bonus-item:last-child {
    margin-bottom: 0;
}

.bonus-icon {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
    object-fit: contain;
}

.bonus-text {
    font-size: 0.7rem;
    color: color-mix(in srgb, var(--bs-body-color) 80%, transparent);
    line-height: 1.1;
}

.bonus-disclaimers {
    margin-top: 0.75rem;
}

.disclaimer-text {
    font-size: 0.65rem;
    color: color-mix(in srgb, var(--bs-body-color) 70%, transparent);
    line-height: 1.2;
    font-style: italic;
    margin-bottom: 0.2rem;
}

.disclaimer-text:last-child {
    margin-bottom: 0;
}
</style>
