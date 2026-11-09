import assert from 'node:assert/strict';
import { test } from 'node:test';
import coaches from '../packages/shared/barcelona/officialCoaches.json';
import {
  BARCA_ERAS,
  barcaCoaches,
  barcaHonours,
  barcaTerms,
  findBarcaTerms,
} from '../packages/shared/barcelona/content';
import {
  BARCA_SEATS,
  BARCA_STAIR,
  barcaWire,
  museumPoint,
} from '../packages/shared/barcelona/layout';
import { parseBarcaResult } from '../packages/shared/barcelona/match';
import { CAVE_CONNECTIONS, toWorldPoint, zoneAtDoor } from '../packages/shared/caveConnections';
import { caveEntrance, CAVES, grandMetres } from '../packages/shared/grandHall';
import { clearPath, groundHeight, near, walkable } from '../packages/shared/world';

test('FC Barcelona archive retains each club entry and every separately listed spell', () => {
  assert.equal(coaches.length, 61);
  assert.equal(
    coaches.reduce((n, coach) => n + coach.terms.length, 0),
    73,
  );
  assert.equal(barcaCoaches.length, 63);
  assert.equal(barcaTerms.length, 75);
  assert.equal(new Set(barcaTerms.map(({ id }) => id)).size, barcaTerms.length);
  for (const coach of coaches) {
    const included = barcaTerms.filter((term) => term.coach.id === coach.id);
    assert.deepEqual(included.map(({ start, end }) => [start, end]).reverse(), coach.terms);
  }
  const filtered = BARCA_ERAS.flatMap((_, era) => findBarcaTerms(era));
  assert.equal(new Set(filtered.map(({ id }) => id)).size, barcaTerms.length);
  assert.deepEqual(
    findBarcaTerms(null, 'carles rexach').map(({ start, caretaker }) => [start, caretaker]),
    [
      [2001, false],
      [1996, true],
      [1991, true],
      [1988, true],
    ],
  );
  assert.equal(findBarcaTerms(4, 'sergi barjuan')[0]?.caretaker, true);
  assert.equal(findBarcaTerms(3, 'jordi roura')[0]?.caretaker, true);
  assert.equal(findBarcaTerms(3, 'jesus antonio')[0]?.caretaker, true);
  assert.equal(findBarcaTerms(null, 'rinus michels').length, 2);
  assert.ok(findBarcaTerms(4).some(({ coach }) => coach.name === 'Ernesto Valverde'));
  assert.equal(barcaTerms.filter(({ current }) => current).length, 1);
  assert.equal(barcaTerms.find(({ current }) => current)?.coach.name, 'Hansi Flick');
  assert.ok(barcaTerms.some(({ coach }) => !coach.image));
  assert.deepEqual(
    barcaHonours.map((item) => item.seasons?.length),
    [29, 32, 5, 5, 3, 16, 4],
  );
});

test('Barcelona gallery is traversable in the same zone, with solid props and reachable interactions', () => {
  const cave = CAVES.find(({ id }) => id === 'barcelona')!;
  const door = caveEntrance(cave);
  const room = CAVE_CONNECTIONS.barcelona;
  const tunnel = grandMetres(toWorldPoint('barcelona', barcaWire(0, 2)));
  assert.equal(zoneAtDoor('plaza', door.x, door.z - 0.2, door.height), 'barcelona');
  assert.equal(zoneAtDoor('barcelona', door.x, door.z + 0.2, door.height), 'plaza');
  assert.equal(tunnel.x, door.x);
  assert.ok(tunnel.z > room.roomMouth && tunnel.z < door.z);
  const route = [barcaWire(0, 2), barcaWire(0, -15), barcaWire(28, -15), museumPoint(0, -19.4)];
  for (let i = 1; i < route.length; i++) assert.ok(clearPath('barcelona', route[i - 1], route[i]));
  assert.equal(groundHeight('barcelona', barcaWire(0, -24)), BARCA_STAIR.rise);
  const sofa = barcaWire(-6.7, -18.5);
  assert.equal(walkable('barcelona', sofa.x, sofa.y), false);
  for (const seat of BARCA_SEATS) assert.equal(near('barcelona', seat)?.kind, 'seat');
  assert.equal(near('barcelona', museumPoint(0, -19.4))?.id, 'coaches');
  assert.equal(near('barcelona', museumPoint(0, -20.72))?.id, 'cup-3');
});

test('results parser takes only a completed Barça score dated at or before now', () => {
  const result = (date: number, home: string, away: string, score = '') => `
    <li class="fixture-result-list__fixture"><a href="/en/matches/${date}/club-fixture">
    <div data-fixture-date="${date}"></div>
    <span class="fixture-result-list__name visually-hidden">La Liga</span>
    <div class="fixture-info__name fixture-info__name--home">${home}</div>
    <div class="fixture-info__name fixture-info__name--away">${away}</div>
    ${score && `<div class="fixture-info__score"><span>${score}</span></div>`}
    </a></li>`;
  const sample = [
    result(100, 'FC Barcelona', 'Athletic Club', '1 - 1'),
    result(400, 'FC Barcelona', 'Real Madrid', '3 - 1'),
    result(300, 'Sevilla', 'FC Barcelona'),
    result(210, 'Real Madrid', 'Athletic Club', '3 - 1'),
    result(200, 'Atlético Madrid', 'FC Barcelona', '1 - 2'),
  ].join('');
  assert.equal(parseBarcaResult(sample, 99), null);
  assert.deepEqual(parseBarcaResult(sample, 350), {
    kickoff: 200,
    home: 'Atlético Madrid',
    away: 'FC Barcelona',
    homeScore: 1,
    awayScore: 2,
    competition: 'La Liga',
    source: 'https://www.fcbarcelona.com/en/matches/200/club-fixture',
  });
});
