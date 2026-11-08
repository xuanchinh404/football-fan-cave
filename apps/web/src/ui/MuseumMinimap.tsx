import { HALL } from '../../../../packages/shared/museum';
import { hallLanguage, hallObstacles } from '../../../../packages/shared/museum/hall';
import type { Point } from '../../../../packages/shared/world';
export function MuseumMinimap({
  position,
  large = false,
  onClick,
  heading = -Math.PI / 2,
}: {
  position: Point;
  large?: boolean;
  onClick?: () => void;
  heading?: number;
}) {
  const { l, r, t, b } = HALL.bounds;
  const english = hallLanguage(document.documentElement.lang) === 'en';
  const svg = (
    <svg
      viewBox={`${l - 120} ${t - 120} ${r - l + 240} ${b - t + 240}`}
      role="img"
      aria-label={english ? 'Manchester United museum map' : 'Bản đồ Phòng Truyền Thống MU'}
    >
      <rect x={l - 120} y={t - 120} width={r - l + 240} height={b - t + 240} fill="#190d1c" />
      <rect
        x={l}
        y={t}
        width={r - l}
        height={b - t}
        rx="180"
        fill="#6b283c"
        stroke="#e9ae61"
        strokeWidth="30"
      />
      <path d={`M1800 ${t + 120}V${b - 40}`} stroke="#e39b5f" strokeWidth="510" opacity=".35" />
      {hallObstacles.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="#f8bc61" opacity=".7" />
      ))}
      {HALL.zones.map((z) => (
        <g key={z.id}>
          <circle cx={z.x} cy={z.y} r="100" fill="#e32948" stroke="#ffda95" strokeWidth="10" />
          <text x={z.x} y={z.y + 30} textAnchor="middle" fontSize="95" fill="#fff4d2">
            {z.id}
          </text>
          {large && (
            <text x={z.x} y={z.y + 160} textAnchor="middle" fontSize="55" fill="#fff4d2">
              {english ? z.en : z.label}
            </text>
          )}
        </g>
      ))}
      <g
        data-player-x={Math.round(position.x)}
        data-player-y={Math.round(position.y)}
        transform={`translate(${position.x} ${position.y}) rotate(${180 - (heading * 180) / Math.PI})`}
      >
        <circle r="110" fill="#fff3ae" opacity=".25" />
        <path d="M0 -90L-65 65 0 30 65 65Z" fill="#fff1ad" stroke="#ff3d55" strokeWidth="20" />
      </g>
    </svg>
  );
  return large ? (
    <div className="map-large">{svg}</div>
  ) : (
    <button
      className="mini-map museum-map"
      onClick={onClick}
      aria-label={english ? 'Open museum map' : 'Mở bản đồ lớn'}
    >
      {svg}
      <span className="north">N</span>
    </button>
  );
}
