/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getWasmMath } from '../wasm/fixedPointWasm';
import { EntityBox } from '../types';

export function distanceSq(x1: number, y1: number, x2: number, y2: number): number {
  const wasm = getWasmMath();
  return wasm.fx_dist_sq(x1, y1, x2, y2);
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(distanceSq(x1, y1, x2, y2));
}

export function checkAABB(b1: EntityBox, b2: EntityBox): boolean {
  const wasm = getWasmMath();
  return wasm.box_overlap(
    b1.x | 0,
    b1.y | 0,
    b1.w | 0,
    b1.h | 0,
    b2.x | 0,
    b2.y | 0,
    b2.w | 0,
    b2.h | 0
  ) === 1;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
