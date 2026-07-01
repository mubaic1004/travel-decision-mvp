// End-to-end pipeline: grayscale image -> entities.
// TS port of cli.py `_run_pipeline`, extended with arc strokes + angle mode
// + RANSAC circle detection (robust to circles that cross lines).

import {
  detectCircles,
  detectCirclesRansac,
  eraseCircles,
  filterArcsOnCircles,
  filterSegmentsOnCircles,
} from "@/lib/cad/detect-circles";
import { detectStrokes } from "@/lib/cad/detect-lines";
import { makeCircle, type Circle, type Entity } from "@/lib/cad/model";
import { preprocess, type Preprocessed } from "@/lib/cad/preprocess";
import { regularize } from "@/lib/cad/regularize";
import type { Gray } from "@/lib/cad/raster";

export interface PipelineOptions {
  minLineLength?: number;
  detectCircles?: boolean;
  snapAngle?: boolean;
}

export interface PipelineResult {
  pre: Preprocessed;
  entities: Entity[];
}

function dedupCircles(circles: Circle[]): Circle[] {
  const kept: Circle[] = [];
  for (const c of circles) {
    const dup = kept.some(
      (k) =>
        Math.hypot(c.center[0] - k.center[0], c.center[1] - k.center[1]) < 0.3 * k.radius &&
        Math.abs(c.radius - k.radius) < 0.3 * k.radius,
    );
    if (!dup) kept.push(makeCircle(c.center, c.radius));
  }
  return kept;
}

export function runPipeline(
  gray: Gray,
  { minLineLength = 30, detectCircles: doCircles = true, snapAngle = true }: PipelineOptions = {},
): PipelineResult {
  const pre = preprocess(gray);

  // Circles from both the connected-component and RANSAC detectors (the latter
  // catches circles that touch/cross other strokes).
  const circles: Circle[] = doCircles
    ? dedupCircles([
        ...detectCircles(pre.skeleton, pre.binary),
        ...detectCirclesRansac(pre.skeleton, pre.binary),
      ])
    : [];

  // Remove circle rings before tracing so they don't become polygons of lines.
  const cleaned = eraseCircles(pre.skeleton, circles);

  const { lines: rawLines, arcs: rawArcs } = detectStrokes(cleaned, { minLineLength });
  const filtered = filterSegmentsOnCircles(rawLines, circles);
  const arcs = filterArcsOnCircles(rawArcs, circles);

  const lineEntities = regularize(filtered, {
    doSnapAngle: snapAngle,
    minLength: minLineLength,
  });

  return { pre, entities: [...lineEntities, ...arcs, ...circles] };
}
