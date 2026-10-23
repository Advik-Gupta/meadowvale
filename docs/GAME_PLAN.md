# Meadowvale - Game Design & Development Plan

> A browser-based isometric farming + city-building game inspired by Township and SimCity BuildIt - but bigger, more automated, and more "real-world": a living town with jobs, logistics networks (rail, sea, air), utilities, and a workforce you can hire to run things for you.
>
> This document is the single source of truth for what we are building. It describes **what** the game is and **how the systems connect**. It intentionally contains no code. Numbers in tables are _starting balance values_ - expect to tune them.

**Reference note:** Township figures (factory counts, unlock levels, costs) from the wiki are used only as _inspiration for scope and pacing_. All names, recipes, numbers and content in Meadowvale are our own.

---

## Table of contents

1. [Vision & design pillars](#1-vision--design-pillars)
2. [Where we are today (v0.1)](#2-where-we-are-today-v01)
3. [The core loop & how every system connects](#3-the-core-loop--how-every-system-connects)
4. [Currencies, resources & materials](#4-currencies-resources--materials)
5. [The world map, terrain & districts](#5-the-world-map-terrain--districts)
6. [Population, housing & community buildings](#6-population-housing--community-buildings)
7. [City services & utilities (the SimCity layer)](#7-city-services--utilities-the-simcity-layer)
8. [Farming: crops, orchards, greenhouses](#8-farming-crops-orchards-greenhouses)
9. [Animals & the Feed Mill](#9-animals--the-feed-mill)
10. [Factories & production chains](#10-factories--production-chains)
11. [Storage: Barn, Silos, Warehouses, Cold Storage](#11-storage-barn-silos-warehouses-cold-storage)
12. [Workforce & automation (hire people to run your town)](#12-workforce--automation-hire-people-to-run-your-town)
13. [Power-ups, boosters & permanent perks](#13-power-ups-boosters--permanent-perks)
14. [Orders & trade: Market, Courier Board, Town Requests](#14-orders--trade-market-courier-board-town-requests)
15. [Railway system](#15-railway-system)
16. [Sea Port, ships & islands](#16-sea-port-ships--islands)
17. [Airport & air cargo](#17-airport--air-cargo)
18. [Mining, Foundry & the Engineering Institute](#18-mining-foundry--the-engineering-institute)
19. [Land expansion & leveling up the city](#19-land-expansion--leveling-up-the-city)
20. [Decorations, roads & terrain customization](#20-decorations-roads--terrain-customization)
21. [Tourism, landmarks & happiness](#21-tourism-landmarks--happiness)
22. [Collections, museum & zoo](#22-collections-museum--zoo)
23. [Events, achievements, quests & daily play](#23-events-achievements-quests--daily-play)
24. [Weather, seasons & day/night](#24-weather-seasons--daynight)
25. [Rival towns & (optional) social](#25-rival-towns--optional-social)
26. [UI / UX plan](#26-ui--ux-plan)
27. [Data model](#27-data-model)
28. [Technical architecture plan](#28-technical-architecture-plan)
29. [Balancing framework](#29-balancing-framework)
30. [Development roadmap](#30-development-roadmap)
31. [Content checklist](#31-content-checklist)
32. [Open questions](#32-open-questions)

---

## 1. Vision & design pillars

**Elevator pitch:** You inherit a small farm beside a sleepy village on a wild island. Grow crops, raise animals, build factories, and turn the village into a bustling city connected to the world by rail, sea and air. As the town grows, hire its residents to farm, cook, haul cargo and collect rent so you can focus on planning the next district.

### Pillars

| Pillar                          | What it means in practice                                                                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Everything is connected**     | Every item has at least two uses. Wheat feeds the bakery, the feed mill, train contracts and customers. No dead-end systems.                                           |
| **The town is alive**           | Villagers walk to work, trucks drive to the port, trains leave the station, planes take off. If a system exists, you can _see_ it on the map.                          |
| **From hands-on to management** | Early game: you tap every field. Mid game: you hire farmhands. Late game: you run an economy, optimizing logistics and workers. Players can still do anything by hand. |
| **Real-world logic**            | Houses need power and water. Workers need homes. Factories need workers. Ports need coastline. Airports need flat open land.                                           |
| **Respect the player's time**   | Generous offline progress, automation, no paywalls. Premium currency (Gems) is earned in-game only.                                                                    |
| **Readable & cozy**             | Bright, rounded art, clear icons, satisfying animations and sounds for every action.                                                                                   |

### Target platform

Desktop browser first (mouse + keyboard), playable on tablets. Single-player, saved locally (later: optional cloud save / export).

---

## 2. Where we are today (v0.1)

What already exists in the codebase:

| Area       | Implemented                                                                                                                                                       |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| World      | 72×72 tile isometric island, procedural terrain (grass, forest floor, dirt, sand, shallow/deep water), river, lake, pond, shoreline foam, clouds, day/night cycle |
| Land       | 9×9 grid of 8×8 plots; 3×3 plots unlocked at start; buyable "For Sale" plots (cost 250 × 1.75ⁿ, level 2+n)                                                        |
| Farming    | Fields; 6 crops (wheat, rice, corn, carrot, tomato, strawberry); drag to plant/harvest; ×2 yield, 25% bonus seed                                                  |
| Town       | 4 house types with population + rent, Town Hall, Market, Barn, roads, decor (trees, flowers, bench, lamp, fountain, statue, windmill)                             |
| Production | Bakery, Snack Bar, Diner; 6 recipes; 3-slot queue                                                                                                                 |
| Economy    | Coins, XP/levels, barn capacity (60, +25 upgrades), direct selling                                                                                                |
| Customers  | NPC customers walk to the market with orders; deliver for coins/XP                                                                                                |
| NPCs       | Villagers wander roads (BFS pathfinding)                                                                                                                          |
| Meta       | 20 achievements, 8-step tutorial quest chain, level-up rewards & unlock screen                                                                                    |
| Tech       | Vanilla JS + Canvas, no build step, localStorage autosave, procedural art & audio                                                                                 |

Everything in this plan builds on top of these systems rather than replacing them.

---

## 3. The core loop & how every system connects

### 3.1 Moment-to-moment loop (seconds–minutes)

Plant → wait → harvest → produce → deliver an order → earn coins & XP → buy/build something → plant again.

### 3.2 Session loop (minutes–hours)

Check returning trains/ships/planes → collect factory outputs → refill queues → fulfil contracts → spend materials on a building → expand land.

### 3.3 Long-term loop (days–weeks)

Unlock a new district and transport system → reorganize the town → hire and train workers → upgrade factories → complete landmarks and collections.

### 3.4 System map

```
                         ┌───────────────┐
                         │   POPULATION  │◄─── Houses (residents)
                         │  & WORKFORCE  │◄─── Community bldgs (cap)
                         └──────┬────────┘◄─── Utilities (power/water)
                    workers     │    rent, taxes
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
   ┌────────────┐        ┌────────────┐        ┌────────────┐
   │  FARMING   │──────► │ FACTORIES  │──────► │   ORDERS   │
   │ crops/anim │  raw   │  chains    │ goods  │ market,    │
   └─────┬──────┘        └─────┬──────┘        │ courier,   │
         │ feed                │ upgrades      │ rail/sea/  │
         ▼                     ▲ (ingots)      │ air        │
   ┌────────────┐        ┌─────┴──────┐        └─────┬──────┘
   │ FEED MILL  │        │ MINE →     │              │ coins, XP,
   └────────────┘        │ FOUNDRY    │              │ materials,
                         └────────────┘              │ tools, gems
                                                     ▼
                ┌──────────────────────────────────────────┐
                │ BUILD & EXPAND: houses, services, land,   │
                │ storage, decorations, landmarks           │
                └──────────────────────────────────────────┘
```

**Rule of interdependence:** Every new system we add must (a) consume something the player already produces and (b) produce something another system needs.

---

## 4. Currencies, resources & materials

### 4.1 Currencies

| Currency          | Earned from                                                      | Spent on                                                           | Notes                                            |
| ----------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------ |
| **Coins** 🪙      | Orders, rent, direct sales, contracts, tourism                   | Buildings, seeds, animals, land, wages                             | Main currency                                    |
| **Gems** 💎       | Achievements, level-ups, mine, plane chests, events, collections | Speed-ups, extra production slots, rare decor, instant worker hire | Earned only - never sold for real money          |
| **XP** ⭐         | Almost every action                                              | -                                                                  | Drives town level                                |
| **Reputation** 🏅 | Fulfilling orders on time, happiness, tourism                    | Unlocks better contracts & trade partners                          | New; per-network (rail/sea/air) reputation tiers |
| **Clovers** 🍀    | Daily login, helping rival towns, events                         | Lucky Wheel (House of Luck equivalent)                             | Light gacha with fixed odds shown                |

### 4.2 Material families

| Family                     | Items                                        | Source                                                                       | Used for                                                   |
| -------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Construction materials** | Bricks, Planks, Glass, Steel Beams, Concrete | Rail freight returns, Brickworks/Sawmill (mid-game production), plane chests | Community buildings, storage upgrades, transport buildings |
| **Expansion tools**        | Survey Stakes, Shovels, Land Deeds           | Rail freight, ships, quests                                                  | Land expansion                                             |
| **Storage parts**          | Bolts, Hinges, Paint                         | Rail, ships, Hardware Factory                                                | Barn/Silo/Warehouse upgrades                               |
| **Mining tools**           | Pickaxe, Dynamite, Drill Bit                 | Rail, Tool Workshop                                                          | Mine digging                                               |
| **Ores & ingots**          | Copper/Iron/Silver/Gold ore → ingots; Gems   | Mine → Foundry                                                               | Factory, vehicle and dock upgrades                         |
| **Fuel**                   | Coal, Diesel, Jet Fuel                       | Mine (coal), Refinery (late)                                                 | Optional: powers trains/ships/planes (see 15.6)            |
| **Special tools**          | Crane Hook, Jackhammer, Welding Torch        | Tool Exchange (convert materials)                                            | Late-game landmarks & big buildings                        |

Material rarity is tiered (common → uncommon → rare) and drop tables per source are data-driven (see §27).

---

## 5. The world map, terrain & districts

### 5.1 Map structure

- Keep the existing **72×72 island with 8×8 plots**, but plan for a **larger 128×128 main island** in a later phase (chunked rendering makes this feasible, see §28).
- The island is divided into **regions (biomes)**, each unlocked by level and land purchases:

| Region                   | Terrain             | Unique content                                  | Unlock   |
| ------------------------ | ------------------- | ----------------------------------------------- | -------- |
| **Meadow Heart** (start) | Grass, dirt         | Farm, village, market                           | Level 1  |
| **Riverlands**           | River, wetland      | Rice paddies, fish farm, water mill, bridges    | Level 6  |
| **Old Forest**           | Dense forest        | Sawmill, Lumber Camp, mushrooms, Ranger Station | Level 10 |
| **Coastline**            | Beach, shallow sea  | **Sea Port**, Lighthouse, beach resort, fishing | Level 15 |
| **Highlands**            | Hills, rock, cliffs | **Mine**, Quarry, Foundry, vineyards            | Level 20 |
| **Flatlands**            | Wide open plains    | **Airport**, Industrial Park, solar farm        | Level 24 |
| **Frost Peaks**          | Snow                | Ski lodge, ice products, observatory            | Level 35 |
| **Offshore islands**     | Various             | Reached by ship only; exotic goods              | Via Port |

### 5.2 Terrain types & placement rules

| Terrain       | Buildable                                      | Rules                                                 |
| ------------- | ---------------------------------------------- | ----------------------------------------------------- |
| Grass / Dirt  | Everything                                     | Dirt fields get +5% growth speed (fertile) - optional |
| Forest floor  | After clearing trees                           | Lumber Camp must be adjacent to forest                |
| Sand          | Decor, resort buildings, docks                 | Fields on sand grow 25% slower                        |
| Shallow water | Docks, piers, bridges, water decor, fish farms | "Water-only" buildings                                |
| Deep water    | Ships only                                     | Port berths must touch deep water                     |
| Rock / Cliff  | Mine, Quarry only                              | Needs Dynamite to clear                               |
| Snow          | Winter buildings                               | Normal buildings allowed after Frost Peaks unlock     |

### 5.3 Districts & zoning (soft zoning)

Not mandatory zoning like SimCity - instead, **district bonuses**:

- **Residential district:** 4+ houses within a radius of a park → +10% rent.
- **Farm district:** fields near a Silo/Barn → farmhands walk less, work faster.
- **Industrial district:** factories near a Warehouse + rail spur → auto-ship output.
- **Downtown:** Town Hall + shops + offices nearby → tourism multiplier.
- **Pollution:** heavy industry lowers happiness of nearby houses (shown as a heatmap overlay).

### 5.4 Natural obstacles

Trees (clear for coins, drop Planks occasionally), rocks (drop Stone), bushes (drop berries), stumps, boulders (need Dynamite), swamp tiles (need Shovel), old ruins (contain artifacts).

---

## 6. Population, housing & community buildings

### 6.1 Three population numbers (Township model, extended)

| Value              | Meaning                                   | Raised by                           |
| ------------------ | ----------------------------------------- | ----------------------------------- |
| **Residents**      | People currently living in town           | Houses                              |
| **Population cap** | Max residents the town can support        | Community buildings & services      |
| **Workforce**      | Residents of working age not yet employed | Derived: residents × 60% − employed |

You can't build a house that would push residents over the cap. Population gates fields, factories and land (as in Township).

### 6.2 Housing tiers

| Tier         | Examples                                | Residents                    | Rent      | Unlock |
| ------------ | --------------------------------------- | ---------------------------- | --------- | ------ |
| 1 - Village  | Cozy House, Cottage, Farmhouse          | 4–6                          | Low       | 1–5    |
| 2 - Suburban | Bungalow, Duplex, Townhouse, Villa      | 8–12                         | Medium    | 6–15   |
| 3 - Urban    | Row Houses, Apartment Block, Condos     | 16–30                        | High      | 16–30  |
| 4 - City     | High-rise, Residential Tower, Eco Tower | 40–80                        | Very high | 31–50  |
| 5 - Luxury   | Seaside Mansion, Penthouse Complex      | 20 (but huge rent + tourism) | Premium   | 40+    |

**Upgradeable houses:** spend materials to upgrade a house in place (Cottage → Villa) instead of demolishing - keeps layouts intact.

**House needs (SimCity flavor):** each house has _needs_ (power, water, a shop within N tiles, a park nearby). Each met need raises its **happiness** → higher rent and slower tenant turnover. Unmet needs never destroy anything, they just reduce income.

### 6.3 Community buildings (raise population cap)

Built with coins + construction materials, with a construction timer.

| Category        | Examples                                                      | Cap     | Extra effect                  |
| --------------- | ------------------------------------------------------------- | ------- | ----------------------------- |
| Public services | School, Clinic → Hospital, Police, Fire Station, Post Office  | +30–150 | Service coverage (§7)         |
| Retail          | Grocery, Café, Bookstore, Bank, Supermarket, Mall             | +20–120 | Shops create Market customers |
| Culture         | Library, Theater, Museum, University, Planetarium             | +40–200 | Tourism, XP bonus             |
| Recreation      | Park, Gym, Bowling, Cinema, Stadium, Water Park, Ferris Wheel | +30–250 | Happiness, tourism            |
| Waterfront      | Lighthouse, Aquarium, Yacht Club, Coast Guard                 | +50–200 | Must touch water              |

### 6.4 Construction flow

1. Buy → construction site appears (scaffolding, workers with hard hats animate).
2. Timer runs **and** materials must be delivered (shown as slots on the site).
3. Hired **Builders** (§12) reduce the timer.
4. Completion: balloons/confetti, +cap, +XP.

---

## 7. City services & utilities (the SimCity layer)

Light-touch city management: never punishing, always rewarding when done well.

| Service          | Buildings                                       | Coverage                                                | Effect when covered                              |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------ |
| **Power** ⚡     | Coal Plant → Wind Farm → Solar Farm → Hydro Dam | Network (power lines optional; radius-based by default) | Required for factories at Tier 2+; houses +rent  |
| **Water** 💧     | Water Tower → Pumping Station → Treatment Plant | Radius                                                  | Houses +rent; fields with sprinklers grow faster |
| **Waste** 🗑️     | Recycling Center                                | Radius                                                  | Removes pollution; produces Recycled Materials   |
| **Safety** 🚓🚒  | Police, Fire Station                            | Radius                                                  | Prevents random "incident" events (fire, theft)  |
| **Health** 🏥    | Clinic, Hospital                                | Radius                                                  | +happiness, +workforce efficiency                |
| **Education** 🎓 | School, College, University                     | Town-wide tiers                                         | Unlocks skilled worker tiers (§12.4)             |

- **Overlays:** toggle coverage heatmaps (power, water, happiness, pollution, land value).
- **Capacity:** each utility building supplies N units; demand grows with population. Showing supply/demand bars in a "City Dashboard" panel.
- **Failure states are soft:** under-supply reduces rent and factory speed by a percentage, never shuts the game down.

---

## 8. Farming: crops, orchards, greenhouses

### 8.1 Crop catalogue (target ~22 crops)

| Crop            | Grow time                    | Seed | Sell | Unlock | Main uses                    |
| --------------- | ---------------------------- | ---- | ---- | ------ | ---------------------------- |
| Wheat           | 2s → (rebalance to 2m later) | 2    | 4    | 1      | Bread, feed, flour           |
| Rice            | 3s                           | 3    | 6    | 1      | Rice bowl, sushi, rice flour |
| Corn            | 6s                           | 5    | 10   | 2      | Feed, popcorn, tacos         |
| Carrot          | 10s                          | 7    | 15   | 3      | Salad, feed for rabbits      |
| Tomato          | 15s                          | 10   | 21   | 4      | Sauce, pizza, ketchup        |
| Strawberry      | 22s                          | 14   | 30   | 5      | Jam, cookies, smoothies      |
| Potato          | -                            | -    | -    | 6      | Fries, chips                 |
| Sugarcane       | -                            | -    | -    | 7      | Sugar, syrup                 |
| Cotton          | -                            | -    | -    | 9      | Fabric                       |
| Soybean         | -                            | -    | -    | 11     | Tofu, feed                   |
| Lettuce         | -                            | -    | -    | 12     | Salads, burgers              |
| Pumpkin         | -                            | -    | -    | 14     | Pies, soup                   |
| Cocoa           | -                            | -    | -    | 18     | Chocolate                    |
| Coffee beans    | -                            | -    | -    | 20     | Coffee                       |
| Grapes          | -                            | -    | -    | 22     | Juice, jam (Highlands)       |
| Sunflower       | -                            | -    | -    | 24     | Oil, bouquets                |
| Tea             | -                            | -    | -    | 26     | Tea                          |
| Lavender        | -                            | -    | -    | 28     | Perfume, soap                |
| Peppers         | -                            | -    | -    | 30     | Sauces                       |
| Vanilla         | -                            | -    | -    | 34     | Ice cream, perfume           |
| Flowers (mixed) | -                            | -    | -    | 36     | Bouquets                     |
| Indigo          | -                            | -    | -    | 40     | Dyes                         |

> **Timing decision:** v0.1 uses seconds-long timers for fun testing. Before release we move to a real scale (2 min → 6 h) and keep a **"Quick Play" setting** that divides all timers by 60.

### 8.2 Field improvements

- **Sprinklers** (decor-style, 1×1): fields within radius 2 grow 15% faster. Need water coverage.
- **Scarecrow:** protects from crow event (§24).
- **Fertilizer** (consumable from Feed Mill/Lab): +1 yield on the next harvest.
- **Field upgrade levels:** Field → Raised Bed (+10% speed) → Hydroponic Bed (+25%, needs power).

### 8.3 Orchards (new)

Fruit trees planted on 1×1 tiles: Apple, Orange, Cherry, Olive, Coconut (coast). They take long to mature once, then produce repeatedly (e.g., 5 harvests), then need replanting or **Pruning Shears** to refresh.

### 8.4 Greenhouses (new)

2×3 building with 6 crop slots; grows exotic crops (Vanilla, Cocoa) and any crop year-round regardless of season (§24). Requires power.

---

## 9. Animals & the Feed Mill

### 9.1 Feed Mill

Converts crops → feed types (Cow Feed, Chicken Feed, Sheep Feed, Pig Feed, Fish Food). Unlocks at level 3, extra mills at 19 and 40.

### 9.2 Animal buildings (2×2 unless noted)

| Building                      | Animals (per bldg) | Max bldgs | Output          | Unlock |
| ----------------------------- | ------------------ | --------- | --------------- | ------ |
| Chicken Coop                  | 6                  | 3         | Eggs            | 3      |
| Cowshed                       | 6                  | 3         | Milk            | 4      |
| Sheep Farm                    | 6                  | 2         | Wool            | 8      |
| Pig Farm                      | 6                  | 2         | Bacon           | 13     |
| Apiary                        | 6 hives            | 2         | Honeycomb       | 16     |
| Goat Pen (new)                | 6                  | 2         | Goat milk       | 19     |
| Fish Farm (new, water)        | 6 tanks            | 2         | Fish            | 21     |
| Duck Pond                     | 2–8                | 2         | Feathers        | 25     |
| Mushroom Cellar               | 6 pots             | 1         | Mushrooms       | 27     |
| Alpaca Ranch (new, Highlands) | 4                  | 1         | Fine wool       | 32     |
| Oyster Bed (new, coast)       | 3                  | 1         | Pearls, oysters | 38     |

- Animals are fed one feed → produce after a timer → tap to collect.
- Animals walk around their pen; tapping an animal shows its timer.
- **Animal happiness** (optional): pens near decorations produce slightly faster.
- **Rancher** worker (§12) automates feeding and collection.

---

## 10. Factories & production chains

### 10.1 Factory mechanics

- **Production slots** (queue): start with 3, buy up to 7 (coins early, gems later).
- **Shelves** (output storage inside the factory): start 3, upgrade to 8. Production pauses if shelves are full.
- **Workers**: each factory has worker seats; assigned workers add speed and enable automation (§12).
- **Power**: Tier 2+ factories need power coverage.
- **Upgrades** at the Engineering Institute with ingots: speed, output value, XP, shelves (§18).

### 10.2 Factory roster (target ~30, by tier)

| Tier | Factory                         | Unlock | Sample recipes (inputs → output)                                                   |
| ---- | ------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| 1    | **Bakery** ✅                   | 2      | 3 Wheat → Bread; 2 Wheat + 1 Strawberry → Cookies; 2 Wheat + 1 Egg + 1 Milk → Cake |
| 1    | **Feed Mill**                   | 3      | 2 Wheat + 1 Corn → Cow Feed; 2 Corn → Chicken Feed                                 |
| 1    | **Dairy**                       | 4      | 2 Milk → Cheese; 2 Milk → Butter; 1 Milk + 1 Strawberry → Yogurt                   |
| 1    | **Snack Bar** ✅                | 3      | 3 Corn → Popcorn; 2 Corn + 1 Tomato → Taco                                         |
| 1    | **Diner** ✅                    | 4      | 3 Rice + 1 Carrot → Rice Bowl; 2 Tomato + 2 Carrot → Salad                         |
| 2    | **Sugar Mill**                  | 7      | 3 Sugarcane → Sugar; 2 Sugarcane → Syrup                                           |
| 2    | **Textile Mill**                | 9      | 3 Cotton → Fabric; 2 Wool → Yarn                                                   |
| 2    | **Sawmill** (new)               | 10     | 1 Log → 3 Planks; Planks → Furniture parts                                         |
| 2    | **Brickworks** (new)            | 11     | Clay + Coal → Bricks (lets you self-produce construction mats slowly)              |
| 2    | **Tailor**                      | 12     | Fabric + Yarn → Shirt, Sweater, Dress                                              |
| 2    | **Fast Food**                   | 16     | Bread + Bacon + Lettuce → Burger; Potato → Fries                                   |
| 2    | **Pizzeria** (new)              | 17     | Wheat + Tomato + Cheese → Pizza                                                    |
| 2    | **Paper Mill**                  | 18     | Planks → Paper; Paper → Notebook                                                   |
| 2    | **Ice Cream Parlor**            | 20     | Milk + Sugar + Strawberry → Ice Cream                                              |
| 3    | **Jam & Preserves**             | 22     | Fruit + Sugar → Jam                                                                |
| 3    | **Fish Market / Cannery** (new) | 23     | Fish → Fish Fillet, Canned Tuna                                                    |
| 3    | **Pastry Shop**                 | 24     | Butter + Sugar + Egg → Croissant, Pie                                              |
| 3    | **Coffee Roastery**             | 26     | Coffee beans → Coffee; + Milk → Latte                                              |
| 3    | **Chocolate Factory**           | 28     | Cocoa + Sugar + Milk → Chocolate bar                                               |
| 3    | **Furniture Workshop**          | 30     | Planks + Fabric + Bolts → Sofa, Table                                              |
| 3    | **Glassworks** (new)            | 31     | Sand + Coal → Glass                                                                |
| 3    | **Plastics Plant**              | 34     | Oil → Plastic                                                                      |
| 4    | **Electronics Assembly** (new)  | 38     | Copper ingot + Plastic + Glass → Radio, Phone                                      |
| 4    | **Toy Factory**                 | 40     | Plastic + Fabric → Teddy bear, Toy car                                             |
| 4    | **Perfume & Soap**              | 42     | Lavender + Flowers + Oil → Perfume                                                 |
| 4    | **Jewelry Studio**              | 45     | Gold ingot + Gems/Pearls → Ring, Necklace                                          |
| 4    | **Juice & Beverage**            | 47     | Fruit → Juice, Smoothie, Soda                                                      |
| 4    | **International Kitchen**       | 50+    | Sushi, Pasta, Curry, Tacos (multi-chain gourmet)                                   |
| 5    | **Auto Parts Plant** (new)      | 55     | Steel + Rubber + Electronics → Car parts (air/rail export)                         |
| 5    | **Refinery** (new)              | 60     | Crude oil (from ships) → Diesel, Jet Fuel, Plastic                                 |

**Chain depth target:** Tier 1 = 1 step, Tier 2 = 2 steps, Tier 3 = 3 steps, Tier 4–5 = 3–5 steps with cross-network inputs (an island good or an ingot).

### 10.3 Product data

Every product: id, name, icon, category (crop/animal/food/textile/industrial/luxury/material), base value, XP, production time, which orders can request it, shelf life (only if we enable perishables, see §11.4).

---

## 11. Storage: Barn, Silos, Warehouses, Cold Storage

Storage is a key strategic constraint - and the user-requested **silos** make it richer.

| Building                 | Stores                                             | Start cap | Upgrade path                          | Unlock |
| ------------------------ | -------------------------------------------------- | --------- | ------------------------------------- | ------ |
| **Barn** ✅              | Everything not covered by others (goods)           | 60        | +25 per level with Bolts/Hinges/Paint | 1      |
| **Grain Silo** (new)     | Crops only (wheat, rice, corn, soy…)               | 100       | +50/level with Steel + Bolts          | 5      |
| **Seed Shed** (new)      | Seeds (currently unlimited - becomes capped later) | 200       | +100/level                            | 6      |
| **Warehouse** (new)      | Industrial goods & materials                       | 80        | +40/level                             | 15     |
| **Cold Storage** (new)   | Dairy, fish, meat, ice cream                       | 40        | +20/level                             | 20     |
| **Material Depot** (new) | Construction materials, tools, ingots              | 50        | +25/level                             | 12     |

- Players can build **multiple** silos/warehouses (each adds capacity), limited by level.
- **Logistics bonus:** a factory within 6 tiles of a Warehouse auto-moves output from shelves to storage when shelves are full.
- **Storage UI:** one combined "Storage" panel with tabs per building type and a capacity bar each. Item → which storage it goes to is defined in data.
- **Overflow:** harvesting when the target storage is full shows an "Overflow" prompt: sell excess / discard / cancel.

### 11.4 Perishables (optional, toggle in settings)

Dairy/fish/fruit slowly spoil unless in Cold Storage. Off by default for a casual experience; on for "Realism Mode".

---

## 12. Workforce & automation (hire people to run your town)

This is Meadowvale's signature feature: **residents are real workers**. You hire them to automate the jobs you did by hand.

### 12.1 Where workers come from

- **Workforce = 60% of residents − currently employed.** More houses → more potential hires.
- Hire at the **Employment Office** (unlock level 6) - shows a list of candidates with name, portrait, traits and skill levels.
- Workers live in houses; employed workers raise the house's rent (+10%) because the household earns income.
- Visual: each worker walks from their home to their workplace in the morning and back at night.

### 12.2 Job roles

| Role                         | Workplace                                                | What they automate                                                                         | Unlock |
| ---------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------ |
| **Farmhand** 🧑‍🌾              | Assigned field group (up to 6 fields per farmhand at L1) | Auto-plant a chosen crop (uses seeds), auto-harvest into Silo/Barn                         | 6      |
| **Rancher**                  | Animal building                                          | Auto-feed animals (uses feed), auto-collect produce                                        | 8      |
| **Factory Worker** 👷        | A factory (1–3 seats)                                    | +15% speed each; **Manager** seat: auto-requeues a chosen recipe ("keep 5 bread in stock") | 9      |
| **Rent Collector** 🧾        | Town Hall (covers a radius / district)                   | Auto-collects rent from houses in range for a 5% fee                                       | 7      |
| **Shopkeeper**               | Market                                                   | Auto-fulfils market customer orders that match a whitelist you configure                   | 12     |
| **Courier**                  | Courier Board                                            | Auto-delivers courier orders when stock is available                                       | 14     |
| **Builder** 🏗️               | Construction sites                                       | −20% construction time each (max 3 per site)                                               | 10     |
| **Lumberjack** 🪓            | Lumber Camp                                              | Auto-clears designated trees, produces logs                                                | 10     |
| **Conductor / Loader** 🚂    | Train Station                                            | Auto-loads train cars from storage and dispatches                                          | 12     |
| **Dock Worker / Captain** ⚓ | Sea Port                                                 | Auto-loads ships, re-sends to last island                                                  | 18     |
| **Ground Crew / Pilot** ✈️   | Airport                                                  | Auto-fills plane crates using a priority list                                              | 24     |
| **Miner** ⛏️                 | Mine                                                     | Auto-digs using tools, deposits ore                                                        | 21     |
| **Researcher** 🔬            | Innovation Lab                                           | Reduces booster brew time                                                                  | 20     |
| **Tour Guide**               | Visitor Center                                           | Increases tourist spending                                                                 | 25     |

### 12.3 Wages, morale & efficiency

- **Wages:** paid in coins per in-game hour (automatically deducted, shown as "Payroll" in the wallet). Wages scale with skill level.
- **Morale (0–100):** affected by house happiness, commute distance, decor near workplace, being overworked. High morale → +efficiency; low morale → slower, may quit (with warning first).
- **Efficiency:** Level 1 workers run at 70% of manual speed (automation has a cost), up to 130% at max level.
- **Shifts:** Day shift by default; buying the _Night Shift_ perk allows 24h operation.
- **Offline:** workers keep working while the game is closed (capped by an "Offline Hours" stat, starting at 4h, upgradable to 24h).

### 12.4 Skills, traits & training

- **Skill levels 1–5**, gained through work XP or paid training at the **School/College** (requires Education coverage, §7).
- **Traits** (random, 1–2 per worker): _Green Thumb_ (+10% crop speed), _Night Owl_, _Speedy_, _Careful_ (no spoilage), _Charming_ (+tips from customers), _Lazy_ (cheaper but slower), _Commuter_ (doesn't mind distance).
- **Specialists** (rare candidates, unlocked by Education tier): Agronomist, Head Chef, Engineer, Logistics Expert - boost an entire building type town-wide.

### 12.5 Automation rules UI

Each automated building gets a small rules panel:

- Farm: crop to plant, "stop when silo above X%".
- Factory: recipe priority list with stock targets ("Bread: keep 10, Cookies: keep 5").
- Shopkeeper/Courier/Crew: whitelist/blacklist of items they may use for orders, and a reserve ("never use the last 5 eggs").

### 12.6 Design guardrails

- Manual play is always **faster/better per action** early on, so players aren't punished for being hands-on.
- Automation **costs coins** (wages) and has an **efficiency penalty** at low skill - it's a management layer, not a free win.
- A "**Workforce Dashboard**" shows employed/unemployed, payroll per hour, income vs. expenses.

---

## 13. Power-ups, boosters & permanent perks

### 13.1 Innovation Lab - temporary boosters (crafted, then activated)

| Booster              | Effect                                | Duration | Ingredients (example)           | Unlock |
| -------------------- | ------------------------------------- | -------- | ------------------------------- | ------ |
| **Fertilizer Burst** | Crops grow 2× faster                  | 1 h      | Compost + Water                 | 10     |
| **Bumper Crop**      | +1 yield per harvest                  | 1 h      | Fertilizer + Sunflower oil      | 14     |
| **Overtime**         | All factories +50% speed              | 30 min   | Coffee + Sugar                  | 16     |
| **Rent Rush**        | All rent ×2                           | 1 h      | Paper + Ink                     | 18     |
| **Golden Hour**      | XP ×2 from everything                 | 30 min   | Honey + Gold dust               | 22     |
| **Express Freight**  | Trains/ships/planes return 50% faster | 1 h      | Diesel + Bolts                  | 24     |
| **Lucky Charm**      | Better rare drops (mine, chests)      | 1 h      | Clover + Pearl                  | 28     |
| **Festival Day**     | Tourists ×3, customer rewards +25%    | 30 min   | Fireworks (Festivities factory) | 30     |
| **Animal Feast**     | Animals produce instantly once        | instant  | Premium feed                    | 26     |

Boosters stack only with different types. Active boosters show as icons with timers under the HUD.

### 13.2 Instant power-ups (one-shot items)

- **Auto Rent Collector (item)**: instantly collects all rent town-wide.
- **Harvest Wave**: harvests every ripe field.
- **Sprout Rain**: replants every empty field with the last-used crop.
- **Time Skip 15m / 1h**: advances a single building's timer.
- **Clear-All Saw**: clears all trees on one plot.
  Earned from chests, events, achievements, daily quests; buyable with gems.

### 13.3 Permanent automation buildings & upgrades

For players who prefer buildings over hiring:

- **Rent Office** (permanent auto rent collector, radius 12, no wage but costs materials to build).
- **Irrigation Network** (permanent speed bonus to fields in range).
- **Conveyor Belts** (decor-like 1×1 pieces): connect a factory to a warehouse for automatic output transfer - a mini-logistics puzzle.
- **Smart Grid** (late game): all power-dependent buildings +10%.

### 13.4 Mayor Perk Tree (permanent, 1 perk point per level)

Three branches, ~15 perks each:

- **Agriculture:** +field limit, cheaper seeds, extra bonus-seed chance, faster animals, longer offline farming.
- **Industry:** extra production slot, cheaper factory upgrades, worker efficiency, shelf capacity.
- **Civic:** rent bonus, tourism, cheaper land, faster construction, better order rewards, auto rent collector in range of Town Hall (perk version).
  A respec costs gems.

---

## 14. Orders & trade: Market, Courier Board, Town Requests

| System                                    | Who                               | Request size                   | Reward                          | Unlock      |
| ----------------------------------------- | --------------------------------- | ------------------------------ | ------------------------------- | ----------- |
| **Market customers** ✅                   | Walk-in villagers                 | 1–3 items, small qty           | Coins + XP                      | 1           |
| **Courier Board** (Township's helicopter) | 9 order cards, refresh on timer   | 1–3 items                      | Coins + XP; sometimes materials | 5           |
| **Town Requests**                         | Named residents with story chains | Specific items                 | Gems, decor, perk points        | 8           |
| **Business Contracts**                    | Companies (rival towns)           | Big bulk orders with deadlines | Coins + Reputation + rare items | 18          |
| **Rail / Sea / Air contracts**            | See §15–17                        | Cargo-sized                    | Materials, tools, chests        | 8 / 15 / 24 |

- **Dynamic pricing (light):** a "Market Trends" panel shows 3 items in high demand today (+50% value) and 2 in surplus (−30%). Encourages varied production.
- **Order difficulty scaling:** based on level and what the player can actually produce (already implemented: only items from unlocked crops & owned factories).
- **Order cooldowns:** skipping an order puts that slot on cooldown (exists).

---

## 15. Railway system

The railway is the backbone for **construction materials and expansion tools**. Unlike Township's fixed station, Meadowvale lets you **lay your own track**.

### 15.1 Buildings & infrastructure

| Piece               | Footprint                                     | Notes                                                                                |
| ------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Train Station**   | 4×2                                           | Unlock level 8; must connect to a track that leaves the island edge (the "mainline") |
| **Track**           | 1×1 pieces: straight, curve, crossing, switch | Placed like roads; cannot cross roads without a **level crossing** piece             |
| **Freight Depot**   | 3×2                                           | Unlock 14; adds a 2nd platform                                                       |
| **Rail Yard**       | 4×3                                           | Unlock 25; 3rd platform, train upgrades                                              |
| **Industrial Spur** | track to a factory/warehouse                  | Lets a factory load cars directly (no manual loading)                                |
| **Signals**         | decor/functional                              | Prevent collisions on shared lines (late game)                                       |

### 15.2 Trains

| Train                  | Cars | Speed (trip time) | Unlock |
| ---------------------- | ---- | ----------------- | ------ |
| Steam Locomotive       | 3    | 4 h               | 8      |
| Diesel                 | 5    | 3 h               | 18     |
| Electric (needs power) | 6    | 2 h               | 30     |
| High-Speed             | 6    | 1 h               | 45     |
| Passenger Train        | -    | brings tourists   | 20     |

### 15.3 How a trip works

1. Train arrives with **filled cars** (rewards) and a **request** for each car (e.g., "8 Bread").
2. Tap a car → collect its reward (materials/tools) → fill the car with the requested item.
3. When all cars are filled (or you choose to send it partially), dispatch. The train visibly leaves along the track.
4. Return timer starts; returning train brings the next set of rewards.

**Destinations:** choose a route per departure - _Pinewood (materials)_, _Harbor City (expansion tools)_, _Ironvale (mining tools & ore)_, _Capital (gems & rare)_. Each destination has its own reputation level that unlocks better rewards.

### 15.4 Passenger rail

Passenger trains bring **tourists** (§21) proportional to station quality and attractions. Tourists spend coins at shops/restaurants.

### 15.5 Upgrades

At the Engineering Institute: return time −5% per level, +1 car at levels 5 and 10, +XP per car, better reward tables.

### 15.6 Optional fuel

Trains consume Coal/Diesel per trip. If fuel is missing, the train is 50% slower (never blocked). Toggle via "Realism Mode".

---

## 16. Sea Port, ships & islands

### 16.1 Port buildings

| Piece              | Footprint      | Rules                                 | Unlock |
| ------------------ | -------------- | ------------------------------------- | ------ |
| **Sea Port**       | 4×3 (+ berths) | Must touch deep water                 | 15     |
| **Berth / Dock**   | 1×3 water      | Each berth hosts one ship (max 5)     | 15+    |
| **Lighthouse**     | 1×1 coast      | −10% voyage time, reduces storm risk  | 17     |
| **Shipyard**       | 3×3 coast      | Build & upgrade ships                 | 20     |
| **Fishing Pier**   | 1×4 water      | Passive fish catch + fishing minigame | 16     |
| **Ferry Terminal** | 3×2            | Brings tourists from the mainland     | 22     |

### 16.2 Ships

| Ship             | Capacity | Purpose                        | Unlock |
| ---------------- | -------- | ------------------------------ | ------ |
| Fishing Boat     | -        | Catches fish/seafood (timer)   | 15     |
| Cargo Ship       | 4 crates | Island trips for exotic goods  | 15     |
| Container Ship   | 8 crates | Bulk export contracts          | 30     |
| Tanker           | -        | Imports crude oil for Refinery | 40     |
| Ferry            | -        | Tourists                       | 22     |
| Yacht (cosmetic) | -        | Regatta-style events           | 25     |

### 16.3 Islands (exotic goods)

| Island               | Goods                                 | Unlock |
| -------------------- | ------------------------------------- | ------ |
| **Coconut Cay**      | Coconut, Pineapple, Banana            | 15     |
| **Spice Atoll**      | Cinnamon, Pepper, Vanilla             | 20     |
| **Coral Reef Isle**  | Pearls, Seaweed, Shells (artifacts)   | 25     |
| **Volcano Isle**     | Sulfur, Obsidian, Geothermal crystals | 32     |
| **Tea Terrace Isle** | Tea, Jasmine                          | 38     |
| **Oil Platform**     | Crude oil                             | 40     |

- Each voyage: choose island + optionally send goods for a **trade bonus** (e.g., send 10 Bread → +2 extra crates).
- Island upgrades (Engineering Institute): faster return, higher chance of 2nd/3rd product, rare drops.
- **Weather risk:** storms may delay a ship (never lose cargo); Lighthouse & Coast Guard mitigate.
- **Visuals:** ships sail out of the harbor across the ocean edge of the map and return.

---

## 17. Airport & air cargo

### 17.1 Buildings

| Piece                  | Footprint           | Notes                                          | Unlock |
| ---------------------- | ------------------- | ---------------------------------------------- | ------ |
| **Airfield**           | 6×3 runway + hangar | Needs flat open land (Flatlands)               | 24     |
| **Cargo Terminal**     | 3×3                 | Adds a second plane                            | 30     |
| **Passenger Terminal** | 4×3                 | Tourism flights                                | 32     |
| **Control Tower**      | 1×1                 | −10% flight time                               | 26     |
| **Helipad**            | 2×2                 | Express "Courier" mini-contracts (fast, small) | 20     |

### 17.2 Plane contracts

- Plane arrives with a **crate list** (e.g., 3 crates: 6 Jam, 4 Sweaters, 2 Cheese).
- Each filled crate pays immediately (coins + XP); filling **all** crates before the deadline awards a **chest** (gems, ingots, rare materials, boosters).
- **Help requests:** for hard crates, ask rival towns (AI, §25) - they fill it after a delay for a share of the reward.
- **Global trade:** late game "International Exchange" lets you sell high-tier goods (electronics, jewelry, car parts) at world prices that change daily.

### 17.3 Planes

| Plane           | Crates   | Flight | Unlock |
| --------------- | -------- | ------ | ------ |
| Propeller Plane | 3        | 6 h    | 24     |
| Cargo Jet       | 6        | 4 h    | 30     |
| Passenger Jet   | tourists | 3 h    | 32     |
| Jumbo Freighter | 9        | 4 h    | 45     |

---

## 18. Mining, Foundry & the Engineering Institute

### 18.1 Mine (Highlands, unlock 20)

- A separate **side-view / top-down dig grid** screen: tap tiles to dig using Pickaxes; Dynamite clears a 3×3; Drill Bits dig a column.
- Finds: ores (Copper, Iron, Silver, Gold), coal, gems, coins, artifacts (§22), treasure rooms, cave-ins (lose a turn, never lose items).
- Mine depth levels with increasing rarity.
- **Miner** workers auto-dig a few tiles per hour.

### 18.2 Quarry (new)

Surface building on rock tiles: passive Stone & Clay (inputs for Brickworks/Glassworks).

### 18.3 Foundry

Ores → ingots (Copper, Iron, Silver, Gold, Platinum alloy); also Steel Beams (Iron + Coal).

### 18.4 Engineering Institute (Academy of Industry equivalent)

Spend ingots + coins to upgrade:

- **Factories:** speed (−5%/lvl to −50%), coin value (+5%/lvl), XP (+5%/lvl), shelves (+1 at lvl 5, 10).
- **Trains / ships / planes:** trip time, capacity, reward quality.
- **Fields / animal buildings (new):** growth speed, yield chance.
- **Storage (new):** capacity multipliers.
- Achievement: _Modernizer_ for total upgrade levels.

---

## 19. Land expansion & leveling up the city

### 19.1 Leveling

- Current XP curve: `xpNeed(L) = 20 + 30(L−1) + 8(L−1)²` - good for levels 1–20. Above 20 we'll switch to a gentler exponential so levels stay achievable (~1–2 days per level at 50+).
- Target **level cap 100** for v1.0, with content unlocks every level through 60 and every 2–3 levels after.
- Each level-up: coins (50 × L), gems at milestones (every 5 levels), 1 Mayor Perk point (§13.4), unlock screen (exists).

### 19.2 Unlock roadmap (summary)

| Levels | Headline unlocks                                                                                                                                 |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1–5    | Fields, wheat/rice/corn/carrot/tomato/strawberry, houses, Bakery, Snack Bar, Diner, Courier Board, Grain Silo, chickens & cows, Feed Mill, Dairy |
| 6–10   | Employment Office (farmhands, rent collectors), Riverlands, Sugar Mill, Textile Mill, Sawmill, Builders, **Railway (L8)**, Power & Water         |
| 11–15  | Brickworks, Tailor, Material Depot, Shopkeepers, Conductors, Old Forest, **Sea Port (L15)**, Warehouse                                           |
| 16–20  | Fast Food, Pizzeria, Paper Mill, Ice Cream, Innovation Lab, Lighthouse, Shipyard, Helipad, **Mine & Highlands (L20)**, Cold Storage              |
| 21–30  | Foundry, Engineering Institute, Fish farm, Coffee, Chocolate, Glassworks, **Airport (L24)**, Passenger rail, Ferry, Tourism                      |
| 31–45  | Urban housing, Electronics, Toy Factory, Perfume, Jewelry, Container Ship, Stadium, University, Specialists                                      |
| 46–60  | High-rises, International Kitchen, Auto Parts, Refinery, Jumbo Freighter, Frost Peaks, landmarks                                                 |
| 61–100 | Wonders, luxury districts, prestige collections, seasonal content                                                                                |

### 19.3 Land expansion requirements

Expansion now needs three things (like Township): **coins + tools + population**.

| Expansion # | Coins     | Tools                      | Min population | Min level    |
| ----------- | --------- | -------------------------- | -------------- | ------------ |
| 1           | 250       | -                          | 40             | 2            |
| 2           | 440       | 1 Survey Stake             | 50             | 3            |
| 3–5         | ×1.6 each | 2–3 Stakes + Shovels       | +20 each       | +1 each      |
| 6–10        | ×1.5 each | Stakes, Shovels, Land Deed | +40 each       | +2 each      |
| 11+         | ×1.4 each | Increasing tools           | +80 each       | region-gated |

- **Special plots:** coast plots needed for Port, flat plots for Airport, rock plots for Mine - shown with icons on the For Sale signs.
- **Region gates:** buying the first plot of a new region requires a region unlock level and a one-time "Road/Bridge" build (e.g., build the **River Bridge** to reach Riverlands).
- **Plot preview** (exists: trees/rocks/water counts) gets extended with "special resources" (clay, ore veins, fertile soil).

### 19.4 City milestones (title progression)

Hamlet → Village → Town → Large Town → City → Metropolis. Each title is reached by population thresholds and unlocks a **Town Hall upgrade** (visual + new perks + bigger Rent Collector radius).

---

## 20. Decorations, roads & terrain customization

- **Roads:** Dirt, Gravel, Asphalt ✅, Stone, Brick; free or cheap; road editor with drag-to-draw lines.
- **Pavement:** Tile, Board, Stone, Checkered, Wood, Brick, Hexagon… unlocked by level; used for plazas.
- **Terrain painting (new):** paint grass/dirt/sand/water/snow on owned tiles (water painting requires a Shovel per tile).
- **Fences, hedges, bridges, walls, street furniture** (lamps ✅, benches ✅, bins, signs, mailboxes).
- **Parks:** each decor has a **beauty value** that raises happiness/land value within a radius (§21).
- **Upgradeable decor:** collections that grow as you add pieces (e.g., Classic Car Show, Dinosaur Park, Space Center).
- **Seasonal/event decor:** time-limited; stored in a "Decor Inventory" so you can put things away.
- **Tools:** rotate (where art supports it), move ✅, sell ✅, **multi-select & move groups**, copy/paste layouts (late).

---

## 21. Tourism, landmarks & happiness

### 21.1 Happiness

Per-house score from: needs met (§6.2/§7), nearby beauty, pollution, noise (roads/rail), services. Town happiness = average → affects rent, morale, tourism.

### 21.2 Tourism

- Tourists arrive by **passenger train, ferry and plane** (and later bus).
- They walk to attractions (landmarks, parks, beach, restaurants) and spend coins → visible coin bubbles at businesses (tap or auto-collect with a Tour Guide).
- **Hotels** cap how many tourists can stay. Tourism rating shown in the City Dashboard.

### 21.3 Landmarks & Wonders

Big multi-stage constructions requiring materials from **all** networks:

- Clock Tower, Grand Ferris Wheel, Opera House, Space Center, Golden Bridge, Volcano Observatory.
- Each grants a permanent town-wide bonus (e.g., +5% all rent, +1 offline hour, +10% tourism).

---

## 22. Collections, museum & zoo

- **Museum:** artifact sets from the mine, islands and ruins (e.g., "Ancient Farming Tools", "Shipwreck Treasures", "Fossils"). Completing a set → gems + a unique decoration. Duplicates can be traded at the Museum Shop for random pieces.
- **Zoo (later phase):** enclosures, animal-family card collections (common/rare/epic), zoo visitor orders using town goods. Treated as an optional expansion pack, not part of v1.0.
- **Worker Album (new):** collect specialist workers with unique portraits.

---

## 23. Events, achievements, quests & daily play

- **Achievements:** expand from 20 → ~80, with tiers (bronze/silver/gold) and new categories: logistics, workforce, tourism, city services. Examples: _Road Champ_ (place 450 roads), _Railroad Tycoon_ (100 train trips), _Captain_ (50 voyages), _Frequent Flyer_, _Full Employment_ (0 unemployed with 200+ residents), _Modernizer_.
- **Quest lines:** story chains from named residents (the baker who wants a bakery, the mayor's festival, the lighthouse keeper) that teach each system as it unlocks - extends the current 8-step tutorial.
- **Daily tasks:** 3 per day + a weekly chest. Login streak calendar (clovers, boosters).
- **Seasonal events (offline-friendly, client-side calendar):** Harvest Festival, Winter Lights, Spring Bloom, Summer Regatta - event currency, themed orders, exclusive decor.
- **Lucky Wheel** (clovers): coins, boosters, materials, decor - odds displayed.

---

## 24. Weather, seasons & day/night

- **Day/night** ✅: extend so shops close at night (fewer customers), lights matter, nightlife buildings earn more at night.
- **Weather:** Sunny, Rain (+crop speed, −tourism), Storm (ships delayed), Heatwave (animals slower without water coverage), Snow (Frost Peaks).
- **Seasons** (1 real day = 1 season, optional): some crops are seasonal (+30% in season, −30% out); greenhouses ignore seasons. Visual palette shifts (autumn trees ✅ partly exists).
- **Random events (mild):** crows on fields (scarecrow prevents), small fire (fire station covers), festival parade (bonus customers), traveling merchant (rare goods offer).

---

## 25. Rival towns & (optional) social

Single-player first, but with the _feel_ of a social game:

- **AI rival towns** on the mainland (via rail/air destinations) with names, mayors and personalities. They post Business Contracts, accept help requests, and appear on a weekly **leaderboard** (population, tourism, deliveries).
- **Weekly Regatta (single-player version):** race AI towns by completing a task board; tokens buy decor & boosters.
- **Later (needs a backend):** real friends, visiting towns, co-ops, chat, help requests. Kept out of scope until the single-player game is complete.

---

## 26. UI / UX plan

### 26.1 HUD

- Top-left: level/XP ✅, coins ✅, gems, population (residents / cap) ✅, storage summary ✅, happiness smiley.
- Top-right: weather + clock ✅, active boosters, notifications bell, settings ✅.
- Bottom toolbar: Store ✅, Storage ✅, Orders ✅, Goals ✅, Home ✅ → add **Logistics** (rail/sea/air hub), **Workforce**, **City** (dashboard/overlays), **Edit Mode**.
- Minimap ✅ → add region labels and transport route lines.

### 26.2 Key panels

Store (tabs by category + search) · Storage (per building type) · Orders (market, courier, contracts) · Logistics hub (train/ship/plane cards with timers) · Workforce (candidates, employees, payroll) · City Dashboard (services, happiness, overlays) · Engineering Institute · Lab · Museum · Achievements ✅ · Settings ✅.

### 26.3 Interaction principles

- Every timer visible both on the map (progress bar ✅) and in a list.
- Notifications when anything finishes (in-game toasts ✅; optional browser notifications).
- "Why can't I?" tooltips: every disabled button explains the missing requirement (level / coins / material / population / storage).
- Drag interactions everywhere it makes sense: plant ✅, harvest ✅, roads, rail tracks, fences, assigning workers (drag portrait onto building).
- Edit Mode: grid overlay, multi-select, move groups, store decor in inventory.
- Accessibility: colorblind-safe status colors, scalable UI, reduced-motion option, full keyboard shortcuts.

---

## 27. Data model

All content is **data-driven** - systems read definitions; nothing is hard-coded per building.

| Entity                       | Key fields                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Item`                       | id, name, icon, category, baseValue, xp, storageType (barn/silo/warehouse/cold/depot), perishHours?                                                                              |
| `Crop`                       | id, itemId, seedCost, growTime, yield, level, season?, terrainModifiers                                                                                                          |
| `AnimalBuilding`             | id, footprint, animalType, slots, feedItem, output, time, maxCount, level                                                                                                        |
| `Building`                   | id, name, category, footprint, cost {coins, materials[]}, buildTime, level, popRequirement, placementRule (land/water/coast/rock/flat), needs (power/water), workerSeats, artRef |
| `House` (extends Building)   | residents, rent, rentTime, needs, upgradeTo                                                                                                                                      |
| `CommunityBuilding`          | popCap, serviceType, radius, tourismValue                                                                                                                                        |
| `Factory` (extends Building) | recipes[], slots, shelves, upgradeTrack                                                                                                                                          |
| `Recipe`                     | id, inputs [{item, qty}], output {item, qty}, time, xp, level                                                                                                                    |
| `Storage`                    | id, storageType, baseCap, upgradeCosts[]                                                                                                                                         |
| `Worker`                     | id, name, portrait, homeId, jobId, role, skill, xp, traits[], wage, morale                                                                                                       |
| `JobRole`                    | id, workplaceTypes[], automation behaviour, efficiencyBySkill[], wageBySkill[]                                                                                                   |
| `AutomationRule`             | buildingId, type (plantCrop/stockTarget/whitelist/reserve), params                                                                                                               |
| `Booster`                    | id, effect {target, stat, multiplier}, duration, recipe                                                                                                                          |
| `Perk`                       | id, branch, tier, effect, cost                                                                                                                                                   |
| `Order`                      | id, source (market/courier/contract/request), items, reward, deadline?, npc                                                                                                      |
| `Vehicle`                    | id, type (train/ship/plane), capacity, tripTime, state, cargo[], route, upgrades                                                                                                 |
| `Route / Destination`        | id, network, rewardTable, reputation, unlockLevel                                                                                                                                |
| `RewardTable`                | entries [{item, qty range, weight}], guaranteed[]                                                                                                                                |
| `Expansion`                  | plotId, region, cost {coins, tools[], population, level}, specialTags                                                                                                            |
| `Upgrade`                    | targetType, level, cost {ingots[], coins}, effect                                                                                                                                |
| `Achievement`                | id, metric, tiers [{goal, reward}] ✅ (single tier today)                                                                                                                        |
| `Quest`                      | id, chain, steps [{text, condition, reward}] ✅ (tutorial today)                                                                                                                 |
| `Event`                      | id, start/end, currency, tasks[], shop[]                                                                                                                                         |
| `Collection`                 | id, items[], reward                                                                                                                                                              |
| `SaveState`                  | version, player, world entities, inventory per storage, workers, vehicles, timers, settings                                                                                      |

**Rule:** relationships (which items feed which recipes, which orders can request what) are computed from data so new content automatically participates in orders, contracts and automation.

---

## 28. Technical architecture plan

### 28.1 Current

Vanilla JS, global scripts (`data.js`, `util.js`, `audio.js`, `world.js`, `render.js`, `walkers.js`, `ui.js`, `game.js`), Canvas 2D, procedural art, localStorage.

### 28.2 Target structure (Phase 1 refactor)

- Move to **ES modules + Vite** (dev server, bundling) - keeps the no-framework approach.
- Split into folders:
  - `data/` - JSON/JS definitions per domain (crops, items, recipes, buildings, vehicles, rewards, levels).
  - `sim/` - pure simulation (no DOM): economy, timers, production, workers, logistics, population, services. Deterministic and unit-testable.
  - `world/` - map, terrain gen, placement, pathfinding (roads, rail, sea lanes).
  - `render/` - canvas renderer, sprite/procedural art per entity, particles, overlays.
  - `ui/` - panels, HUD, popups.
  - `save/` - serialization + **versioned migrations** (v1 → v2 …) so players never lose saves.
- **Simulation tick** (fixed 4 Hz, already 250 ms) separate from rendering (rAF ✅).
- **Offline catch-up:** on load, simulate elapsed time in coarse steps (fields, factories, workers, vehicles, rent) with an offline cap.
- **Event bus:** systems emit events (`harvested`, `orderDelivered`, `trainReturned`) consumed by achievements, quests, stats, sounds - avoids cross-coupling.

### 28.3 Performance

- **Chunked terrain caching:** pre-render static ground per 8×8 plot to offscreen canvases; redraw only on change. Needed for the 128×128 map.
- Spatial index for entities (per-chunk lists) instead of iterating every entity per frame.
- Cap walkers by zoom level; LOD (simplified drawing when zoomed out).
- Pathfinding: cache road graph; A\* for rail and sea lanes; incremental updates when roads change.
- Target: 60 fps with 5,000 entities and 150 walkers on a mid-range laptop.

### 28.4 Art direction

Keep the procedural vector style for consistency and tiny download size. Add a sprite atlas pipeline later for complex buildings (pre-rendered from procedural draws at load time = already doing this for store thumbnails).

### 28.5 Testing

- Unit tests for `sim/` (Vitest): recipes, storage limits, wage payouts, offline catch-up, order generation.
- Headless-browser smoke tests (already used during v0.1): boot, plant/harvest/deliver, save/load round-trip, screenshot diffs for key screens.
- Balance simulation script: bot plays N simulated days → outputs level/coins/population curves.

---

## 29. Balancing framework

### 29.1 Core formulas (starting points)

- **Item value** = Σ(input values) × 1.35 + time bonus (1 coin per 2 min of production).
- **XP per item** ≈ value / 6.
- **Order reward** = Σ(value × qty) × (1.35–1.75) × (1 + population/300) ✅.
- **Rent per hour** ≈ residents × 3 × happiness multiplier (0.7–1.3).
- **Wages per hour** ≈ 40–60% of the value the worker automates at L1, dropping to 25% at L5 (the incentive to train).
- **Expansion cost** grows ~1.5×; tool requirements grow linearly.

### 29.2 Pacing targets (Quick Play off)

| Milestone      | Target real time          |
| -------------- | ------------------------- |
| Level 5        | 30–45 min                 |
| Railway (L8)   | 2–3 h                     |
| Sea Port (L15) | 1–2 days                  |
| Mine (L20)     | 3–4 days                  |
| Airport (L24)  | 5–7 days                  |
| Level 50       | ~6–8 weeks of casual play |

### 29.3 Sinks & faucets

Track per-hour coin **faucets** (orders, rent, sales, tourism) vs **sinks** (construction, seeds, wages, upgrades, decor). Payroll and maintenance are the new long-term sinks that keep coins meaningful late game.

---

## 30. Development roadmap

Each phase ends with a playable build, a save migration, and updated tests.

### Phase 0 - Foundation (done ✅)

Isometric world, farming, houses, market customers, 3 factories, store, barn, achievements, tutorial, expansion, save/load.

### Phase 1 - Architecture & polish

- ES modules + Vite, `sim/` separation, event bus, versioned saves.
- Chunked terrain cache, spatial index.
- Real timer scale + Quick Play setting.
- Construction timers & construction sites.
- **Acceptance:** same gameplay as v0.1, 60 fps on a 128×128 test map, old saves migrate.

### Phase 2 - Deeper farm & storage

- 10 more crops, Feed Mill, Chicken Coop, Cowshed, Dairy, Sheep, Textile.
- Grain Silo, Seed Shed, storage routing by item type, overflow prompt.
- Courier Board (9 orders).
- **Acceptance:** a full chain crop → feed → animal → factory → courier order works.

### Phase 3 - Workforce & automation ⭐

- Employment Office, worker generation, homes ↔ jobs, wages/payroll, morale.
- Roles: Farmhand, Rancher, Factory Worker/Manager, Rent Collector, Builder.
- Automation rules UI, Workforce Dashboard, offline work.
- Rent Office building + auto rent collector power-up.
- **Acceptance:** with 3 farmhands + 2 factory managers, the farm/bakery run unattended for 4 offline hours with correct payroll.

### Phase 4 - Railway

- Track placement tool, Train Station, steam train, car loading, destinations, reputation, material & tool rewards.
- Construction materials economy; expansion now requires tools + population.
- Conductor automation.
- **Acceptance:** materials from trains complete a community building and a land expansion.

### Phase 5 - City services & population cap

- Community buildings raise cap; power & water; happiness; overlays; City Dashboard.
- Housing tiers 2–3, house upgrades.
- **Acceptance:** population gated by cap; coverage visibly changes rent.

### Phase 6 - Sea Port & islands

- Coast region, port, berths, cargo ships, 3 islands, lighthouse, fishing pier, fishing boat, storms.
- Warehouse, Cold Storage, fish chain.
- **Acceptance:** island goods feed a tier-3 recipe used in a contract.

### Phase 7 - Boosters, perks & Lab

- Innovation Lab boosters, instant power-ups, Mayor Perk Tree, daily tasks, Lucky Wheel.

### Phase 8 - Mine, Foundry, Engineering Institute

- Mine dig screen, ores, foundry, ingots, upgrade tracks for factories and vehicles, museum v1.

### Phase 9 - Airport & tourism

- Flatlands region, airfield, cargo planes with chests, passenger flights, tourists, hotels, landmarks.

### Phase 10 - Content & live feel

- Tier 4–5 factories, high-rises, Frost Peaks, wonders, seasons & weather, events, AI rival towns & leaderboard, 80 achievements, story quest chains.

### Later / optional

Zoo expansion, cloud saves, real multiplayer co-ops, mobile-optimized UI, sprite art pass.

---

## 31. Content checklist

_Every single-player item in this plan is now playable. Online multiplayer was deliberately deferred (no backend for now)._

**World & construction**

- [x] Isometric map, terrain types, procedural island
- [x] Bigger world: 128×128 main island + 4 themed islands (forest, beach, meadow, rocky)
- [x] Bridges to islands (bridge sites, level + coin gates, free first plot)
- [x] Plot-based land expansion (coins + level)
- [x] Expansion requiring tools (stakes, shovels, deeds) + population
- [x] Construction sites & timers (materials, scaffolding, builders, 💎 finish)
- [x] Community buildings & population cap
- [x] City services (power, water, safety, fire, health, education, shopping, parks) with coverage
- [x] Regions on the main island with level gates (Meadow Heart, Riverlands, Old Forest, Sunset Coast, Highlands, Flatlands, Frost Peaks)
- [x] Snowy Frost Peaks content (snow terrain, Ski Lodge, Ice Rink, snowmen)

**Farming & production**

- [x] Fields, drag plant/harvest, 22 crops
- [x] Greenhouse, sprinklers, scarecrows, field ★ upgrades
- [x] Feed Mill + 11 animal buildings (coop, cowshed, sheep, pigs, apiary, goats, fish pond, duck pond, mushroom cellar, alpaca ranch, oyster bed)
- [x] True orchards (apple, orange, cherry, olive, coconut - 5 harvests, then prune)
- [x] Seasonal crops (+30% in season, −25% out of season; greenhouses unaffected)
- [x] ~40 factories / ~118 recipes across five tiers (incl. Refinery, Auto Parts, Furniture, Paper Mill, Flower Studio, Shoes, Pet Supply, Bags, Candles, Gourmet)
- [x] Production queues with extra slots via upgrades, perks and the Engineering Institute
- [x] Factory output shelves (production pauses when shelves are full)

**Storage**

- [x] Barn with upgrades
- [x] Grain Silo, Warehouse, Cold Storage, Material Depot (storage routing by item type)
- [x] Seed Shed (seed bag capped at 200 + 150 per shed)
- [x] Overflow prompt (quick-sell surplus / open barn when storage is full)
- [x] Perishables & fuel in optional Realism Mode

**Workforce & power-ups**

- [x] Employment Office, hiring, wages/payroll, strikes, traits, skill levels, training, morale
- [x] 12 roles: farmhand, rancher, factory manager, rent collector, shopkeeper, dispatch clerk, builder, conductor, dock worker, pilot, miner, tour guide
- [x] Automation rules UI (crop choice, field count, stock targets, reserves) & staff dashboard
- [x] Offline staff simulation (4h + Mayor perk, summary on return)
- [x] Specialists (agronomist, head chef, logistics expert, accountant, engineer, vet) & worker album with milestones
- [x] Innovation Lab boosters, timed boosters, instant power-ups (Harvest Wave, Sprout Rain, Rent Day, Time Skip, Clear-All Saw)
- [x] Permanent perks (Auto-Sow, Combine Harvester, Rent Office, Feed Dispenser…)
- [x] Mayor Perk Tree (1 point per level, 3 branches × 5 perks, row gating, gem respec)

**Logistics**

- [x] Market walk-in customers
- [x] Courier Board (with delivery vans), Business Contracts, Market Trends
- [x] Town Requests (6 named-resident story chains)
- [x] Railway: track laying, station, trains, cars, 4 destinations, reputation, freight depot
- [x] Passenger rail, rail signals, 4 train types (steam → bullet), diesel fuel in Realism Mode
- [x] Sea Port: ships, 6 voyage destinations, gifts, storms, lighthouse, fishing pier
- [x] Berths, shipyard, ferries, container ships & tankers
- [x] Airport: planes, crates, reward chests, help requests, control tower
- [x] Passenger terminal & flights, helipad express orders, International Exchange

**Industry & collections**

- [x] Mine (dig screen, depths, dynamite), quarry, foundry, ingots, steel
- [x] Engineering Institute upgrades (factories, fields, trains, ships, planes)
- [x] Museum collections (4 sets, duplicate trading, unique decor reward)
- [x] Tool Exchange & special tools (crane hook, jackhammer, welding torch) required by wonders & top-tier homes

**Customization & city life**

- [x] Roads, dirt paths, plaza, cobblestone, brick roads, rail, fences, bridges
- [x] Terrain painting (grass, dirt, sand, dig ponds, fill water)
- [x] Move / sell, building ★ upgrades
- [x] Edit mode: multi-select, group move, copy/paste, flip, store decor in an inventory
- [x] Beauty, happiness, pollution, tourism, hotels, 3 wonders, map overlays
- [x] Weather, seasons, day/night, random events (crows, merchant, festival, fire)

**Progression & meta**

- [x] Levels, XP, unlock screen, tutorial quest chain (16 steps)
- [x] Town titles (Hamlet → Metropolis)
- [x] Gems (earned only), daily tasks, login streak, Lucky Wheel, weekly events + event shop
- [x] Rival towns leaderboard, notifications log, City dashboard
- [x] 115 tiered (bronze/silver/gold) achievements
- [x] Level cap 100 with an unlock on every level (monuments fill levels 36–100), Town Hall upgrades to ★5 with a grander look
- [x] Story quest chains (Town Requests) & a real-date seasonal event calendar (double tokens + exclusive decor)
- [x] Weekly Regatta with AI co-op teammates, save download/upload & transfer codes
- [ ] _Deferred by choice:_ online multiplayer, real co-ops and cloud saves (needs a backend)

**Tech**

- [x] Save/load with offline progress, pause & game speed
- [x] Vite dev server & production build with an ES-module entry (`src/main.js`); `index.html` still runs straight from file://
- [x] Versioned save migrations (incl. upgrading the original 72×72 saves)
- [x] Spatial index for entities & cached far-zoom terrain chunks
- [x] Browser test suite (`tests/run.sh`, 57 checks) & balance-simulation bot (`tests/run.sh balance`)

---

## 32. Open questions

1. **Timer scale:** keep seconds-scale "arcade" timers as the default, or default to real-time with Quick Play optional?
2. **Realism Mode:** ship fuel and perishables in v1.0 or leave for later?
3. **Map size:** grow the existing 72×72 island, or generate a new 128×128 map (requires a save migration that regenerates terrain around existing builds)?
4. **Track building freedom:** fully free rail placement (more fun, more pathfinding work) vs. fixed rail corridors per region (simpler)?
5. **Worker visibility:** should every worker be an individually simulated walker (charming, heavier) or aggregated with only a sample shown walking?
6. **Gems:** confirm "no real money, ever" - affects how generous gem rewards should be.
7. **Rotation:** do we invest in two-direction building art (needed for nicer layouts) in Phase 1 or later?
