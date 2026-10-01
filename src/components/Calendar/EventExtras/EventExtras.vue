<template>
    <div v-if="hasContent" class="event-extras">
        <EventBonuses :event="event" />
        <RaidHourBonuses :event="event" />
        <SeasonBonuses v-if="seasonData" :season="seasonData" :highlight-day-of-week="highlightDayOfWeek" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { hasEventExtras } from '@/utils/eventSubtype';
import { type PogoEvent } from '@/utils/eventTypes';

import EventBonuses from './EventBonuses.vue';
import RaidHourBonuses from './RaidHourBonuses.vue';
import SeasonBonuses from './SeasonBonuses.vue';

interface Props {
    event: PogoEvent;
    highlightDayOfWeek?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
    highlightDayOfWeek: null,
});

const hasContent = computed(() => hasEventExtras(props.event));

const seasonData = computed(() => {
    if (props.event.eventType === 'season' && props.event.extraData?.season) {
        return props.event.extraData.season;
    }
    return null;
});
</script>
