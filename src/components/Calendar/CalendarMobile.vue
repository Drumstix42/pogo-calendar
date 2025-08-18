<template>
    <div class="calendar-mobile">
        <!-- Mini Calendar -->
        <div class="mini-calendar-section">
            <MiniCalendar />
        </div>

        <!-- Divider -->
        <hr class="my-3" />

        <!-- Event Timeline -->
        <div class="event-timeline-section">
            <EventTimeline />
        </div>
    </div>
</template>

<script setup lang="ts">
import EventTimeline from './EventTimeline.vue';
import MiniCalendar from './MiniCalendar.vue';
</script>

<style scoped>
.calendar-mobile {
    padding: 0 4px;
}

.mini-calendar-section {
    margin-bottom: 8px;
}
</style>
