# Phòng Truyền Thống — Hall of Legends

Implemented inside the existing Phaser World lifecycle, React HUD and Socket.IO server. No database, new game engine, external image hotlinks or static museum background.

## Enter and explore

Enter Hang Quỷ Đỏ from the plaza. Walk around either side of the central monument to the sign north of it, at (2048, 1100), and press E. The museum joins `cave:red-devils:hall-of-legends:<instance>` through the existing server-authorized portal system. The return portal is at (1800, 3730) and returns to the cave entrance.

WASD/arrows or the existing joystick move the avatar. E opens the closest exhibit; Escape closes the modal. Each exhibit has its own collision footprint and reachable approach. The desktop camera presents an overview at the main entrance and moves closer when exploring exhibits. Mobile keeps a closer, scrolling view. The live minimap includes all seven zones and the player's actual coordinates and heading.

## Inventory

- 68 independent trophy containers, all rendered together in the world.
- 20 league titles in two rows of 10: 7 First Division and 13 Premier League.
- 3 European Cups, 13 FA Cups, 6 League Cups, 21 Community Shields, plus Europa League, Super Cup, Club World Cup, Intercontinental Cup and Cup Winners' Cup.
- Shared Community Shields explicitly marked: 1965, 1967, 1977, 1990.
- 32 manager tenure panels, representing 29 people. Fourteen permanent post-war managers are in the main gallery. Earlier managers and caretaker spells continue in the south gallery. Busby's return and Carrick's 2021 spell are separate entries. Jimmy Murphy's 1958 cover intentionally overlaps Busby's tenure.
- Eight timeline exhibits, three European final result boards and one Ferguson tribute.
- Total: 112 individually discoverable exhibits, plus photo and return interactions.

The seven connected zones are the main hall, league collection, other honours, manager corridor, history timeline, legendary matches and photo corner. Main walking routes remain open between display rows.

## Data and sources

The five JSON files in `packages/shared/museum/` contain display coordinates, IDs, metadata, asset keys, sources and `lastVerifiedAt`. The TypeScript module validates inventory on import and exposes reusable entity data to game, UI and server. Run `npm run validate:museum` for an inventory check; `tests/museum.test.ts` checks the canonical league years, shared awards, counts and graph reachability of every interaction.

Sources accessed 4 November 2026:

- https://www.manutd.com/en/club/history/trophy-room
- https://www.manutd.com/en/news/uniteds-permanent-post-war-bosses-in-full
- https://www.manutd.com/en/news/manchester-united-confirm-michael-carrick-coaching-staff-2026
- https://www.manutd.com/en/club/history/trophy-room/european-cup-champions-league
- https://www.manutd.com/en/club/history/history-by-decade
- https://www.sportingnews.com/uk/football/news/manchester-united-managers-complete-list-history/tt6o1equttbqzfhuijouzv6o

Carrick's current tenure begins 13 January 2026 and his contract runs to 2028. Amorim is a former coach, 2024–January 2026. Earlier tenure dates are deliberately displayed at year precision where day-level data is not included. The scope includes Albut onward, rather than asserting uncertain nineteenth-century secretary appointments before 1892.

## Visual direction and limitations

The room uses original procedural cup textures, brass-trimmed glass cases, reflections, crimson carpet, stone tiling, layered cave rocks, banners, lantern glow, floating motes and existing project character assets. It is an interactive 2.5D game environment.

The reference establishes composition and palette, but this implementation does **not** reach its cinematic illustration quality. Portraits are explicitly stylized medallions/silhouettes, not licensed photographic likenesses. The Ferguson tribute is an original AI-generated bronze bust on a transparent sprite, not a reproduction of the Old Trafford statue. Its generation prompt and provenance are recorded in `assets/source/museum-art.json`. Cup silhouettes are generic decorative designs; no licensed competition logos or exact trophy models have been imported. There is no historic video footage or audio guide. The quiz currently has one question. Photo export captures the Phaser canvas, without the HTML HUD; camera direction follows movement rather than an independent photo camera.

For the next visual pass, extend the bust’s painted material quality to cave cornices, display cases and manager illustrations with consistent licensed or original sprites. Keep IDs, coordinates and interaction data intact. Improve stone reflections and sculpture detail, and author per-manager historical narratives with individually cited sources. The current manager award lists cover the ten requested trophy categories; Second Division titles and other categories are outside this collection.

## Verification

`npm run build`, `npm test`, `npm run validate:museum`, and `npx playwright test tests/e2e/museum.spec.ts` are the relevant checks. Browser tests enter through the real cave portal, count rendered trophy instances, open every exhibit using E at fixture positions, exercise collision, Escape, quiz and image download, test mobile joystick and minimap, and send chat/expressions between two real clients in the museum room. Graph traversal separately proves all approaches are reachable without fixture relocation.

Screenshots: `hall-of-legends-desktop.png`, `hall-of-legends-mobile.png`.

Verification completed: production build passed, inventory validator passed, 12 unit/server tests passed and all 10 browser tests passed (including museum, original plaza and cave). The final sculpture asset integration is rechecked with the museum desktop/mobile browser tests.
