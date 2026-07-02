<template>
    <div v-if="bonus" class="spotlight-bonus">
        <strong>Bonus:</strong>
        <div class="bonus-content">
            <img v-if="bonusIcon" :src="bonusIcon" :alt="bonus" class="spotlight-bonus-icon" />
            <span>{{ bonus }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useEventTypeColorsStore } from '@/stores/eventTypeColors';
import { type PogoEvent } from '@/utils/eventTypes';
import { getSpotlightBonusInfo, getSpotlightBonusTypeIcon } from '@/utils/spotlightBonus';

interface Props {
    event: PogoEvent;
}

const props = defineProps<Props>();

const eventTypeColorsStore = useEventTypeColorsStore();

// The event type's configured color (respects user overrides), used for the bonus card accent border.
const eventColor = computed(() => eventTypeColorsStore.getEventTypeColor(props.event.eventType));

const bonus = computed(() => {
    if (props.event.eventType === 'pokemon-spotlight-hour' && props.event.extraData?.spotlight?.bonus) {
        return props.event.extraData.spotlight.bonus;
    }
    return null;
});

const bonusIcon = computed(() => {
    const info = getSpotlightBonusInfo(props.event);
    return info ? getSpotlightBonusTypeIcon(info.bonusType) : null;
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
    border-left: 3px solid color-mix(in srgb, v-bind(eventColor) 70%, transparent);
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
</style>
