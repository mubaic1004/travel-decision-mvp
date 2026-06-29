// Export entities to DXF — TS port of handdraw2cad/export_dxf.py.
// Hand-written minimal R12 ASCII DXF (LINE/CIRCLE/ARC) — no dependency.
// Two things matter for a usable CAD file:
//   1. Real CAD entities, not polyline approximations.
//   2. Correct units. Hand drawings have no scale, so the caller supplies
//      `scale` (mm per pixel) or calibrates via scaleFromReference.
// Image y is DOWN; CAD y is UP — we flip y so the drawing isn't mirrored.

import type { Entity, LayerName } from "@/lib/cad/model";

const LAYER_COLORS: Record<LayerName, number> = {
  outline: 7,
  centerline: 1,
  dimension: 3,
  construction: 8,
};

function tag(code: number, value: string | number): string {
  return `${code}\n${value}\n`;
}

export interface ExportOptions {
  scale?: number; // mm per pixel
  imageHeight: number; // source image height in px (for y-flip)
}

export function exportDxf(entities: Entity[], { scale = 1, imageHeight }: ExportOptions): string {
  const fx = (x: number) => x * scale;
  const fy = (y: number) => (imageHeight - y) * scale;

  const usedLayers = new Set<LayerName>(entities.map((e) => e.layer));

  let tables = "";
  tables += tag(0, "TABLE") + tag(2, "LAYER") + tag(70, usedLayers.size);
  for (const name of usedLayers) {
    tables +=
      tag(0, "LAYER") + tag(2, name) + tag(70, 0) + tag(62, LAYER_COLORS[name] ?? 7) + tag(6, "CONTINUOUS");
  }
  tables += tag(0, "ENDTAB");

  let body = "";
  for (const e of entities) {
    if (e.kind === "line") {
      body +=
        tag(0, "LINE") +
        tag(8, e.layer) +
        tag(10, fx(e.p1[0])) + tag(20, fy(e.p1[1])) + tag(30, 0) +
        tag(11, fx(e.p2[0])) + tag(21, fy(e.p2[1])) + tag(31, 0);
    } else if (e.kind === "circle") {
      body +=
        tag(0, "CIRCLE") +
        tag(8, e.layer) +
        tag(10, fx(e.center[0])) + tag(20, fy(e.center[1])) + tag(30, 0) +
        tag(40, e.radius * scale);
    } else if (e.kind === "arc") {
      // y-flip mirrors angles about the x-axis and swaps start/end.
      body +=
        tag(0, "ARC") +
        tag(8, e.layer) +
        tag(10, fx(e.center[0])) + tag(20, fy(e.center[1])) + tag(30, 0) +
        tag(40, e.radius * scale) +
        tag(50, -e.endAngle) +
        tag(51, -e.startAngle);
    }
  }

  return (
    tag(0, "SECTION") + tag(2, "HEADER") +
    tag(9, "$INSUNITS") + tag(70, 4) + // millimetres
    tag(0, "ENDSEC") +
    tag(0, "SECTION") + tag(2, "TABLES") + tables + tag(0, "ENDSEC") +
    tag(0, "SECTION") + tag(2, "ENTITIES") + body + tag(0, "ENDSEC") +
    tag(0, "EOF")
  );
}

// mm-per-pixel from a known reference length.
export function scaleFromReference(refPixelLength: number, refRealMm: number): number {
  if (refPixelLength <= 0) throw new Error("参考像素长度必须为正");
  return refRealMm / refPixelLength;
}
