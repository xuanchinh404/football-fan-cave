import { lazy } from 'react';
const ChelseaCave = lazy(() => import('./ChelseaCave').then((m) => ({ default: m.ChelseaCave })));
const ChelseaMuseum = lazy(() =>
  import('./ChelseaMuseum').then((m) => ({ default: m.ChelseaMuseum })),
);
import { GrandHall, type Quality } from './GrandHall';
const RedDevilsCave = lazy(() =>
  import('./RedDevilsCave').then((m) => ({ default: m.RedDevilsCave })),
);
const RedDevilsMuseum = lazy(() =>
  import('./RedDevilsMuseum').then((m) => ({ default: m.RedDevilsMuseum })),
);
import type { SceneId } from './worldLayout';

export function Environment({ map, quality = 'medium' }: { map: SceneId; quality?: Quality }) {
  if (map === 'chelsea') return <ChelseaCave quality={quality} />;
  if (map === 'chelsea-museum') return <ChelseaMuseum quality={quality} />;
  if (map === 'plaza') return <GrandHall quality={quality} />;
  if (map === 'hall-of-legends') return <RedDevilsMuseum quality={quality} />;
  return <RedDevilsCave quality={quality} />;
}
