<template>
    <div v-if="bonuses" class="raid-hour-bonuses">
        <strong>Bonus:</strong>
        <div v-for="bonus in bonuses" :key="bonus" class="bonus-content">
            <span>{{ bonus }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

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
    if (props.event.extraData?.isRaidHourSubEvent && props.event.extraData?.raidHourBonuses) {
        return props.event.extraData.raidHourBonuses;
    }
    return null;
});
</script>

<style scoped>
.raid-hour-bonuses {
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
</style>
