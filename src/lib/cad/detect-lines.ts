// Line detection via skeleton tracing + segment fitting.
// Replaces the Python LSD/HoughLinesP path: on a clean 1px skeleton we trace
// node-to-node polylines, simplify them (Douglas-Peucker), and emit a raw Line
// per straight run. regularize.mergeCollinear then stitches/cleans them.
// Closed loops (no endpoints/junctions — i.e. circles) are skipped here and
// handled by circle detection.

import { makeLine, type Line, type Point } from "@/lib/cad/model";
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

export interface DetectLinesOptions {
  minLineLength?: number;
  cornerThresh?: number;
}

export function detectLines(
  skeleton: Binary,
  { minLineLength = 30, cornerThresh = 6 }: DetectLinesOptions = {},
): Line[] {
  const { data, width, height } = skeleton;
  const minSeg = Math.max(12, minLineLength * 0.4);

  // Neighbor count per ink pixel; nodes = endpoints (1) or junctions (>=3).
  const isNode = new Uint8Array(width * height);
  const isInk = (i: number) => data[i] > 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      if (!isInk(i)) continue;
      const cnt = inkNeighbors(data, width, height, x, y).length;
      if (cnt === 1 || cnt >= 3) isNode[i] = 1;
    }
  }

  const consumed = new Uint8Array(width * height); // non-node pixels already traced
  const polylines: Point[][] = [];

  // Trace every path starting from each node into each of its ink neighbors.
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      if (!isNode[i]) continue;
      for (const nb of inkNeighbors(data, width, height, x, y)) {
        const startIdx = nb[1] * width + nb[0];
        if (isNode[startIdx]) {
          // Direct node-to-node edge; only record once (x,y) < neighbor.
          if (i < startIdx) polylines.push([[x, y], nb]);
          continue;
        }
        if (consumed[startIdx]) continue;
        // Walk the 2-neighbor chain until the next node.
        const path: Point[] = [[x, y]];
        let prev: Point = [x, y];
        let cur: Point = nb;
        for (let guard = 0; guard < width * height; guard += 1) {
          const ci = cur[1] * width + cur[0];
          path.push(cur);
          if (isNode[ci]) break;
          consumed[ci] = 1;
          const nbrs = inkNeighbors(data, width, height, cur[0], cur[1]).filter(
            (p) => !(p[0] === prev[0] && p[1] === prev[1]),
          );
          // Prefer an unconsumed, non-backward neighbor.
          const next = nbrs.find((p) => !consumed[p[1] * width + p[0]]) ?? nbrs[0];
          if (!next) break;
          prev = cur;
          cur = next;
        }
        polylines.push(path);
      }
    }
  }

  // Split each polyline at corners, PCA-fit each straight run to one clean line.
  const lines: Line[] = [];
  for (const poly of polylines) {
    for (const run of splitStraightRuns(poly, cornerThresh)) {
      if (run.length < 2) continue;
      const { c, u, tmin, tmax } = fitLinePca(run);
      const p1: Point = [c[0] + u[0] * tmin, c[1] + u[1] * tmin];
      const p2: Point = [c[0] + u[0] * tmax, c[1] + u[1] * tmax];
      if (Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) >= minSeg) {
        lines.push(makeLine(p1, p2));
      }
    }
  }
  return lines;
}
