import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { STORAGE_KEYS } from '@/constants/storage';

export interface UserMessage {
    id: string;
    version: string;
    type: 'info' | 'success' | 'warning' | 'danger';
    content: string;
    dismissible: boolean;
}

export const useUserMessagesStore = defineStore('userMessages', () => {
    const dismissedVersions = useLocalStorage<Record<string, string>>(STORAGE_KEYS.DISMISSED_MESSAGE_VERSIONS, {});
    const runtimeMessages = ref<UserMessage[]>([]);

    const messages: UserMessage[] = [
        {
            id: 'welcome-message',
            version: '2025-10-17-001',
            type: 'info',
            content: 'Configure your Calendar and Event Settings using the <strong>Settings cog</strong> in the top right.',
            dismissible: true,
        },
    ];

    const activeMessages = computed(() => {
        const staticMessages = messages.filter(message => {
            const dismissedVersion = dismissedVersions.value[message.id];
            return !dismissedVersion || dismissedVersion !== message.version;
        });

        const activeRuntimeMessages = runtimeMessages.value.filter(message => {
            const dismissedVersion = dismissedVersions.value[message.id];
            return !dismissedVersion || dismissedVersion !== message.version;
        });

        return [...staticMessages, ...activeRuntimeMessages];
    });

    function dismissMessage(id: string, version: string) {
        // check if it's a runtime message - just remove it from the array
        const runtimeIndex = runtimeMessages.value.findIndex(msg => msg.id === id);
        if (runtimeIndex !== -1) {
            runtimeMessages.value.splice(runtimeIndex, 1);
            return;
        }

        // for static messages, persist the dismissal
        dismissedVersions.value[id] = version;
    }

    function addRuntimeMessage(message: Omit<UserMessage, 'version'>) {
        const messageWithVersion: UserMessage = {
            ...message,
            version: '1', // version doesn't matter since dismissals aren't persisted
        };

        // avoid duplicates
        const exists = runtimeMessages.value.some(msg => msg.id === message.id);
        if (!exists) {
            runtimeMessages.value.push(messageWithVersion);
        }
    }

    return {
        activeMessages,
        dismissMessage,
        addRuntimeMessage,
    };
});
