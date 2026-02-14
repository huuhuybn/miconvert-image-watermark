/**
 * @miconvert/image-watermark
 * Image/logo watermark renderer — handles auto-resize and aspect ratio.
 */

import { ImageWatermarkOptions } from './types';
import { resolveImage, degreesToRadians, getResponsiveMultiplier } from './utils';
import { calculatePosition } from './position';

/**
 * Draw an image/logo watermark on the canvas.
 * Automatically scales the logo proportionally to the canvas width.
 */
export async function drawImageWatermark(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    options: ImageWatermarkOptions
): Promise<void> {
    const {
        source,
        imageElement,
        width: widthFraction = 0.15,
        position = 'bottom-right',
        padding = 20,
        offsetX = 0,
        offsetY = 0,
        opacity = 1,
        rotate = 0,
        scale,
    } = options;

    // Load watermark image
    const wmImage = await resolveImage(source, imageElement);

    // Calculate watermark dimensions
    const multiplier = getResponsiveMultiplier(canvas.width, scale);
    const targetWidth = canvas.width * widthFraction * (scale !== undefined ? multiplier : 1);
    const aspectRatio = wmImage.naturalHeight / wmImage.naturalWidth;
    const wmW = Math.round(targetWidth);
    const wmH = Math.round(targetWidth * aspectRatio);

    // Calculate position
    const { x, y } = calculatePosition(
        canvas.width,
        canvas.height,
        wmW,
        wmH,
        position,
        padding,
        offsetX,
        offsetY
    );

    ctx.save();

    // Apply opacity
    ctx.globalAlpha = opacity;

    // Apply rotation around watermark center
    if (rotate !== 0) {
        const cx = x + wmW / 2;
        const cy = y + wmH / 2;
        ctx.translate(cx, cy);
        ctx.rotate(degreesToRadians(rotate));
        ctx.translate(-cx, -cy);
    }

    // Draw the watermark image
    ctx.drawImage(wmImage, x, y, wmW, wmH);

    ctx.restore();
}
