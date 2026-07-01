"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import { CanvasEditor } from "@/components/cad/canvas-editor";
import { exportDxf } from "@/lib/cad/export-dxf";
import { exportSvg } from "@/lib/cad/export-svg";
import { loadImageFromSource, type LoadedImage } from "@/lib/cad/image-load";
import type { Entity } from "@/lib/cad/model";
import { runPipeline } from "@/lib/cad/pipeline";
import { createZip } from "@/lib/cad/zip";

type Phase = "idle" | "processing" | "ready" | "error";
type Mode = "engineering" | "architecture";

export function CadTool() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string>("");
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [history, setHistory] = useState<Entity[][]>([]);
  const [scale, setScale] = useState("1");
  const [mode, setMode] = useState<Mode>("engineering");
  const lastSrcRef = useRef<string | File | null>(null);

  const run = useCallback(async (src: string | File, m: Mode) => {
    lastSrcRef.current = src;
    setPhase("processing");
    setError("");
    try {
      const loaded = await loadImageFromSource(src);
      setImage(loaded);
      await new Promise((r) => setTimeout(r, 16));
      const result = runPipeline(loaded.gray, { snapAngle: m === "engineering" });
      setEntities(result.entities);
      setHistory([]);
      setPhase("ready");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "处理失败");
      setPhase("error");
    }
  }, []);

  const changeMode = useCallback(
    (m: Mode) => {
      setMode(m);
      if (lastSrcRef.current) void run(lastSrcRef.current, m);
    },
    [run],
  );

  // Edits go through here so we can keep an undo stack.
  const applyEntities = useCallback((next: Entity[]) => {
    setEntities((cur) => {
      setHistory((h) => [...h.slice(-40), cur]);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      setEntities(h[h.length - 1]);
      return h.slice(0, -1);
    });
  }, []);

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadDxf = useCallback(() => {
    if (!image || entities.length === 0) return;
    const s = Number(scale) || 1;
    const dxf = exportDxf(entities, { scale: s, imageHeight: image.height });
    triggerDownload(new Blob([dxf], { type: "application/dxf" }), "drawing.dxf");
  }, [image, entities, scale]);

  // Bundle: DXF (real units) + underlay PNG + aligned self-contained SVG + README.
  const downloadBundle = useCallback(() => {
    if (!image || entities.length === 0) return;
    const s = Number(scale) || 1;

    // Encode the (downscaled) base image to PNG.
    const off = document.createElement("canvas");
    off.width = image.width;
    off.height = image.height;
    const octx = off.getContext("2d");
    if (!octx) return;
    octx.putImageData(image.rgba, 0, 0);
    const pngDataUrl = off.toDataURL("image/png");
    const pngBytes = Uint8Array.from(atob(pngDataUrl.split(",")[1]), (c) => c.charCodeAt(0));

    const dxf = exportDxf(entities, { scale: s, imageHeight: image.height });
    const svg = exportSvg(entities, {
      width: image.width,
      height: image.height,
      pngDataUrl,
    });
    const readme =
      `手绘转 CAD 导出包\n\n` +
      `- drawing.dxf : 矢量图形，真实毫米单位（比例尺 ${s} 毫米/像素）。\n` +
      `- underlay.png : 手绘底图，像素坐标与 DXF 对应。\n` +
      `- preview.svg : 底图 + 矢量叠加，双击用浏览器打开即可对照。\n\n` +
      `在 CAD 里叠加底图：附着/插入 underlay.png，插入点设为 (0,0)，\n` +
      `缩放比例设为 ${s}（毫米/像素），即与矢量对齐。\n`;

    const zip = createZip([
      { name: "drawing.dxf", data: new TextEncoder().encode(dxf) },
      { name: "underlay.png", data: pngBytes },
      { name: "preview.svg", data: new TextEncoder().encode(svg) },
      { name: "README.txt", data: new TextEncoder().encode(readme) },
    ]);
    triggerDownload(zip, "handdraw-cad.zip");
  }, [image, entities, scale]);

  const lineCount = entities.filter((e) => e.kind === "line").length;
  const circleCount = entities.filter((e) => e.kind === "circle").length;
  const arcCount = entities.filter((e) => e.kind === "arc").length;

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
            上传手绘的工程图或建筑透视线稿（直线、弧线、圆都能识别），浏览器就地
            转成矢量几何并导出 DXF —— 全程在你的设备上完成，图片不上传任何服务器。
          </p>
        </header>

        {/* Mode selector */}
        <div className="mt-10">
          <p className="mb-3 text-[11px] uppercase tracking-[0.24em] text-white/40">识别模式</p>
          <div className="flex flex-wrap gap-2">
            {([
              ["engineering", "工程图", "把线吸附到水平/垂直/45°直角"],
              ["architecture", "建筑 / 透视", "保留所有角度，识别弧线"],
            ] as const).map(([m, label, desc]) => (
              <button
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  mode === m
                    ? "border-white/40 bg-white/[0.08]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/25"
                }`}
                key={m}
                onClick={() => changeMode(m)}
                type="button"
              >
                <span className="block text-sm text-white">{label}</span>
                <span className="mt-0.5 block text-[11px] text-white/40">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Upload / actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <label className="cursor-pointer rounded-full bg-white px-6 py-3 text-sm font-normal text-black transition hover:bg-[#e2e2e6]">
            选择图片
            <input
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void run(f, mode);
              }}
              type="file"
            />
          </label>
          <button
            className="rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm text-white/70 transition hover:border-white/30 hover:text-white"
            onClick={() => void run("/cad-sample.png", mode)}
            type="button"
          >
            工程图示例
          </button>
          <button
            className="rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm text-white/70 transition hover:border-white/30 hover:text-white"
            onClick={() => void run("/cad-arch-sample.png", mode)}
            type="button"
          >
            透视图示例
          </button>
        </div>

        {phase === "processing" ? (
          <p className="mt-8 text-sm text-white/50">正在识别…（大图可能要几秒）</p>
        ) : null}
        {phase === "error" ? (
          <div className="mt-8 rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        ) : null}

        {phase === "ready" && image ? (
          <div className="mt-10">
            <div className="mb-4 flex flex-wrap items-end gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div>
                <label className="field-label" htmlFor="cad-scale">
                  比例尺（毫米 / 像素）
                </label>
                <input
                  className="field-input w-40 text-base"
                  id="cad-scale"
                  min={0}
                  onChange={(e) => setScale(e.target.value)}
                  step="0.1"
                  type="number"
                  value={scale}
                />
                <p className="hint-text mt-2 max-w-xs">
                  用「标定尺寸」在图上量一段已知长度可自动填这里。
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-30"
                  disabled={history.length === 0}
                  onClick={undo}
                  type="button"
                >
                  ↶ 撤销
                </button>
                <button
                  className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm text-white/70 transition hover:border-white/30 hover:text-white"
                  onClick={downloadDxf}
                  type="button"
                >
                  仅 DXF
                </button>
                <button
                  className="rounded-full bg-white px-6 py-3 text-sm font-normal text-black transition hover:bg-[#e2e2e6]"
                  onClick={downloadBundle}
                  type="button"
                >
                  下载带底图 (ZIP)
                </button>
              </div>
              <span className="ml-auto text-xs text-white/40">
                {lineCount} 条线 · {arcCount} 段弧 · {circleCount} 个圆
              </span>
            </div>

            <CanvasEditor
              entities={entities}
              image={image}
              onCalibrate={(mmPerPx) => setScale(String(Number(mmPerPx.toFixed(4))))}
              onChange={applyEntities}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}
