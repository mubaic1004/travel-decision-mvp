// Web Worker wrapper around runPipeline so recognition never freezes the UI
// (real photos can take seconds; on the main thread that means a dead tab).

import { runPipeline, type PipelineOptions } from "@/lib/cad/pipeline";
import type { Gray } from "@/lib/cad/raster";

interface WorkerRequest {
  gray: Gray;
  options: PipelineOptions;
}

self.onmessage = (ev: MessageEvent<WorkerRequest>) => {
  try {
    const { gray, options } = ev.data;
    const result = runPipeline(gray, options);
    // Entities are plain JSON — cheap to clone. The heavy Preprocessed rasters
    // stay in the worker; the UI doesn't need them.
    self.postMessage({ ok: true as const, entities: result.entities });
  } catch (err) {
    self.postMessage({
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
