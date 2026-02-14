/**
 * @miconvert/image-watermark
 * Text watermark renderer — handles fonts, stroke, shadow, and responsive scaling.
 * Automatically loads the correct font for the text's language/script.
 */

import { TextWatermarkOptions } from './types';
import { degreesToRadians, getResponsiveMultiplier } from './utils';
import { calculatePosition } from './position';
import { ensureFontForText } from './font-loader';

/**
 * Measure and draw a text watermark at the specified position on the canvas.
 * Automatically detects the text script and loads a matching Google Noto font.
 */
export async function drawTextWatermark(
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
        shadowColor = 'rgba(0, 0, 0, 0.5)',
        shadowBlur = 4,
        shadowOffsetX = 2,
        shadowOffsetY = 2,
        position = 'bottom-right',
        padding = 20,
        offsetX = 0,
        offsetY = 0,
        opacity = 1,
        rotate = 0,
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

    // Set font
    ctx.font = `${fontStyle} ${fontWeight} ${scaledFontSize}px ${resolvedFontFamily}`;

    // Measure text
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = scaledFontSize;

    // Calculate position
    const { x, y } = calculatePosition(
        canvas.width,
        canvas.height,
        textWidth,
        textHeight,
        position,
        padding,
        offsetX,
        offsetY
    );

    // Center point for rotation
    const cx = x + textWidth / 2;
    const cy = y + textHeight / 2;

    // Apply transforms
    ctx.globalAlpha = opacity;
    if (rotate !== 0) {
        ctx.translate(cx, cy);
        ctx.rotate(degreesToRadians(rotate));
        ctx.translate(-cx, -cy);
    }

    // Shadow
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = shadowOffsetX;
    ctx.shadowOffsetY = shadowOffsetY;

    // Stroke (outline) — drawn first so fill sits on top
    if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, x, y + textHeight * 0.85);
    }

    // Fill
    ctx.fillStyle = color;
    ctx.fillText(text, x, y + textHeight * 0.85);

    ctx.restore();
}

/**
 * Measure text dimensions for positioning calculations.
 */
export function measureText(
    ctx: CanvasRenderingContext2D,
    text: string,
    fontSize: number,
    fontFamily: string,
    fontWeight: string,
    fontStyle: string
): { width: number; height: number } {
    ctx.save();
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    ctx.restore();
    return { width: metrics.width, height: fontSize };
}
