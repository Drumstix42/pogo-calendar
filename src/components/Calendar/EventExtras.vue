<template>
    <div class="event-extras">
        <div v-if="spotlightBonus" class="spotlight-bonus">
            <strong>Bonus:</strong>
            <div class="bonus-content">
                <img v-if="spotlightBonusIcon" :src="spotlightBonusIcon" :alt="spotlightBonus" class="spotlight-bonus-icon" />
                <span>{{ spotlightBonus }}</span>
            </div>
        </div>

        <!-- Bonuses for raid hour sub-events -->
        <div v-if="raidHourBonuses" class="raid-hour-bonuses">
            <strong>Bonus:</strong>
            <div v-for="bonus in raidHourBonuses" :key="bonus" class="bonus-content">
                <span>{{ bonus }}</span>
            </div>
        </div>

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

        <!-- Bonuses with time ranges (e.g. GO Fest) -->
        <div v-if="eventBonuses" class="event-bonuses">
            <div class="bonus-header"><strong>Bonuses:</strong></div>
            <div class="event-bonus-list">
                <div v-for="group in eventBonuses" :key="group.description ?? group.startTime" class="event-bonus-group">
                    <div v-if="group.startTime && group.endTime" class="event-bonus-time-range">{{ group.startTime }} – {{ group.endTime }}</div>
                    <div v-for="item in group.items" :key="item.text" class="bonus-item">
                        <img v-if="item.image" :src="item.image" :alt="item.text" class="bonus-icon" />
                        <span class="bonus-text">{{ item.text }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';

import { type EventBonusGroup, type PogoEvent } from '@/utils/eventTypes';

interface Props {
    event: PogoEvent;
}

const props = defineProps<Props>();

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

const raidHourBonuses = computed(() => {
    if (props.event.extraData?.isRaidHourSubEvent && props.event.extraData?.bonuses) {
        return props.event.extraData.bonuses;
    }
    return null;
});

const spotlightBonusIcon = computed(() => {
    if (!spotlightBonus.value) return null;

    const bonus = spotlightBonus.value;

    if (/xp/i.test(bonus)) {
        return '/images/icons/xp.png';
    }
    if (/stardust/i.test(bonus)) {
        return '/images/icons/stardust.png';
    }
    if (/candy/i.test(bonus)) {
        return '/images/icons/candy.png';
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

function parseBonusStartTimeMinutes(value?: string) {
    if (!value) return Number.POSITIVE_INFINITY;

    const normalized = value.trim().toLowerCase();
    const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(a\.m\.|p\.m\.)$/);
    if (!match) return Number.POSITIVE_INFINITY;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3];

    if (hours === 12) {
        hours = period === 'a.m.' ? 0 : 12;
    } else if (period === 'p.m.') {
        hours += 12;
    }

    return hours * 60 + minutes;
}

const eventBonuses = computed<EventBonusGroup[] | null>(() => {
    const bonuses = props.event.extraData?.bonuses;
    if (!bonuses?.length) return null;

    // Filter out groups with no items and sort earliest time window first.
    const filtered = bonuses
        .filter(g => g.items?.length)
        .map((group, index) => ({
            group,
            startMinutes: parseBonusStartTimeMinutes(group.startTime),
            index,
        }))
        .sort((a, b) => {
            if (a.startMinutes === b.startMinutes) {
                return a.index - b.index;
            }
            return a.startMinutes - b.startMinutes;
        })
        .map(entry => entry.group);

    return filtered.length ? filtered : null;
});

onMounted(() => {
    nextTick(() => {
        setTimeout(updateScrollState, 50);
    });
});
</script>

<style scoped>
.spotlight-bonus {
    font-size: 12px;
    color: color-mix(in srgb, var(--bs-body-color) 80%, transparent);
    padding: 0.3rem 0.6rem;
    margin: 0.1rem 0 0.1rem 0;
    background-color: color-mix(in srgb, var(--bs-body-color) 3%, transparent);
    border: 1px solid color-mix(in srgb, var(--bs-body-color) 12%, transparent);
    border-left: 3px solid color-mix(in srgb, var(--bs-body-color) 25%, transparent);
    border-radius: 0.25rem;
}

.raid-hour-bonuses {
    font-size: 12px;
    color: color-mix(in srgb, var(--bs-body-color) 80%, transparent);
    padding: 0.3rem 0.6rem;
    margin: 0.1rem 0 0.1rem 0;
    background-color: color-mix(in srgb, var(--bs-body-color) 3%, transparent);
    border: 1px solid color-mix(in srgb, var(--bs-body-color) 12%, transparent);
    border-left: 3px solid color-mix(in srgb, var(--bs-body-color) 25%, transparent);
    border-radius: 0.25rem;
}

.bonus-content {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    line-height: 1.1rem;
}

.spotlight-bonus-icon {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
    object-fit: contain;
}

.community-day-bonuses {
    margin: 0.1rem 0 0.1rem 0;
    padding: 0.4rem 0.6rem 0.1rem 0.6rem;
    background-color: color-mix(in srgb, var(--bs-body-color) 3%, transparent);
    border: 1px solid color-mix(in srgb, var(--bs-body-color) 12%, transparent);
    border-left: 3px solid color-mix(in srgb, var(--bs-body-color) 25%, transparent);
    border-radius: 0.25rem;
}

.bonus-header {
    font-size: 12px;
    line-height: 1;
    color: color-mix(in srgb, var(--bs-body-color) 80%, transparent);
    font-weight: 500;
    padding: 0 0.6rem 0.3rem 0;
}

.bonus-list-container {
    position: relative;
}

.bonus-list {
    max-height: 97px;
    overflow-y: auto;
    padding: 0 0.2rem 0 0.2rem;
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

.event-bonuses {
    margin: 0.1rem 0 0.1rem 0;
    padding: 0.4rem 0.6rem 0.3rem 0.6rem;
    background-color: color-mix(in srgb, var(--bs-body-color) 3%, transparent);
    border: 1px solid color-mix(in srgb, var(--bs-body-color) 12%, transparent);
    border-left: 3px solid color-mix(in srgb, var(--bs-body-color) 25%, transparent);
    border-radius: 0.25rem;
}

.event-bonus-group {
    margin-bottom: 0.5rem;
}

.event-bonus-group:last-child {
    margin-bottom: 0;
}

.event-bonus-list {
    max-height: 120px;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-right: 0.2rem;
}

.event-bonus-time-range {
    font-size: 0.65rem;
    font-weight: 600;
    color: color-mix(in srgb, var(--bs-body-color) 60%, transparent);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-bottom: 0.2rem;
    padding-bottom: 0.15rem;
    border-bottom: 1px solid color-mix(in srgb, var(--bs-body-color) 10%, transparent);
}
</style>
