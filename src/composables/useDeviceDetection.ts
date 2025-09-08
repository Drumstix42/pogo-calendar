import { useMediaQuery } from '@vueuse/core';
import { computed } from 'vue';

/**
 * Composable for detecting touch devices and hover capabilities.
 *
 * Uses a combination of user agent detection and touch/hover capability detection
 * to reliably identify touch devices across different browsers and platforms.
 */
export function useDeviceDetection() {
    const canHover = useMediaQuery('(hover: hover)');
    const hasCoarsePointer = useMediaQuery('(pointer: coarse)');
    const hasFinePointer = useMediaQuery('(pointer: fine)');

    // Touch device detection based on pointer capability
    const isTouchDevice = computed(() => {
        // Primary detection: coarse pointer indicates touch input
        if (hasCoarsePointer.value) {
            return true;
        }

        // Secondary detection: fine pointer with hover capability indicates mouse/trackpad
        if (hasFinePointer.value && canHover.value) {
            return false;
        }

        // Fallback to user agent detection if pointer queries are not supported
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

        return isMobileUserAgent;
    });

    return {
        isTouchDevice,
    };
}
