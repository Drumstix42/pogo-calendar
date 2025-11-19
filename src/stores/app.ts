import { defineStore } from 'pinia';
import { ref } from 'vue';

import { useUserMessagesStore } from '@/stores/userMessages';

interface VersionInfo {
    timestamp: number;
    timestampFormatted: string;
}

// dev mode: set to true to force show update message on load
const DEV_FORCE_UPDATE_MESSAGE = true;

export const useAppStore = defineStore('app', () => {
    const currentVersion = ref<number | null>(null);
    const isOutdated = ref(false);

    async function loadVersion() {
        try {
            const response = await fetch(`/version.json?t=${Date.now()}`);
            if (!response.ok) {
                console.warn('Failed to fetch version.json');
                return;
            }

            const data: VersionInfo = await response.json();

            if (currentVersion.value === null) {
                // first load - store the version
                currentVersion.value = data.timestamp;
                console.log('[AppStore] Version loaded:', data.timestampFormatted);

                // dev mode: force show update message for testing
                if (import.meta.env.DEV && DEV_FORCE_UPDATE_MESSAGE) {
                    console.log('[AppStore] Dev mode - forcing update message');
                    showUpdateMessage();
                }
            } else if (data.timestamp > currentVersion.value) {
                // newer version detected
                console.log('[AppStore] New version detected!');
                isOutdated.value = true;
                showUpdateMessage();
            }
        } catch (error) {
            console.warn('Error checking app version:', error);
        }
    }

    function showUpdateMessage() {
        const userMessages = useUserMessagesStore();

        // check if message already exists
        const messageExists = userMessages.activeMessages.some(msg => msg.id === 'app-update-available');

        if (!messageExists) {
            userMessages.addRuntimeMessage({
                id: 'app-update-available',
                type: 'info',
                content:
                    'A new version of the app is available. Please <strong><a href="#" onclick="window.location.reload(true); return false;">reload the page</a></strong>.',
                dismissible: true,
            });
        }
    }

    // dev mode: expose helper to console for testing
    if (import.meta.env.DEV) {
        (window as any).__triggerVersionCheck = () => {
            console.log('Triggering version check...');
            loadVersion();
        };
        (window as any).__forceUpdateMessage = () => {
            console.log('Forcing update message...');
            showUpdateMessage();
        };
    }

    return {
        currentVersion,
        isOutdated,
        loadVersion,
    };
});
