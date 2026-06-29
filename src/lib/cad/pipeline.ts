// End-to-end pipeline: grayscale image -> entities.
// TS port of cli.py `_run_pipeline`.

import { detectCircles, filterSegmentsOnCircles } from "@/lib/cad/detect-circles";
import { detectLines } from "@/lib/cad/detect-lines";
import type { Circle, Entity, Line } from "@/lib/cad/model";
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

export function runPipeline(
  gray: Gray,
  { minLineLength = 30, detectCircles: doCircles = true, snapAngle = true }: PipelineOptions = {},
): PipelineResult {
  const pre = preprocess(gray);

  const circles: Circle[] = doCircles ? detectCircles(pre.skeleton, pre.binary) : [];
  let rawLines: Line[] = detectLines(pre.skeleton, { minLineLength });
  rawLines = filterSegmentsOnCircles(rawLines, circles);

  const lineEntities = regularize(rawLines, {
    doSnapAngle: snapAngle,
    minLength: minLineLength,
  });

  return { pre, entities: [...lineEntities, ...circles] };
}
