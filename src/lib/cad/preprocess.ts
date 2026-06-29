// Image preprocessing — TS port of handdraw2cad/preprocess.py.
// gray -> adaptive binarize (ink=255) -> morphological close -> Zhang-Suen
// skeletonize (1px centerlines). The binary is used for circle/contour work;
// the skeleton for line fitting.

import type { Binary, Gray } from "@/lib/cad/raster";

export interface Preprocessed {
  binary: Binary;
  skeleton: Binary;
}

// Adaptive threshold (Gaussian-C analogue via box mean over an integral image).
// INV: dark ink (gray < localMean - C) becomes foreground 255.
// blockSize/C mirror the Python defaults (35 / 10).
export function adaptiveThreshold(
  gray: Gray,
  { blockSize = 35, c = 10 }: { blockSize?: number; c?: number } = {},
): Binary {
  const { data, width, height } = gray;
  const radius = Math.max(1, Math.floor(blockSize / 2));

  // Integral image (summed-area table), (width+1) x (height+1).
  const iw = width + 1;
  const integral = new Float64Array(iw * (height + 1));
  for (let y = 0; y < height; y += 1) {
    let rowSum = 0;
    for (let x = 0; x < width; x += 1) {
      rowSum += data[y * width + x];
      integral[(y + 1) * iw + (x + 1)] = integral[y * iw + (x + 1)] + rowSum;
    }
  }

  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(height - 1, y + radius);
    for (let x = 0; x < width; x += 1) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(width - 1, x + radius);
      const area = (x1 - x0 + 1) * (y1 - y0 + 1);
      const sum =
        integral[(y1 + 1) * iw + (x1 + 1)] -
        integral[y0 * iw + (x1 + 1)] -
        integral[(y1 + 1) * iw + x0] +
        integral[y0 * iw + x0];
      const mean = sum / area;
      out[y * width + x] = data[y * width + x] < mean - c ? 255 : 0;
    }
  }
  return { data: out, width, height };
}

function dilate3(bin: Binary): Binary {
  const { data, width, height } = bin;
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let on = 0;
      for (let dy = -1; dy <= 1 && !on; dy += 1) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        for (let dx = -1; dx <= 1; dx += 1) {
          const xx = x + dx;
          if (xx < 0 || xx >= width) continue;
          if (data[yy * width + xx] > 0) {
            on = 1;
            break;
          }
        }
      }
      out[y * width + x] = on ? 255 : 0;
    }
  }
  return { data: out, width, height };
}

function erode3(bin: Binary): Binary {
  const { data, width, height } = bin;
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let all = 1;
      for (let dy = -1; dy <= 1 && all; dy += 1) {
        const yy = y + dy;
        for (let dx = -1; dx <= 1; dx += 1) {
          const xx = x + dx;
          if (xx < 0 || xx >= width || yy < 0 || yy >= height || data[yy * width + xx] === 0) {
            all = 0;
            break;
          }
        }
      }
      out[y * width + x] = all ? 255 : 0;
    }
  }
  return { data: out, width, height };
}

// Morphological close = dilate then erode (fills small gaps from broken strokes).
export function morphClose(bin: Binary): Binary {
  return erode3(dilate3(bin));
}

// Zhang-Suen thinning -> 1px skeleton. Replaces skimage.skeletonize.
export function skeletonize(bin: Binary): Binary {
  const { width, height } = bin;
  // Work on a 0/1 buffer.
  const img = new Uint8Array(width * height);
  for (let i = 0; i < img.length; i += 1) img[i] = bin.data[i] > 0 ? 1 : 0;

  const at = (x: number, y: number): number => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0;
    return img[y * width + x];
  };

  let changed = true;
  const toClear: number[] = [];
  while (changed) {
    changed = false;
    for (let step = 0; step < 2; step += 1) {
      toClear.length = 0;
      for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
          if (img[y * width + x] === 0) continue;
          const p2 = at(x, y - 1);
          const p3 = at(x + 1, y - 1);
          const p4 = at(x + 1, y);
          const p5 = at(x + 1, y + 1);
          const p6 = at(x, y + 1);
          const p7 = at(x - 1, y + 1);
          const p8 = at(x - 1, y);
          const p9 = at(x - 1, y - 1);
          const neighbors = [p2, p3, p4, p5, p6, p7, p8, p9];
          const bp = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (bp < 2 || bp > 6) continue;
          // Count 0->1 transitions in the ordered sequence p2,p3,...,p9,p2.
          let ap = 0;
          for (let k = 0; k < 8; k += 1) {
            if (neighbors[k] === 0 && neighbors[(k + 1) % 8] === 1) ap += 1;
          }
          if (ap !== 1) continue;
          if (step === 0) {
            if (p2 * p4 * p6 !== 0) continue;
            if (p4 * p6 * p8 !== 0) continue;
          } else {
            if (p2 * p4 * p8 !== 0) continue;
            if (p2 * p6 * p8 !== 0) continue;
          }
          toClear.push(y * width + x);
        }
      }
      if (toClear.length > 0) {
        changed = true;
        for (const idx of toClear) img[idx] = 0;
      }
    }
  }

  const out = new Uint8Array(width * height);
  for (let i = 0; i < out.length; i += 1) out[i] = img[i] ? 255 : 0;
  return { data: out, width, height };
}

export function preprocess(gray: Gray): Preprocessed {
  const binary = morphClose(adaptiveThreshold(gray));
  const skeleton = skeletonize(binary);
  return { binary, skeleton };
}
