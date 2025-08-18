<template>
    <div class="animated-images-toggle">
        <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">Animated Images</h6>
        </div>

        <div class="form-check form-switch">
            <input
                id="useAnimatedImages"
                class="form-check-input"
                type="checkbox"
                role="switch"
                :checked="calendarSettings.useAnimatedImages"
                @change="handleToggleChange"
            />
            <label for="useAnimatedImages" class="form-check-label">Use animated Pokémon images</label>
        </div>

        <small class="text-muted d-block mt-1"> When enabled, animated Pokémon sprites will be used in detailed views. </small>
    </div>
</template>

<script setup lang="ts">
import { useCalendarSettingsStore } from '@/stores/calendarSettings';

const calendarSettings = useCalendarSettingsStore();

const handleToggleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    calendarSettings.setUseAnimatedImages(target.checked);
};
</script>

<style scoped>
.animated-images-toggle {
    padding: 1rem;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
}

.form-check-input:checked {
    background-color: #198754;
    border-color: #198754;
}

.form-check-input:focus {
    box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.25);
    border-color: #86b7fe;
}

.form-check-label {
    font-size: 0.9rem;
    font-weight: 500;
}
</style>
