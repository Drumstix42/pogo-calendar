import { type Ref, nextTick, onMounted, ref } from 'vue';

const SCROLL_SHADOW_THRESHOLD_PX = 5;
const INITIAL_MEASURE_DELAY_MS = 50;

// Tracks whether a scroll container has content hidden above/below the fold, driving the
// global `.scroll-shadow-hints` gradient affordances. The caller owns the template ref and
// passes it in; bind `@scroll="updateScrollState"` and toggle `can-scroll-up`/`can-scroll-down`.
export function useScrollShadow(elementRef: Ref<HTMLElement | null | undefined>) {
    const canScrollUp = ref(false);
    const canScrollDown = ref(false);

    function updateScrollState() {
        const element = elementRef.value;
        if (!element) return;

        const { scrollTop, scrollHeight, clientHeight } = element;

        canScrollUp.value = scrollTop > SCROLL_SHADOW_THRESHOLD_PX;
        canScrollDown.value = scrollTop < scrollHeight - clientHeight - SCROLL_SHADOW_THRESHOLD_PX;
    }

    onMounted(() => {
        nextTick(() => {
            setTimeout(updateScrollState, INITIAL_MEASURE_DELAY_MS);
        });
    });

    return { canScrollUp, canScrollDown, updateScrollState };
}
