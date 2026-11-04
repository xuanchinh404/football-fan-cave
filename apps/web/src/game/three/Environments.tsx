import { GrandHall, type Quality } from './GrandHall';
import { RedDevilsCave } from './RedDevilsCave';
import { RedDevilsMuseum } from './RedDevilsMuseum';
import type { SceneId } from './worldLayout';

export function Environment({ map, quality = 'medium' }: { map: SceneId; quality?: Quality }) {
  if (map === 'plaza') return <GrandHall quality={quality} />;
  if (map === 'hall-of-legends') return <RedDevilsMuseum quality={quality} />;
  return <RedDevilsCave quality={quality} />;
}
