import type { Interaction, MapId, Player, Point, Profile } from '../../../../packages/shared/world';
export type WorldState = {
  map: MapId;
  position: Point;
  direction?: number;
  near?: Interaction;
  fps: number;
  seated?: boolean;
  height?: number;
  quality?: string;
  tier?: number;
};
export const bridge = new EventTarget();
export function emit(type: string, detail?: unknown) {
  bridge.dispatchEvent(new CustomEvent(type, { detail }));
}
export function on<T>(type: string, fn: (detail: T) => void) {
  const handler = (e: Event) => fn((e as CustomEvent).detail);
  bridge.addEventListener(type, handler);
  return () => bridge.removeEventListener(type, handler);
}
export type StartEvent = { profile: Profile; id: string };
export type RemoteEvent = { players: Player[]; self: string };
