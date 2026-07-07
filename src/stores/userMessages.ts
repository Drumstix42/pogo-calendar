import { useLocalStorage } from '@vueuse/core';
import dayjs from 'dayjs';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { STORAGE_KEYS } from '@/constants/storage';

export interface UserMessage {
    id: string;
    version: string;
    type: 'info' | 'success' | 'warning' | 'danger';
    content: string;
    dismissible: boolean;
    /** ISO date (YYYY-MM-DD) after which the message stops surfacing, regardless of dismissal state. */
    expiresAt?: string;
    /** Whether to show this message to a first-time visitor. Defaults to false (most messages are announcements aimed at returning users). */
    showToNewUsers?: boolean;
}

export const useUserMessagesStore = defineStore('userMessages', () => {
    const dismissedVersions = useLocalStorage<Record<string, string>>(STORAGE_KEYS.DISMISSED_MESSAGE_VERSIONS, {});
    const runtimeMessages = ref<UserMessage[]>([]);

    // Captured once per session, before we mark this browser as visited, so a first-time
    // visitor is treated as "new" for the whole session even if they dismiss something.
    const hasVisitedBefore = useLocalStorage<boolean>(STORAGE_KEYS.HAS_VISITED_BEFORE, false);
    const isNewUser = !hasVisitedBefore.value;
    hasVisitedBefore.value = true;

    const messages: UserMessage[] = [
        {
            id: 'welcome-message',
            version: '2025-10-17-001',
            type: 'info',
            content: 'Configure your Calendar and Event Settings using the <strong>Settings cog</strong> in the top right.',
            dismissible: true,
            showToNewUsers: true,
        },
        {
            id: 'add-to-calendar-message',
            version: '2026-07-07-001',
            type: 'info',
            content:
                'You can now add event reminders to your own calendar. Look for the <strong>bell icon</strong> on detailed event views to add it to your web calendar, or download an .ics file.',
            dismissible: true,
            expiresAt: '2026-09-07',
        },
    ];

    function isMessageActive(message: UserMessage) {
        const dismissedVersion = dismissedVersions.value[message.id];
        if (dismissedVersion === message.version) {
            return false;
        }

        if (isNewUser && !message.showToNewUsers) {
            return false;
        }

        if (message.expiresAt && dayjs().isAfter(dayjs(message.expiresAt), 'day')) {
            return false;
        }

        return true;
    }

    const activeMessages = computed(() => [...messages, ...runtimeMessages.value].filter(isMessageActive));

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
