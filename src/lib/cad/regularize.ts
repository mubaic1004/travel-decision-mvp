// Regularize raw detected geometry into clean CAD-usable lines.
// TS port of handdraw2cad/regularize.py —逐函数直译。
// This is where hand-drawn wobble becomes engineering geometry:
//   * merge near-collinear / overlapping segments (iterative PCA refit)
//   * snap angles to 0/45/90/135
//   * cluster nearby endpoints to shared junction nodes
// Only lines are regularized; circles/arcs pass through unchanged.

import {
  lineAngleDeg,
  lineLength,
  makeLine,
  type Entity,
  type Line,
  type Point,
} from "@/lib/cad/model";

// Total-least-squares line fit via 2x2 covariance eigen-decomposition
// (replaces numpy.linalg.svd). Returns centroid, unit direction, t_min, t_max
// where t is the signed projection onto the direction.
export function fitLinePca(pts: Point[]): {
  c: Point;
  u: Point;
  tmin: number;
  tmax: number;
} {
  const n = pts.length;
  let cx = 0;
  let cy = 0;
  for (const p of pts) {
    cx += p[0];
    cy += p[1];
  }
  cx /= n;
  cy /= n;

  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const p of pts) {
    const dx = p[0] - cx;
    const dy = p[1] - cy;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }

  // Principal eigenvector of [[sxx, sxy], [sxy, syy]].
  const tr = sxx + syy;
  const det = sxx * syy - sxy * sxy;
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const lambda = tr / 2 + disc;
  let ux: number;
  let uy: number;
  if (Math.abs(sxy) > 1e-9) {
    ux = lambda - syy;
    uy = sxy;
  } else if (sxx >= syy) {
    ux = 1;
    uy = 0;
  } else {
    ux = 0;
    uy = 1;
  }
  const norm = Math.hypot(ux, uy) || 1;
  ux /= norm;
  uy /= norm;

  let tmin = Infinity;
  let tmax = -Infinity;
  for (const p of pts) {
    const t = (p[0] - cx) * ux + (p[1] - cy) * uy;
    if (t < tmin) tmin = t;
    if (t > tmax) tmax = t;
  }
  return { c: [cx, cy], u: [ux, uy], tmin, tmax };
}

// Smallest difference between two undirected angles in [0,180).
function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 180;
  return Math.min(d, 180 - d);
}

export function mergeCollinear(
  lines: Line[],
  { angleTolDeg = 14, distTol = 22, gapTol = 45 } = {},
): Line[] {
  const used = new Array(lines.length).fill(false);
  const merged: Line[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    if (used[i]) continue;
    used[i] = true;
    const pts: Point[] = [lines[i].p1, lines[i].p2];
    const layer = lines[i].layer;

    let changed = true;
    while (changed) {
      changed = false;
      const { c, u, tmin, tmax } = fitLinePca(pts);
      const groupAngle = ((Math.atan2(u[1], u[0]) * 180) / Math.PI + 180) % 180;
      for (let j = 0; j < lines.length; j += 1) {
        if (used[j]) continue;
        const lj = lines[j];
        if (angleDiff(groupAngle, lineAngleDeg(lj)) > angleTolDeg) continue;
        // Perpendicular distance of lj's endpoints to the group axis.
        const perp = Math.max(
          ...[lj.p1, lj.p2].map((q) =>
            Math.abs((q[0] - c[0]) * u[1] - (q[1] - c[1]) * u[0]),
          ),
        );
        if (perp > distTol) continue;
        // Projected extent must overlap or be within gapTol.
        const tj = [lj.p1, lj.p2].map((q) => (q[0] - c[0]) * u[0] + (q[1] - c[1]) * u[1]);
        const oLo = Math.min(...tj);
        const oHi = Math.max(...tj);
        if (oLo > tmax + gapTol || oHi < tmin - gapTol) continue;
        pts.push(lj.p1, lj.p2);
        used[j] = true;
        changed = true;
      }
    }

    const { c, u, tmin, tmax } = fitLinePca(pts);
    const pStart: Point = [c[0] + u[0] * tmin, c[1] + u[1] * tmin];
    const pEnd: Point = [c[0] + u[0] * tmax, c[1] + u[1] * tmax];
    merged.push(makeLine(pStart, pEnd, layer));
  }
  return merged;
}

export function snapAngles(
  lines: Line[],
  { snapTo = [0, 45, 90, 135], tolDeg = 8 } = {},
): Line[] {
  return lines.map((ln) => {
    const ang = lineAngleDeg(ln);
    let target = snapTo[0];
    for (const t of snapTo) {
      if (angleDiff(ang, t) < angleDiff(ang, target)) target = t;
    }
    if (angleDiff(ang, target) > tolDeg) return ln;
    const length = lineLength(ln);
    const mx = (ln.p1[0] + ln.p2[0]) / 2;
    const my = (ln.p1[1] + ln.p2[1]) / 2;
    const rad = (target * Math.PI) / 180;
    const dx = (Math.cos(rad) * length) / 2;
    const dy = (Math.sin(rad) * length) / 2;
    return makeLine([mx - dx, my - dy], [mx + dx, my + dy], ln.layer);
  });
}

export function snapEndpoints(lines: Line[], { tol = 10 } = {}): Line[] {
  const pts: Point[] = [];
  for (const ln of lines) {
    pts.push(ln.p1, ln.p2);
  }
  if (pts.length === 0) return lines;

  const clusterId = new Array(pts.length).fill(-1);
  const centroids: Point[] = [];

  for (let i = 0; i < pts.length; i += 1) {
    if (clusterId[i] !== -1) continue;
    const members = [i];
    clusterId[i] = centroids.length;
    for (let j = 0; j < pts.length; j += 1) {
      if (clusterId[j] === -1 && Math.hypot(pts[j][0] - pts[i][0], pts[j][1] - pts[i][1]) <= tol) {
        clusterId[j] = clusterId[i];
        members.push(j);
      }
    }
    let mx = 0;
    let my = 0;
    for (const m of members) {
      mx += pts[m][0];
      my += pts[m][1];
    }
    centroids.push([mx / members.length, my / members.length]);
  }

  return lines.map((ln, k) => {
    const c1 = centroids[clusterId[2 * k]];
    const c2 = centroids[clusterId[2 * k + 1]];
    return makeLine([c1[0], c1[1]], [c2[0], c2[1]], ln.layer);
  });
}

export interface RegularizeOptions {
  doMerge?: boolean;
  doSnapAngle?: boolean;
  doSnapEndpoints?: boolean;
  minLength?: number;
}

export function regularize(
  entities: Entity[],
  { doMerge = true, doSnapAngle = true, doSnapEndpoints = true, minLength = 10 }: RegularizeOptions = {},
): Entity[] {
  let lines = entities.filter((e): e is Line => e.kind === "line");
  const others = entities.filter((e) => e.kind !== "line");

  if (doMerge) lines = mergeCollinear(lines);
  if (doSnapAngle) lines = snapAngles(lines);
  if (doSnapEndpoints) lines = snapEndpoints(lines);
  lines = lines.filter((ln) => lineLength(ln) >= minLength);

  return [...lines, ...others];
}
