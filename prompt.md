Based on this document @coder.md you are an expert in game development using Three.js.
Your task is to define all the steps necessary to create a game described in @game.md.
All 3D buildings are created with Three.js and are described in @buildings.md.
All 3D resources are created with Three.js and are described in @resources.md.
All 3D units are created with Three.js and are described in @units.md.
Based on all these prerequisites you must define all the development stages.

## Important

The game should be perfectly playable in a browser and also on a mobile phone.
To make the game more beautiful it is necessary to use the Material 3 library for the UI components as well as for the icons.
Each step must be checked and must never contain any BUG.
All 3D shapes for buildings and resources and units must be created in one step. This will allow for a complete set of 3D elements for the game, and the shapes will be used later during game development.

## V2:

Okay, I have reviewed all the provided documents (`coder.md`, `game.md`, `buildings.md`, `resources.md`, and `units.md`). Based on this information, here is a proposed set of development stages for creating "Feudal Realm Manager." Each stage aligns with the principles outlined in `coder.md`, emphasizing phased development, verification, and the specific requirements of the game.

**Overarching Requirements to be Integrated Throughout Development:**

- **Three.js:** The core technology for all 3D rendering and game world representation.
- **Material 3:** To be used for all UI components and icons, ensuring a modern and beautiful interface.
- **Browser & Mobile Playability:** All features and UI must be designed and tested for responsiveness and performance on both desktop browsers and mobile devices.
- **Bug-Free Stages:** Rigorous testing and verification at the end of each stage to ensure no bugs are carried forward.
- **Git Commits:** Each completed and verified stage should correspond to a Git commit.
- **Console Logging:** Use `console.log` extensively for browser-based testing and validation, as recommended.

---

**Proposed Development Stages:**

**Phase 1: Foundation & Core Assets**

- **Stage 1: Project Setup & Core Three.js Engine**

    - **Objective:** Establish the foundational project structure and the basic Three.js environment.

    - **Key Tasks:**

        1. Set up the project directory structure (e.g., `/src`, `/assets`, `/components`, `/ui`, etc.).
        2. Initialize `package.json`, install Three.js, and any necessary build tools (e.g., Vite, Webpack).
        3. Create the main game entry point (`main.js` or `main.ts`).
        4. Implement a basic Three.js scene: renderer, camera (isometric perspective), basic lighting.
        5. Create a simple game loop (requestAnimationFrame).
        6. Implement basic camera controls (scrolling, zooming) suitable for desktop and touch devices.
        7. Set up ESLint, Prettier, and TypeScript (highly recommended as per `coder.md`).

    - **Verification:**

        - \[ ] Project compiles and runs, displaying a simple 3D scene.
        - \[ ] Basic camera controls work on desktop and mobile.
        - \[ ] Code linting and formatting are enforced.
        - \[ ] Git repository initialized.

- **Stage 2: 3D Asset Creation (Buildings, Resources, Units)**

    - **Objective:** Create all static 3D models for game entities as per `buildings.md`, `resources.md`, and `units.md` using simple Three.js geometric primitives. This fulfills the requirement to create all 3D shapes in one step.

    - **Key Tasks:**

        1. Develop a consistent system/module for creating and managing these 3D shapes (e.g., factory functions or classes for each building, resource, unit type).
        2. Implement all **Building** models (Castle, Woodcutter's Hut, Quarry, etc.) using `THREE.Mesh` with appropriate `THREE.BufferGeometry` (Box, Cylinder, Sphere, Cone, Pyramid) and `THREE.MeshStandardMaterial` (or similar) with specified colors.
        3. Implement all **Resource** models (Wood, Stone, Grain, Planks, Tools, etc.) as distinct 3D objects.
        4. Implement the base **Serf** model and all profession-specific variations (Woodcutter, Miner, Farmer, etc.) including their tools or distinguishing features.
        5. Implement the **Knight** model, including variations for player color and potentially rank indicators.
        6. Organize assets for easy instantiation and management.
        7. Create a simple test scene to display and verify all created assets.

    - **Verification:**

        - \[ ] All building, resource, and unit models are visually accurate according to their markdown descriptions.
        - \[ ] Colors and shapes are correct.
        - \[ ] Models are efficiently created and can be easily instantiated.
        - \[ ] Test scene showcases all assets correctly.

**Phase 2: World & Basic Interactivity**

- **Stage 3: Map Generation & Terrain System**

    - **Objective:** Implement the game world, including different terrain types and map structure.

    - **Key Tasks:**

        1. Define data structures for the game map (e.g., 2D grid).
        2. Implement logic for different terrain types (Grassland, Forest, Mountain, Water, Desert) as described in `game.md`.
        3. Create visual representations for each terrain type using simple Three.js planes/meshes with distinct colors or very simple procedural textures.
        4. Implement basic map generation (either from a seed or loading a pre-defined layout).
        5. Implement world wrapping logic.
        6. Render a basic grid-based map.

    - **Verification:**

        - \[ ] Map generates with different terrain types visually distinct.
        - \[ ] World wrapping functions correctly.
        - \[ ] Map data structure is sound.

- **Stage 4: UI Framework (Material 3) & Initial HUD**

    - **Objective:** Integrate Material 3 and set up the basic game UI structure.

    - **Key Tasks:**

        1. Research and integrate a Material 3 library compatible with web components or your chosen frontend approach (e.g., M3 Web Components, or adapt a framework like Vue/React with Material 3 styling).

        2. Design and implement the main game view layout, considering mobile responsiveness.

        3. Create initial UI panels:

            - A placeholder for the construction menu.
            - A basic resource display area (e.g., Wood, Stone, Food counts).
            - Placeholder for minimap.

        4. Ensure UI elements are interactive and adapt to screen size.

    - **Verification:**

        - \[ ] Material 3 components can be used and are styled correctly.
        - \[ ] Basic HUD layout is functional and responsive.
        - \[ ] Placeholder UI elements are present.

**Phase 3: Core Gameplay Mechanics - Economy**

- **Stage 5: Resource Management System**

    - **Objective:** Implement the logic for gathering, storing, and tracking all resources.

    - **Key Tasks:**

        1. Define data structures for all raw materials and processed goods.
        2. Implement logic for resource stockpiles (global and per-building if applicable).
        3. Connect resource display in UI to the backend data.
        4. Implement logic for resource consumption (e.g., tools being consumed, food for miners).

    - **Verification:**

        - \[ ] Resources can be added to and removed from stockpiles.
        - \[ ] UI correctly reflects resource amounts.
        - \[ ] Resource consumption logic works as intended.

- **Stage 6: Building System - Placement & Basic Functionality**

    - **Objective:** Allow players to construct buildings and implement their basic economic functions.

    - **Key Tasks:**

        1. Implement the construction menu UI using Material 3 components, allowing selection of buildings.

        2. Implement building placement logic:

            - Visual feedback for valid/invalid placement.
            - Deducting construction costs (Wood, Stone) from global stockpiles.
            - Instantiating building 3D models on the map.

        3. Implement the "Builder" serf concept (even if not fully animated yet) for the construction process (timer-based or resource-delivery based).

        4. Implement basic functionality for initial resource-gathering buildings (e.g., Woodcutter's Hut producing Wood, Quarry producing Stone).

        5. Implement Warehouse/Storehouse functionality for storing surplus goods.

    - **Verification:**

        - \[ ] Players can select and place buildings from the UI.
        - \[ ] Construction costs are deducted.
        - \[ ] Buildings appear on the map.
        - \[ ] Basic resource-gathering buildings start producing their respective resources.
        - \[ ] Warehouses can store goods.

- **Stage 7: Serf Management & Professions**

    - **Objective:** Implement serf spawning, job assignment, and basic behaviors.

    - **Key Tasks:**

        1. Implement serf spawning from the Castle.
        2. Develop a job management system: buildings create job slots, serfs fill them.
        3. Implement logic for serfs to take on professions (Woodcutter, Stonemason, Farmer, etc.) and visually represent this (using the 3D unit models from Stage 2).
        4. Implement basic serf movement (e.g., pathfinding to their workplace).
        5. Implement tool requirements for professions (e.g., Woodcutter needs an Axe). Serfs cannot work without tools.
        6. Implement food requirements for Miners.

    - **Verification:**

        - \[ ] Serfs spawn and can be assigned to jobs in buildings.
        - \[ ] Serfs display correct professional appearance.
        - \[ ] Serfs move to their workplaces.
        - \[ ] Tool and food requirements correctly gate serf work.

- **Stage 8: Logistics - Transportation Network (Flags & Roads)**

    - **Objective:** Implement the system for moving goods between buildings.

    - **Key Tasks:**

        1. Implement UI for placing Flags.
        2. Implement logic for automatically creating Roads between connected Flags.
        3. Implement the "Transporter" serf profession.
        4. Develop logic for Transporters to pick up goods from producing buildings/flags and deliver them to consuming buildings/flags or Warehouses.
        5. Implement pathfinding for Transporters along roads.
        6. Implement the "one transporter per road segment" rule.

    - **Verification:**

        - \[ ] Players can place flags and roads form correctly.
        - \[ ] Transporter serfs move goods between designated points along roads.
        - \[ ] Goods are correctly picked up and dropped off.

- **Stage 9: Production Chains & Economic Balancing (Initial)**

    - **Objective:** Implement multi-step production chains and begin balancing the economy.

    - **Key Tasks:**

        1. Implement functionality for processing buildings (Sawmill, Windmill, Bakery, Smelter, Toolmaker, Blacksmith, etc.).
        2. Connect input/output logic for these buildings (e.g., Sawmill takes Wood, produces Planks).
        3. Implement fuel requirements (e.g., Coal for Smelter, Bakery).
        4. Implement the full production chain for key items like Bread, Tools, and Weapons.
        5. Begin initial balancing of production rates, consumption rates, and costs.

    - **Verification:**

        - \[ ] Production chains function correctly (e.g., Grain -> Flour -> Bread).
        - \[ ] Processing buildings consume inputs and produce outputs as expected.
        - \[ ] Fuel mechanics work.
        - \[ ] Basic economic flow is established.

**Phase 4: Advanced Gameplay & Military**

- **Stage 10: Territory Expansion System**

    - **Objective:** Implement the mechanics for claiming land.

    - **Key Tasks:**

        1. Implement logic for military buildings (Guard Hut, Watchtower, Barracks) to project an area of influence.
        2. Visually represent player territory on the map.
        3. Handle overlapping influence and contested territory (if applicable for initial implementation).
        4. Link resource accessibility (e.g., new mines, forests) to territory control.

    - **Verification:**

        - \[ ] Placing military buildings expands player territory.
        - \[ ] Territory is visually clear.
        - \[ ] Expansion unlocks access to new resource areas.

- **Stage 11: Military System - Knight Recruitment & Combat**

    - **Objective:** Implement military units and combat mechanics.

    - **Key Tasks:**

        1. Implement Knight recruitment in military buildings (requires Swords & Shields).
        2. Implement Knight stationing in military buildings.
        3. Implement Knight combat strength, factoring in ranks (experience from combat) and Gold Bar bonus.
        4. Develop UI for directing Knights to attack adjacent enemy military buildings.
        5. Implement Knight movement to target.
        6. Implement combat resolution (one-on-one duels, higher strength wins).
        7. Implement capturing enemy military buildings.
        8. Implement logic for capturing/destroying adjacent non-military enemy buildings.
        9. Ensure civilian serfs are not directly attackable and their behavior when workplaces are lost.

    - **Verification:**

        - \[ ] Knights can be recruited and stationed.
        - \[ ] Knights can be ordered to attack.
        - \[ ] Combat resolves based on strength, ranks, and gold.
        - \[ ] Buildings can be captured.

**Phase 5: UI, Polish & Finalization**

- **Stage 12: Advanced UI & Game Management Panels**

    - **Objective:** Implement all remaining UI panels and game management features using Material 3.

    - **Key Tasks:**

        1. Selected Building Panel: Detailed info, production settings.
        2. Selected Unit Panel (Knights): Stats, rank.
        3. Global Statistics Panel: Resource stockpiles, serf breakdown, military overview.
        4. Goods Distribution/Priorities Panel: Player control over resource flow.
        5. Military Management Panel: Overview of military buildings, Knight deployment.
        6. Minimap implementation.
        7. Alerts/Notifications system.

    - **Verification:**

        - \[ ] All UI panels are functional, responsive, and use Material 3 components.
        - \[ ] Players can effectively manage their economy and military through the UI.
        - \[ ] Minimap and alerts provide useful information.

- **Stage 13: Game Balancing, AI (Opponent Logic - Basic)**

    - **Objective:** Fine-tune game balance and implement basic opponent AI.

    - **Key Tasks:**

        1. Thoroughly playtest and balance all economic aspects (costs, production rates, consumption).

        2. Balance military unit strength, recruitment times, and costs.

        3. Implement basic AI for opponent lords:

            - Resource gathering and building.
            - Territory expansion.
            - Military production and basic attack/defense logic.

        4. Implement winning/losing conditions (Castle destruction).

    - **Verification:**

        - \[ ] Game is challenging but fair.
        - \[ ] No obvious exploits or dominant strategies.
        - \[ ] Basic AI provides a reasonable opponent.
        - \[ ] Win/loss conditions trigger correctly.

- **Stage 14: Polish, Optimization & Final Review**

    - **Objective:** Refine the game, optimize performance, and conduct final reviews.

    - **Key Tasks:**

        1. Add visual polish (simple animations for units/buildings if feasible, particle effects for production/combat if simple).

        2. Performance profiling and optimization:

            - Frame rate optimization (draw calls, shader complexity, JavaScript).
            - Memory usage optimization (Three.js object disposal).

        3. Ensure all debugging code is removed or guarded.

        4. Final code review for cleanliness, adherence to standards, and maintainability.

        5. Playtesting for overall experience, intuitiveness, and fun.

    - **Verification:**

        - \[ ] Game runs smoothly on target desktop browsers and mobile devices.
        - \[ ] No memory leaks.
        - \[ ] Code is clean and well-documented.
        - \[ ] Game is enjoyable and requirements are met.

- **Stage 15: Cross-Platform Testing & Bug Fixing**

    - **Objective:** Ensure the game is robust and playable across different browsers and mobile devices.

    - **Key Tasks:**

        1. Test extensively on major desktop browsers (Chrome, Firefox, Safari, Edge).
        2. Test extensively on representative iOS and Android devices.
        3. Identify and fix platform-specific bugs or rendering issues.
        4. Verify UI responsiveness and usability on all target platforms.

    - **Verification:**

        - \[ ] Game functions consistently and correctly across all supported platforms.
        - \[ ] Performance is acceptable on all target devices.
        - \[ ] All major bugs are resolved.

- **Stage 16: Build & Deployment Preparation**

    - **Objective:** Prepare the game for deployment.

    - **Key Tasks:**

        1. Implement a production build process (minification, tree-shaking).
        2. Final check of all assets and configurations.
        3. Prepare any necessary documentation for deployment.

    - **Verification:**

        - \[ ] Production build is created successfully.
        - \[ ] Game is ready for deployment to a web server.

---

This detailed plan should provide a solid roadmap for developing "Feudal Realm Manager." Each stage builds upon the previous ones, ensuring a structured and verifiable development process.


