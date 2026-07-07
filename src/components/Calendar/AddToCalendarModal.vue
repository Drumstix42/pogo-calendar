<template>
    <BaseModal :show="show" title="Add to Calendar" @close="closeModal">
        <div class="event-summary mb-3 pb-3 border-bottom">
            <div class="event-summary-name">{{ eventName }}</div>
            <div class="event-summary-dates">{{ eventDateRange }}</div>
        </div>

        <div class="d-grid gap-2">
            <a class="btn btn-primary btn-calendar-provider" :href="googleUrl" target="_blank" rel="noopener" @click="closeModal">
                Google Calendar
                <ExternalLink :size="14" />
            </a>
            <a class="btn btn-primary btn-calendar-provider" :href="outlookComUrl" target="_blank" rel="noopener" @click="closeModal">
                Outlook.com
                <ExternalLink :size="14" />
            </a>
            <a class="btn btn-primary btn-calendar-provider" :href="office365Url" target="_blank" rel="noopener" @click="closeModal">
                Office 365
                <ExternalLink :size="14" />
            </a>
            <a class="btn btn-primary btn-calendar-provider" :href="yahooUrl" target="_blank" rel="noopener" @click="closeModal">
                Yahoo Calendar
                <ExternalLink :size="14" />
            </a>
        </div>

        <div class="d-flex gap-2 mt-3 pt-3 border-top">
            <button type="button" class="btn btn-secondary flex-grow-1" @click="handleDownloadIcs">
                <Download :size="16" class="me-1" />
                Download .ics <span class="ics-btn-note">(Apple Calendar &amp; others)</span>
            </button>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { Download, ExternalLink } from '@lucide/vue';
import { computed } from 'vue';

import { getGoogleCalendarUrl, getOffice365Url, getOutlookComUrl, getYahooCalendarUrl } from '@/utils/calendarLinks';
import { formatEventDateRange } from '@/utils/dateFormat';
import { formatEventName } from '@/utils/eventName';
import type { PogoEvent } from '@/utils/eventTypes';
import { downloadEventIcs } from '@/utils/icsExport';

import BaseModal from '@/components/BaseModal.vue';

interface Props {
    show: boolean;
    event: PogoEvent;
}

interface Emits {
    (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const eventName = computed(() => formatEventName(props.event.name));
const eventDateRange = computed(() => formatEventDateRange(props.event.start, props.event.end));

const googleUrl = computed(() => getGoogleCalendarUrl(props.event));
const outlookComUrl = computed(() => getOutlookComUrl(props.event));
const office365Url = computed(() => getOffice365Url(props.event));
const yahooUrl = computed(() => getYahooCalendarUrl(props.event));

function closeModal() {
    emit('close');
}

function handleDownloadIcs() {
    downloadEventIcs(props.event);
    closeModal();
}
</script>

<style scoped>
.event-summary-name {
    font-weight: 600;
    color: var(--bs-body-color);
}

.event-summary-dates {
    font-size: 0.85rem;
    color: var(--bs-secondary-color);
}

.btn-calendar-provider {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.ics-btn-note {
    opacity: 0.75;
    font-size: 0.85em;
}
</style>
