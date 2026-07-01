// Load a page from a (scanned) PDF into the same LoadedImage shape the pipeline
// uses, and derive the paper scale (mm per pixel) from the page's physical size.
//
// A PDF page's size is in points (1 pt = 1/72 inch). Rendering at `renderScale`
// gives width_px = width_pt * renderScale, so:
//   paperMmPerPx = (width_pt * 25.4/72) / (width_pt * renderScale)
//                = 25.4 / (72 * renderScale)
// i.e. it depends only on renderScale. Real-world mm/px = paperMmPerPx * drawingRatio.

import { rgbaToGray } from "@/lib/cad/raster";
import type { LoadedImage } from "@/lib/cad/image-load";

const MAX_DIM = 2400; // allow a bit larger for scanned drawings

export interface LoadedPdf extends LoadedImage {
  paperMmPerPx: number;
  pageCount: number;
}

export async function loadPdfPage(file: File, pageNumber = 1): Promise<LoadedPdf> {
  const pdfjs = await import("pdfjs-dist");
  // Served as .js (not .mjs): EdgeOne returns application/octet-stream for
  // .mjs, and browsers refuse module workers with a non-JS MIME type.
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const page = await doc.getPage(Math.min(pageNumber, doc.numPages));

  // Choose a render scale that keeps the longest side within MAX_DIM.
  const base = page.getViewport({ scale: 1 });
  const longestPt = Math.max(base.width, base.height);
  const renderScale = Math.min(3, Math.max(1.5, MAX_DIM / longestPt));
  const viewport = page.getViewport({ scale: renderScale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("无法创建画布上下文");
  // White background (scans are usually on white paper).
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;

  const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const gray = rgbaToGray(rgba.data, canvas.width, canvas.height);
  const paperMmPerPx = 25.4 / (72 * renderScale);

  return {
    gray,
    rgba,
    width: canvas.width,
    height: canvas.height,
    paperMmPerPx,
    pageCount: doc.numPages,
  };
}
