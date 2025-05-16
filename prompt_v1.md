---

## V1:

---

## Feudal Realm Manager: Development Stages

Here's a breakdown of the development stages to create the "Feudal Realm Manager" game using Three.js:

**Overarching Principles (from `game.md`):**

- **Phased Development:** Each feature/module will undergo Planning & Design, Core Implementation & Unit Testing, Integration & Integration Testing, and Polish, Optimization & Final Review.
- **Rigorous Verification:** All verification steps from `game.md` must be completed for each stage.
- **Coding Standards:** Adhere to JavaScript/TypeScript conventions, naming, comments, formatting.
- **Three.js Best Practices:** Proper object disposal, scene graph management, vector math.
- **Code Organization:** Follow a clear directory structure and class design principles (SRP, clear API).
- **Version Control:** Use Git with feature branches, frequent commits, and PRs for review.

---

### Phase 0: Project Setup & Core Engine Foundation

- **Overall Goal:** Establish the project environment, basic Three.js rendering, and core utilities.

- **Key Features/Modules:**

    1. **Project Initialization:**

        - **Stage 1 (Planning):** Define project structure (as per `game.md` suggestions), choose build tools (e.g., Vite, Webpack), setup version control (Git).
        - **Stage 2 (Implementation):** Create directory structure, install Three.js and other core dependencies, setup linter/formatter.
        - **Stage 3 (Integration):** Basic "hello world" with Three.js (e.g., render a spinning cube).
        - **Stage 4 (Polish):** Ensure build process works, basic README.

    2. **Core Rendering Engine:**

        - **Stage 1 (Planning):** Design classes for scene management, camera controls (isometric perspective, scroll, zoom as per `coder.md` 6. User Interface), renderer setup.
        - **Stage 2 (Implementation):** Implement `SceneManager`, `CameraManager`, `Renderer` wrapper. Basic game loop.
        - **Stage 3 (Integration):** Integrate into the main application. Test camera controls.
        - **Stage 4 (Polish):** Optimize basic rendering loop.

    3. **Basic Input Manager:**

        - **Stage 1 (Planning):** Define how mouse clicks and keyboard inputs (if any initially) will be captured and processed.
        - **Stage 2 (Implementation):** Implement an `InputManager` class to handle mouse events (position, clicks).
        - **Stage 3 (Integration):** Connect input manager to the game loop; log mouse clicks on the 3D plane.
        - **Stage 4 (Polish):** Refine input handling.

    4. **Utility Library:**

        - **Stage 1 (Planning):** Identify common utility functions needed (e.g., math helpers, constants).
        - **Stage 2 (Implementation):** Create initial utility functions.
        - **Stage 3 (Integration):** Use utilities in existing core components.
        - **Stage 4 (Polish):** Document utilities.

- **Phase-Level Verification:** A blank 3D world is rendered, camera is controllable, and mouse interactions with the 3D ground plane can be detected. Project structure and build tools are operational.

---

### Phase 1: The First Settlement - Core Gameplay Loop Initiation

- **Overall Goal:** Implement the absolute basics: placing the Castle, spawning a generic serf, basic map representation, and gathering one type of resource (Wood).

- **Key Features/Modules:**

    1. **Map System (Basic):**

        - **Stage 1 (Planning):** Design data structure for the game map (grid-based), terrain types (Grassland initially). Define map generation/loading (start with a fixed simple map). Address world wrapping (`coder.md` 3.7).
        - **Stage 2 (Implementation):** Implement `Map` class, render a simple flat grid representing grassland. Implement basic world wrapping logic for camera/entities.
        - **Stage 3 (Integration):** Display the map in the game.
        - **Stage 4 (Polish):** Visual distinction for map edges if needed.

    2. **Building System (Core):**

        - **Stage 1 (Planning):** Design base `Building` class, placement logic (grid-based, collision detection with other buildings - though only Castle initially).
        - **Stage 2 (Implementation):** Implement `BuildingManager` and base `Building` class. Implement logic for selecting and placing a building.
        - **Stage 3 (Integration):** Allow placing a "placeholder" building on the map.
        - **Stage 4 (Polish):** Visual feedback for placement (valid/invalid).

    3. **Castle Implementation:**

        - **Stage 1 (Planning):** Design `Castle` class (extends `Building`). Define its properties (starting resources, serf spawning point as per `coder.md` 4.2.1). Plan 3D model using simple shapes as per `buildings.md`.
        - **Stage 2 (Implementation):** Implement `Castle` class. Create the Castle 3D model using Three.js primitives as per `buildings.md`.
        - **Stage 3 (Integration):** Player starts with a pre-placed Castle or can place it. Castle stores initial (placeholder) resources.
        - **Stage 4 (Polish):** Ensure Castle visuals are correct and it functions as the central hub.

    4. **Resource System (Basic):**

        - **Stage 1 (Planning):** Design base `Resource` class. Define Wood resource type. Plan 3D model for Wood (Logs) as per `resources.md`.
        - **Stage 2 (Implementation):** Implement `ResourceManager` and `Wood` resource class. Create Wood (Log) 3D model.
        - **Stage 3 (Integration):** Castle can store Wood. Display Wood count in a basic UI.
        - **Stage 4 (Polish):** Visuals for Wood resource are clear.

    5. **Unit System (Basic Serf):**

        - **Stage 1 (Planning):** Design base `Serf` class. Plan serf spawning from Castle. Plan basic serf 3D model as per `units.md`.
        - **Stage 2 (Implementation):** Implement `UnitManager` and base `Serf` class. Create base serf 3D model. Implement spawning logic.
        - **Stage 3 (Integration):** Castle spawns a generic serf. Serf can move on the map (simple pathfinding or direct movement initially).
        - **Stage 4 (Polish):** Serf model is visible and moves.

    6. **Woodcutter's Hut & Wood Gathering:**

        - **Stage 1 (Planning):** Design `WoodcutterHut` class. Serf profession: Woodcutter. Resource gathering logic (Woodcutter + Axe -> Wood). Plan 3D models for Hut (`buildings.md`), Axe (`resources.md`), Woodcutter serf (`units.md`).
        - **Stage 2 (Implementation):** Implement `WoodcutterHut`, Woodcutter profession (modifies base Serf). Implement Axe tool. Create 3D models.
        - **Stage 3 (Integration):** Player can build Woodcutter's Hut. Assign a serf to be a Woodcutter. Woodcutter travels to a "tree" (placeholder), "chops" it, and brings Wood back to Hut/Castle.
        - **Stage 4 (Polish):** Animations (simple), resource depletion for trees (placeholders).

    7. **Basic UI:**

        - **Stage 1 (Planning):** Plan UI elements for selecting buildings, displaying resource counts (Wood).
        - **Stage 2 (Implementation):** Implement basic HTML/CSS UI elements interacting with the game.
        - **Stage 3 (Integration):** UI updates based on game state.
        - **Stage 4 (Polish):** UI is clear and functional.

- **Phase-Level Verification:** Player can place a Castle and Woodcutter's Hut. A serf can become a Woodcutter, gather Wood from placeholder trees, and deposit it. Basic resource count is visible.

---

### Phase 2: Expanding the Economy - Basic Production Chains

- **Overall Goal:** Introduce more resource types, processing buildings, serf professions, and the concept of a simple production chain (e.g., Wood -> Planks). Implement basic transportation.

- **Key Features/Modules:**

    1. **Additional Raw Materials:**

        - **Stone:** Implement Stone resource (visuals from `resources.md`).
        - **Quarry & Stonemason:** Implement Quarry building (`buildings.md`), Stonemason serf (`units.md`), Pickaxe tool (`resources.md`). Stonemasons gather Stone from placeholder stone deposits.

    2. **Processed Goods - Planks:**

        - **Planks Resource:** Implement Planks resource (`resources.md`).
        - **Sawmill:** Implement Sawmill building (`buildings.md`), Sawmill Worker serf (`units.md`). Sawmill converts Wood (Logs) to Planks.

    3. **Forester's Hut & Tree Planting:**

        - Implement Forester's Hut (`buildings.md`) and Forester serf (`units.md`). Foresters plant saplings (placeholder trees) to ensure renewable wood.

    4. **Transportation System (Basic - Transporters):**

        - **Transporter Serf:** Implement Transporter profession (`units.md`).
        - **Goods Movement:** Transporters pick up goods from producing buildings (e.g., Wood from Woodcutter's Hut, Stone from Quarry) and deliver them to consuming buildings (e.g., Wood to Sawmill) or storage (Castle). Start with direct A-to-B logic.

    5. **Storage - Warehouse (Basic):**

        - Implement Warehouse building (`buildings.md`) for centralized storage. Transporters can use it.

    6. **Builder Serf & Construction Process:**

        - Implement Builder serf (`units.md`) and Hammer tool (`resources.md`).
        - Buildings require Wood/Stone for construction. Builders transport these materials to the construction site and "build" over time.

    7. **UI Enhancements:**

        - Display new resources (Stone, Planks).
        - Allow assigning serfs to new professions.
        - Building construction progress.

- **Phase-Level Verification:** Player can establish a production chain for Planks. Builders construct buildings using resources. Transporters move goods between a few key buildings. New resources and professions are functional.

---

### Phase 3: Food, Tools, and Complex Economy

- **Overall Goal:** Introduce food as a critical resource (especially for Miners), tools for various professions, mining operations, metal production, and the full logistics system (Roads & Flags).

- **Key Features/Modules:**

    1. **Food Production Chains:**

        - **Fish:** Fisherman's Hut (`buildings.md`), Fisherman serf (`units.md`), Fishing Rod (`resources.md`). Requires water tiles on map.

        - **Bread:**

            - Farm (`buildings.md`), Farmer serf (`units.md`), Scythe (`resources.md`) -> Grain (`resources.md`).
            - Windmill (`buildings.md`), Miller serf (`units.md`) -> Flour (`resources.md`).
            - Bakery (`buildings.md`), Baker serf (`units.md`) -> Bread (`resources.md`). (Requires Coal - implement Coal alongside Iron).

        - **Meat (Pork):**

            - Pig Farm (`buildings.md`), Pig Farmer serf (`units.md`) -> Pigs (live animal resource, `resources.md`). (Requires Grain).
            - Slaughterhouse (`buildings.md`), Butcher serf (`units.md`) -> Meat (`resources.md`).

    2. **Mining Operations:**

        - **Geologist & Prospecting:** Geologist's Hut (`buildings.md`), Geologist serf (`units.md`). Geologists prospect mountain tiles (new terrain type) to find ore deposits.
        - **Ores:** Iron Ore, Coal Ore (`resources.md`).
        - **Mines:** Implement generic Mine structure (`buildings.md`) with visual indicators for Iron, Coal. Miner serf (`units.md`) requires Pickaxe and Food to work.

    3. **Metal Production:**

        - **Iron Smelter:** (`buildings.md`), Smelter Worker (`units.md`) -> Iron Bars (`resources.md`). (Requires Iron Ore, Coal).

    4. **Tool Production:**

        - **Toolmaker's Workshop:** (`buildings.md`), Toolmaker serf (`units.md`).
        - **Tools:** Produce various tools (Axes, Pickaxes, Scythes, Hammers, Fishing Rods) from Iron Bars and Planks. Professions now consume their specific tools.

    5. **Logistics System (Roads & Flags):**

        - Implement Flags and Roads (`coder.md` 3.3). Players place Flags; roads form between them.
        - Transporters now use the road network. Pathfinding for Transporters along roads.
        - Manage path segment occupation (one Transporter per segment).

    6. **Economic Management UI:**

        - **Global Statistics Panel:** Resource stockpiles, production rates, serf population (`coder.md` 6. User Interface).
        - **Goods Distribution/Priorities Panel:** Allow players to set basic priorities for goods transport (`coder.md` 6. User Interface).

    7. **Map Enhancements:**
        - Introduce Mountain and Water terrain types.

- **Phase-Level Verification:** Complex production chains for food and tools are operational. Mining provides ores for metal production. The road and flag based logistics system is functional. Players can manage their economy via new UI panels.

---

### Phase 4: Military and Expansion

- **Overall Goal:** Introduce military units (Knights), weapon production, military buildings, territory expansion, and a basic combat system.

- **Key Features/Modules:**

    1. **Weapon Production:**

        - **Blacksmith/Armory:** (`buildings.md`), Blacksmith serf (`units.md`).
        - **Weapons:** Produce Swords and Shields (`resources.md`) from Iron Bars, Coal (and Planks for shields).

    2. **Military Buildings & Territory Expansion:**

        - **Guard Hut:** (`buildings.md`). Expands territory, houses few Knights.
        - **Watchtower:** (`buildings.md`). Expands more territory, houses more Knights.
        - **Barracks/Fortress:** (`buildings.md`). Major military building, large Knight capacity.
        - Implement territory influence mechanic based on military buildings.

    3. **Knight Unit:**

        - Implement Knight unit (`units.md`). Recruited in military buildings when Sword & Shield are delivered; serf becomes Knight.
        - Knights have combat strength.
        - Visuals include player faction color and equipment.

    4. **Combat System (Basic):**

        - Players can direct Knights from a military building to attack an adjacent enemy military building.
        - Basic combat resolution (e.g., comparing total strength, or simple one-on-one duels).
        - Capturing enemy military buildings.
        - Civilian serfs are not directly attackable.

    5. **Military Management UI:**

        - Overview of military buildings, stationed Knights.
        - Interface to order attacks.
        - Set Knight recruitment priorities.

    6. **Alerts/Notifications System:**
        - Implement basic alerts (e.g., "Under Attack", "Mine Depleted").

- **Phase-Level Verification:** Players can produce weapons, recruit Knights, build military structures to expand territory, and engage in basic combat to capture enemy (placeholder/neutral) military buildings.

---

### Phase 5: Advanced Economy, Conquest & Winning

- **Overall Goal:** Introduce the gold economy, its impact on military strength, refine combat with Knight ranks, and implement the primary winning condition.

- **Key Features/Modules:**

    1. **Gold Economy:**

        - **Gold Ore:** (`resources.md`). Found via Geologists, mined in Gold Mines.
        - **Goldsmith/Mint:** (`buildings.md`), Goldsmith serf (`units.md`). Converts Gold Ore to Gold Bars (`resources.md`). (Requires Coal).

    2. **Knight Advancement:**

        - **Gold Influence:** Gold Bars in treasury boost combat strength of all Knights.
        - **Knight Ranks/Levels:** Knights gain experience from combat, increasing rank and base strength (up to 5 ranks as per `coder.md` 4.3.2). Visual indicators for rank on Knight model (`units.md`).

    3. **Refined Combat & Conquest:**

        - Implement detailed combat resolution (one-on-one duels, factoring in rank and gold bonus).
        - Capturing non-military enemy buildings if they fall within new territory after military building capture.
        - Serfs returning to Castle or seeking new jobs if workplace is lost.

    4. **Winning Condition:**

        - Implement logic for destroying an enemy Castle to achieve victory.

    5. **Minimap:**
        - Implement a minimap for quick navigation (`coder.md` 6. User Interface).

- **Phase-Level Verification:** The gold economy is functional and impacts Knight strength. Knights can rank up. Combat is more nuanced. The primary win condition (destroying enemy Castle) is implemented and testable against a placeholder opponent.

---

### Phase 6: AI Opponent

- **Overall Goal:** Develop a functional AI opponent that can manage its own settlement, expand, build an army, and engage in conflict with the player.

- **Key Features/Modules:**

    1. **AI Core Logic:**

        - Decision-making framework (e.g., state machine, behavior trees).
        - Goal setting (e.g., economic development, military buildup, expansion).

    2. **AI Economic Management:**

        - AI places buildings, manages production chains, assigns serfs.
        - Responds to resource shortages.

    3. **AI Military Management:**

        - AI recruits Knights, builds military structures.
        - Decides when and where to attack or defend.

    4. **AI Territory Expansion:**

        - AI strategically expands its territory.

    5. **Difficulty Levels (Optional):**
        - Implement different AI behaviors or resource handicaps for varying difficulty.

- **Phase-Level Verification:** An AI opponent can play the game, providing a challenge to the human player. The AI makes sensible economic and military decisions.

---

### Phase 7: Polish, Balancing, & Finalization

- **Overall Goal:** Refine all aspects of the game, balance gameplay, optimize performance, fix bugs, and prepare for "release."

- **Key Features/Modules:**

    1. **Game Balancing:**

        - Adjust resource costs, production times, unit stats, building effectiveness.
        - Playtest extensively to ensure fair and engaging gameplay.

    2. **Performance Optimization:**

        - Profile and optimize Three.js rendering (draw calls, shaders).
        - Optimize JavaScript game logic.
        - Ensure proper disposal of all Three.js objects to prevent memory leaks (`game.md`).

    3. **Visual Polish:**

        - Refine 3D model appearances (within simple shape constraints).
        - Add simple animations or visual feedback where impactful (e.g., building construction, combat effects).
        - Improve UI aesthetics and usability.

    4. **Sound Effects (Optional):**

        - Integrate basic sound effects for key actions if desired.

    5. **Bug Fixing:**

        - Address all identified bugs from testing.

    6. **Final Testing & QA:**

        - Comprehensive testing of all game features and edge cases.

    7. **Map Generation (Random):**

        - If desired, implement random map generation based on a seed, including varied terrain types (`coder.md` 3.7).

    8. **Tutorial/Help System (Optional):**
        - Implement in-game tutorial or help screens to guide new players.

- **Phase-Level Verification:** The game is feature-complete, balanced, performs well, is relatively bug-free, and provides an enjoyable player experience. All documentation and code are clean.

---

This detailed plan should provide a solid roadmap for developing "Feudal Realm Manager." Remember to consistently apply the verification steps and quality guidelines from `game.md` throughout each phase. Good luck!