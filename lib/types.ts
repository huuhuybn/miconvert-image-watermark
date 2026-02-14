/**
 * @miconvert/image-watermark
 * Type definitions
 */

/**
 * 9 named anchor positions + tiled mode.
 */
export type WatermarkPosition =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'center-left'
    | 'center'
    | 'center-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';

/**
 * Watermark rendering mode.
 * - 'single': Draw watermark at one position (default)
 * - 'tiled': Repeat watermark across entire image (anti-crop protection)
 */
export type WatermarkMode = 'single' | 'tiled';

/**
 * Font weight for text watermarks.
 */
export type FontWeight = 'normal' | 'bold' | 'lighter' | 'bolder';

/**
 * Font style for text watermarks.
 */
export type FontStyle = 'normal' | 'italic' | 'oblique';

/**
 * Common watermark options shared by both text and image types.
 */
export interface WatermarkBaseOptions {
    /** Position of the watermark (9 anchor points). Default: 'bottom-right' */
    position?: WatermarkPosition;

    /** Rendering mode: 'single' or 'tiled'. Default: 'single' */
    mode?: WatermarkMode;

    /** Opacity of the watermark (0.0–1.0). Default: 1.0 */
    opacity?: number;

    /** Rotation angle in degrees. Default: 0 */
    rotate?: number;

    /** Padding from image edges in pixels. Default: 20 */
    padding?: number;

    /** Additional horizontal offset in pixels. Default: 0 */
    offsetX?: number;

    /** Additional vertical offset in pixels. Default: 0 */
    offsetY?: number;

    /** Horizontal spacing between tiles in pixels (tiled mode only). Default: 100 */
    tileSpacingX?: number;

    /** Vertical spacing between tiles in pixels (tiled mode only). Default: 80 */
    tileSpacingY?: number;

    /**
     * Responsive scale factor relative to canvas width.
     * When set, sizes are multiplied by (canvasWidth / 1920) × scale.
     * Default: undefined (no responsive scaling)
     */
    scale?: number;

    /** Output image MIME type. Default: same as input or 'image/png' */
    outputType?: string;

    /** Output image quality (0–1), for JPEG/WebP. Default: 0.92 */
    outputQuality?: number;
}

/**
 * Options specific to text watermarks.
 */
export interface TextWatermarkOptions extends WatermarkBaseOptions {
    type: 'text';

    /** The text content to render. */
    text: string;

    /** Font family. Default: 'Arial, Helvetica, sans-serif' */
    fontFamily?: string;

    /** Font size in pixels (before scaling). Default: 48 */
    fontSize?: number;

    /** Font weight. Default: 'bold' */
    fontWeight?: FontWeight;

    /** Font style. Default: 'normal' */
    fontStyle?: FontStyle;

    /** Text fill color (CSS color string). Default: 'rgba(255,255,255,0.5)' */
    color?: string;

    /** Stroke (outline) color. Default: undefined (no stroke) */
    strokeColor?: string;

    /** Stroke width in pixels. Default: 2 */
    strokeWidth?: number;

    /** Shadow color. Default: 'rgba(0,0,0,0.5)' */
    shadowColor?: string;

    /** Shadow blur radius. Default: 4 */
    shadowBlur?: number;

    /** Shadow horizontal offset. Default: 2 */
    shadowOffsetX?: number;

    /** Shadow vertical offset. Default: 2 */
    shadowOffsetY?: number;
}

/**
 * Options specific to image/logo watermarks.
 */
export interface ImageWatermarkOptions extends WatermarkBaseOptions {
    type: 'image';

    /** URL of the watermark logo image. */
    source?: string;

    /** Watermark image as a File, Blob, or HTMLImageElement. */
    imageElement?: File | Blob | HTMLImageElement;

    /**
     * Width of the watermark as a fraction of the canvas width (0.0–1.0).
     * For example, 0.15 means the logo occupies 15% of the image width.
     * Default: 0.15
     */
    width?: number;
}

/**
 * Union type for all watermark options.
 */
export type WatermarkOptions = TextWatermarkOptions | ImageWatermarkOptions;
