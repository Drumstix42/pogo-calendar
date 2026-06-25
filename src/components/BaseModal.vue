<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="show" class="modal-backdrop" :class="{ 'is-scrollable': scrollable }" @click="handleBackdropClick">
                <div class="modal-dialog" @click.stop>
                    <div class="modal-content">
                        <!-- Modal Header -->
                        <div class="modal-header">
                            <h5 class="modal-title">{{ title }}</h5>
                            <button type="button" class="btn btn-icon-ghost" aria-label="Close" @click="close">
                                <X :size="20" />
                            </button>
                        </div>

                        <!-- Modal Body -->
                        <div class="modal-body">
                            <slot />
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { X } from '@lucide/vue';
import { onBeforeUnmount, watch } from 'vue';

import { setElementInert } from '@/utils/dom';

interface Props {
    show: boolean;
    title: string;
    /** Enables the scrollable layout (vertical-overflow backdrop + flex body) for tall content. */
    scrollable?: boolean;
    /** Optional selector to mark `inert` while the modal is open (e.g. an offcanvas with a focus trap). */
    inertSelector?: string;
}

interface Emits {
    (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

function close() {
    emit('close');
}

function handleBackdropClick() {
    close();
}

function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !event.defaultPrevented && props.show) {
        close();
    }
}

// When opened from within a focus-trapping container (e.g. an offcanvas), that trap fights the
// modal for focus. Marking the container `inert` while the modal is open suspends its trap; the
// inert state mirrors the modal's visibility.
function updateInertTarget(inert: boolean) {
    if (props.inertSelector) {
        setElementInert(document.querySelector(props.inertSelector), inert);
    }
}

watch(
    () => props.show,
    newShow => {
        if (newShow) {
            window.addEventListener('keydown', handleKeydown);
        } else {
            window.removeEventListener('keydown', handleKeydown);
        }
        updateInertTarget(newShow);
    },
    { immediate: true },
);

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown);
    // Ensure we clean up inert if the component unmounts while the modal is open
    updateInertTarget(false);
});
</script>

<style scoped>
/* Modal backdrop */
.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10055;
    backdrop-filter: blur(2px);
}

.modal-backdrop.is-scrollable {
    overflow-y: auto;
    padding: 1rem 0;
}

/* Modal dialog */
.modal-dialog {
    max-width: 500px;
    width: 90%;
    margin: 1rem;
}

.modal-backdrop.is-scrollable .modal-dialog {
    margin: auto;
    max-height: calc(100vh - 2rem);
    display: flex;
    flex-direction: column;
}

/* Modal content */
.modal-content {
    background-color: var(--bs-body-bg);
    border: 1px solid var(--bs-border-color);
    border-radius: 0.5rem;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.modal-backdrop.is-scrollable .modal-content {
    max-height: 100%;
    display: flex;
    flex-direction: column;
}

/* Modal header */
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--bs-border-color);
}

.modal-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--bs-body-color);
}

/* Modal body */
.modal-body {
    padding: 1.25rem;
}

.modal-backdrop.is-scrollable .modal-body {
    overflow-y: auto;
    flex: 1;
    min-height: 0;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.2s ease;
}

.modal-enter-active .modal-dialog,
.modal-leave-active .modal-dialog {
    transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-from .modal-dialog,
.modal-leave-to .modal-dialog {
    transform: scale(0.95);
}

/* Responsive adjustments */
@media (max-width: 576px) {
    .modal-dialog {
        width: 95%;
        margin: 0.5rem;
    }
}
</style>
