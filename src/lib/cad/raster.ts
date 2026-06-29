// Lightweight raster types shared across the CAD pipeline.
// A Binary image is a Uint8Array of 0/255 (foreground/ink = 255 on 0 background),
// matching the Python pipeline's convention.

export interface Gray {
  data: Uint8ClampedArray; // 0..255 luminance
  width: number;
  height: number;
}

export interface Binary {
  data: Uint8Array; // 0 or 255
  width: number;
  height: number;
}

// RGBA ImageData (browser) -> grayscale luminance.
export function rgbaToGray(rgba: Uint8ClampedArray, width: number, height: number): Gray {
  const n = width * height;
  const out = new Uint8ClampedArray(n);
  for (let i = 0; i < n; i += 1) {
    const r = rgba[i * 4];
    const g = rgba[i * 4 + 1];
    const b = rgba[i * 4 + 2];
    // Rec. 601 luma
    out[i] = (r * 0.299 + g * 0.587 + b * 0.114) | 0;
  }
  return { data: out, width, height };
}

// Render a binary image into an RGBA buffer for canvas display.
// ink (255) -> inkColor, background (0) -> transparent (or bgColor).
export function binaryToRgba(
  bin: Binary,
  inkColor: [number, number, number, number] = [255, 255, 255, 255],
  bgColor: [number, number, number, number] = [0, 0, 0, 0],
): ImageData {
  const { data, width, height } = bin;
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    const c = data[i] > 0 ? inkColor : bgColor;
    out[i * 4] = c[0];
    out[i * 4 + 1] = c[1];
    out[i * 4 + 2] = c[2];
    out[i * 4 + 3] = c[3];
  }
  return new ImageData(out, width, height);
}
