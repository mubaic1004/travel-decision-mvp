// Line detection via skeleton tracing + segment fitting.
// Replaces the Python LSD/HoughLinesP path: on a clean 1px skeleton we trace
// node-to-node polylines, simplify them (Douglas-Peucker), and emit a raw Line
// per straight run. regularize.mergeCollinear then stitches/cleans them.
// Closed loops (no endpoints/junctions — i.e. circles) are skipped here and
// handled by circle detection.

import { fitCircleLsq } from "@/lib/cad/detect-circles";
import { makeArc, makeLine, type Arc, type Line, type Point } from "@/lib/cad/model";
import { fitLinePca } from "@/lib/cad/regularize";
import type { Binary } from "@/lib/cad/raster";

const NEIGHBORS: Array<[number, number]> = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1],
];

function inkNeighbors(
  data: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
): Point[] {
  const out: Point[] = [];
  for (const [dx, dy] of NEIGHBORS) {
    const xx = x + dx;
    const yy = y + dy;
    if (xx >= 0 && yy >= 0 && xx < width && yy < height && data[yy * width + xx] > 0) {
      out.push([xx, yy]);
    }
  }
  return out;
}

function perpDist(p: Point, a: Point, b: Point): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  return Math.abs((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / len;
}

// Recursively split a polyline at genuine corners (max chord deviation beyond
// cornerThresh). Small hand-drawn wobble stays as one straight run; sharp
// corners split. Returns a list of straight sub-polylines (each keeps ALL its
// points so it can be PCA-fit accurately).
function splitStraightRuns(poly: Point[], cornerThresh: number): Point[][] {
  if (poly.length < 3) return [poly];
  let maxD = 0;
  let idx = 0;
  const a = poly[0];
  const b = poly[poly.length - 1];
  for (let i = 1; i < poly.length - 1; i += 1) {
    const d = perpDist(poly[i], a, b);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD > cornerThresh) {
    return [
      ...splitStraightRuns(poly.slice(0, idx + 1), cornerThresh),
      ...splitStraightRuns(poly.slice(idx), cornerThresh),
    ];
  }
  return [poly];
}

// Line spanning the projection extent of a point set's PCA axis.
function lineFromRun(pts: Point[], minSeg: number): Line | null {
  const { c, u, tmin, tmax } = fitLinePca(pts);
  if (tmax - tmin < minSeg) return null;
  return makeLine(
    [c[0] + u[0] * tmin, c[1] + u[1] * tmin],
    [c[0] + u[0] * tmax, c[1] + u[1] * tmax],
  );
}

// Fit an arc to a curved run: angles CCW-from-+x in image coords (y-down).
function arcFromRun(pts: Point[], cx: number, cy: number, r: number): Arc | null {
  const ang = pts.map((p) => Math.atan2(p[1] - cy, p[0] - cx));
  const unwrapped = [ang[0]];
  for (let i = 1; i < ang.length; i += 1) {
    let d = ang[i] - ang[i - 1];
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    unwrapped.push(unwrapped[i - 1] + d);
  }
  const a0 = unwrapped[0];
  const a1 = unwrapped[unwrapped.length - 1];
  if (Math.abs(a1 - a0) < (25 * Math.PI) / 180) return null; // too shallow -> keep as line

  // Smoothness gate: a real arc sweeps monotonically around its center. A
  // polygonal corner traced as one polyline would reverse direction — reject it
  // so corners fall through to line splitting instead of becoming fake arcs.
  const overall = Math.sign(a1 - a0) || 1;
  let sameSign = 0;
  let steps = 0;
  for (let i = 1; i < unwrapped.length; i += 1) {
    const d = unwrapped[i] - unwrapped[i - 1];
    if (Math.abs(d) < 1e-6) continue;
    steps += 1;
    if (Math.sign(d) === overall) sameSign += 1;
  }
  if (steps > 0 && sameSign / steps < 0.85) return null;

  return makeArc([cx, cy], r, (a0 * 180) / Math.PI, (a1 * 180) / Math.PI);
}

const STRAIGHT_TOL = 4.0; // px: max deviation from chord to count as straight
const ARC_RMS_TOL = 3.0; // px: max RMS residual to a fitted circle to count as arc

// Classify one traced polyline into line(s) / arc.
function classifyPolyline(pts: Point[], minSeg: number, cornerThresh: number): Array<Line | Arc> {
  if (pts.length < 2) return [];

  // 1. Straight? (low deviation from its own chord/axis)
  const { c, u } = fitLinePca(pts);
  let maxDev = 0;
  for (const p of pts) {
    const dev = Math.abs((p[0] - c[0]) * u[1] - (p[1] - c[1]) * u[0]);
    if (dev > maxDev) maxDev = dev;
  }
  if (maxDev <= STRAIGHT_TOL) {
    const ln = lineFromRun(pts, minSeg);
    return ln ? [ln] : [];
  }

  // 2. Circular arc? Require: enough support points, good circle fit, and a
  // radius commensurate with the run's chord (rules out near-straight strokes
  // that happen to fit a huge circle).
  const chord = Math.hypot(pts[pts.length - 1][0] - pts[0][0], pts[pts.length - 1][1] - pts[0][1]);
  const cf = pts.length >= 12 ? fitCircleLsq(pts) : null;
  if (cf && cf.r >= 15 && cf.r <= 6 * Math.max(chord, 1)) {
    let sum = 0;
    for (const [x, y] of pts) {
      const dd = Math.hypot(x - cf.cx, y - cf.cy) - cf.r;
      sum += dd * dd;
    }
    if (Math.sqrt(sum / pts.length) <= ARC_RMS_TOL) {
      const arc = arcFromRun(pts, cf.cx, cf.cy, cf.r);
      if (arc) return [arc];
    }
  }

  // 3. Corner path (polygon-like) -> split into straight runs -> lines.
  const out: Line[] = [];
  for (const run of splitStraightRuns(pts, cornerThresh)) {
    if (run.length < 2) continue;
    const ln = lineFromRun(run, minSeg);
    if (ln) out.push(ln);
  }
  return out;
}

export interface DetectStrokesResult {
  lines: Line[];
  arcs: Arc[];
}

export interface DetectLinesOptions {
  minLineLength?: number;
  cornerThresh?: number;
}

export function detectStrokes(
  skeleton: Binary,
  { minLineLength = 30, cornerThresh = 6 }: DetectLinesOptions = {},
): DetectStrokesResult {
  const { data, width, height } = skeleton;
  const minSeg = Math.max(12, minLineLength * 0.4);
  const idx = (p: Point) => p[1] * width + p[0];

  // Degree (neighbor count) per ink pixel.
  const deg = new Int8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      if (data[i] > 0) deg[i] = inkNeighbors(data, width, height, x, y).length;
    }
  }

  const consumed = new Uint8Array(width * height); // degree-2 pixels already traced

  // Pick the neighbor that best continues the incoming direction (straightest),
  // so strokes trace THROUGH crossings/junctions instead of breaking there.
  function nextStep(prev: Point, cur: Point): Point | null {
    const avail = inkNeighbors(data, width, height, cur[0], cur[1]).filter((n) => {
      if (n[0] === prev[0] && n[1] === prev[1]) return false;
      const ni = idx(n);
      return deg[ni] !== 2 || !consumed[ni];
    });
    if (avail.length === 0) return null;
    if (avail.length === 1) return avail[0];
    const ix = cur[0] - prev[0];
    const iy = cur[1] - prev[1];
    const il = Math.hypot(ix, iy) || 1;
    let best = avail[0];
    let bestScore = -Infinity;
    for (const n of avail) {
      const dx = n[0] - cur[0];
      const dy = n[1] - cur[1];
      const dl = Math.hypot(dx, dy) || 1;
      const s = (ix * dx + iy * dy) / (il * dl);
      if (s > bestScore) {
        bestScore = s;
        best = n;
      }
    }
    return best;
  }

  function walk(start: Point, first: Point): Point[] {
    const path: Point[] = [start];
    let prev = start;
    let cur = first;
    for (let g = 0; g < width * height; g += 1) {
      path.push(cur);
      const ci = idx(cur);
      if (deg[ci] === 1) break; // reached an endpoint
      if (deg[ci] === 2) consumed[ci] = 1;
      const next = nextStep(prev, cur);
      if (!next) break;
      if (next[0] === start[0] && next[1] === start[1] && path.length > 3) break; // closed loop
      prev = cur;
      cur = next;
    }
    return path;
  }

  const polylines: Point[][] = [];
  const startable = (nb: Point) => {
    const ni = idx(nb);
    return deg[ni] !== 2 || !consumed[ni];
  };

  // 1. Start from endpoints.
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      if (deg[i] !== 1) continue;
      const nb = inkNeighbors(data, width, height, x, y)[0];
      if (nb && startable(nb)) polylines.push(walk([x, y], nb));
    }
  }
  // 2. Start remaining branches from junctions.
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      if (deg[i] < 3) continue;
      for (const nb of inkNeighbors(data, width, height, x, y)) {
        if (deg[idx(nb)] === 2 && !consumed[idx(nb)]) polylines.push(walk([x, y], nb));
      }
    }
  }
  // 3. Remaining pure loops (degree-2 pixels never consumed).
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      if (deg[i] !== 2 || consumed[i]) continue;
      const nb = inkNeighbors(data, width, height, x, y)[0];
      if (nb) polylines.push(walk([x, y], nb));
    }
  }

  // Classify each polyline into line(s) / arc.
  const lines: Line[] = [];
  const arcs: Arc[] = [];
  for (const poly of polylines) {
    for (const ent of classifyPolyline(poly, minSeg, cornerThresh)) {
      if (ent.kind === "line") lines.push(ent);
      else arcs.push(ent);
    }
  }
  return { lines, arcs };
}
