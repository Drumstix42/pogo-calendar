<template>
    <CollapsibleSection title="Raid Bosses" storage-key="calendarSettings/raid-bosses">
        <div class="form-check form-switch">
            <input
                id="showCurrentRaidBosses"
                class="form-check-input"
                type="checkbox"
                role="switch"
                :checked="calendarSettings.showCurrentRaidBosses"
                @change="handleToggleChange"
            />
            <label for="showCurrentRaidBosses" class="form-check-label">Show current raid bosses</label>
        </div>
        <small class="text-muted mt-1 d-block">Displays a summary of the current raid bosses above the calendar.</small>
    </CollapsibleSection>
</template>

<script setup lang="ts">
import { useCalendarSettingsStore } from '@/stores/calendarSettings';

import CollapsibleSection from '@/components/CollapsibleSection.vue';

const calendarSettings = useCalendarSettingsStore();

const handleToggleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    calendarSettings.setShowCurrentRaidBosses(target.checked);
};
</script>
