<template>
    <div v-if="hasContent" class="event-extras">
        <SpotlightBonus :event="event" />
        <RaidHourBonuses :event="event" />
        <CommunityDayBonuses :event="event" />
        <SeasonBonuses v-if="seasonData" :season="seasonData" :highlight-day-of-week="highlightDayOfWeek" />
        <EventBonuses :event="event" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { hasEventExtras } from '@/utils/eventSubtype';
import { type PogoEvent } from '@/utils/eventTypes';

import CommunityDayBonuses from './CommunityDayBonuses.vue';
import EventBonuses from './EventBonuses.vue';
import RaidHourBonuses from './RaidHourBonuses.vue';
import SeasonBonuses from './SeasonBonuses.vue';
import SpotlightBonus from './SpotlightBonus.vue';

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
