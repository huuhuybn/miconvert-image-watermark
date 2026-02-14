/**
 * @miconvert/image-watermark
 * Font loading system — ensures text watermarks render correctly in any language.
 *
 * Problem: Canvas fillText() uses only installed system fonts. If a font doesn't
 * support certain characters (Vietnamese diacritics, CJK, Arabic, Devanagari...),
 * they render as □ (tofu boxes).
 *
 * Solution: Auto-detect the text's script and load an appropriate Google Font
 * via the CSS Font Loading API (FontFace). This guarantees correct rendering
 * for ALL languages without requiring users to manually configure fonts.
 */

/**
 * Script detection result.
 */
export interface ScriptInfo {
    script: string;
    googleFont: string;
    fallbackStack: string;
}

/**
 * Map of Unicode ranges → recommended Google Noto fonts.
 * Noto font family is designed to cover ALL languages ("No Tofu").
 */
const SCRIPT_FONTS: Array<{ ranges: Array<[number, number]>; script: string; googleFont: string; fallbackStack: string }> = [
    // CJK — Chinese, Japanese, Korean (most common CJK range)
    {
        ranges: [[0x4E00, 0x9FFF], [0x3400, 0x4DBF], [0x3000, 0x303F], [0xF900, 0xFAFF]],
        script: 'cjk-sc',
        googleFont: 'Noto Sans SC',
        fallbackStack: '"Noto Sans SC", "Microsoft YaHei", "PingFang SC", "SimHei", sans-serif',
    },
    // Japanese Hiragana + Katakana
    {
        ranges: [[0x3040, 0x309F], [0x30A0, 0x30FF], [0x31F0, 0x31FF]],
        script: 'japanese',
        googleFont: 'Noto Sans JP',
        fallbackStack: '"Noto Sans JP", "Yu Gothic", "Hiragino Sans", "Meiryo", sans-serif',
    },
    // Korean Hangul
    {
        ranges: [[0xAC00, 0xD7AF], [0x1100, 0x11FF], [0x3130, 0x318F]],
        script: 'korean',
        googleFont: 'Noto Sans KR',
        fallbackStack: '"Noto Sans KR", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif',
    },
    // Arabic
    {
        ranges: [[0x0600, 0x06FF], [0x0750, 0x077F], [0xFB50, 0xFDFF], [0xFE70, 0xFEFF]],
        script: 'arabic',
        googleFont: 'Noto Sans Arabic',
        fallbackStack: '"Noto Sans Arabic", "Segoe UI", "Tahoma", sans-serif',
    },
    // Devanagari (Hindi, Sanskrit, Marathi)
    {
        ranges: [[0x0900, 0x097F], [0xA8E0, 0xA8FF]],
        script: 'devanagari',
        googleFont: 'Noto Sans Devanagari',
        fallbackStack: '"Noto Sans Devanagari", "Mangal", sans-serif',
    },
    // Bengali
    {
        ranges: [[0x0980, 0x09FF]],
        script: 'bengali',
        googleFont: 'Noto Sans Bengali',
        fallbackStack: '"Noto Sans Bengali", sans-serif',
    },
    // Thai
    {
        ranges: [[0x0E00, 0x0E7F]],
        script: 'thai',
        googleFont: 'Noto Sans Thai',
        fallbackStack: '"Noto Sans Thai", "Leelawadee UI", "Tahoma", sans-serif',
    },
    // Vietnamese (Latin Extended with diacritics)
    {
        ranges: [[0x1EA0, 0x1EF9], [0x01A0, 0x01B4], [0x0300, 0x036F]],
        script: 'vietnamese',
        googleFont: 'Noto Sans',
        fallbackStack: '"Noto Sans", "Segoe UI", Arial, sans-serif',
    },
    // Cyrillic (Russian, Ukrainian, etc.)
    {
        ranges: [[0x0400, 0x04FF], [0x0500, 0x052F]],
        script: 'cyrillic',
        googleFont: 'Noto Sans',
        fallbackStack: '"Noto Sans", "Segoe UI", Arial, sans-serif',
    },
    // Hebrew
    {
        ranges: [[0x0590, 0x05FF], [0xFB1D, 0xFB4F]],
        script: 'hebrew',
        googleFont: 'Noto Sans Hebrew',
        fallbackStack: '"Noto Sans Hebrew", "Segoe UI", "Arial Hebrew", sans-serif',
    },
    // Tamil
    {
        ranges: [[0x0B80, 0x0BFF]],
        script: 'tamil',
        googleFont: 'Noto Sans Tamil',
        fallbackStack: '"Noto Sans Tamil", sans-serif',
    },
];

/**
 * Detect the dominant script in a text string.
 * Returns the first non-Latin script found, or defaults to 'latin'.
 */
export function detectScript(text: string): ScriptInfo {
    // Count characters per script
    const counts = new Map<string, number>();

    for (const char of text) {
        const code = char.codePointAt(0);
        if (code === undefined) continue;

        for (const entry of SCRIPT_FONTS) {
            for (const [start, end] of entry.ranges) {
                if (code >= start && code <= end) {
                    counts.set(entry.script, (counts.get(entry.script) || 0) + 1);
                    break;
                }
            }
        }
    }

    // Find the script with highest count
    let maxScript = '';
    let maxCount = 0;
    for (const [script, count] of counts) {
        if (count > maxCount) {
            maxCount = count;
            maxScript = script;
        }
    }

    if (maxScript) {
        const entry = SCRIPT_FONTS.find(e => e.script === maxScript)!;
        return {
            script: entry.script,
            googleFont: entry.googleFont,
            fallbackStack: entry.fallbackStack,
        };
    }

    // Default: Latin script
    return {
        script: 'latin',
        googleFont: 'Noto Sans',
        fallbackStack: '"Noto Sans", Arial, Helvetica, sans-serif',
    };
}

/**
 * Cache of already-loaded font families to avoid duplicate loads.
 */
const loadedFonts = new Set<string>();

/**
 * Load a Google Font by name using the CSS Font Loading API (FontFace).
 * Works without adding any <link> tags to the DOM.
 *
 * @param fontFamily - Google Font family name (e.g., 'Noto Sans SC')
 * @param weight     - Font weight (default: '400')
 * @returns          - Promise that resolves when the font is ready
 */
export async function loadGoogleFont(
    fontFamily: string,
    weight = '400'
): Promise<void> {
    const cacheKey = `${fontFamily}:${weight}`;
    if (loadedFonts.has(cacheKey)) return;

    // Build Google Fonts CSS2 URL
    const encodedFamily = fontFamily.replace(/ /g, '+');
    const url = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weight}&display=swap`;

    try {
        // Fetch the CSS to extract the actual font file URL
        const cssResponse = await fetch(url);
        if (!cssResponse.ok) {
            throw new Error(`HTTP ${cssResponse.status}`);
        }

        const cssText = await cssResponse.text();

        // Extract font-face src URL from CSS
        const urlMatch = cssText.match(/src:\s*url\(([^)]+)\)/);
        if (!urlMatch) {
            throw new Error('Could not extract font URL from Google Fonts CSS');
        }

        const fontUrl = urlMatch[1];

        // Use FontFace API to register the font
        const fontFace = new FontFace(fontFamily, `url(${fontUrl})`, {
            weight: weight,
            style: 'normal',
            display: 'swap' as FontDisplay,
        });

        await fontFace.load();
        (document.fonts as FontFaceSet).add(fontFace);
        loadedFonts.add(cacheKey);
    } catch (err) {
        // Font loading failed — we'll fall back to system fonts.
        // This is non-fatal; the watermark will still render.
        console.warn(
            `[miconvert] Could not load Google Font "${fontFamily}": ${err instanceof Error ? err.message : String(err)}. Falling back to system fonts.`
        );
    }
}

/**
 * Load a custom font from a URL (TTF, OTF, WOFF, WOFF2).
 *
 * @param fontFamily - Name to register the font under
 * @param fontUrl    - URL to the font file
 * @param weight     - Font weight (default: '400')
 * @returns          - Promise that resolves when font is ready
 */
export async function loadCustomFont(
    fontFamily: string,
    fontUrl: string,
    weight = '400'
): Promise<void> {
    const cacheKey = `custom:${fontFamily}:${weight}`;
    if (loadedFonts.has(cacheKey)) return;

    try {
        const fontFace = new FontFace(fontFamily, `url(${fontUrl})`, {
            weight: weight,
            style: 'normal',
        });

        await fontFace.load();
        (document.fonts as FontFaceSet).add(fontFace);
        loadedFonts.add(cacheKey);
    } catch (err) {
        console.warn(
            `[miconvert] Could not load custom font "${fontFamily}" from ${fontUrl}: ${err instanceof Error ? err.message : String(err)}`
        );
    }
}

/**
 * Auto-load the best font for the given text.
 * Detects the script, loads the appropriate Noto font from Google,
 * and returns the recommended font-family CSS string.
 *
 * @param text        - The watermark text to analyze
 * @param userFont    - User-specified font family (if any)
 * @param fontWeight  - Font weight to load
 * @returns           - The font-family CSS value to use in ctx.font
 */
export async function ensureFontForText(
    text: string,
    userFont?: string,
    fontWeight = '700'
): Promise<string> {
    const scriptInfo = detectScript(text);

    // Always try to load the appropriate Noto font as a safety net
    await loadGoogleFont(scriptInfo.googleFont, fontWeight);

    // If user specified a custom font, prepend it to the fallback stack
    if (userFont && userFont !== scriptInfo.googleFont) {
        return `${userFont}, ${scriptInfo.fallbackStack}`;
    }

    return scriptInfo.fallbackStack;
}
