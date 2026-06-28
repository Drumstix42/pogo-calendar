<template>
    <div v-if="bonuses" class="community-day-bonuses">
        <div class="bonus-header"><strong>Bonuses:</strong></div>
        <div
            class="bonus-list-container scroll-shadow-hints"
            :class="{
                'can-scroll-up': canScrollUp,
                'can-scroll-down': canScrollDown,
            }"
        >
            <div ref="bonusListRef" class="bonus-list" @scroll="updateScrollState">
                <div v-for="bonus in bonuses" :key="bonus.text" class="bonus-item">
                    <img :src="bonus.image" :alt="bonus.text" class="bonus-icon" />
                    <span class="bonus-text">{{ bonus.text }}</span>
                </div>
                <div v-if="disclaimers" class="bonus-disclaimers">
                    <div v-for="disclaimer in disclaimers" :key="disclaimer" class="disclaimer-text" v-html="disclaimer"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { useScrollShadow } from '@/composables/useScrollShadow';
import { useEventTypeColorsStore } from '@/stores/eventTypeColors';
import { type PogoEvent } from '@/utils/eventTypes';

interface Props {
    event: PogoEvent;
}

const props = defineProps<Props>();

const eventTypeColorsStore = useEventTypeColorsStore();

// The event type's configured color (respects user overrides), used for the bonus card accent border.
const eventColor = computed(() => eventTypeColorsStore.getEventTypeColor(props.event.eventType));

const bonuses = computed(() => {
    if (props.event.eventType === 'community-day' && props.event.extraData?.communityday?.bonuses) {
        return props.event.extraData.communityday.bonuses;
    }
    return null;
});

const disclaimers = computed(() => {
    if (props.event.eventType === 'community-day' && props.event.extraData?.communityday?.bonusDisclaimers) {
        return props.event.extraData.communityday.bonusDisclaimers;
    }
    return null;
});

const bonusListRef = ref<HTMLElement>();
const { canScrollUp, canScrollDown, updateScrollState } = useScrollShadow(bonusListRef);
</script>

<style scoped>
.community-day-bonuses {
    margin: 0.1rem 0 0.1rem 0;
    padding: 0.4rem 0.6rem 0.1rem 0.6rem;
    background-color: color-mix(in srgb, var(--bs-body-color) 3%, transparent);
    border: 1px solid color-mix(in srgb, var(--bs-body-color) 12%, transparent);
    border-left: 3px solid color-mix(in srgb, v-bind(eventColor) 70%, transparent);
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
