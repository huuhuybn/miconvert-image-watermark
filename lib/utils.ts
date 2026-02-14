/**
 * @miconvert/image-watermark
 * Utility helpers
 */

/**
 * iOS Safari canvas size limit (~16.7 megapixels).
 * 4K (3840×2160 = 8.3MP) is fine, but camera photos (6000×4000 = 24MP) will
 * silently fail or crash Safari. We downscale to stay within safe limits.
 *
 * @see https://github.com/brianium/watermarkjs/issues/62
 * @see https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit/
 */
const MAX_CANVAS_AREA = 16_777_216;

/**
 * Calculate safe canvas dimensions that won't crash iOS Safari.
 * If the image exceeds 16.7 megapixels, it is proportionally downscaled.
 */
export function getSafeCanvasSize(
    w: number,
    h: number
): { width: number; height: number; scaled: boolean } {
    const area = w * h;
    if (area <= MAX_CANVAS_AREA) {
        return { width: w, height: h, scaled: false };
    }
    const ratio = Math.sqrt(MAX_CANVAS_AREA / area);
    return {
        width: Math.floor(w * ratio),
        height: Math.floor(h * ratio),
        scaled: true,
    };
}

/**
 * Release canvas memory. Safari hoards canvas memory (~384MB max on iOS 15)
 * and doesn't release it when canvas elements go out of scope.
 * This trick forces Safari to free the GPU memory.
 *
 * @see https://pqina.nl/blog/total-canvas-memory-use-exceeds-the-maximum-limit/
 */
export function releaseCanvas(canvas: HTMLCanvasElement): void {
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, 1, 1);
}

/**
 * Load an image from a URL string and return an HTMLImageElement.
 */
export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () =>
            reject(new Error(`[miconvert] Failed to load watermark image: ${url}`));
        img.src = url;
    });
}

/**
 * Load an image from a File or Blob and return an HTMLImageElement.
 */
export function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('[miconvert] Failed to load watermark image from Blob'));
        };
        img.src = url;
    });
}

/**
 * Resolve a watermark image source (URL, File, Blob, or HTMLImageElement)
 * into a ready-to-draw HTMLImageElement.
 */
export async function resolveImage(
    source?: string,
    element?: File | Blob | HTMLImageElement
): Promise<HTMLImageElement> {
    if (element) {
        if (element instanceof HTMLImageElement) {
            if (!element.complete || element.naturalWidth === 0) {
                return new Promise((resolve, reject) => {
                    element.onload = () => resolve(element);
                    element.onerror = () =>
                        reject(new Error('[miconvert] Provided HTMLImageElement failed to load'));
                });
            }
            return element;
        }
        // File or Blob
        return loadImageFromBlob(element);
    }

    if (source) {
        return loadImageFromUrl(source);
    }

    throw new Error('[miconvert] No image source provided. Set "source" (URL) or "imageElement".');
}

/**
 * Load a File or Blob as an HTMLImageElement, draw it on a new canvas,
 * and return the canvas. Automatically downscales if the image exceeds
 * the iOS Safari canvas size limit (16.7 megapixels).
 */
export async function fileToCanvas(file: File | Blob): Promise<HTMLCanvasElement> {
    // SSR guard — this function requires a browser environment
    if (typeof document === 'undefined') {
        throw new Error('[miconvert] This library requires a browser environment (DOM). Cannot run in Node.js/SSR.');
    }

    const img = await loadImageFromBlob(file);
    const { width, height, scaled } = getSafeCanvasSize(img.naturalWidth, img.naturalHeight);

    if (scaled) {
        console.warn(
            `[miconvert] Image (${img.naturalWidth}×${img.naturalHeight} = ${(img.naturalWidth * img.naturalHeight / 1e6).toFixed(1)}MP) ` +
            `exceeds iOS Safari canvas limit (16.7MP). Auto-downscaled to ${width}×${height}.`
        );
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('[miconvert] Failed to get 2D context');
    ctx.drawImage(img, 0, 0, width, height);
    return canvas;
}

/**
 * Export a canvas to a Blob.
 * Includes detailed error information if the export fails (common on iOS
 * when canvas exceeds memory limits).
 */
export function canvasToBlob(
    canvas: HTMLCanvasElement,
    type = 'image/png',
    quality = 0.92
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        try {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error(
                            `[miconvert] Canvas export failed for type "${type}" ` +
                            `(canvas size: ${canvas.width}×${canvas.height}). ` +
                            `This may be caused by canvas size limits on mobile browsers (iOS Safari max ~16.7MP).`
                        ));
                    }
                },
                type,
                quality
            );
        } catch (err) {
            reject(new Error(
                `[miconvert] Canvas export threw an error for type "${type}": ` +
                (err instanceof Error ? err.message : String(err))
            ));
        }
    });
}

/**
 * Convert degrees to radians.
 */
export function degreesToRadians(deg: number): number {
    return (deg * Math.PI) / 180;
}

/**
 * Clamp a value between min and max.
 */
export function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
}

/**
 * Calculate the responsive scale multiplier.
 * Scales sizes proportionally: on a 1920px-wide image, multiplier = scale.
 * On a 3840px (4K) image, multiplier ≈ 2 × scale.
 */
export function getResponsiveMultiplier(canvasWidth: number, scale?: number): number {
    if (scale === undefined || scale <= 0) return 1;
    return (canvasWidth / 1920) * scale;
}
