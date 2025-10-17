import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed } from 'vue';

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
        return messages.filter(message => {
            const dismissedVersion = dismissedVersions.value[message.id];
            return !dismissedVersion || dismissedVersion !== message.version;
        });
    });

    function dismissMessage(id: string, version: string) {
        dismissedVersions.value[id] = version;
    }

    return {
        activeMessages,
        dismissMessage,
    };
});
