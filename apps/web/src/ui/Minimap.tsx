import { BarcelonaMinimap } from './BarcelonaMinimap';
import { CityMinimap } from './CityMinimap';
import {
  CAVE_CONNECTIONS,
  isCaveZone,
  isRefuge,
} from '../../../../packages/shared/caveConnections';
import { TeamMinimap } from './TeamMinimap';
import { CaveMinimap } from './CaveMinimap';
import { MuseumMinimap } from './MuseumMinimap';
import { layouts, playtestInteractions, type SceneId } from '../game/three/worldLayout';
import {
  CAVES,
  caveEntrance,
  CORRIDOR_HALF_WIDTH,
  GRAND_PLACES,
  GRAND_SURFACES,
  grandMetres,
} from '../../../../packages/shared/grandHall';
import { obstacles, type MapId, type Point } from '../../../../packages/shared/world';
export function Minimap({
  map,
  position,
  large = false,
  onClick,
  heading = Math.PI,
}: {
  map: MapId;
  position: Point;
  large?: boolean;
  onClick?: () => void;
  heading?: number;
}) {
  if (map === 'barcelona')
    return <BarcelonaMinimap position={position} heading={heading} large={large} onClick={onClick} />;
  if (map === 'city')
    return <CityMinimap position={position} heading={heading} large={large} onClick={onClick} />;
  if (
    isCaveZone(map) &&
    map !== 'liverpool' &&
    (isRefuge(map) || position.y > layouts[map].bounds.b)
  ) {
    const cave = CAVES.find((candidate) => candidate.id === map)!;
    const { origin, offset, scale } = CAVE_CONNECTIONS[map];
    const bounds = layouts[map].bounds;
    const left = (bounds.l - origin.x) * scale;
    const top = (bounds.t - origin.y) * scale;
    const width = (bounds.r - bounds.l) * scale;
    const bottom = (bounds.b - origin.y) * scale;
    const gate = caveEntrance(cave).z - offset[2];
    const px = (position.x - origin.x) * scale;
    const pz = (position.y - origin.y) * scale;
    const contents = (
      <svg
        role="img"
        aria-label={`Bản đồ ${cave.name}`}
        viewBox={`${left - 3} ${top - 4} ${width + 6} ${gate - top + 8}`}
      >
        <rect
          x={left}
          y={top}
          width={width}
          height={bottom - top}
          fill="#3e384f"
          stroke={cave.color}
        />
        <rect
          x={-CORRIDOR_HALF_WIDTH}
          y={bottom}
          width={CORRIDOR_HALF_WIDTH * 2}
          height={gate - bottom}
          fill="#67505d"
        />
        <path
          d={`M${-CORRIDOR_HALF_WIDTH} ${gate}H${CORRIDOR_HALF_WIDTH}`}
          stroke={cave.color}
          strokeWidth="0.8"
        />
        <text x="0" y={top + 3.8} textAnchor="middle" fontSize="2.2" fill="#fff1ce">
          Sảnh Trú Ẩn
        </text>
        <circle cx={px} cy={pz} r="1.1" fill="#fff1ce" />
        <path
          d="M0 -1.8L-0.8 0.6 0 0.3 0.8 0.6Z"
          fill="#fff"
          transform={`translate(${px} ${pz}) rotate(${180 - (heading * 180) / Math.PI})`}
        />
      </svg>
    );
    return large ? (
      <div className="map-large">{contents}</div>
    ) : (
      <button className="mini-map" onClick={onClick} aria-label="Mở bản đồ lớn">
        {contents}
      </button>
    );
  }
  if (map === 'liverpool' || map === 'liverpool-museum')
    return (
      <TeamMinimap
        liverpool
        position={position}
        museum={map === 'liverpool-museum'}
        large={large}
        onClick={onClick}
        heading={heading}
      />
    );
  if (map === 'arsenal' || map === 'arsenal-museum')
    return (
      <TeamMinimap
        arsenal
        position={position}
        museum={map === 'arsenal-museum'}
        large={large}
        onClick={onClick}
        heading={heading}
      />
    );
  if (map === 'chelsea' || map === 'chelsea-museum')
    return (
      <TeamMinimap
        position={position}
        museum={map === 'chelsea-museum'}
        large={large}
        onClick={onClick}
        heading={heading}
      />
    );
  if (map === 'united')
    return <CaveMinimap position={position} large={large} onClick={onClick} heading={heading} />;
  if (map === 'hall-of-legends')
    return <MuseumMinimap position={position} large={large} onClick={onClick} heading={heading} />;
  const plaza = map === 'plaza',
    p = plaza ? grandMetres(position) : { x: position.x, z: position.y };
  const b = layouts.united.bounds;
  const contents = (
    <svg
      viewBox={
        plaza ? '-59 -62 118 108' : `${b.l - 50} ${b.t - 50} ${b.r - b.l + 100} ${b.b - b.t + 100}`
      }
      role="img"
      aria-label="Bản đồ 9 hang và vị trí người chơi"
    >
      {plaza ? (
        <>
          <rect x="-59" y="-62" width="118" height="108" fill="#233c4b" />
          <path d="M-55 -60L-55 41H55V-60" fill="#536f69" />
          {GRAND_SURFACES.map((s) => (
            <rect
              key={s.id}
              x={s.x - s.w / 2}
              y={s.z - s.d / 2}
              width={s.w}
              height={s.d}
              rx={s.kind === 'plaza' ? 8 : 1}
              fill={
                s.kind === 'stairs' || s.kind === 'bridge'
                  ? '#dfca91'
                  : s.north === 15
                    ? '#9e92b9'
                    : s.north === 7
                      ? '#a9aca7'
                      : '#a99f8c'
              }
              stroke="#f4dd9a"
              strokeWidth=".35"
            />
          ))}
          <circle cx="0" cy="3" r="3.5" fill="#edc34b" />
          {CAVES.map((c) => (
            <g key={c.id}>
              <circle
                cx={c.x}
                cy={c.z}
                r={c.id === 'united' ? 3.5 : 2.9}
                fill={c.color}
                stroke="#fff3c5"
                strokeWidth=".5"
              />
              <text
                x={c.x}
                y={c.z + 1}
                textAnchor="middle"
                fontSize="3"
                fontWeight="bold"
                fill="white"
              >
                {c.symbol}
              </text>
              {large && (
                <text
                  x={c.x}
                  y={c.z - 4.2}
                  textAnchor="middle"
                  fontSize="2.2"
                  fill="#fff4d7"
                  stroke="#202c47"
                  strokeWidth=".4"
                  paintOrder="stroke"
                >
                  {c.short}
                </text>
              )}
            </g>
          ))}
          {GRAND_PLACES.filter((a) => !['outfit', 'effects', 'vip', 'statue'].includes(a.id)).map(
            (a) => (
              <g key={a.id}>
                <rect
                  x={a.x - 1.3}
                  y={a.z - 1.3}
                  width="2.6"
                  height="2.6"
                  fill="#463650"
                  stroke="#ffd99b"
                  strokeWidth=".3"
                />
                {large && (
                  <text x={a.x} y={a.z + 3} textAnchor="middle" fontSize="1.7" fill="#ffefc6">
                    {a.label}
                  </text>
                )}
              </g>
            ),
          )}
        </>
      ) : (
        <>
          <rect x={b.l} y={b.t} width={b.r - b.l} height={b.b - b.t} fill="#68586d" />
          {obstacles('united').map((o, i) => (
            <rect key={i} x={o.x} y={o.y} width={o.w} height={o.h} fill="#a99777" />
          ))}
          {playtestInteractions('united').map((a) => (
            <circle key={a.id} cx={a.x} cy={a.y} r="35" fill="#f3bd6c" />
          ))}
        </>
      )}
      <g
        transform={`translate(${p.x} ${p.z}) rotate(${180 - (heading * 180) / Math.PI}) scale(${plaza ? 1 : 35})`}
      >
        <circle r="2.8" fill="white" opacity=".3" />
        <path d="M0 -2L-1.5 1.5 0 .7 1.5 1.5Z" fill="#fff" stroke="#dc375b" strokeWidth=".45" />
      </g>
    </svg>
  );
  return large ? (
    <div className="map-large">{contents}</div>
  ) : (
    <button className="mini-map" onClick={onClick} aria-label="Mở bản đồ lớn">
      {contents}
      <span className="north">N</span>
    </button>
  );
}
