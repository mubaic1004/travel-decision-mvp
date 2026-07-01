// Circle detection — Hough-free port of handdraw2cad/detect.py circle logic.
// Approach: connected components of the skeleton -> algebraic circle fit
// (_fit_circle_lsq) -> residual + circumference-support gating
// (_circumference_support) -> dedup. Then filterSegmentsOnCircles drops line
// fragments that are really arcs of a detected circle.

import { lineLength, makeCircle, type Arc, type Circle, type Line, type Point } from "@/lib/cad/model";
import type { Binary } from "@/lib/cad/raster";

const NB8: Array<[number, number]> = [
  [-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1],
];

// 8-connected components of skeleton ink pixels.
function connectedComponents(skel: Binary): Point[][] {
  const { data, width, height } = skel;
  const seen = new Uint8Array(width * height);
  const comps: Point[][] = [];
  const stack: number[] = [];
  for (let start = 0; start < data.length; start += 1) {
    if (data[start] === 0 || seen[start]) continue;
    const comp: Point[] = [];
    stack.length = 0;
    stack.push(start);
    seen[start] = 1;
    while (stack.length) {
      const idx = stack.pop()!;
      const x = idx % width;
      const y = (idx / width) | 0;
      comp.push([x, y]);
      for (const [dx, dy] of NB8) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
        const ni = yy * width + xx;
        if (data[ni] > 0 && !seen[ni]) {
          seen[ni] = 1;
          stack.push(ni);
        }
      }
    }
    comps.push(comp);
  }
  return comps;
}

// Algebraic least-squares circle fit (normal equations of A=[2x,2y,1], b=x²+y²).
export function fitCircleLsq(pts: Point[]): { cx: number; cy: number; r: number } | null {
  if (pts.length < 3) return null;
  // Build AᵀA (3x3 symmetric) and Aᵀb (3).
  let a00 = 0, a01 = 0, a02 = 0, a11 = 0, a12 = 0, a22 = 0;
  let b0 = 0, b1 = 0, b2 = 0;
  for (const [x, y] of pts) {
    const c0 = 2 * x;
    const c1 = 2 * y;
    const c2 = 1;
    const rhs = x * x + y * y;
    a00 += c0 * c0; a01 += c0 * c1; a02 += c0 * c2;
    a11 += c1 * c1; a12 += c1 * c2; a22 += c2 * c2;
    b0 += c0 * rhs; b1 += c1 * rhs; b2 += c2 * rhs;
  }
  // Solve 3x3 [[a00,a01,a02],[a01,a11,a12],[a02,a12,a22]] x = [b0,b1,b2] (Cramer).
  const m = [
    [a00, a01, a02],
    [a01, a11, a12],
    [a02, a12, a22],
  ];
  const det3 = (
    a: number, b: number, c: number,
    d: number, e: number, f: number,
    g: number, h: number, i: number,
  ) => a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  const D = det3(m[0][0], m[0][1], m[0][2], m[1][0], m[1][1], m[1][2], m[2][0], m[2][1], m[2][2]);
  if (Math.abs(D) < 1e-9) return null;
  const Dx = det3(b0, m[0][1], m[0][2], b1, m[1][1], m[1][2], b2, m[2][1], m[2][2]);
  const Dy = det3(m[0][0], b0, m[0][2], m[1][0], b1, m[1][2], m[2][0], b2, m[2][2]);
  const Dc = det3(m[0][0], m[0][1], b0, m[1][0], m[1][1], b1, m[2][0], m[2][1], b2);
  const cx = Dx / D;
  const cy = Dy / D;
  const c = Dc / D;
  const r2 = c + cx * cx + cy * cy;
  if (r2 <= 0) return null;
  return { cx, cy, r: Math.sqrt(r2) };
}

// Longest contiguous inked arc around the circumference, as a fraction.
// Separates real drawn circles (one continuous arc) from Hough-style phantoms.
function circumferenceSupport(
  binary: Binary,
  cx: number,
  cy: number,
  r: number,
  samples = 72,
  tol = 3,
): number {
  const { data, width, height } = binary;
  const mask: boolean[] = [];
  for (let i = 0; i < samples; i += 1) {
    const a = (2 * Math.PI * i) / samples;
    const px = Math.round(cx + r * Math.cos(a));
    const py = Math.round(cy + r * Math.sin(a));
    let inked = false;
    for (let yy = Math.max(0, py - tol); yy <= Math.min(height - 1, py + tol) && !inked; yy += 1) {
      for (let xx = Math.max(0, px - tol); xx <= Math.min(width - 1, px + tol); xx += 1) {
        if (data[yy * width + xx] > 0) {
          inked = true;
          break;
        }
      }
    }
    mask.push(inked);
  }
  let best = 0;
  let run = 0;
  for (let i = 0; i < samples * 2; i += 1) {
    run = mask[i % samples] ? run + 1 : 0;
    if (run > best) best = run;
  }
  return Math.min(best, samples) / samples;
}

function dedupCircles(circles: Circle[]): Circle[] {
  const kept: Circle[] = [];
  for (const c of circles) {
    const dup = kept.some(
      (k) =>
        Math.hypot(c.center[0] - k.center[0], c.center[1] - k.center[1]) < 0.3 * k.radius &&
        Math.abs(c.radius - k.radius) < 0.3 * k.radius,
    );
    if (!dup) kept.push(c);
  }
  return kept;
}

export interface DetectCirclesOptions {
  minRadius?: number;
  maxResidual?: number;
  minSupport?: number;
}

export function detectCircles(
  skeleton: Binary,
  binary: Binary,
  { minRadius = 12, maxResidual = 4, minSupport = 0.8 }: DetectCirclesOptions = {},
): Circle[] {
  const maxRadius = Math.min(skeleton.width, skeleton.height) / 2;
  const circles: Circle[] = [];
  for (const comp of connectedComponents(skeleton)) {
    if (comp.length < 40) continue;
    const fit = fitCircleLsq(comp);
    if (!fit) continue;
    const { cx, cy, r } = fit;
    if (r < minRadius || r > maxRadius) continue;
    // RMS residual of component points to the fitted circle.
    let sum = 0;
    for (const [x, y] of comp) {
      const d = Math.hypot(x - cx, y - cy) - r;
      sum += d * d;
    }
    const rms = Math.sqrt(sum / comp.length);
    if (rms > maxResidual) continue;
    if (circumferenceSupport(binary, cx, cy, r) < minSupport) continue;
    circles.push(makeCircle([cx, cy], r));
  }
  return dedupCircles(circles);
}

// Drop arcs that coincide with an already-detected full circle (same
// center/radius) — otherwise a circle also shows up as redundant arc fragments.
export function filterArcsOnCircles(arcs: Arc[], circles: Circle[]): Arc[] {
  if (circles.length === 0) return arcs;
  return arcs.filter(
    (arc) =>
      !circles.some(
        (c) =>
          Math.hypot(arc.center[0] - c.center[0], arc.center[1] - c.center[1]) < 0.25 * c.radius &&
          Math.abs(arc.radius - c.radius) < 0.25 * c.radius,
      ),
  );
}

// Drop short segments that are genuinely arc fragments of a detected circle.
// Conservative: removed only if both endpoints AND midpoint sit on the same
// circle and the chord is short relative to the radius.
export function filterSegmentsOnCircles(lines: Line[], circles: Circle[], tol = 6): Line[] {
  if (circles.length === 0) return lines;
  const on = (c: Circle, p: Point) =>
    Math.abs(Math.hypot(p[0] - c.center[0], p[1] - c.center[1]) - c.radius) < tol;
  return lines.filter((ln) => {
    const mid: Point = [(ln.p1[0] + ln.p2[0]) / 2, (ln.p1[1] + ln.p2[1]) / 2];
    const isArc = circles.some(
      (c) => on(c, ln.p1) && on(c, ln.p2) && on(c, mid) && lineLength(ln) < c.radius * 1.2,
    );
    return !isArc;
  });
}
