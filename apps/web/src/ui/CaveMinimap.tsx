import { RED_CAVE } from '../../../../packages/shared/cave';
import type { Point } from '../../../../packages/shared/world';
export function CaveMinimap({
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
  const content = (
    <svg viewBox="0 0 4096 3072" role="img" aria-label="Bản đồ Hang Quỷ Đỏ">
      <rect width="4096" height="3072" fill="#201827" />
      <rect
        x="480"
        y="300"
        width="3160"
        height="2570"
        rx="300"
        fill="#72494c"
        stroke="#bd7863"
        strokeWidth="35"
      />
      <path
        d="M1040 720L2048 1980 3100 710M920 1550L2048 1980 3190 1810M2048 1980V2750"
        fill="none"
        stroke="#d3a485"
        strokeWidth="110"
        opacity=".7"
      />
      {RED_CAVE.obstacles.map((o, i) => (
        <rect key={i} x={o.x} y={o.y} width={o.w} height={o.h} rx="30" fill="#302032" />
      ))}
      {RED_CAVE.zones.map((z) => (
        <g key={z.id}>
          <circle cx={z.x} cy={z.y} r="83" fill={z.color} stroke="#ffead5" strokeWidth="10" />
          <text x={z.x} y={z.y + 27} fontSize="90" fill="#49222b" textAnchor="middle">
            {z.icon}
          </text>
          <text
            x={z.x}
            y={z.y - 140}
            fontSize={large ? 60 : 95}
            fill="#ffe8d7"
            stroke="#2f1c2c"
            strokeWidth="12"
            paintOrder="stroke"
            textAnchor="middle"
          >
            {z.label}
          </text>
        </g>
      ))}
      <circle cx={position.x} cy={position.y} r="150" fill="#fff3c9" opacity=".2" />
      <g
        transform={`translate(${position.x} ${position.y}) rotate(${(heading * 180) / Math.PI + 90})`}
        data-player-x={Math.round(position.x)}
        data-player-y={Math.round(position.y)}
      >
        <path d="M0 -80L-55 45 0 21 55 45Z" fill="#ff3e4e" stroke="#fff9eb" strokeWidth="15" />
      </g>
    </svg>
  );
  return large ? (
    <div className="map-large">{content}</div>
  ) : (
    <button className="mini-map" onClick={onClick} aria-label="Mở bản đồ lớn">
      {content}
      <span className="north">N</span>
    </button>
  );
}
