"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { LoadedImage } from "@/lib/cad/image-load";
import { makeLine, type Entity, type Point } from "@/lib/cad/model";

type Tool = "select" | "addline" | "calibrate";

interface View {
  scale: number; // world px -> css px
  tx: number;
  ty: number;
}

interface Handle {
  entityId: string;
  kind: "line-p1" | "line-p2" | "circle-center" | "circle-radius" | "arc-center";
  pos: Point; // world coords
}

interface CanvasEditorProps {
  image: LoadedImage;
  entities: Entity[];
  onChange: (entities: Entity[]) => void;
  onCalibrate: (mmPerPx: number) => void;
}

const HANDLE_HIT = 9; // css px
const COL_BASE = "rgba(255,255,255,0.16)";
const COL_ENTITY = "#5ad1c0";
const COL_SELECTED = "#ffffff";
const COL_HANDLE = "#ffd36a";

export function CanvasEditor({ image, entities, onChange, onCalibrate }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [view, setView] = useState<View>({ scale: 1, tx: 0, ty: 0 });
  const [tool, setTool] = useState<Tool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverHandle, setHoverHandle] = useState<Handle | null>(null);

  // Interaction state kept in a ref so pointer handlers don't go stale.
  const drag = useRef<
    | { type: "pan"; startX: number; startY: number; startTx: number; startTy: number }
    | { type: "handle"; handle: Handle }
    | { type: "draw"; from: Point; to: Point }
    | null
  >(null);
  const [, forceRedraw] = useState(0);

  // Offscreen base image (faint underlay), drawn once per image.
  useEffect(() => {
    const off = document.createElement("canvas");
    off.width = image.width;
    off.height = image.height;
    const octx = off.getContext("2d");
    if (octx) octx.putImageData(image.rgba, 0, 0);
    baseCanvasRef.current = off;
  }, [image]);

  const screenToWorld = useCallback(
    (sx: number, sy: number): Point => [(sx - view.tx) / view.scale, (sy - view.ty) / view.scale],
    [view],
  );

  // Fit the drawing into the viewport whenever the image changes.
  const fit = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;
    const s = Math.min(cw / image.width, ch / image.height) * 0.92;
    setView({
      scale: s,
      tx: (cw - image.width * s) / 2,
      ty: (ch - image.height * s) / 2,
    });
  }, [image]);

  useEffect(() => {
    fit();
  }, [fit]);

  // Collect draggable handles for all entities.
  const handlesOf = useCallback((): Handle[] => {
    const hs: Handle[] = [];
    for (const e of entities) {
      if (e.kind === "line") {
        hs.push({ entityId: e.id, kind: "line-p1", pos: e.p1 });
        hs.push({ entityId: e.id, kind: "line-p2", pos: e.p2 });
      } else if (e.kind === "circle") {
        hs.push({ entityId: e.id, kind: "circle-center", pos: e.center });
        hs.push({ entityId: e.id, kind: "circle-radius", pos: [e.center[0] + e.radius, e.center[1]] });
      } else if (e.kind === "arc") {
        hs.push({ entityId: e.id, kind: "arc-center", pos: e.center });
      }
    }
    return hs;
  }, [entities]);

  const hitHandle = useCallback(
    (sx: number, sy: number): Handle | null => {
      for (const h of handlesOf()) {
        const hx = h.pos[0] * view.scale + view.tx;
        const hy = h.pos[1] * view.scale + view.ty;
        if (Math.hypot(hx - sx, hy - sy) <= HANDLE_HIT) return h;
      }
      return null;
    },
    [handlesOf, view],
  );

  const hitEntity = useCallback(
    (sx: number, sy: number): string | null => {
      const [wx, wy] = screenToWorld(sx, sy);
      const tol = 6 / view.scale;
      for (const e of entities) {
        if (e.kind === "line") {
          if (distToSegment([wx, wy], e.p1, e.p2) <= tol) return e.id;
        } else if (e.kind === "circle") {
          if (Math.abs(Math.hypot(wx - e.center[0], wy - e.center[1]) - e.radius) <= tol) return e.id;
        } else if (e.kind === "arc") {
          if (Math.abs(Math.hypot(wx - e.center[0], wy - e.center[1]) - e.radius) <= tol) return e.id;
        }
      }
      return null;
    },
    [entities, screenToWorld, view],
  );

  // ---- Pointer handlers ----
  const onPointerDown = useCallback(
    (ev: React.PointerEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const sx = ev.clientX - rect.left;
      const sy = ev.clientY - rect.top;
      try {
        (ev.target as Element).setPointerCapture?.(ev.pointerId);
      } catch {
        // setPointerCapture can throw for non-active pointers; non-essential.
      }

      if (tool === "addline" || tool === "calibrate") {
        drag.current = { type: "draw", from: screenToWorld(sx, sy), to: screenToWorld(sx, sy) };
        forceRedraw((n) => n + 1);
        return;
      }

      // select tool
      const h = hitHandle(sx, sy);
      if (h) {
        setSelectedId(h.entityId);
        drag.current = { type: "handle", handle: h };
        return;
      }
      const id = hitEntity(sx, sy);
      if (id) {
        setSelectedId(id);
        drag.current = null;
        return;
      }
      setSelectedId(null);
      drag.current = { type: "pan", startX: sx, startY: sy, startTx: view.tx, startTy: view.ty };
    },
    [tool, hitHandle, hitEntity, screenToWorld, view],
  );

  const onPointerMove = useCallback(
    (ev: React.PointerEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const sx = ev.clientX - rect.left;
      const sy = ev.clientY - rect.top;
      const d = drag.current;

      if (!d) {
        // hover feedback in select mode
        if (tool === "select") {
          const h = hitHandle(sx, sy);
          setHoverHandle(h);
        }
        return;
      }

      if (d.type === "pan") {
        setView((v) => ({ ...v, tx: d.startTx + (sx - d.startX), ty: d.startTy + (sy - d.startY) }));
        return;
      }
      if (d.type === "draw") {
        d.to = screenToWorld(sx, sy);
        forceRedraw((n) => n + 1);
        return;
      }
      if (d.type === "handle") {
        const w = screenToWorld(sx, sy);
        onChange(
          entities.map((e) => {
            if (e.id !== d.handle.entityId) return e;
            if (e.kind === "line" && d.handle.kind === "line-p1") return { ...e, p1: w };
            if (e.kind === "line" && d.handle.kind === "line-p2") return { ...e, p2: w };
            if (e.kind === "circle" && d.handle.kind === "circle-center") return { ...e, center: w };
            if (e.kind === "circle" && d.handle.kind === "circle-radius")
              return { ...e, radius: Math.max(2, Math.hypot(w[0] - e.center[0], w[1] - e.center[1])) };
            if (e.kind === "arc" && d.handle.kind === "arc-center") return { ...e, center: w };
            return e;
          }),
        );
      }
    },
    [tool, hitHandle, screenToWorld, entities, onChange],
  );

  const onPointerUp = useCallback(
    (ev: React.PointerEvent) => {
      const d = drag.current;
      drag.current = null;
      if (!d || d.type !== "draw") return;

      const dist = Math.hypot(d.to[0] - d.from[0], d.to[1] - d.from[1]);
      if (tool === "addline" && dist >= 3) {
        onChange([...entities, makeLine(d.from, d.to)]);
        setTool("select");
      } else if (tool === "calibrate" && dist >= 3) {
        const answer = window.prompt(`这段长度在真实图纸上是多少毫米？（当前 ${dist.toFixed(0)} 像素）`, "1000");
        const mm = Number(answer);
        if (answer !== null && Number.isFinite(mm) && mm > 0) onCalibrate(mm / dist);
        setTool("select");
      }
      forceRedraw((n) => n + 1);
    },
    [tool, entities, onChange, onCalibrate],
  );

  const onWheel = useCallback((ev: React.WheelEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = ev.clientX - rect.left;
    const sy = ev.clientY - rect.top;
    setView((v) => {
      const factor = ev.deltaY < 0 ? 1.12 : 1 / 1.12;
      const ns = Math.min(40, Math.max(0.05, v.scale * factor));
      // Zoom toward the cursor.
      return {
        scale: ns,
        tx: sx - ((sx - v.tx) / v.scale) * ns,
        ty: sy - ((sy - v.ty) / v.scale) * ns,
      };
    });
  }, []);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    onChange(entities.filter((e) => e.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, entities, onChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, deleteSelected]);

  // ---- Render ----
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    const { scale, tx, ty } = view;
    const wx = (x: number) => x * scale + tx;
    const wy = (y: number) => y * scale + ty;

    // Faint base image.
    if (baseCanvasRef.current) {
      ctx.globalAlpha = 0.16;
      ctx.drawImage(baseCanvasRef.current, tx, ty, image.width * scale, image.height * scale);
      ctx.globalAlpha = 1;
    }

    // Entities.
    for (const e of entities) {
      const sel = e.id === selectedId;
      ctx.strokeStyle = sel ? COL_SELECTED : COL_ENTITY;
      ctx.lineWidth = sel ? 2.5 : 1.8;
      ctx.beginPath();
      if (e.kind === "line") {
        ctx.moveTo(wx(e.p1[0]), wy(e.p1[1]));
        ctx.lineTo(wx(e.p2[0]), wy(e.p2[1]));
      } else if (e.kind === "circle") {
        ctx.arc(wx(e.center[0]), wy(e.center[1]), e.radius * scale, 0, Math.PI * 2);
      } else if (e.kind === "arc") {
        const a0 = (e.startAngle * Math.PI) / 180;
        const a1 = (e.endAngle * Math.PI) / 180;
        ctx.arc(wx(e.center[0]), wy(e.center[1]), e.radius * scale, a0, a1, a1 < a0);
      }
      ctx.stroke();
    }

    // Handles (small dots).
    for (const h of handlesOf()) {
      const on = hoverHandle && hoverHandle.entityId === h.entityId && hoverHandle.kind === h.kind;
      ctx.fillStyle = COL_HANDLE;
      ctx.beginPath();
      ctx.arc(wx(h.pos[0]), wy(h.pos[1]), on ? 5.5 : 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rubber-band while drawing / calibrating.
    const d = drag.current;
    if (d && d.type === "draw") {
      ctx.strokeStyle = tool === "calibrate" ? "#ff8a5a" : COL_HANDLE;
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(wx(d.from[0]), wy(d.from[1]));
      ctx.lineTo(wx(d.to[0]), wy(d.to[1]));
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [entities, view, selectedId, hoverHandle, image, tool, handlesOf]);

  const toolBtn = (t: Tool, label: string) => (
    <button
      className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.14em] transition ${
        tool === t ? "bg-white text-black" : "border border-white/15 bg-white/[0.04] text-white/60 hover:text-white"
      }`}
      onClick={() => setTool(t)}
      type="button"
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {toolBtn("select", "选择 / 拖拽")}
        {toolBtn("addline", "加线")}
        {toolBtn("calibrate", "标定尺寸")}
        <button
          className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.14em] text-white/60 transition hover:text-white disabled:opacity-30"
          disabled={!selectedId}
          onClick={deleteSelected}
          type="button"
        >
          删除选中
        </button>
        <button
          className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.14em] text-white/60 transition hover:text-white"
          onClick={fit}
          type="button"
        >
          适配视图
        </button>
        <span className="ml-1 text-[11px] text-white/35">
          滚轮缩放 · 空白处拖动平移 · 拖黄点改端点
        </span>
      </div>

      <div
        className="relative h-[62vh] min-h-[360px] overflow-hidden rounded-xl border border-white/10 bg-black/40"
        ref={wrapRef}
      >
        <canvas
          className="block touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onWheel={onWheel}
          ref={canvasRef}
          style={{ cursor: tool === "select" ? "default" : "crosshair" }}
        />
      </div>
    </div>
  );
}

function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}
