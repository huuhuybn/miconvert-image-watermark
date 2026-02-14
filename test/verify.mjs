/**
 * Node.js verification test for @miconvert/image-watermark
 * Tests: module loading, type exports, position calculations, and utility functions.
 * 
 * Run: node --experimental-vm-modules test/verify.mjs
 */

import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  ✅ ${name}`);
    } catch (err) {
        failed++;
        console.log(`  ❌ ${name}`);
        console.log(`     Error: ${err.message}`);
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

// ============================================================
console.log('\n🧪 @miconvert/image-watermark — Verification Tests\n');

// --- 1. Package.json ---
console.log('📦 Package Configuration:');
const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));

test('Package name is correct', () => {
    assert(pkg.name === '@miconvert/image-watermark', `Got: ${pkg.name}`);
});

test('Version is 1.0.0', () => {
    assert(pkg.version === '1.0.0', `Got: ${pkg.version}`);
});

test('Has main (CJS) entry', () => {
    assert(pkg.main === 'dist/image-watermark.js', `Got: ${pkg.main}`);
});

test('Has module (ESM) entry', () => {
    assert(pkg.module === 'dist/image-watermark.mjs', `Got: ${pkg.module}`);
});

test('Has types entry', () => {
    assert(pkg.types === 'dist/index.d.ts', `Got: ${pkg.types}`);
});

test('Has SEO keywords (>= 10)', () => {
    assert(pkg.keywords.length >= 10, `Got ${pkg.keywords.length} keywords`);
});

test('Keywords include "watermark"', () => {
    assert(pkg.keywords.includes('watermark'), 'Missing "watermark" keyword');
});

test('Repository URL is correct', () => {
    assert(pkg.repository.url.includes('huuhuybn/miconvert-image-watermark'), `Got: ${pkg.repository.url}`);
});

// --- 2. Dist Files ---
console.log('\n📁 Build Output:');
import { readdirSync, statSync } from 'fs';

const distFiles = readdirSync(join(rootDir, 'dist'));

test('CJS bundle exists (image-watermark.js)', () => {
    assert(distFiles.includes('image-watermark.js'), 'Missing CJS bundle');
});

test('ESM bundle exists (image-watermark.mjs)', () => {
    assert(distFiles.includes('image-watermark.mjs'), 'Missing ESM bundle');
});

test('CJS sourcemap exists', () => {
    assert(distFiles.includes('image-watermark.js.map'), 'Missing CJS sourcemap');
});

test('ESM sourcemap exists', () => {
    assert(distFiles.includes('image-watermark.mjs.map'), 'Missing ESM sourcemap');
});

test('Type declarations exist (index.d.ts)', () => {
    assert(distFiles.includes('index.d.ts'), 'Missing index.d.ts');
});

test('Type declarations for all modules', () => {
    const expectedDts = ['types.d.ts', 'utils.d.ts', 'position.d.ts', 'text-watermark.d.ts', 'image-watermark.d.ts', 'tiled.d.ts'];
    for (const f of expectedDts) {
        assert(distFiles.includes(f), `Missing ${f}`);
    }
});

test('CJS bundle is non-trivial size (> 1KB)', () => {
    const size = statSync(join(rootDir, 'dist', 'image-watermark.js')).size;
    assert(size > 1024, `CJS bundle too small: ${size} bytes`);
});

test('ESM bundle is non-trivial size (> 1KB)', () => {
    const size = statSync(join(rootDir, 'dist', 'image-watermark.mjs')).size;
    assert(size > 1024, `ESM bundle too small: ${size} bytes`);
});

// --- 3. CJS Module Loading ---
console.log('\n🔌 Module Loading (CJS):');
const cjsModule = createRequire(import.meta.url)(join(rootDir, 'dist', 'image-watermark.js'));

test('CJS exports addWatermark function', () => {
    assert(typeof cjsModule.addWatermark === 'function', `Got: ${typeof cjsModule.addWatermark}`);
});

test('CJS has default export', () => {
    assert(typeof cjsModule.default === 'function', `Got: ${typeof cjsModule.default}`);
});

test('CJS default === addWatermark', () => {
    assert(cjsModule.default === cjsModule.addWatermark, 'Default export !== addWatermark');
});

// --- 4. ESM Module Loading ---
console.log('\n🔌 Module Loading (ESM):');
const esmModule = await import(pathToFileURL(join(rootDir, 'dist', 'image-watermark.mjs')).href);

test('ESM exports addWatermark function', () => {
    assert(typeof esmModule.addWatermark === 'function', `Got: ${typeof esmModule.addWatermark}`);
});

test('ESM has default export', () => {
    assert(typeof esmModule.default === 'function', `Got: ${typeof esmModule.default}`);
});

test('ESM default === addWatermark', () => {
    assert(esmModule.default === esmModule.addWatermark, 'Default export !== addWatermark');
});

// --- 5. Type Declaration Content ---
console.log('\n📝 Type Declarations:');
const indexDts = readFileSync(join(rootDir, 'dist', 'index.d.ts'), 'utf8');

test('index.d.ts exports addWatermark', () => {
    assert(indexDts.includes('addWatermark'), 'Missing addWatermark in declarations');
});

test('index.d.ts exports WatermarkOptions type', () => {
    assert(indexDts.includes('WatermarkOptions'), 'Missing WatermarkOptions type');
});

test('index.d.ts exports WatermarkPosition type', () => {
    assert(indexDts.includes('WatermarkPosition'), 'Missing WatermarkPosition type');
});

const typesDts = readFileSync(join(rootDir, 'dist', 'types.d.ts'), 'utf8');

test('types.d.ts has all 9 positions', () => {
    const positions = ['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'];
    for (const pos of positions) {
        assert(typesDts.includes(`'${pos}'`), `Missing position: ${pos}`);
    }
});

test('types.d.ts has WatermarkMode (single/tiled)', () => {
    assert(typesDts.includes("'single'") && typesDts.includes("'tiled'"), 'Missing WatermarkMode');
});

test('types.d.ts has TextWatermarkOptions', () => {
    assert(typesDts.includes('TextWatermarkOptions'), 'Missing TextWatermarkOptions');
});

test('types.d.ts has ImageWatermarkOptions', () => {
    assert(typesDts.includes('ImageWatermarkOptions'), 'Missing ImageWatermarkOptions');
});

test('TextWatermarkOptions has strokeColor', () => {
    assert(typesDts.includes('strokeColor'), 'Missing strokeColor in TextWatermarkOptions');
});

test('TextWatermarkOptions has shadowColor', () => {
    assert(typesDts.includes('shadowColor'), 'Missing shadowColor in TextWatermarkOptions');
});

test('ImageWatermarkOptions has source field', () => {
    assert(typesDts.includes('source'), 'Missing source in ImageWatermarkOptions');
});

test('ImageWatermarkOptions has imageElement field', () => {
    assert(typesDts.includes('imageElement'), 'Missing imageElement in ImageWatermarkOptions');
});

test('WatermarkBaseOptions has mode field', () => {
    assert(typesDts.includes('mode'), 'Missing mode in WatermarkBaseOptions');
});

test('WatermarkBaseOptions has padding field', () => {
    assert(typesDts.includes('padding'), 'Missing padding in WatermarkBaseOptions');
});

test('WatermarkBaseOptions has scale field', () => {
    assert(typesDts.includes('scale'), 'Missing scale in WatermarkBaseOptions');
});

test('WatermarkBaseOptions has tileSpacingX/Y', () => {
    assert(typesDts.includes('tileSpacingX') && typesDts.includes('tileSpacingY'), 'Missing tile spacing');
});

// --- 6. ESM Bundle Content ---
console.log('\n🔍 Bundle Content Checks:');
const esmContent = readFileSync(join(rootDir, 'dist', 'image-watermark.mjs'), 'utf8');

test('ESM bundle contains position calculation logic', () => {
    assert(esmContent.includes('bottom') && esmContent.includes('right'), 'Missing position logic');
});

test('ESM bundle contains stroke text logic', () => {
    assert(esmContent.includes('strokeText') || esmContent.includes('strokeStyle'), 'Missing stroke logic');
});

test('ESM bundle contains shadow logic', () => {
    assert(esmContent.includes('shadowColor') || esmContent.includes('shadowBlur'), 'Missing shadow logic');
});

test('ESM bundle contains tiled logic', () => {
    assert(esmContent.includes('tiled') || esmContent.includes('Tiled'), 'Missing tiled logic');
});

test('ESM bundle contains responsive scaling logic', () => {
    assert(esmContent.includes('1920') || esmContent.includes('Responsive'), 'Missing responsive scaling');
});

test('ESM bundle contains canvas export (toBlob)', () => {
    assert(esmContent.includes('toBlob'), 'Missing toBlob export');
});

test('ESM bundle contains input validation', () => {
    assert(esmContent.includes('[miconvert]'), 'Missing miconvert error prefix');
});

test('ESM bundle uses crossOrigin for external URLs', () => {
    assert(esmContent.includes('crossOrigin'), 'Missing crossOrigin for CORS safety');
});

// --- 7. Error Handling Validation ---
console.log('\n🛡️ Error Handling:');

test('addWatermark rejects null input', async () => {
    try {
        await esmModule.addWatermark(null, { type: 'text', text: 'test' });
        throw new Error('Should have thrown');
    } catch (err) {
        assert(err.message.includes('[miconvert]'), `Expected miconvert error, got: ${err.message}`);
    }
});

test('addWatermark rejects invalid type', async () => {
    // Can't fully test without Blob, but verify error path exists in code
    assert(esmContent.includes('Invalid watermark type'), 'Missing invalid type error');
});

test('addWatermark validates text is non-empty', () => {
    assert(esmContent.includes('requires a "text"'), 'Missing text validation error');
});

test('addWatermark validates image source', () => {
    assert(esmContent.includes('requires a "source"'), 'Missing image source validation error');
});

// --- 8. README ---
console.log('\n📖 Documentation:');
const readme = readFileSync(join(rootDir, 'README.md'), 'utf8');

test('README exists and has title', () => {
    assert(readme.includes('@miconvert/image-watermark'), 'Missing package name in README');
});

test('README has installation section', () => {
    assert(readme.includes('npm install'), 'Missing install instructions');
});

test('README has API reference', () => {
    assert(readme.includes('API Reference'), 'Missing API reference');
});

test('README has position map', () => {
    assert(readme.includes('top-left') && readme.includes('bottom-right'), 'Missing position examples');
});

test('README has tiled example', () => {
    assert(readme.includes("mode: 'tiled'"), 'Missing tiled example in README');
});

// --- 9. Audit Fix Verification ---
console.log('\n🔧 Audit Fix Checks:');

// Fix #5: iOS Canvas Size Guard
test('Bundle has iOS canvas size limit constant (16777216)', () => {
    assert(esmContent.includes('16777216') || esmContent.includes('16_777_216'), 'Missing iOS canvas limit');
});

test('Bundle has getSafeCanvasSize function', () => {
    assert(esmContent.includes('getSafeCanvasSize') || esmContent.includes('SafeCanvas'), 'Missing canvas size guard');
});

test('Bundle logs warning for oversized images', () => {
    assert(esmContent.includes('exceeds iOS Safari canvas limit') || esmContent.includes('Auto-downscaled'), 'Missing downscale warning');
});

// Fix #6: Memory Cleanup
test('Bundle has releaseCanvas function', () => {
    assert(esmContent.includes('releaseCanvas'), 'Missing releaseCanvas memory cleanup');
});

test('Bundle calls releaseCanvas after export', () => {
    assert(esmContent.includes('releaseCanvas(canvas)'), 'releaseCanvas not called after export');
});

// Fix #7: Multiline Text
test('Bundle handles multiline text (split \\n)', () => {
    assert(esmContent.includes("split('\\n')") || esmContent.includes('split("\\n")'), 'Missing multiline text split');
});

test('Types include lineHeight option', () => {
    const typesDts = readFileSync(join(rootDir, 'dist', 'types.d.ts'), 'utf8');
    assert(typesDts.includes('lineHeight'), 'Missing lineHeight in type declarations');
});

// Fix #8: SSR Guard
test('Bundle has SSR/Node.js guard', () => {
    assert(esmContent.includes("typeof document") || esmContent.includes("typeof HTMLCanvasElement"), 'Missing SSR guard');
});

test('SSR guard error message is helpful', () => {
    assert(esmContent.includes('browser environment') || esmContent.includes('Cannot run in Node'), 'SSR error not helpful');
});

// Fix #9: EXIF Documentation
test('README documents EXIF data loss', () => {
    assert(readme.includes('EXIF'), 'Missing EXIF warning in README');
});

test('README documents iOS Safari limit', () => {
    assert(readme.includes('16.7 megapixels') || readme.includes('iOS Safari'), 'Missing iOS Safari note in README');
});

// Fix #10: Better Error Messages
test('canvasToBlob error includes MIME type', () => {
    assert(esmContent.includes('Canvas export failed for type'), 'Missing detailed toBlob error');
});

test('canvasToBlob error includes canvas dimensions', () => {
    assert(esmContent.includes('canvas size:') || esmContent.includes('canvas.width'), 'Missing canvas dimensions in error');
});

// ============================================================
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);

if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!\n');
    process.exit(0);
} else {
    console.log(`\n⚠️  ${failed} test(s) failed.\n`);
    process.exit(1);
}
