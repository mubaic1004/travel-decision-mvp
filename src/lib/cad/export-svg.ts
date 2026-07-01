// Self-contained SVG export: base image embedded as base64 + vector overlay,
// perfectly aligned (SVG y-down matches image coords, no flip needed).
// This is the guaranteed-aligned "trace against the original" deliverable.

import type { Entity, Point } from "@/lib/cad/model";

function arcPoints(cx: number, cy: number, r: number, a0Deg: number, a1Deg: number): Point[] {
  const a0 = (a0Deg * Math.PI) / 180;
  const a1 = (a1Deg * Math.PI) / 180;
  const steps = Math.max(6, Math.ceil((Math.abs(a1 - a0) * r) / 6));
  const pts: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = a0 + ((a1 - a0) * i) / steps;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

export interface SvgExportOptions {
  width: number;
  height: number;
  pngDataUrl: string; // data:image/png;base64,...
  imageOpacity?: number;
  stroke?: string;
}

export function exportSvg(
  entities: Entity[],
  { width, height, pngDataUrl, imageOpacity = 0.55, stroke = "#0aa" }: SvgExportOptions,
): string {
  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
  );
  parts.push(
    `<image href="${pngDataUrl}" x="0" y="0" width="${width}" height="${height}" opacity="${imageOpacity}"/>`,
  );
  const sw = Math.max(1, Math.round(Math.max(width, height) / 600));
  parts.push(`<g fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round">`);
  for (const e of entities) {
    if (e.kind === "line") {
      parts.push(`<line x1="${e.p1[0]}" y1="${e.p1[1]}" x2="${e.p2[0]}" y2="${e.p2[1]}"/>`);
    } else if (e.kind === "circle") {
      parts.push(`<circle cx="${e.center[0]}" cy="${e.center[1]}" r="${e.radius}"/>`);
    } else if (e.kind === "arc") {
      const pts = arcPoints(e.center[0], e.center[1], e.radius, e.startAngle, e.endAngle);
      const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
      parts.push(`<path d="${d}"/>`);
    }
  }
  parts.push(`</g></svg>`);
  return parts.join("");
}
