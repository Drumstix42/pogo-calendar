<template>
    <div class="option-section">
        <div class="d-flex align-items-center">
            <h6 class="section-title me-2">Detailed Views</h6>
            <VTooltip class="d-none d-md-flex align-items-center" placement="top" :delay="{ show: 300, hide: 0 }" distance="8">
                <Info :size="16" class="text-muted" />
                <template #popper>
                    <div class="calendar-options-tooltip-text">{{ tooltipText }}</div>
                </template>
            </VTooltip>
        </div>

        <div class="option-content">
            <div class="toggle-with-image">
                <div class="form-check form-switch">
                    <input
                        id="useAnimatedImages"
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                        :checked="calendarSettings.useAnimatedImages"
                        @change="handleToggleChange"
                    />
                    <label for="useAnimatedImages" class="form-check-label">Animated Pokémon</label>
                </div>
                <div class="image-container">
                    <img
                        :src="
                            calendarSettings.useAnimatedImages
                                ? 'https://raw.githubusercontent.com/mgrann03/pokemon-resources/refs/heads/main/graphics/ani/rillaboom.gif'
                                : 'https://raw.githubusercontent.com/mgrann03/pokemon-resources/refs/heads/main/graphics/pogo/rillaboom.png'
                        "
                        :alt="calendarSettings.useAnimatedImages ? 'Animated Rillaboom' : 'Static Rillaboom'"
                        class="example-image"
                        @click="toggleSetting"
                    />
                    <Transition name="flavor-text" mode="out-in">
                        <div v-if="showFlavorText" :key="flavorTextKey" class="flavor-text" :style="{ color: flavorTextColor }">
                            {{ flavorText }}
                        </div>
                    </Transition>
                </div>
            </div>

            <small class="text-muted d-block mt-2 d-md-none">{{ tooltipText }}</small>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Info } from 'lucide-vue-next';
import { computed, ref } from 'vue';

import { useCalendarSettingsStore } from '@/stores/calendarSettings';

const calendarSettings = useCalendarSettingsStore();

const tooltipText = 'When enabled, Pokémon sprites will be animated in detailed views.';

const showFlavorText = ref(false);
const flavorTextKey = ref(0);
const currentTimeout = ref<number | null>(null);

const flavorTexts = {
    animated: ['🥁 Boom!', '🎵 Rhythm!', '⚡ Energized!'],
    static: ['😴 Zzz...', '💤 Sleepy'],
};

const flavorText = computed(() => {
    const texts = calendarSettings.useAnimatedImages ? flavorTexts.animated : flavorTexts.static;
    return texts[Math.floor(Math.random() * texts.length)];
});

const flavorTextColor = computed(() => {
    return calendarSettings.useAnimatedImages ? '#198754' : '#343a40';
});

const showFlavorTextBriefly = () => {
    // Clear any existing timeout and immediately hide current text
    if (currentTimeout.value) {
        clearTimeout(currentTimeout.value);
        showFlavorText.value = false;
    }

    // Use nextTick to ensure the DOM updates before showing new text, forces the transition to complete immediately
    setTimeout(
        () => {
            showFlavorText.value = true;
            flavorTextKey.value++;
            currentTimeout.value = setTimeout(() => {
                showFlavorText.value = false;
                currentTimeout.value = null;
            }, 750);
        },
        showFlavorText.value ? 50 : 0,
    ); // Small delay if text was showing, immediate if not
};
const handleToggleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    calendarSettings.setUseAnimatedImages(target.checked);
    showFlavorTextBriefly();
};

const toggleSetting = () => {
    calendarSettings.setUseAnimatedImages(!calendarSettings.useAnimatedImages);
    showFlavorTextBriefly();
};
</script>

<style scoped>
.form-check-input:checked {
    background-color: #198754;
    border-color: #198754;
}

.form-check-input:focus {
    box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.25);
    border-color: #86b7fe;
}

.toggle-with-image {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.form-check.form-switch {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.form-check.form-switch {
    display: flex;
    align-items: center;
}

.form-check-input {
    margin-top: 0;
}

.form-check-label {
    font-size: 0.9rem;
    font-weight: 500;
    margin: 0;
    line-height: 1.2;
    cursor: pointer;
}

.example-image {
    width: 48px;
    height: 48px;
    object-fit: contain;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.example-image:hover {
    /* transform: scale(1.05); */
    background-color: rgba(var(--bs-body-color-rgb), 0.03);
}

.flavor-text {
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.75rem;
    font-weight: 600;
    color: #198754;
    text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
    pointer-events: none;
    white-space: nowrap;
    z-index: 10;
}

.image-container {
    position: relative;
}

/* Flavor text transition animations */
.flavor-text-enter-active {
    transition: all 0.3s ease-out;
}

.flavor-text-leave-active {
    transition: all 0.4s ease-in;
}

.flavor-text-enter-from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px) scale(0.8);
}

.flavor-text-enter-to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
}

.flavor-text-leave-from {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
}

.flavor-text-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-15px) scale(0.9);
}
</style>
