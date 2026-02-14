/**
 * @miconvert/image-watermark
 * Tiled watermark pattern — repeats watermark across the entire image.
 * Anti-crop protection: impossible to remove by simple cropping.
 */

import { TextWatermarkOptions, ImageWatermarkOptions } from './types';
import { degreesToRadians, getResponsiveMultiplier, resolveImage } from './utils';
import { ensureFontForText } from './font-loader';

/**
 * Draw a tiled text watermark pattern across the entire canvas.
 * Each tile is rotated and spaced evenly in a grid pattern.
 */
export async function drawTiledText(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    options: TextWatermarkOptions
): Promise<void> {
    const {
        text,
        fontFamily: userFontFamily,
        fontSize = 48,
        fontWeight = 'bold',
        fontStyle = 'normal',
        color = 'rgba(255, 255, 255, 0.5)',
        strokeColor,
        strokeWidth = 2,
        shadowColor = 'rgba(0, 0, 0, 0.3)',
        shadowBlur = 2,
        shadowOffsetX = 1,
        shadowOffsetY = 1,
        opacity = 0.3,
        rotate = -45,
        tileSpacingX = 100,
        tileSpacingY = 80,
        scale,
    } = options;

    // Auto-load the best font for the text's language
    const resolvedFontFamily = await ensureFontForText(
        text,
        userFontFamily,
        String(fontWeight === 'bold' ? '700' : '400')
    );

    ctx.save();

    // Responsive font size
    const multiplier = getResponsiveMultiplier(canvas.width, scale);
    const scaledFontSize = Math.max(12, Math.round(fontSize * multiplier));
    const scaledSpacingX = tileSpacingX * multiplier;
    const scaledSpacingY = tileSpacingY * multiplier;

    ctx.font = `${fontStyle} ${fontWeight} ${scaledFontSize}px ${resolvedFontFamily}`;
    ctx.globalAlpha = opacity;

    // Handle multiline text — canvas fillText() ignores \n
    const lines = text.split('\n');
    const lineH = scaledFontSize * 1.3;

    // Measure widest line for tile width
    let maxLineWidth = 0;
    for (const line of lines) {
        const w = ctx.measureText(line).width;
        if (w > maxLineWidth) maxLineWidth = w;
    }
    const tileW = maxLineWidth + scaledSpacingX;
    const tileH = lineH * lines.length + scaledSpacingY;

    // Shadow
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = shadowOffsetX;
    ctx.shadowOffsetY = shadowOffsetY;

    // Calculate grid bounds — expand to cover rotated area
    const diagonal = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);
    const startX = -diagonal / 2;
    const startY = -diagonal / 2;
    const endX = canvas.width + diagonal / 2;
    const endY = canvas.height + diagonal / 2;

    // Move to canvas center, rotate, then draw grid
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate(degreesToRadians(rotate));
    ctx.translate(-centerX, -centerY);

    ctx.textBaseline = 'top';

    for (let y = startY; y < endY; y += tileH) {
        for (let x = startX; x < endX; x += tileW) {
            for (let i = 0; i < lines.length; i++) {
                const lineY = y + i * lineH;

                // Stroke
                if (strokeColor) {
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = strokeWidth;
                    ctx.lineJoin = 'round';
                    ctx.strokeText(lines[i], x, lineY);
                }

                // Fill
                ctx.fillStyle = color;
                ctx.fillText(lines[i], x, lineY);
            }
        }
    }

    ctx.restore();
}

/**
 * Draw a tiled image watermark pattern across the entire canvas.
 */
export async function drawTiledImage(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    options: ImageWatermarkOptions
): Promise<void> {
    const {
        source,
        imageElement,
        width: widthFraction = 0.1,
        opacity = 0.3,
        rotate = -45,
        tileSpacingX = 100,
        tileSpacingY = 80,
        scale,
    } = options;

    const wmImage = await resolveImage(source, imageElement);

    ctx.save();

    // Calculate tile size
    const multiplier = getResponsiveMultiplier(canvas.width, scale);
    const targetWidth = canvas.width * widthFraction * (scale !== undefined ? multiplier : 1);
    const aspectRatio = wmImage.naturalHeight / wmImage.naturalWidth;
    const wmW = Math.round(targetWidth);
    const wmH = Math.round(targetWidth * aspectRatio);

    const scaledSpacingX = tileSpacingX * multiplier;
    const scaledSpacingY = tileSpacingY * multiplier;

    const tileW = wmW + scaledSpacingX;
    const tileH = wmH + scaledSpacingY;

    ctx.globalAlpha = opacity;

    // Calculate grid bounds
    const diagonal = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);
    const startX = -diagonal / 2;
    const startY = -diagonal / 2;
    const endX = canvas.width + diagonal / 2;
    const endY = canvas.height + diagonal / 2;

    // Rotate around center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate(degreesToRadians(rotate));
    ctx.translate(-centerX, -centerY);

    for (let y = startY; y < endY; y += tileH) {
        for (let x = startX; x < endX; x += tileW) {
            ctx.drawImage(wmImage, x, y, wmW, wmH);
        }
    }

    ctx.restore();
}
