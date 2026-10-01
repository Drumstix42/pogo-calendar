// Keyed by the full candidate list, so a changed Pokemon name (a different list) loads fresh while
// re-renders of the same one reuse the result - including a known failure, so the fallback chain's
// 404s aren't re-requested every time. Holding the promise also dedupes overlapping renders.
const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

// Tries image URLs in order, resolving with the first that actually loads (or null if all fail).
// `crossOrigin` is required so a canvas that later draws this image isn't tainted - only hosts that
// send permissive CORS headers work here (GitHub's raw content CDN does).
export function loadFirstAvailableImage(urls: string[]): Promise<HTMLImageElement | null> {
    const cacheKey = urls.join('\n');
    const cached = imageCache.get(cacheKey);
    if (cached) return cached;

    const loading = new Promise<HTMLImageElement | null>(resolve => {
        function tryNext(index: number) {
            if (index >= urls.length) {
                resolve(null);
                return;
            }

            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.onload = () => resolve(image);
            image.onerror = () => tryNext(index + 1);
            image.src = urls[index];
        }

        tryNext(0);
    });

    imageCache.set(cacheKey, loading);
    return loading;
}
