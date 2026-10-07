<template>
    <BaseDrawer :show="show" close-label="Close event details" @close="emit('close')">
        <template #title>
            <CalendarDays :size="16" class="flex-grow-0" />
            Event Details
        </template>
        <EventDetailOffcanvas :event="event" :is-single-day="isSingleDay" :target-date="targetDate" />
    </BaseDrawer>
</template>

<script setup lang="ts">
import { CalendarDays } from '@lucide/vue';

import type { PogoEvent } from '@/utils/eventTypes';

import BaseDrawer from '@/components/BaseDrawer.vue';
import EventDetailOffcanvas from '@/components/Calendar/EventDetailOffcanvas.vue';

withDefaults(
    defineProps<{
        show: boolean;
        event?: PogoEvent;
        isSingleDay?: boolean;
        targetDate?: string;
    }>(),
    {
        event: undefined,
        isSingleDay: false,
        targetDate: undefined,
    },
);

const emit = defineEmits<{
    close: [];
}>();
</script>
