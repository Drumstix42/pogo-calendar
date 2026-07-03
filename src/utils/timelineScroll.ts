// Buffer below a sticky timeline header so an expanded card isn't parked under it.
export const TIMELINE_TITLE_BUFFER_PX = 56;

// Walk up the DOM for the nearest vertically-scrollable ancestor, falling back to the window.
export function getScrollContainer(element: HTMLElement): Window | HTMLElement {
    let parent = element.parentElement;

    while (parent) {
        const overflowY = window.getComputedStyle(parent).overflowY;
        const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight;

        if (isScrollable) {
            return parent;
        }

        parent = parent.parentElement;
    }

    return window;
}

// Smooth-scroll a card into view within its scroll container, accounting for the sticky-header buffer.
export function scrollCardIntoView(eventCard: HTMLElement): void {
    const container = getScrollContainer(eventCard);
    const cardRect = eventCard.getBoundingClientRect();

    const viewTop = container instanceof HTMLElement ? container.getBoundingClientRect().top : 0;
    const viewBottom = container instanceof HTMLElement ? container.getBoundingClientRect().bottom : window.innerHeight;
    const effectiveViewTop = viewTop + TIMELINE_TITLE_BUFFER_PX;
    const viewHeight = viewBottom - effectiveViewTop;

    const isOutOfView = cardRect.top < effectiveViewTop || cardRect.bottom > viewBottom;
    if (!isOutOfView) {
        return;
    }

    let delta: number;

    // If content is taller than viewport, align top; otherwise align bottom.
    if (cardRect.height > viewHeight) {
        delta = cardRect.top - effectiveViewTop;
    } else {
        delta = cardRect.bottom - viewBottom;
    }

    if (container === window) {
        window.scrollBy({ top: delta, behavior: 'smooth' });
    } else {
        container.scrollBy({ top: delta, behavior: 'smooth' });
    }
}
