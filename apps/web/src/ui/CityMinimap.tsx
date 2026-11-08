import { CAVE_CONNECTIONS } from '../../../../packages/shared/caveConnections';
import { caveEntrance, CAVES, CORRIDOR_HALF_WIDTH } from '../../../../packages/shared/grandHall';
import { CITY_COPY, cityLanguage, cityText } from '../../../../packages/shared/city/content';
import { CITY_HALL, CITY_LINK, CITY_MUSEUM, cityMetres } from '../../../../packages/shared/city/layout';
import type { Point } from '../../../../packages/shared/world';

const entrance = caveEntrance(CAVES.find((cave) => cave.id === 'city')!);
const tunnelEnd = entrance.z - CAVE_CONNECTIONS.city.offset[2];
export function CityMinimap({ position, heading, large, onClick }: {
  position: Point; heading: number; large: boolean; onClick?: () => void;
}) {
  const lang = cityLanguage(document.documentElement.lang);
  const { x, z } = cityMetres(position);
  const tunnel = { left: -CORRIDOR_HALF_WIDTH, right: CORRIDOR_HALF_WIDTH, north: 0, south: tunnelEnd };
  const title = lang === 'en' ? 'Man City Cave map' : 'Bản đồ Hang Man City';
  const map = <svg viewBox={large ? `-19 -33 65 ${tunnelEnd + 39}` : z > 5 ? `-15 -5 30 ${tunnelEnd + 9}` : '-18 -32 63 38'}
    role="img" aria-label={title}>
    {[{ ...tunnel, label: CITY_COPY.tunnel, color: '#385c77' },
      { ...CITY_HALL, label: CITY_COPY.hall, color: '#245989' },
      { ...CITY_LINK, label: null, color: '#385c77' },
      { ...CITY_MUSEUM, label: CITY_COPY.museum, color: '#153d6d' }].map((r) =>
      <g key={r.left}>
        <rect x={r.left} y={r.north} width={r.right - r.left} height={r.south - r.north}
          fill={r.color} stroke="#a5dcfc" strokeWidth="0.37" />
        {r.label && <text x={(r.left + r.right) / 2} y={r.north + 4}
          textAnchor="middle" fontSize={r.north === 0 ? '1.25' : '1.75'} fill="#f0f8ff"
          transform={r.north === 0 ? 'rotate(90 0 4) translate(8 0)' : undefined}>
          {cityText(lang, r.label)}
        </text>}
      </g>)}
    <rect x="-14.5" y="-23" width="7.7" height="9.7" rx="0.6" fill="#176b92" />
    <text x="-10.65" y="-19.4" textAnchor="middle" fontSize="1.34" fill="#fff0bb">
      {lang === 'en' ? 'Lounge' : 'Tâm Sự'}
    </text>
    <path d={`M0 ${tunnelEnd}V-21 M0 -15H31`} stroke="#8ed7ff" strokeDasharray="0.7 0.9"
      strokeWidth="0.24" fill="none" />
    <path d={`M-3.2 ${tunnelEnd}h6.4`} stroke="#ffca7b" strokeWidth=".6" />
    <g transform={`translate(${x} ${z}) rotate(${180 - heading * 180 / Math.PI})`}>
      <circle r="1.12" fill="#f2ba60" stroke="#102c4d" strokeWidth="0.22" />
      <path d="M0 -1.45L-0.65 0.48 0 0.21 0.65 0.48Z" fill="white" />
    </g>
  </svg>;
  return large ? <div className="map-large city-map-large">{map}</div>
    : <button className="mini-map" onClick={onClick} aria-label={title}>{map}</button>;
}
