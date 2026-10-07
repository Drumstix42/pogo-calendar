<template>
    <BaseDrawer :show="show" close-label="Close raid boss details" @close="emit('close')">
        <template #title>
            <CalendarDays :size="16" class="flex-grow-0" />
            Current Raid Bosses
        </template>
        <CurrentRaidBossesOffcanvas />
    </BaseDrawer>
</template>

<script setup lang="ts">
import { CalendarDays } from '@lucide/vue';

import BaseDrawer from '@/components/BaseDrawer.vue';
import CurrentRaidBossesOffcanvas from '@/components/CurrentRaidBossesOffcanvas.vue';

defineProps<{
    show: boolean;
}>();

const emit = defineEmits<{
    close: [];
}>();
</script>
