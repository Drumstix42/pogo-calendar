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

    // Reliable touch device detection
    const isTouchDevice = computed(() => {
        const hasOntouchstart = 'ontouchstart' in window;
        const hasMaxTouchPoints = navigator.maxTouchPoints > 0;
        const hasMsMaxTouchPoints = (navigator as any).msMaxTouchPoints > 0;

        // Primary detection: Mobile user agent patterns
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

        // Secondary detection: Touch capability without hover support
        const hasTouchCapability = hasOntouchstart || hasMaxTouchPoints || hasMsMaxTouchPoints;

        // Return true if mobile user agent OR (touch capable AND can't hover)
        // This handles cases where hover detection might be unreliable on some devices
        return isMobileUserAgent || (hasTouchCapability && !canHover.value);
    });

    return {
        isTouchDevice,
    };
}
