<template>
    <div class="event-extras">
        <div v-if="spotlightBonus" class="spotlight-bonus">
            <strong>Bonus:</strong>
            <div class="bonus-content">
                <img v-if="spotlightBonusIcon" :src="spotlightBonusIcon" :alt="spotlightBonus" class="spotlight-bonus-icon" />
                <span>{{ spotlightBonus }}</span>
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

        <!-- External link to LeekDuck for single events -->
        <div v-if="event.link && !(event as any)._isGrouped" class="event-link">
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
import { ExternalLink } from 'lucide-vue-next';
import { computed, nextTick, onMounted, ref } from 'vue';

import { type PogoEvent } from '@/utils/eventTypes';

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

.bonus-content {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    line-height: 1.2rem;
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
</style>
