<template>
    <CollapsibleSection title="Local Timezone Override" :storage-key="manualOffsetStorageKey">
        <label for="manualTimeOffsetHours" class="form-label">Displayed event time adjustment</label>
        <small class="text-muted d-block mb-2 fst-italic">For participating/traveling across time zones.</small>

        <div class="manual-offset-controls">
            <button
                type="button"
                class="btn btn-stepper btn-sm"
                :disabled="manualOffsetHours <= -14"
                @click="decrementManualOffset"
                aria-label="Decrease display time offset by one hour"
            >
                -1
            </button>

            <input
                id="manualTimeOffsetHours"
                class="form-range"
                type="range"
                min="-14"
                max="14"
                step="0.5"
                :value="manualOffsetHours"
                @input="handleManualOffsetInput"
            />

            <button
                type="button"
                class="btn btn-stepper btn-sm"
                :disabled="manualOffsetHours >= 14"
                @click="incrementManualOffset"
                aria-label="Increase display time offset by one hour"
            >
                +1
            </button>
        </div>

        <div class="d-flex align-items-center justify-content-center mt-1">
            <button
                type="button"
                class="manual-offset-chip"
                :class="{ active: manualOffsetHours !== 0 }"
                :disabled="manualOffsetHours === 0"
                aria-label="Reset timezone override to local time"
                @click="resetManualOffset"
            >
                <span class="manual-offset-dot" :class="{ active: manualOffsetHours !== 0 }"></span>
                <span aria-live="polite">{{ localManualOffsetLabel() }}</span>
            </button>
        </div>

        <small class="text-muted d-block mt-2"
            >Display time: <strong>{{ adjustedNowLabel() }}</strong> ({{ effectiveTimezoneLabel() }})</small
        >

        <button v-if="calendarSettings.hasManualTimeOffset" type="button" class="btn btn-link btn-sm fw-bold p-0 mt-1" @click="resetManualOffset">
            Reset to local time
        </button>
    </CollapsibleSection>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core';
import dayjs from 'dayjs';
import { ref, watch } from 'vue';

import { useCurrentTime } from '@/composables/useCurrentTime';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { formatManualOffsetLabel, getEffectiveTimezoneLabel } from '@/utils/timezoneLabel';

import CollapsibleSection from '@/components/CollapsibleSection.vue';

const calendarSettings = useCalendarSettingsStore();
const { liveMinute } = useCurrentTime();

const manualOffsetHours = ref(calendarSettings.manualTimeOffsetHours);
const manualOffsetStorageKey = 'calendarSettings/event-options-time-override';

const debouncedUpdateManualOffset = useDebounceFn((offset: number) => {
    calendarSettings.setManualTimeOffsetHours(offset);
}, 150);

watch(
    () => calendarSettings.manualTimeOffsetHours,
    newValue => {
        if (manualOffsetHours.value !== newValue) {
            manualOffsetHours.value = newValue;
        }
    },
);

const adjustedNowLabel = () => {
    return dayjs(liveMinute.value)
        .add(manualOffsetHours.value * 60, 'minute')
        .format('ddd, MMM D h:mma')
        .replace(':00', '');
};

const effectiveTimezoneLabel = () => {
    return getEffectiveTimezoneLabel(manualOffsetHours.value);
};

const localManualOffsetLabel = () => formatManualOffsetLabel(manualOffsetHours.value);

function applyManualOffset(nextOffset: number) {
    manualOffsetHours.value = nextOffset;
    debouncedUpdateManualOffset(nextOffset);
}

function decrementManualOffset() {
    applyManualOffset(manualOffsetHours.value - 1);
}

function incrementManualOffset() {
    applyManualOffset(manualOffsetHours.value + 1);
}

function handleManualOffsetInput(event: Event) {
    const target = event.target as HTMLInputElement;
    applyManualOffset(Number(target.value));
}

function resetManualOffset() {
    calendarSettings.resetManualTimeOffsetHours();
}

watch(
    () => calendarSettings.manualTimeOffsetHours,
    value => {
        if (value !== 0 && calendarSettings.isCollapsibleSectionCollapsed(manualOffsetStorageKey)) {
            calendarSettings.setCollapsibleSection(manualOffsetStorageKey, false);
        }
    },
    { immediate: true },
);
</script>

<style scoped>
.form-label {
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0;
}

.manual-offset-controls {
    display: grid;
    grid-template-columns: 2.5rem 1fr 2.5rem;
    align-items: center;
    gap: 0.5rem;
}

.btn-stepper {
    border: 1px solid color-mix(in srgb, var(--bs-border-color) 75%, transparent);
    background-color: color-mix(in srgb, var(--bs-tertiary-bg) 85%, transparent);
    color: var(--bs-body-color);
    font-weight: 600;
    line-height: 1;
    padding: 0.3rem 0.2rem;
    min-width: 2.5rem;
    transition:
        background-color 0.15s ease,
        border-color 0.15s ease,
        transform 0.08s ease;
}

.btn-stepper:hover:not(:disabled) {
    background-color: var(--bs-secondary-bg);
    border-color: var(--bs-border-color);
}

.btn-stepper:active:not(:disabled) {
    transform: translateY(1px);
}

.btn-stepper:disabled {
    opacity: 0.45;
}

.manual-offset-chip {
    border: 1px solid color-mix(in srgb, var(--bs-border-color) 70%, transparent);
    border-radius: 0.5rem;
    padding: 0.16rem 0.5rem;
    line-height: 1;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--bs-secondary-color);
    background-color: color-mix(in srgb, var(--bs-tertiary-bg) 80%, transparent);
    min-width: 120px;
    text-align: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    cursor: pointer;
    user-select: none;
    transition:
        background-color 0.15s ease,
        border-color 0.15s ease,
        color 0.15s ease;
}

.manual-offset-chip.active {
    color: var(--bs-body-color);
    border-color: color-mix(in srgb, var(--bs-primary) 35%, var(--bs-border-color));
    background-color: color-mix(in srgb, var(--bs-primary) 9%, var(--bs-tertiary-bg));
}

.manual-offset-chip:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--bs-primary) 45%, var(--bs-border-color));
    background-color: color-mix(in srgb, var(--bs-primary) 14%, var(--bs-tertiary-bg));
}

.manual-offset-chip:disabled {
    cursor: default;
    opacity: 0.8;
}

.manual-offset-dot {
    width: 0.34rem;
    height: 0.34rem;
    border-radius: 50%;
    background-color: var(--bs-border-color);
    opacity: 0.7;
}

.manual-offset-dot.active {
    background-color: var(--bs-primary);
    opacity: 1;
}
</style>
