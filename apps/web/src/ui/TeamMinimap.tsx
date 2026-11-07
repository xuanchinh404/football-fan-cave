import { KOP_CAVE, KOP_MUSEUM } from '../../../../packages/shared/liverpool/layout';
import { ARSENAL_CAVE, ARSENAL_MUSEUM } from '../../../../packages/shared/arsenal/layout';
import { BLUES_CAVE, BLUES_MUSEUM } from '../../../../packages/shared/chelsea/layout';
import type { Point } from '../../../../packages/shared/world';
export function TeamMinimap({
  position,
  arsenal = false,
  liverpool = false,
  museum = false,
  large = false,
  onClick,
  heading = Math.PI,
}: {
  position: Point;
  arsenal?: boolean;
  liverpool?: boolean;
  museum?: boolean;
  large?: boolean;
  onClick?: () => void;
  heading?: number;
}) {
  const club = liverpool ? 'Liverpool' : arsenal ? 'Arsenal' : 'Chelsea';
  const warm = arsenal || liverpool;
  const data = liverpool
      ? museum
        ? KOP_MUSEUM
        : KOP_CAVE
      : arsenal
        ? museum
          ? ARSENAL_MUSEUM
          : ARSENAL_CAVE
        : museum
          ? BLUES_MUSEUM
          : BLUES_CAVE,
    b = data.bounds;
  const svg = (
    <svg
      viewBox={`${b.l - 35} ${b.t - 35} ${b.r - b.l + 70} ${b.b - b.t + 70}`}
      role="img"
      aria-label={
        museum
          ? 'Bản đồ Phòng Truyền Thống ' + club
          : 'Bản đồ ' + (warm ? 'Hang ' + club : 'Hang The Blues')
      }
    >
      <rect
        x={b.l - 35}
        y={b.t - 35}
        width={b.r - b.l + 70}
        height={b.b - b.t + 70}
        fill={warm ? '#240f1b' : '#071830'}
      />
      <rect
        x={b.l}
        y={b.t}
        width={b.r - b.l}
        height={b.b - b.t}
        fill={warm ? '#793548' : '#214779'}
        stroke="#dcb76b"
        strokeWidth="12"
      />
      {data.obstacles.map((o, i) => (
        <rect
          key={i}
          x={o.x}
          y={o.y}
          width={o.w}
          height={o.h}
          fill={warm ? '#2a1421' : '#07162e'}
          stroke={warm ? '#b57c70' : '#6594d0'}
          strokeWidth="3"
        />
      ))}
      {data.zones.map((z) => (
        <g key={z.id}>
          <circle cx={z.x} cy={z.y} r="22" fill="#e2be70" />
          <text
            x={z.x}
            y={z.y - 40}
            fontSize={large ? 20 : 30}
            textAnchor="middle"
            fill="#fff1c9"
            stroke="#091a32"
            strokeWidth="5"
            paintOrder="stroke"
          >
            {z.label}
          </text>
        </g>
      ))}
      <g
        transform={`translate(${position.x} ${position.y}) rotate(${180 - (heading * 180) / Math.PI})`}
      >
        <circle r="55" fill="#57c7ff" opacity=".3" />
        <path d="M0 -30L-19 20 0 10 19 20Z" fill="#fff5bf" stroke="#152950" strokeWidth="5" />
      </g>
    </svg>
  );
  return large ? (
    <div className="map-large">{svg}</div>
  ) : (
    <button className="mini-map" onClick={onClick} aria-label={'Mở bản đồ ' + club}>
      {svg}
      <span className="north">N</span>
    </button>
  );
}
