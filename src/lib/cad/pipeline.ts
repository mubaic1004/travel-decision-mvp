// End-to-end pipeline: grayscale image -> entities.
// TS port of cli.py `_run_pipeline`, extended with arc strokes + angle mode.

import {
  detectCircles,
  filterArcsOnCircles,
  filterSegmentsOnCircles,
} from "@/lib/cad/detect-circles";
import { detectStrokes } from "@/lib/cad/detect-lines";
import type { Circle, Entity } from "@/lib/cad/model";
import { preprocess, type Preprocessed } from "@/lib/cad/preprocess";
import { regularize } from "@/lib/cad/regularize";
import type { Gray } from "@/lib/cad/raster";

export interface PipelineOptions {
  minLineLength?: number;
  detectCircles?: boolean;
  // Engineering mode snaps line angles to 0/45/90/135. Turn OFF for
  // architectural / perspective sketches so all angles are preserved.
  snapAngle?: boolean;
}

export interface PipelineResult {
  pre: Preprocessed;
  entities: Entity[];
}

export function runPipeline(
  gray: Gray,
  { minLineLength = 30, detectCircles: doCircles = true, snapAngle = true }: PipelineOptions = {},
): PipelineResult {
  const pre = preprocess(gray);

  const circles: Circle[] = doCircles ? detectCircles(pre.skeleton, pre.binary) : [];
  const { lines: rawLines, arcs: rawArcs } = detectStrokes(pre.skeleton, { minLineLength });
  const filtered = filterSegmentsOnCircles(rawLines, circles);
  const arcs = filterArcsOnCircles(rawArcs, circles);

  const lineEntities = regularize(filtered, {
    doSnapAngle: snapAngle,
    minLength: minLineLength,
  });

  return { pre, entities: [...lineEntities, ...arcs, ...circles] };
}
