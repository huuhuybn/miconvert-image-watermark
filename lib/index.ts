/**
 * @miconvert/image-watermark
 *
 * Add text or logo watermark to images in the browser.
 * Client-side, fast, beautiful — no server needed.
 *
 * @example
 * ```ts
 * import { addWatermark } from '@miconvert/image-watermark';
 *
 * // Text watermark at bottom-right
 * const blob = await addWatermark(file, {
 *   type: 'text',
 *   text: '© Miconvert',
 *   position: 'bottom-right',
 *   color: 'rgba(255,255,255,0.5)',
 *   strokeColor: 'black',
 * });
 *
 * // Logo watermark scaled to 15% of image width
 * const blob = await addWatermark(file, {
 *   type: 'image',
 *   source: './logo.png',
 *   position: 'bottom-right',
 *   width: 0.15,
 *   padding: 20,
 * });
 *
 * // Tiled text pattern (anti-crop protection)
 * const blob = await addWatermark(file, {
 *   type: 'text',
 *   text: 'Bản quyền thuộc Miconvert',
 *   mode: 'tiled',
 *   opacity: 0.3,
 *   rotate: -45,
 * });
 * ```
 */

import { WatermarkOptions, TextWatermarkOptions, ImageWatermarkOptions } from './types';
import { fileToCanvas, canvasToBlob, releaseCanvas } from './utils';
import { drawTextWatermark } from './text-watermark';
import { drawImageWatermark } from './image-watermark';
import { drawTiledText, drawTiledImage } from './tiled';

/**
 * Add a watermark (text or image) to an image file.
 *
 * @param file    - Source image as File or Blob
 * @param options - Watermark configuration
 * @returns       - Watermarked image as Blob
 */
export async function addWatermark(
    file: File | Blob,
    options: WatermarkOptions
): Promise<Blob> {
    if (!file) {
        throw new Error('[miconvert] No source image provided.');
    }

    if (!(file instanceof Blob)) {
        throw new Error('[miconvert] Source must be a File or Blob object.');
    }

    // SSR guard — ensure browser environment
    if (typeof document === 'undefined' || typeof HTMLCanvasElement === 'undefined') {
        throw new Error(
            '[miconvert] This library requires a browser environment with Canvas support. ' +
            'It cannot run in Node.js or SSR. Use dynamic import() or check typeof window before importing.'
        );
    }

    // Load source image onto canvas
    const canvas = await fileToCanvas(file);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('[miconvert] Failed to get 2D canvas context.');
    }

    const mode = options.mode || 'single';

    if (options.type === 'text') {
        if (!options.text) {
            throw new Error('[miconvert] Text watermark requires a "text" property.');
        }

        if (mode === 'tiled') {
            await drawTiledText(ctx, canvas, options);
        } else {
            await drawTextWatermark(ctx, canvas, options);
        }
    } else if (options.type === 'image') {
        if (!options.source && !options.imageElement) {
            throw new Error(
                '[miconvert] Image watermark requires a "source" (URL) or "imageElement" property.'
            );
        }

        if (mode === 'tiled') {
            await drawTiledImage(ctx, canvas, options);
        } else {
            await drawImageWatermark(ctx, canvas, options);
        }
    } else {
        throw new Error(
            `[miconvert] Invalid watermark type. Use "text" or "image".`
        );
    }

    // Determine output format — preserve input MIME type (avoid PNG-only bug)
    const outputType = options.outputType || (file as File).type || 'image/png';
    const outputQuality = options.outputQuality ?? 0.92;

    const result = await canvasToBlob(canvas, outputType, outputQuality);

    // Release canvas memory to prevent Safari memory hoarding.
    // Without this, batch processing will accumulate ~384MB and crash.
    releaseCanvas(canvas);

    return result;
}

// Re-export types for consumers
export type {
    WatermarkOptions,
    TextWatermarkOptions,
    ImageWatermarkOptions,
    WatermarkPosition,
    WatermarkMode,
    WatermarkBaseOptions,
    FontWeight,
    FontStyle,
} from './types';

// Re-export font utilities for advanced usage
export { loadGoogleFont, loadCustomFont, detectScript, ensureFontForText } from './font-loader';
export type { ScriptInfo } from './font-loader';

// Default export
export default addWatermark;
