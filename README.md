# @miconvert/image-watermark

> Add text or logo watermark to images **right in the browser**. Fast, beautiful, zero server dependency.

[![npm](https://img.shields.io/npm/v/@miconvert/image-watermark)](https://www.npmjs.com/package/@miconvert/image-watermark)
[![license](https://img.shields.io/npm/l/@miconvert/image-watermark)](./LICENSE)
[![size](https://img.shields.io/bundlephobia/minzip/@miconvert/image-watermark)](https://bundlephobia.com/package/@miconvert/image-watermark)

## ✨ Features

- **Text Watermark** — Custom font, size, color, stroke outline & drop shadow
- **Image/Logo Watermark** — Supports URL, File, Blob, or HTMLImageElement
- **9-Point Positioning** — `top-left`, `top-center`, `top-right`, `center-left`, `center`, `center-right`, `bottom-left`, `bottom-center`, `bottom-right`
- **Tiled Pattern Mode** — Repeat watermark across entire image (anti-crop protection, like Shutterstock)
- **Responsive Scaling** — Logo/text auto-scales based on image resolution (no more tiny watermarks on 4K images)
- **Rotation & Opacity** — Full control over angle and transparency
- **🌍 Multilingual Font Auto-Loading** — Auto-detects script (CJK, Arabic, Thai, Vietnamese, Cyrillic, Devanagari...) and loads the correct [Google Noto font](https://fonts.google.com/noto). No more □□□ tofu boxes!
- **100% Client-Side** — Uses HTML5 Canvas, no server required
- **TypeScript** — Full type definitions included

## 📦 Installation

```bash
npm install @miconvert/image-watermark
```

## 🚀 Quick Start

### Text Watermark

```js
import { addWatermark } from '@miconvert/image-watermark';

const watermarked = await addWatermark(imageFile, {
  type: 'text',
  text: '© Miconvert Property',
  position: 'bottom-right',
  fontSize: 48,
  color: 'rgba(255, 255, 255, 0.5)',
  strokeColor: 'black',
  strokeWidth: 2,
  padding: 20,
});

// Display result
const url = URL.createObjectURL(watermarked);
document.getElementById('preview').src = url;
```

### Logo Watermark

```js
// Logo auto-scales to 15% of image width
const watermarked = await addWatermark(imageFile, {
  type: 'image',
  source: './logo.png',       // URL string
  // imageElement: logoBlob,  // or File/Blob/HTMLImageElement
  position: 'bottom-right',
  width: 0.15,                // 15% of image width
  opacity: 0.7,
  padding: 20,
});
```

### Tiled Pattern (Anti-Crop Protection)

```js
const watermarked = await addWatermark(imageFile, {
  type: 'text',
  text: 'Bản quyền thuộc Miconvert',
  mode: 'tiled',
  opacity: 0.3,
  rotate: -45,
  fontSize: 36,
  color: 'rgba(255, 255, 255, 0.4)',
});
```

## 📖 API Reference

### `addWatermark(file, options): Promise<Blob>`

| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | `File \| Blob` | Source image |
| `options` | `WatermarkOptions` | Configuration object |

### Common Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `'text' \| 'image'` | — | **Required.** Watermark type |
| `position` | `WatermarkPosition` | `'bottom-right'` | Anchor position (9 presets) |
| `mode` | `'single' \| 'tiled'` | `'single'` | Single stamp or tiled pattern |
| `opacity` | `number` | `1.0` | Transparency (0.0–1.0) |
| `rotate` | `number` | `0` | Rotation in degrees |
| `padding` | `number` | `20` | Distance from image edge (px) |
| `offsetX` | `number` | `0` | Extra horizontal offset (px) |
| `offsetY` | `number` | `0` | Extra vertical offset (px) |
| `scale` | `number` | — | Responsive scale factor |
| `tileSpacingX` | `number` | `100` | Horizontal tile gap (px) |
| `tileSpacingY` | `number` | `80` | Vertical tile gap (px) |

### Text-Specific Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `text` | `string` | — | **Required.** Text content |
| `fontFamily` | `string` | `'Arial, Helvetica, sans-serif'` | CSS font family |
| `fontSize` | `number` | `48` | Font size in pixels |
| `fontWeight` | `string` | `'bold'` | `'normal'`, `'bold'`, etc. |
| `fontStyle` | `string` | `'normal'` | `'normal'`, `'italic'` |
| `color` | `string` | `'rgba(255,255,255,0.5)'` | Fill color (any CSS color) |
| `strokeColor` | `string` | — | Outline color |
| `strokeWidth` | `number` | `2` | Outline width (px) |
| `shadowColor` | `string` | `'rgba(0,0,0,0.5)'` | Drop shadow color |
| `shadowBlur` | `number` | `4` | Shadow blur radius |

### Image-Specific Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `source` | `string` | — | Logo URL |
| `imageElement` | `File \| Blob \| HTMLImageElement` | — | Logo as File/Blob/Element |
| `width` | `number` | `0.15` | Logo width as fraction of image width (0.0–1.0) |

## 🎯 Position Map

```
┌─────────────┬─────────────┬─────────────┐
│  top-left   │ top-center  │  top-right  │
├─────────────┼─────────────┼─────────────┤
│ center-left │   center    │center-right │
├─────────────┼─────────────┼─────────────┤
│ bottom-left │bottom-center│bottom-right │
└─────────────┴─────────────┴─────────────┘
```

## 🌍 Multilingual Font Support

Text watermarks automatically detect the language/script of your text and load the correct **Google Noto font** via the FontFace API. No manual font configuration needed!

| Script | Languages | Auto-loaded Font |
|--------|-----------|-----------------|
| CJK (Simplified Chinese) | Chinese | Noto Sans SC |
| Japanese | Japanese | Noto Sans JP |
| Korean | Korean | Noto Sans KR |
| Arabic | Arabic, Persian, Urdu | Noto Sans Arabic |
| Devanagari | Hindi, Sanskrit, Marathi | Noto Sans Devanagari |
| Bengali | Bengali, Assamese | Noto Sans Bengali |
| Thai | Thai | Noto Sans Thai |
| Vietnamese | Vietnamese | Noto Sans |
| Cyrillic | Russian, Ukrainian | Noto Sans |
| Hebrew | Hebrew | Noto Sans Hebrew |
| Tamil | Tamil | Noto Sans Tamil |
| Latin | English, European | Noto Sans |

### Custom Font Loading

```js
import { loadCustomFont, addWatermark } from '@miconvert/image-watermark';

// Load a custom font from URL
await loadCustomFont('MyBrand', 'https://example.com/fonts/mybrand.woff2');

const result = await addWatermark(imageFile, {
  type: 'text',
  text: 'My Brand™',
  fontFamily: 'MyBrand',
  // ...other options
});
```

## ⚠️ Important Notes

- **EXIF metadata is lost** — Canvas processing strips EXIF data (GPS, camera info, orientation). Modern browsers auto-apply EXIF orientation before drawing, so images will look correct, but the metadata is not preserved in the output.
- **iOS Safari limit** — Images larger than ~16.7 megapixels are automatically downscaled to prevent Safari crashes. A console warning is logged when this happens.
- **SSR / Node.js** — This library requires a browser environment (DOM + Canvas). In Next.js/Nuxt, use `dynamic import()` or check `typeof window !== 'undefined'` before importing.
- **Multiline text** — Use `\n` in your text string for multi-line watermarks. Example: `text: '© Company\nAll Rights Reserved'`
- **Animated GIF** — Only the first frame is watermarked. Canvas API does not support multi-frame GIF rendering.
- **AVIF output** — When using `outputType: 'image/avif'`, color quality depends on your browser's AVIF encoder. Chrome 121+ and Safari 17+ produce good results.

## 🌐 Browser Support

Works in all modern browsers that support `HTMLCanvasElement.toBlob()` and `FontFace` API:
Chrome 50+, Firefox 19+, Safari 11+, Edge 79+

## 🤝 Support

For bug reports and feature requests, please visit [miconvert.com/en/contact](https://miconvert.com/en/contact?utm_source=npm&utm_medium=readme&utm_campaign=image-watermark).

## 📄 License

[MIT](./LICENSE) © [Miconvert](https://miconvert.com?utm_source=npm&utm_medium=readme&utm_campaign=image-watermark)
