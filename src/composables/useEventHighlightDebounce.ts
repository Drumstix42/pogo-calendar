import { useEventHighlightStore } from '@/stores/eventHighlight';

const HIGHLIGHT_DELAY_MS = 200;

interface Options {
    // Gate both setting and clearing the highlight (e.g. only when a sidebar is visible).
    // Defaults to always-on.
    guard?: () => boolean;
}

// Debounced cross-component event highlighting. Each caller gets its own pending timeout,
// so instances don't clobber each other's hover state.
export function useEventHighlightDebounce(options: Options = {}) {
    const eventHighlight = useEventHighlightStore();
    const guard = options.guard ?? (() => true);

    let highlightTimeout: number | null = null;

    function debouncedHighlightEventID(eventID: string) {
        if (highlightTimeout) {
            clearTimeout(highlightTimeout);
        }

        highlightTimeout = setTimeout(() => {
            if (guard()) {
                eventHighlight.highlightEventID(eventID);
            }
            highlightTimeout = null;
        }, HIGHLIGHT_DELAY_MS);
    }

    function debouncedClearEventIDHighlight() {
        if (highlightTimeout) {
            clearTimeout(highlightTimeout);
            highlightTimeout = null;
        }

        if (guard()) {
            eventHighlight.clearEventIDHighlight();
        }
    }

    return { debouncedHighlightEventID, debouncedClearEventIDHighlight };
}
