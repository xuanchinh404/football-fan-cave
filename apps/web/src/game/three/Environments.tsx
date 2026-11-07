import { lazy } from 'react';
const LiverpoolCaveScene = lazy(() => import('./liverpool/LiverpoolCaveScene'));
const LiverpoolMuseumScene = lazy(() => import('./liverpool/LiverpoolMuseumScene'));
const ArsenalCave = lazy(() => import('./ArsenalCave').then((m) => ({ default: m.ArsenalCave })));
const ArsenalMuseum = lazy(() =>
  import('./ArsenalMuseum').then((m) => ({ default: m.ArsenalMuseum })),
);
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
  if (map === 'liverpool') return <LiverpoolCaveScene quality={quality} />;
  if (map === 'liverpool-museum') return <LiverpoolMuseumScene quality={quality} />;
  if (map === 'arsenal') return <ArsenalCave quality={quality} />;
  if (map === 'arsenal-museum') return <ArsenalMuseum quality={quality} />;
  if (map === 'chelsea') return <ChelseaCave quality={quality} />;
  if (map === 'chelsea-museum') return <ChelseaMuseum quality={quality} />;
  if (map === 'plaza') return <GrandHall quality={quality} />;
  if (map === 'hall-of-legends') return <RedDevilsMuseum quality={quality} />;
  return <RedDevilsCave quality={quality} />;
}
