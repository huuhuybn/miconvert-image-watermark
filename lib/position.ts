/**
 * @miconvert/image-watermark
 * Positioning system — calculates anchor coordinates for 9 named positions.
 */

import { WatermarkPosition } from './types';

/**
 * Calculate (x, y) coordinates for a watermark element on a canvas.
 *
 * @param canvasW  - Canvas width in pixels
 * @param canvasH  - Canvas height in pixels
 * @param wmW      - Watermark element width in pixels
 * @param wmH      - Watermark element height in pixels
 * @param position - Named anchor position
 * @param padding  - Padding from edges in pixels
 * @param offsetX  - Additional horizontal offset
 * @param offsetY  - Additional vertical offset
 */
export function calculatePosition(
    canvasW: number,
    canvasH: number,
    wmW: number,
    wmH: number,
    position: WatermarkPosition = 'bottom-right',
    padding = 20,
    offsetX = 0,
    offsetY = 0
): { x: number; y: number } {
    let x: number;
    let y: number;

    // ----- Horizontal -----
    if (position.includes('left')) {
        x = padding;
    } else if (position.includes('right')) {
        x = canvasW - wmW - padding;
    } else {
        // center column
        x = (canvasW - wmW) / 2;
    }

    // ----- Vertical -----
    if (position.startsWith('top')) {
        y = padding;
    } else if (position.startsWith('bottom')) {
        y = canvasH - wmH - padding;
    } else {
        // center row
        y = (canvasH - wmH) / 2;
    }

    return { x: x + offsetX, y: y + offsetY };
}
