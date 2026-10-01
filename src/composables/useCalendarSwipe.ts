import { tryOnScopeDispose, useEventListener, usePreferredReducedMotion, useSwipe } from '@vueuse/core';
import { type MaybeRefOrGetter, computed, nextTick, shallowRef, toValue } from 'vue';

import { useMonthNavigation } from '@/composables/useMonthNavigation';

// Movement before the gesture's axis is decided (browser-like touch slop).
const AXIS_LOCK_DISTANCE = 10;
// Horizontal movement must clearly dominate so diagonal scrolling never changes the month.
const AXIS_LOCK_RATIO = 1.5;
// iOS/Android reserve screen edges for back/forward swipes — and "back" changes the month here too.
const EDGE_EXCLUSION_PX = 20;
const COMMIT_DISTANCE_RATIO = 0.25;
const FLICK_VELOCITY = 0.35; // px/ms
const FLICK_MIN_DISTANCE = 30;
const VELOCITY_WINDOW_MS = 100;
const BOUNDARY_RESISTANCE = 0.3;
const SLIDE_OUT_MS = 160;
const SLIDE_IN_MS = 220;
const SPRING_BACK_MS = 200;
const MAX_FADE = 0.4;

type GestureState = 'pending' | 'horizontal' | 'ignored';
type Direction = 1 | -1; // 1 = finger moving right (previous month), -1 = left (next month)

/**
 * Touch swipe left/right on the calendar to change months, with the grid following the finger
 * and sliding out/in on commit. Returns a style to bind on the element that should move.
 */
export function useCalendarSwipe(target: MaybeRefOrGetter<HTMLElement | null | undefined>) {
    const { isPreviousDisabled, isNextDisabled, goToPreviousMonth, goToNextMonth } = useMonthNavigation();
    const reducedMotion = usePreferredReducedMotion();

    const offsetX = shallowRef(0);
    const transitionMs = shallowRef(0);
    let gesture: GestureState = 'ignored';
    let isSliding = false;
    let samples: { dx: number; t: number }[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;

    const { lengthX, lengthY } = useSwipe(target, {
        threshold: AXIS_LOCK_DISTANCE,
        onSwipeStart(e) {
            const x = e.touches[0].clientX;
            const isNearEdge = x < EDGE_EXCLUSION_PX || x > window.innerWidth - EDGE_EXCLUSION_PX;
            gesture = isSliding || isNearEdge ? 'ignored' : 'pending';
            samples = [];
        },
        onSwipe(e) {
            const dx = -lengthX.value;
            if (gesture === 'pending') {
                gesture = Math.abs(dx) > Math.abs(lengthY.value) * AXIS_LOCK_RATIO ? 'horizontal' : 'ignored';
            }
            if (gesture !== 'horizontal') {
                return;
            }

            clearTimeout(timer);
            transitionMs.value = 0;
            offsetX.value = isBlocked(dx) ? dx * BOUNDARY_RESISTANCE : dx;

            samples.push({ dx, t: e.timeStamp });
            samples = samples.filter(sample => e.timeStamp - sample.t <= VELOCITY_WINDOW_MS);
        },
        onSwipeEnd(e) {
            if (gesture !== 'horizontal') {
                return;
            }
            gesture = 'ignored';

            const dx = -lengthX.value;
            const direction: Direction = dx > 0 ? 1 : -1;
            if (e.type !== 'touchcancel' && !isBlocked(dx) && isCommitGesture(dx)) {
                slideToMonth(direction);
            } else {
                animateTo(0, SPRING_BACK_MS);
            }
        },
    });

    // A second finger means pinch-zoom, not a swipe.
    useEventListener(
        target,
        'touchstart',
        (e: TouchEvent) => {
            if (e.touches.length < 2) {
                return;
            }
            if (gesture === 'horizontal') {
                animateTo(0, SPRING_BACK_MS);
            }
            gesture = 'ignored';
        },
        { passive: true },
    );

    function isBlocked(dx: number) {
        return dx > 0 ? isPreviousDisabled.value : isNextDisabled.value;
    }

    function isCommitGesture(dx: number) {
        const width = toValue(target)?.offsetWidth ?? window.innerWidth;
        if (Math.abs(dx) > width * COMMIT_DISTANCE_RATIO) {
            return true;
        }

        const first = samples[0];
        const last = samples[samples.length - 1];
        if (!first || !last || last.t === first.t) {
            return false;
        }
        const velocity = (last.dx - first.dx) / (last.t - first.t);
        // Flick must be in the same direction as the drag (flicking back cancels).
        return Math.abs(velocity) > FLICK_VELOCITY && Math.sign(velocity) === Math.sign(dx) && Math.abs(dx) > FLICK_MIN_DISTANCE;
    }

    function animateTo(x: number, durationMs: number) {
        clearTimeout(timer);
        transitionMs.value = durationMs;
        offsetX.value = x;
        return new Promise<void>(resolve => {
            timer = setTimeout(() => {
                transitionMs.value = 0;
                resolve();
            }, durationMs);
        });
    }

    async function slideToMonth(direction: Direction) {
        const navigate = direction === 1 ? goToPreviousMonth : goToNextMonth;
        if (reducedMotion.value === 'reduce') {
            navigate();
            offsetX.value = 0;
            transitionMs.value = 0;
            return;
        }

        const width = toValue(target)?.offsetWidth ?? window.innerWidth;
        isSliding = true;
        await animateTo(direction * width, SLIDE_OUT_MS);

        // Swap months while off-screen so the new month's render cost is hidden, then park it on
        // the opposite side and let it paint before sliding in.
        navigate();
        offsetX.value = -direction * width;
        await nextTick();
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        await animateTo(0, SLIDE_IN_MS);
        isSliding = false;
    }

    tryOnScopeDispose(() => clearTimeout(timer));

    const swipeStyle = computed(() => {
        if (offsetX.value === 0 && transitionMs.value === 0) {
            return undefined;
        }

        const width = toValue(target)?.offsetWidth || window.innerWidth;
        const fade = Math.min(Math.abs(offsetX.value) / width, 1) * MAX_FADE;
        const transition = transitionMs.value ? `transform ${transitionMs.value}ms ease-out, opacity ${transitionMs.value}ms ease-out` : 'none';

        return {
            transform: `translate3d(${offsetX.value}px, 0, 0)`,
            opacity: 1 - fade,
            transition,
            willChange: 'transform, opacity',
        };
    });

    return { swipeStyle };
}
