"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { loadImageFromSource, type LoadedImage } from "@/lib/cad/image-load";
import { preprocess, type Preprocessed } from "@/lib/cad/preprocess";
import { binaryToRgba } from "@/lib/cad/raster";

type View = "binary" | "skeleton" | "original";
type Phase = "idle" | "processing" | "ready" | "error";

export function CadTool() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string>("");
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [pre, setPre] = useState<Preprocessed | null>(null);
  const [view, setView] = useState<View>("skeleton");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const run = useCallback(async (src: string | File) => {
    setPhase("processing");
    setError("");
    try {
      const loaded = await loadImageFromSource(src);
      setImage(loaded);
      // Yield so the spinner can paint before the heavy sync work.
      await new Promise((r) => setTimeout(r, 16));
      const result = preprocess(loaded.gray);
      setPre(result);
      setPhase("ready");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "处理失败");
      setPhase("error");
    }
  }, []);

  // Paint the selected view onto the canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (view === "original") {
      ctx.putImageData(image.rgba, 0, 0);
      return;
    }
    if (!pre) return;
    const bin = view === "binary" ? pre.binary : pre.skeleton;
    ctx.putImageData(binaryToRgba(bin), 0, 0);
  }, [view, image, pre]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#010103]">
      <div className="aurora-bg pointer-events-none fixed inset-0" />
      <div className="dot-grid pointer-events-none fixed inset-0" />

      <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-10 sm:px-10 sm:pt-14">
        <Link
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-white/50 backdrop-blur transition hover:border-white/30 hover:text-white"
          href="/"
        >
          ← chenmubai.cn
        </Link>

        <header className="mt-10">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">
            手绘转 CAD / HANDDRAW → DXF
          </p>
          <h1 className="mt-3 text-[2rem] font-normal leading-[1.15] tracking-[-0.02em] text-white sm:text-[2.6rem]">
            把手绘工程图变成可编辑的 CAD 图纸
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
            上传一张由直线和圆构成的手绘图，浏览器会就地识别成矢量几何 ——
            全程在你的设备上完成，图片不上传任何服务器。
          </p>
        </header>

        {/* Upload / actions */}
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <label className="cursor-pointer rounded-full bg-white px-6 py-3 text-sm font-normal text-black transition hover:bg-[#e2e2e6]">
            选择图片
            <input
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void run(f);
              }}
              type="file"
            />
          </label>
          <button
            className="rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm text-white/70 transition hover:border-white/30 hover:text-white"
            onClick={() => void run("/cad-sample.png")}
            type="button"
          >
            用示例图试试
          </button>
        </div>

        {/* Status */}
        {phase === "processing" ? (
          <p className="mt-8 text-sm text-white/50">正在识别…（大图可能要几秒）</p>
        ) : null}
        {phase === "error" ? (
          <div className="mt-8 rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        ) : null}

        {/* Result canvas + view toggle */}
        {image ? (
          <div className="mt-10">
            <div className="mb-4 flex flex-wrap gap-2">
              {(["original", "binary", "skeleton"] as const).map((v) => (
                <button
                  className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.16em] transition ${
                    view === v
                      ? "bg-white text-black"
                      : "border border-white/15 bg-white/[0.04] text-white/60 hover:text-white"
                  }`}
                  key={v}
                  onClick={() => setView(v)}
                  type="button"
                >
                  {v === "original" ? "原图" : v === "binary" ? "二值" : "骨架"}
                </button>
              ))}
            </div>
            <div className="overflow-auto rounded-xl border border-white/10 bg-black/40 p-3">
              <canvas
                className="mx-auto block max-w-full"
                ref={canvasRef}
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
