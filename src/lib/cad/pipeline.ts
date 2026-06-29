// End-to-end pipeline: grayscale image -> entities.
// TS port of cli.py `_run_pipeline`. Circle detection is added in a later stage.

import { detectLines } from "@/lib/cad/detect-lines";
import type { Entity } from "@/lib/cad/model";
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
  { minLineLength = 30, snapAngle = true }: PipelineOptions = {},
): PipelineResult {
  const pre = preprocess(gray);
  const rawLines = detectLines(pre.skeleton, { minLineLength });
  const entities = regularize(rawLines, {
    doSnapAngle: snapAngle,
    minLength: minLineLength,
  });
  return { pre, entities };
}
