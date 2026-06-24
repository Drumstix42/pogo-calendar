<template>
    <Teleport to="body">
        <Transition name="offcanvas-fade">
            <div v-if="show" class="calendar-options-backdrop" @click="emit('close')">
                <div class="offcanvas offcanvas-end show calendar-options-offcanvas" @click.stop>
                    <CalendarOptions @close="emit('close')" />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import CalendarOptions from '@/components/CalendarOptions/CalendarOptions.vue';

defineProps<{
    show: boolean;
}>();

const emit = defineEmits<{
    close: [];
}>();
</script>

<style scoped>
.calendar-options-backdrop {
    z-index: 1045;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(0.5px);
}

.calendar-options-offcanvas {
    z-index: 1050;
    width: 100%;
    max-width: 400px;
    border: none;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
    background-color: var(--bs-body-bg);
}

@media (max-width: 575.98px) {
    .calendar-options-offcanvas {
        /* Mobile: full width */
        max-width: 100%;
    }
}

/* Offcanvas slide-in animation */
.offcanvas-fade-enter-active .calendar-options-offcanvas {
    transition: transform 0.3s ease-in-out;
}

.offcanvas-fade-enter-from .calendar-options-offcanvas {
    transform: translateX(100%);
}

.offcanvas-fade-enter-to .calendar-options-offcanvas {
    transform: translateX(0);
}

.offcanvas-fade-leave-active .calendar-options-offcanvas {
    transition: transform 0.3s ease-in-out;
}

.offcanvas-fade-leave-from .calendar-options-offcanvas {
    transform: translateX(0);
}

.offcanvas-fade-leave-to .calendar-options-offcanvas {
    transform: translateX(100%);
}
</style>
