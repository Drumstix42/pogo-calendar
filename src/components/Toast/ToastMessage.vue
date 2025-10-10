<template>
    <div
        class="toast-message"
        :class="[`toast-${toast.type}`, { 'toast-paused': isPaused }]"
        :style="{ boxShadow: toast.color ? `0 1px 10px 2px color-mix(in srgb, ${toast.color} 30%, transparent)` : '' }"
        @mouseenter="resetAndPauseTimer"
        @mouseleave="resetTimer"
    >
        <!-- Color indicator bar for event types -->
        <div v-if="toast.color" class="toast-color-indicator" :style="{ backgroundColor: toast.color }"></div>

        <!-- Toast body -->
        <div class="toast-body">
            <div class="toast-content-row">
                <div class="toast-text">
                    <div class="mb-1 small" v-html="toast.title"></div>
                    <div class="toast-text--message" v-html="toast.message"></div>
                </div>
                <div class="toast-right-section">
                    <button
                        v-if="toast.actions && toast.actions.length > 0"
                        v-for="action in toast.actions"
                        :key="action.label"
                        type="button"
                        class="undo-btn btn btn-icon-ghost btn-sm"
                        @click="handleAction(action)"
                    >
                        Undo
                    </button>
                    <button type="button" class="btn btn-icon-ghost btn-sm" @click="closeToast" aria-label="Close">
                        <X :size="16" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Progress bar -->
        <div class="toast-progress-container">
            <div
                class="toast-progress-bar"
                :style="{
                    width: `${progressPercentage}%`,
                }"
            ></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next';
import { computed, onMounted, onUnmounted, ref } from 'vue';

import type { ToastAction, ToastMessage } from '@/stores/toasts';

interface Props {
    toast: ToastMessage;
}

interface Emits {
    (e: 'remove', id: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const startTime = ref<number>(0);
const elapsedTime = ref<number>(0);
const isPaused = ref<boolean>(false);
const isComplete = ref<boolean>(false);
let animationFrame: number | null = null;

const progressPercentage = computed(() => {
    if (!props.toast.duration || isComplete.value) return 0;
    const percentage = Math.max(0, 100 - (elapsedTime.value / props.toast.duration) * 100);
    return percentage;
});

const startTimer = () => {
    if (!props.toast.duration) return;

    startTime.value = Date.now();
    elapsedTime.value = 0;
    isPaused.value = false;
    isComplete.value = false;
    updateProgress();
};

const updateProgress = () => {
    if (!props.toast.duration || isComplete.value) return;

    if (!isPaused.value) {
        elapsedTime.value = Date.now() - startTime.value;

        if (elapsedTime.value >= props.toast.duration) {
            isComplete.value = true;
            closeToast();
            return;
        }
    }

    animationFrame = requestAnimationFrame(updateProgress);
};

const resetTimer = () => {
    if (isComplete.value) return;

    startTime.value = Date.now();
    elapsedTime.value = 0;
    isPaused.value = false;
};

const resetAndPauseTimer = () => {
    resetTimer();
    isPaused.value = true;
};

// Action handlers
const closeToast = () => {
    isComplete.value = true;
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    emit('remove', props.toast.id);
};

const handleAction = (action: ToastAction) => {
    action.action();
    // Close toast immediately after any action (including undo)
    closeToast();
};

// Lifecycle
onMounted(() => {
    startTimer();
});

onUnmounted(() => {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
});
</script>

<style lang="scss" scoped>
.toast-message {
    pointer-events: auto;
    background: var(--calendar-cell-bg);
    border: 1px solid var(--bs-border-color-translucent);
    border-radius: 0.375rem;
    position: relative;
    overflow: hidden;
    min-width: 250px;
}

/* Color indicator bar */
.toast-color-indicator {
    position: absolute;
    top: 0;
    left: 0;
    width: 5px;
    height: 100%;
    z-index: 1;
}

/* Toast header */
.toast-header {
    padding: 0.75rem 1rem 0.5rem;
    background: transparent;
    border-bottom: none;
}

.toast-title-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.toast-title {
    font-size: 0.875rem;
    color: var(--bs-body-color);
    margin: 0;
}

/* Toast body */
.toast-body {
    padding: 0.65rem 1rem;
    font-size: 0.875rem;
    line-height: 1;
    color: var(--bs-primary-color);
}

.toast-content-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.toast-text {
    flex: 1;
    min-width: 0;

    .toast-text--message {
        font-weight: 500;
        line-height: 1.3;
    }
}

.toast-right-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
}

.undo-btn {
    padding: 0.15rem 0.5rem;
}

.toast-action-link:hover {
    color: var(--bs-primary-dark, #0056b3);
    text-decoration: none;
}

/* Progress bar */
.toast-progress-container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--bs-secondary-bg);
    overflow: hidden;
}

.toast-progress-bar {
    height: 100%;
    background: rgba(var(--bs-secondary-rgb), 0.7); /* Bootstrap's secondary color - nice dark theme color */
    transition: width 100ms linear;
    opacity: 0.8;
}

.toast-paused .toast-progress-bar {
    transition: none;
}

/* Toast type styling */
.toast-success {
    border-left: 4px solid var(--bs-success);
}

.toast-warning {
    border-left: 4px solid var(--bs-warning);
}

.toast-info {
    border-left: 4px solid var(--bs-info);
}

.toast-error {
    border-left: 4px solid var(--bs-danger);
}

/* When there's a color indicator, hide the type border */
.toast-message:has(.toast-color-indicator) {
    border-left: none;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .toast-message {
        min-width: 280px;
    }

    .toast-actions {
        flex-wrap: wrap;
    }

    .toast-actions .btn {
        flex: 1;
        min-width: fit-content;
    }
}
</style>
