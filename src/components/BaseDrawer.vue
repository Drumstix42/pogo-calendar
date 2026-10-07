<template>
    <Teleport to="body">
        <Transition name="offcanvas-fade">
            <div v-if="show" class="drawer-backdrop" @click="emit('close')">
                <div class="offcanvas offcanvas-bottom show drawer-panel" @click.stop>
                    <div v-if="title || $slots.title" class="offcanvas-header">
                        <h5 class="offcanvas-title mb-0 d-flex align-items-center gap-2">
                            <slot name="title">{{ title }}</slot>
                        </h5>
                        <button class="btn btn-icon-ghost btn-sm drawer-close" :aria-label="closeLabel" @click="emit('close')">
                            <X :size="16" />
                        </button>
                    </div>
                    <slot />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { X } from '@lucide/vue';

interface Props {
    show: boolean;
    /** Plain-text header title; use the `title` slot for icons or richer content. No header without either. */
    title?: string;
    closeLabel?: string;
}

withDefaults(defineProps<Props>(), {
    title: undefined,
    closeLabel: 'Close',
});

const emit = defineEmits<{
    close: [];
}>();
</script>

<style scoped>
.offcanvas-header {
    background-color: var(--bs-tertiary-bg);
    border-bottom: 1px solid var(--bs-border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
}

.offcanvas-title {
    font-weight: 600;
    color: var(--bs-body-color);
}

.drawer-close {
    padding: 0.37rem;
}

.drawer-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1070;
    display: flex;
    align-items: flex-end;
    backdrop-filter: blur(2px);
}

.drawer-panel {
    position: relative;
    width: 100%;
    height: auto;
    min-height: 40vh;
    max-height: 80dvh;
    border: none;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
    background-color: var(--bs-body-bg);
    display: flex;
    flex-direction: column;
    /* iOS safe area support */
    padding-bottom: env(safe-area-inset-bottom);
}

/* Bottom offcanvas slide-up animation */
.offcanvas-fade-enter-active .drawer-panel {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.offcanvas-fade-enter-from .drawer-panel {
    transform: translateY(100%);
}

.offcanvas-fade-enter-to .drawer-panel {
    transform: translateY(0);
}

.offcanvas-fade-leave-active .drawer-panel {
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.6, 1);
}

.offcanvas-fade-leave-from .drawer-panel {
    transform: translateY(0);
}

.offcanvas-fade-leave-to .drawer-panel {
    transform: translateY(100%);
}
</style>
