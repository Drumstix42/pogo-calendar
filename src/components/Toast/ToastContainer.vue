<template>
    <teleport to="body">
        <div class="toast-container">
            <TransitionGroup name="toast" tag="div" class="toast-stack">
                <ToastMessage v-for="toast in toasts" :key="toast.id" :toast="toast" @remove="removeToast" />
            </TransitionGroup>
        </div>
    </teleport>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { useToastsStore } from '@/stores/toasts';

import ToastMessage from './ToastMessage.vue';

const toastsStore = useToastsStore();
const { toasts } = storeToRefs(toastsStore);
const { removeToast } = toastsStore;
</script>

<style scoped>
.toast-container {
    position: fixed;
    top: 4rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20000;
    pointer-events: none; /* Allow clicks to pass through container */
}

.toast-stack {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-width: 350px;
}

/* Individual toast wrapper for better transitions */
.toast-stack > * {
    max-height: 200px; /* Set a reasonable max height for transition */
    overflow: hidden;
}

/* Mobile adjustments */
@media (max-width: 768px) {
    .toast-container {
        top: 4rem; /* Position below mobile header */
    }

    .toast-stack {
        max-width: calc(100vw - 2rem);
        min-width: 280px;
    }
}

/* Toast transition animations */
.toast-enter-active {
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-leave-active {
    transition:
        opacity 0.3s ease-in,
        max-height 0.3s ease-in,
        margin 0.3s ease-in,
        padding 0.3s ease-in;
    overflow: hidden;
}

.toast-enter-from {
    opacity: 0;
    transform: translateY(20px); /* Slide up from below */
}

.toast-leave-to {
    opacity: 0;
    max-height: 0;
    margin-top: 0;
    margin-bottom: 0;
    padding-top: 0;
    padding-bottom: 0;
}

.toast-move {
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
