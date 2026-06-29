// Geometric entity model — TS port of handdraw2cad/model.py.
//
// The entity list is the intermediate representation flowing through the whole
// pipeline: detect -> regularize -> (manual edit) -> export.
// Coordinate convention: pixel coords of the source image, x right, y DOWN
// (image convention). Unit conversion to mm happens only at DXF export.

export type Point = [number, number];

export type LayerName = "outline" | "centerline" | "dimension" | "construction";

export interface Line {
  kind: "line";
  id: string;
  p1: Point;
  p2: Point;
  layer: LayerName;
}

export interface Circle {
  kind: "circle";
  id: string;
  center: Point;
  radius: number;
  layer: LayerName;
}

export interface Arc {
  kind: "arc";
  id: string;
  center: Point;
  radius: number;
  startAngle: number; // degrees, CCW from +x in image coords
  endAngle: number;
  layer: LayerName;
}

export type Entity = Line | Circle | Arc;

let idCounter = 0;
export function nextId(prefix = "e"): string {
  idCounter += 1;
  return `${prefix}${idCounter}`;
}

export function makeLine(p1: Point, p2: Point, layer: LayerName = "outline"): Line {
  return { kind: "line", id: nextId("l"), p1, p2, layer };
}

export function makeCircle(center: Point, radius: number, layer: LayerName = "outline"): Circle {
  return { kind: "circle", id: nextId("c"), center, radius, layer };
}

export function makeArc(
  center: Point,
  radius: number,
  startAngle: number,
  endAngle: number,
  layer: LayerName = "outline",
): Arc {
  return { kind: "arc", id: nextId("a"), center, radius, startAngle, endAngle, layer };
}

export function lineLength(l: Line): number {
  return Math.hypot(l.p2[0] - l.p1[0], l.p2[1] - l.p1[1]);
}

// Undirected angle in [0, 180).
export function lineAngleDeg(l: Line): number {
  const a = (Math.atan2(l.p2[1] - l.p1[1], l.p2[0] - l.p1[0]) * 180) / Math.PI;
  return ((a % 180) + 180) % 180;
}
