import { tryOnScopeDispose, useEventListener, usePreferredReducedMotion, useSwipe } from '@vueuse/core';
import { type MaybeRefOrGetter, computed, shallowRef, toValue } from 'vue';

// Movement before the axis is decided. Must stay under the browser's touch slop (~8px in Chrome),
// after which it starts scrolling and touchmove can no longer be canceled.
const AXIS_LOCK_DISTANCE = 5;
// Horizontal movement must clearly dominate so diagonal scrolling never changes the month.
const AXIS_LOCK_RATIO = 1.5;
// iOS/Android reserve screen edges for back/forward swipes — and "back" changes the month here too.
const EDGE_EXCLUSION_PX = 20;
const COMMIT_DISTANCE_RATIO = 0.25;
const FLICK_VELOCITY = 0.35; // px/ms
const FLICK_MIN_DISTANCE = 30;
const VELOCITY_WINDOW_MS = 100;
const BOUNDARY_RESISTANCE = 0.3;
const SLIDE_MS = 220;
const SPRING_BACK_MS = 200;

type GestureState = 'pending' | 'horizontal' | 'ignored';
/** Month offset a swipe reveals: -1 = previous (finger moving right), 1 = next (finger moving left). */
export type SwipeMonthOffset = -1 | 1;

interface CalendarSwipeOptions {
    canSwipe: (offset: SwipeMonthOffset) => boolean;
    /** Called when the slide lands; must swap the displayed month synchronously so the reset frame shows it. */
    onCommit: (offset: SwipeMonthOffset) => void;
}

/** Touch swipe left/right on the calendar to change months; `swipeStyle` translates a track holding the neighbor months. */
export function useCalendarSwipe(target: MaybeRefOrGetter<HTMLElement | null | undefined>, { canSwipe, onCommit }: CalendarSwipeOptions) {
    const reducedMotion = usePreferredReducedMotion();

    const offsetX = shallowRef(0);
    const transitionMs = shallowRef(0);
    /** Neighbor currently being dragged toward (0 = none). */
    const revealingOffset = shallowRef<SwipeMonthOffset | 0>(0);
    /** From axis lock until the slide/spring-back settles. */
    const isSwiping = shallowRef(false);
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

            const offset = toMonthOffset(dx);
            clearTimeout(timer);
            isSwiping.value = true;
            revealingOffset.value = offset;
            transitionMs.value = 0;
            offsetX.value = canSwipe(offset) ? dx : dx * BOUNDARY_RESISTANCE;

            samples.push({ dx, t: e.timeStamp });
            samples = samples.filter(sample => e.timeStamp - sample.t <= VELOCITY_WINDOW_MS);
        },
        onSwipeEnd(e) {
            if (gesture !== 'horizontal') {
                return;
            }
            gesture = 'ignored';

            const dx = -lengthX.value;
            const offset = toMonthOffset(dx);
            if (e.type !== 'touchcancel' && canSwipe(offset) && isCommitGesture(dx)) {
                slideToMonth(offset);
            } else {
                springBack();
            }
        },
    });

    // Claim locked swipes so the browser doesn't also pan the page; its leftover fling would swallow
    // the next tap. Registered after useSwipe's listener so the lock is decided for this event.
    useEventListener(
        target,
        'touchmove',
        (e: TouchEvent) => {
            if (gesture === 'horizontal' && e.cancelable) {
                e.preventDefault();
            }
        },
        { passive: false },
    );

    // A second finger means pinch-zoom, not a swipe.
    useEventListener(
        target,
        'touchstart',
        (e: TouchEvent) => {
            if (e.touches.length < 2) {
                return;
            }
            if (gesture === 'horizontal') {
                springBack();
            }
            gesture = 'ignored';
        },
        { passive: true },
    );

    function toMonthOffset(dx: number): SwipeMonthOffset {
        return dx > 0 ? -1 : 1;
    }

    function getWidth() {
        return toValue(target)?.offsetWidth || window.innerWidth;
    }

    function isCommitGesture(dx: number) {
        if (Math.abs(dx) > getWidth() * COMMIT_DISTANCE_RATIO) {
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

    async function springBack() {
        await animateTo(0, SPRING_BACK_MS);
        revealingOffset.value = 0;
        isSwiping.value = false;
    }

    async function slideToMonth(offset: SwipeMonthOffset) {
        if (reducedMotion.value !== 'reduce') {
            isSliding = true;
            await animateTo(-offset * getWidth(), SLIDE_MS);
        }

        onCommit(offset);
        transitionMs.value = 0;
        offsetX.value = 0;
        revealingOffset.value = 0;
        isSliding = false;
        isSwiping.value = false;
    }

    tryOnScopeDispose(() => clearTimeout(timer));

    const swipeStyle = computed(() => {
        if (offsetX.value === 0 && transitionMs.value === 0) {
            return undefined;
        }

        return {
            transform: `translate3d(${offsetX.value}px, 0, 0)`,
            transition: transitionMs.value ? `transform ${transitionMs.value}ms ease-out` : 'none',
            willChange: 'transform',
        };
    });

    /** How far the track has moved toward the neighbor, 0–1 (reaches 1 as a committed slide lands). */
    const swipeProgress = computed(() => Math.min(Math.abs(offsetX.value) / getWidth(), 1));

    return { swipeStyle, swipeProgress, transitionMs, revealingOffset, isSwiping };
}
