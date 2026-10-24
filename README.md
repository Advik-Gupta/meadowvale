# Meadowvale

An endless, seeded city-building sandbox that runs in the browser. Start with a small village, grow farms into factories, found new cities across continents, and watch thousands of simulated residents live their lives.

Play offline with worlds saved in your browser, or create an account to build together with friends in live multiplayer worlds.

## Features

- **Infinite, seeded worlds.** Terrain is generated in 16×16 chunks that stream in and out as you explore. Continents, archipelagos, rivers, lakes, mountains and 19 biomes, from tundra to jungle. The same seed always makes the same world.
- **A title screen with multiple worlds.** Create worlds with a name, seed, game mode (Career or Creative) and world type (Normal, Archipelago, Supercontinent, Tiny Islands). Continue, rename, export or import them.
- **550+ buildings.** Homes, farms, factories, industry, utilities, transport, government, leisure, sports, fast-food chains, 10 world cultures, military bases and 23 world landmarks. Everything can be built from the start; money and construction materials are the only limits.
- **A living population.** Every resident is simulated: they go to school and work, eat out, shop, get married, have children, retire, fall ill, commit crimes and start businesses. A Census dashboard tracks people, jobs, businesses, the budget and safety.
- **An automated economy.** Placing a workplace posts its jobs, residents fill them, and staffed factories produce and store goods on their own. Taxes, a city budget, and private businesses that profit or go bust.
- **Emergency services and traffic.** Police respond to crimes, fire trucks to fires and ambulances to the sick. Cars, buses and pedestrians follow residents' real trips on the road network.
- **Transport.** Rail networks with commuter trains, modular airports where planes taxi and take off from your runways, sea lanes, and a fleet of ships and aircraft you commission.
- **Many cities.** Every Town Hall founds a named city. A world map shows everything you have explored and built.
- **Accounts and live multiplayer.** Sign up, add friends by username, and create online worlds you build in together in real time, with shared cursors and chat. Friends can watch any of your worlds as spectators. Global leaderboards rank worlds by coins, level, population, cities and buildings.
- **Autosave.** Worlds save every minute (online worlds to your account), and you're asked to save when you leave.

## Play

```bash
npm install
npm run dev        # http://localhost:5173 (offline play works without the server)
```

You can also open `index.html` directly in a browser; the game runs as plain scripts with no build step. Online features need the server.

## Online play (accounts, friends, multiplayer)

You need MongoDB (local or Atlas) and Node 20+.

1. Copy `.env.example` to `.env` and fill in the values:

   | Variable         | Meaning                                                                 |
   | ---------------- | ----------------------------------------------------------------------- |
   | `PORT`           | Port for the API and WebSocket server (default `8787`)                  |
   | `MONGODB_URI`    | MongoDB connection string                                               |
   | `MONGODB_DB`     | Database name (default `meadowvale`)                                    |
   | `TOKEN_SECRET`   | Long random string used to sign login tokens - keep it secret           |
   | `TOKEN_TTL_DAYS` | How long a login lasts (default `30`)                                   |
   | `CORS_ORIGIN`    | Only needed if the game is hosted on a different origin than the server |

2. Run the server and the game together:

   ```bash
   npm run dev:server   # API + WebSocket on :8787 (restarts on changes)
   npm run dev          # Vite on :5173, proxies /api and /ws to the server
   ```

3. For production, `npm start` builds the game into `dist/` and serves it from the same Node process.

If the game is hosted somewhere else, set `window.MEADOWVALE_SERVER = "https://your-server"` before the game scripts load.

### How multiplayer works

Each online world is a room on the server. The first player to open it becomes the **host**: their browser runs the simulation and streams changes to everyone else every 400ms (and immediately after any action). Other players' actions are sent to the host, which applies them and broadcasts the result. If the host leaves, the next player takes over seamlessly. The host saves the world to MongoDB every minute. Spectators get the same live stream but can't change anything.

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
  ui/                 panels and HUD, census dashboard, title screen, accounts, store families, touch
  net/                REST client and the live multiplayer sync
server/               Express + MongoDB API (accounts, friends, worlds, leaderboards) and the WebSocket relay
tests/                headless-browser suite, balance simulation, server and multiplayer tests
docs/GAME_PLAN.md     the original design document
```

The game files share one global scope and are loaded in a fixed order (see `index.html`; `src/main.js` mirrors it for production builds).

## Tests

```bash
npm test                 # runs tests/suite.js in headless Chrome
npm run balance          # economy pacing simulation
npm run test:server      # API + WebSocket tests (needs MongoDB)
npm run test:multiplayer # 3 real browsers: host, guest and spectator in one live world
```

The browser tests need Google Chrome. Set `CHROME=/path/to/chrome` if it's not in the default macOS location. The server and multiplayer tests use `TEST_MONGODB_URI` (default `mongodb://127.0.0.1:27017`) and create and then drop a temporary database.

## Build

```bash
npm run build        # outputs a static site in dist/
npm run preview
```
