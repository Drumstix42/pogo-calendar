<template>
    <div class="calendar">
        <div class="container mt-4">
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div
                            class="card-header d-flex justify-content-between align-items-center"
                        >
                            <h2 class="card-title mb-0">Event Calendar</h2>
                            <button
                                class="btn btn-primary"
                                @click="testDataFetch"
                                :disabled="eventsStore.loading"
                            >
                                {{
                                    eventsStore.loading
                                        ? 'Loading...'
                                        : 'Fetch Events'
                                }}
                            </button>
                        </div>
                        <div class="card-body">
                            <div
                                v-if="eventsStore.error"
                                class="alert alert-danger"
                                role="alert"
                            >
                                <strong>Error:</strong> {{ eventsStore.error }}
                            </div>

                            <div
                                v-else-if="eventsStore.events.length > 0"
                                class="alert alert-success"
                                role="alert"
                            >
                                <strong>Success!</strong> Loaded
                                {{ eventsStore.events.length }} events. Current
                                month ({{ currentMonthName }}) has
                                {{ eventsStore.currentMonthEvents.length }}
                                events.
                            </div>

                            <div v-else class="alert alert-info" role="alert">
                                <strong>Ready to test:</strong> Click "Fetch
                                Events" to load Pokemon GO events data.
                            </div>

                            <div v-if="sampleEvents.length > 0" class="mt-3">
                                <h5>
                                    Sample Events for {{ currentMonthName }}:
                                </h5>
                                <div class="row">
                                    <div
                                        v-for="event in sampleEvents"
                                        :key="event.eventID"
                                        class="col-md-6 mb-2"
                                    >
                                        <div class="card">
                                            <div class="card-body py-2">
                                                <h6 class="card-title mb-1">
                                                    {{ event.name }}
                                                </h6>
                                                <small class="text-muted">
                                                    {{ event.eventType }} |
                                                    {{
                                                        formatEventDates(event)
                                                    }}
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import dayjs from 'dayjs';
import { useEventsStore } from '../stores/events';
import { DATE_FORMAT, formatEventDateRange } from '../utils/dateFormat';
import type { PogoEvent } from '../utils/eventTypes';

const eventsStore = useEventsStore();

const currentMonthName = computed(() => {
    return dayjs()
        .year(eventsStore.currentYear)
        .month(eventsStore.currentMonth)
        .format(DATE_FORMAT.MONTH_YEAR);
});

const sampleEvents = computed((): PogoEvent[] => {
    return eventsStore.currentMonthEvents.slice(0, 6);
});

const testDataFetch = async () => {
    await eventsStore.fetchEvents(true);
};

const formatEventDates = (event: PogoEvent): string => {
    return formatEventDateRange(event.start, event.end);
};
</script>
