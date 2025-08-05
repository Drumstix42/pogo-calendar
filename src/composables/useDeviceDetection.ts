import { useMediaQuery } from '@vueuse/core';
import { computed } from 'vue';

/**
 * Composable for detecting touch devices and hover capabilities
 */
export function useDeviceDetection() {
    const canHover = useMediaQuery('(hover: hover)');

    // Comprehensive touch device detection
    const isTouchDevice = computed(() => {
        return (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            // @ts-ignore - some browsers have this
            navigator.msMaxTouchPoints > 0 ||
            !canHover.value
        );
    });

    return {
        isTouchDevice,
    };
}
