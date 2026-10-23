# Meadowvale

An endless, seeded city-building sandbox that runs in the browser. Start with a small village, grow farms into factories, found new cities across continents, and watch thousands of simulated residents live their lives.

No backend, no accounts - every world is saved in your browser.

## Features

- **Infinite, seeded worlds.** Terrain is generated in 16×16 chunks that stream in and out as you explore. Continents, archipelagos, rivers, lakes, mountains and 19 biomes, from tundra to jungle. The same seed always makes the same world.
- **A title screen with multiple worlds.** Create worlds with a name, seed, game mode (Career or Creative) and world type (Normal, Archipelago, Supercontinent, Tiny Islands). Continue, rename, export or import them.
- **550+ buildings.** Homes, farms, factories, industry, utilities, transport, government, leisure, sports, fast-food chains, 10 world cultures, military bases and 23 world landmarks. Everything can be built from the start; money and construction materials are the only limits.
- **A living population.** Every resident is simulated: they go to school and work, eat out, shop, get married, have children, retire, fall ill, commit crimes and start businesses. A Census dashboard tracks people, jobs, businesses, the budget and safety.
- **An automated economy.** Placing a workplace posts its jobs, residents fill them, and staffed factories produce and store goods on their own. Taxes, a city budget, and private businesses that profit or go bust.
- **Emergency services and traffic.** Police respond to crimes, fire trucks to fires and ambulances to the sick. Cars, buses and pedestrians follow residents' real trips on the road network.
- **Transport.** Rail networks with commuter trains, modular airports where planes taxi and take off from your runways, sea lanes, and a fleet of ships and aircraft you commission.
- **Many cities.** Every Town Hall founds a named city. A world map shows everything you have explored and built.

## Play

```bash
npm install
npm run dev        # http://localhost:5173
```

You can also open `index.html` directly in a browser; the game runs as plain scripts with no build step.

### Controls

| Action | Input                                                                                 |
| ------ | ------------------------------------------------------------------------------------- |
| Pan    | Drag, or WASD / arrow keys (Shift for speed)                                          |
| Zoom   | Mouse wheel / trackpad pinch                                                          |
| Build  | Store (B), then click or drag to place; R rotates                                     |
| Cancel | Esc or right-click                                                                    |
| Panels | I barn · O orders · J staff · T transport · C city · N census · M world map · G goals |
| Time   | P / Space pause · F speed                                                             |
| Tools  | X clear an area · V edit mode · H go home                                             |

## Project structure

```
index.html            loads the game as classic scripts (works from file://)
styles/main.css       all styling
src/
  main.js             Vite entry: evaluates the game files in load order
  game.js             boot, input, camera, main loop, save/load
  core/               constants & catalogue data, utilities, audio
  world/              seeded terrain generation and chunk streaming
  render/             renderer, terrain caches, building & nature art
  content/            building catalogues (cultures, military, landmarks …)
  gameplay/           economy, production, staff, logistics, cities, fleet, automation
  simulation/         residents, traffic, trains, ships & aircraft
  ui/                 panels and HUD, census dashboard, title screen
tests/                headless-browser test suite and balance simulation
docs/GAME_PLAN.md     the original design document
```

The game files share one global scope and are loaded in a fixed order (see `index.html`; `src/main.js` mirrors it for production builds).

## Tests

```bash
npm test             # runs tests/suite.js in headless Chrome
npm run balance      # economy pacing simulation
```

The tests need Google Chrome. Set `CHROME=/path/to/chrome` if it's not in the default macOS location.

## Build

```bash
npm run build        # outputs a static site in dist/
npm run preview
```
