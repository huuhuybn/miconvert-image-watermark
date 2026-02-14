/**
 * @miconvert/image-watermark
 * Utility helpers
 */

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
 * and return the canvas.
 */
export async function fileToCanvas(file: File | Blob): Promise<HTMLCanvasElement> {
    const img = await loadImageFromBlob(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('[miconvert] Failed to get 2D context');
    ctx.drawImage(img, 0, 0);
    return canvas;
}

/**
 * Export a canvas to a Blob.
 */
export function canvasToBlob(
    canvas: HTMLCanvasElement,
    type = 'image/png',
    quality = 0.92
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('[miconvert] Canvas export to Blob failed'));
                }
            },
            type,
            quality
        );
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
