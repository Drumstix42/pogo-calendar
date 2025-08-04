<template>
    <div class="calendar">
        <div class="container mt-4">
            <!-- Month Navigation Header -->
            <CalendarHeader />

            <!-- Calendar Options -->
            <div class="row">
                <div class="col-12">
                    <CalendarOptions />
                </div>
            </div>

            <!-- Calendar Grid Component -->
            <div class="row">
                <div class="col-12">
                    <CalendarGrid />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import { useEventsStore } from '@/stores/events';

import CalendarGrid from '@/components/Calendar/CalendarGrid.vue';
import CalendarHeader from '@/components/Calendar/CalendarHeader.vue';
import CalendarOptions from '@/components/CalendarOptions/CalendarOptions.vue';

const eventsStore = useEventsStore();

// Auto-load events when the page mounts
onMounted(async () => {
    // Only fetch if we don't have fresh data
    if (!eventsStore.hasFreshData) {
        await eventsStore.fetchEvents();
    }
});
</script>
