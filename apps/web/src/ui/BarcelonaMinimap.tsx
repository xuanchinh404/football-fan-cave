import { useBarcaLanguage } from '../game/three/barcelona/useBarcaLanguage';
import { BARCA_COPY, bt } from '../../../../packages/shared/barcelona/content';
import {
  BARCA_HALL,
  BARCA_LINK,
  BARCA_MUSEUM,
  barcaMetres,
} from '../../../../packages/shared/barcelona/layout';
import { CAVE_CONNECTIONS } from '../../../../packages/shared/caveConnections';
import { CAVES, CORRIDOR_HALF_WIDTH, caveEntrance } from '../../../../packages/shared/grandHall';
import type { Point } from '../../../../packages/shared/world';

const gate =
  caveEntrance(CAVES.find((cave) => cave.id === 'barcelona')!).z -
  CAVE_CONNECTIONS.barcelona.offset[2];
export function BarcelonaMinimap({
  position,
  heading,
  large,
  onClick,
}: {
  position: Point;
  heading: number;
  large: boolean;
  onClick?: () => void;
}) {
  const { x, z } = barcaMetres(position);
  const lang = useBarcaLanguage();
  const label = lang === 'vi' ? 'Bản đồ Hang Barcelona' : 'Barcelona Cave map';
  const areas = [
    { ...BARCA_HALL, fill: '#354885' },
    { ...BARCA_LINK, fill: '#773553' },
    { ...BARCA_MUSEUM, fill: '#243762' },
    {
      left: -CORRIDOR_HALF_WIDTH,
      right: CORRIDOR_HALF_WIDTH,
      north: 0,
      south: gate,
      fill: '#713954',
    },
  ];
  const map = (
    <svg viewBox={`-14 -33 66 ${gate + 37}`} role="img" aria-label={label}>
      {areas.map((r) => (
        <rect
          key={r.left}
          x={r.left}
          y={r.north}
          width={r.right - r.left}
          height={r.south - r.north}
          fill={r.fill}
          stroke="#d49b55"
          strokeWidth=".33"
          rx=".4"
        />
      ))}
      <rect x="-10.6" y="-26.8" width="7.2" height="11.1" fill="#7d3156" rx="1" />
      {[
        { x: 5.5, z: -8, copy: BARCA_COPY.hall },
        { x: -7, z: -18, copy: BARCA_COPY.lounge },
        { x: 36.9, z: -11.1, copy: BARCA_COPY.museum },
        { x: 0, z: gate + 2.25, copy: BARCA_COPY.tunnel },
      ].map((spot, i) => (
        <g key={spot.x}>
          {i < 3 && (
            <circle cx={spot.x} cy={spot.z - 2.6} r={i === 1 ? 0.66 : 0.86} fill="#f8bf6b" />
          )}
          {(large || i !== 1) && (
            <text
              x={spot.x}
              y={spot.z}
              textAnchor="middle"
              fill="#fff1dc"
              fontSize={large ? 1.72 : 2.08}
            >
              {bt(lang, spot.copy)}
            </text>
          )}
        </g>
      ))}
      <circle cx={x} cy={z} r="1.6" fill="#fff0b1" opacity=".35" />
      <path
        d="M0 -2.05L-1.02 0.86 0 0.55 1.02 0.86Z"
        fill="#fff9e5"
        transform={`translate(${x} ${z}) rotate(${180 - (heading * 180) / Math.PI})`}
      />
    </svg>
  );
  return large ? (
    <div className="map-large barca-map-large">{map}</div>
  ) : (
    <button type="button" className="mini-map" onClick={onClick} aria-label={label}>
      {map}
    </button>
  );
}
