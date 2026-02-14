/**
 * @miconvert/image-watermark
 * Text watermark renderer — handles fonts, stroke, shadow, responsive scaling,
 * and multiline text (canvas fillText ignores \n by default).
 *
 * @see https://github.com/brianium/watermarkjs/issues/65 (multiline bug)
 */

import { TextWatermarkOptions } from './types';
import { degreesToRadians, getResponsiveMultiplier } from './utils';
import { calculatePosition } from './position';
import { ensureFontForText } from './font-loader';

/**
 * Draw a single line of text with stroke and fill.
 */
function drawTextLine(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    strokeColor?: string,
    strokeWidth = 2
): void {
    // Stroke (outline) — drawn first so fill sits on top
    if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, x, y);
    }

    // Fill
    ctx.fillText(text, x, y);
}

/**
 * Measure and draw a text watermark at the specified position on the canvas.
 * Supports multiline text (split by \n).
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
        lineHeight: customLineHeight,
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

    // Handle multiline text — canvas fillText() ignores \n
    const lines = text.split('\n');
    const lineH = customLineHeight ?? scaledFontSize * 1.3;

    // Measure the bounding box of all lines
    let maxLineWidth = 0;
    for (const line of lines) {
        const metrics = ctx.measureText(line);
        if (metrics.width > maxLineWidth) maxLineWidth = metrics.width;
    }
    const totalHeight = lineH * lines.length;

    // Calculate position using the full bounding box
    const { x, y } = calculatePosition(
        canvas.width,
        canvas.height,
        maxLineWidth,
        totalHeight,
        position,
        padding,
        offsetX,
        offsetY
    );

    // Center point for rotation
    const cx = x + maxLineWidth / 2;
    const cy = y + totalHeight / 2;

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

    // Draw each line
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    for (let i = 0; i < lines.length; i++) {
        const lineY = y + i * lineH;
        drawTextLine(ctx, lines[i], x, lineY, strokeColor, strokeWidth);
    }

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
    const lines = text.split('\n');
    let maxWidth = 0;
    for (const line of lines) {
        const metrics = ctx.measureText(line);
        if (metrics.width > maxWidth) maxWidth = metrics.width;
    }
    ctx.restore();
    return { width: maxWidth, height: fontSize * 1.3 * lines.length };
}
