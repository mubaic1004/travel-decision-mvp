// Browser image loading + downscaling helpers.

import { rgbaToGray, type Gray } from "@/lib/cad/raster";

const MAX_DIM = 1600; // downscale large uploads for speed

export interface LoadedImage {
  gray: Gray;
  // RGBA of the (possibly downscaled) image, for faint base-layer display.
  rgba: ImageData;
  width: number;
  height: number;
}

export async function loadImageFromSource(src: string | File): Promise<LoadedImage> {
  const url = typeof src === "string" ? src : URL.createObjectURL(src);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("图片加载失败"));
      el.src = url;
    });

    let { naturalWidth: width, naturalHeight: height } = img;
    const longest = Math.max(width, height);
    const scale = longest > MAX_DIM ? MAX_DIM / longest : 1;
    width = Math.round(width * scale);
    height = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("无法创建画布上下文");
    ctx.drawImage(img, 0, 0, width, height);
    const rgba = ctx.getImageData(0, 0, width, height);
    const gray = rgbaToGray(rgba.data, width, height);
    return { gray, rgba, width, height };
  } finally {
    if (typeof src !== "string") URL.revokeObjectURL(url);
  }
}
