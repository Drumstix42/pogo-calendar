<template>
    <Teleport to="body">
        <Transition name="offcanvas-fade">
            <div v-if="show" class="event-detail-backdrop" @click="emit('close')">
                <div class="offcanvas offcanvas-bottom show event-detail-offcanvas" @click.stop>
                    <EventDetailOffcanvas :event="event" :is-single-day="isSingleDay" :target-date="targetDate" @close="emit('close')" />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import type { PogoEvent } from '@/utils/eventTypes';

import EventDetailOffcanvas from '@/components/Calendar/EventDetailOffcanvas.vue';

withDefaults(
    defineProps<{
        show: boolean;
        event?: PogoEvent;
        isSingleDay?: boolean;
        targetDate?: string;
    }>(),
    {
        event: undefined,
        isSingleDay: false,
        targetDate: undefined,
    },
);

const emit = defineEmits<{
    close: [];
}>();
</script>

<style scoped>
.event-detail-backdrop {
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

.event-detail-offcanvas {
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
.offcanvas-fade-enter-active .event-detail-offcanvas {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.offcanvas-fade-enter-from .event-detail-offcanvas {
    transform: translateY(100%);
}

.offcanvas-fade-enter-to .event-detail-offcanvas {
    transform: translateY(0);
}

.offcanvas-fade-leave-active .event-detail-offcanvas {
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.6, 1);
}

.offcanvas-fade-leave-from .event-detail-offcanvas {
    transform: translateY(0);
}

.offcanvas-fade-leave-to .event-detail-offcanvas {
    transform: translateY(100%);
}
</style>
