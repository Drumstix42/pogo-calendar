// Tries image URLs in order, resolving with the first that actually loads (or null if all fail).
// `crossOrigin` is required so a canvas that later draws this image isn't tainted - only hosts that
// send permissive CORS headers work here (GitHub's raw content CDN does).
export function loadFirstAvailableImage(urls: string[]): Promise<HTMLImageElement | null> {
    return new Promise(resolve => {
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
}
