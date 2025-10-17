<template>
    <div v-if="userMessages.activeMessages.length > 0" class="user-messages-container">
        <Transition name="message-slide">
            <div v-if="showMessages">
                <div v-for="message in userMessages.activeMessages" :key="`${message.id}-${message.version}`" class="user-message-wrapper">
                    <div :class="['alert', `alert-${message.type}`, 'd-flex', 'align-items-start', 'mb-2']" role="alert">
                        <div class="message-icon me-3">
                            <Info v-if="message.type === 'info'" :size="20" />
                            <CheckCircle2 v-else-if="message.type === 'success'" :size="20" />
                            <AlertTriangle v-else-if="message.type === 'warning'" :size="20" />
                            <AlertCircle v-else-if="message.type === 'danger'" :size="20" />
                        </div>
                        <div class="message-content flex-grow-1" v-html="message.content"></div>
                        <button
                            v-if="message.dismissible"
                            type="button"
                            class="btn-close ms-3"
                            aria-label="Dismiss message"
                            @click="handleDismiss(message.id, message.version)"
                        ></button>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-vue-next';
import { nextTick, onMounted, ref } from 'vue';

import { useUserMessagesStore } from '@/stores/userMessages';

const userMessages = useUserMessagesStore();
const showMessages = ref(false);

onMounted(async () => {
    if (userMessages.activeMessages.length > 0) {
        let scrollRestoration: ScrollRestoration;

        // bypass auto scrolling.
        if ('scrollRestoration' in history) {
            scrollRestoration = history.scrollRestoration;
            history.scrollRestoration = 'manual';
        }

        await nextTick();

        window.scrollTo({ top: 0, behavior: 'smooth' });

        setTimeout(() => {
            showMessages.value = true;

            // restore scroll restoration setting
            if ('scrollRestoration' in history) {
                history.scrollRestoration = scrollRestoration;
            }
        }, 500);
    }
});

function handleDismiss(id: string, version: string) {
    userMessages.dismissMessage(id, version);
}
</script>

<style scoped>
.user-messages-container {
    padding-top: 1rem;
    min-height: 0;
}

.user-message-wrapper {
    margin-bottom: 0;
}

.alert {
    border-radius: 0.375rem;
    padding: 0.75rem 1rem;
    margin-bottom: 0;
    border-left: 3px solid currentColor;
}

.message-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding-top: 0.125rem;
}

.message-content {
    font-size: 0.9375rem;
    line-height: 1.5;
}

.message-content :deep(strong) {
    font-weight: 600;
}

.btn-close {
    flex-shrink: 0;
    padding: 0.5rem;
    margin: -0.25rem -0.5rem -0.25rem 0;
}

.message-slide-enter-active {
    transition: all 0.3s ease-out;
}

.message-slide-leave-active {
    transition: all 0.3s ease-in;
}

.message-slide-enter-from {
    opacity: 0;
    transform: translateY(-1rem);
}

.message-slide-leave-to {
    opacity: 0;
    transform: translateY(-0.5rem);
}

@media (max-width: 575.98px) {
    .message-content {
        font-size: 0.875rem;
    }

    .alert {
        padding: 0.625rem 0.75rem;
    }

    .message-icon {
        margin-right: 0.5rem !important;
    }
}
</style>
