# Three.js Game Development: Guidelines for Quality & Maintainability

Welcome, Developer! Your role is crucial in building a high-quality, engaging, and robust Three.js game. To achieve this, we emphasize **structured code, rigorous verification at each stage, and excellent organization** for long-term maintainability and collaboration.

Please adhere to these guidelines throughout the development lifecycle.

## Guiding Principles

1.  **Clarity over Cleverness:** Write code that is easy for others (and your future self) to understand.
2.  **Modularity & Reusability:** Design components and systems that can be understood, tested, and potentially reused independently.
3.  **Verify Early, Verify Often:** Each development stage must be verified before moving to the next.
4.  **Bug Prevention over Bug Fixing:** Proactive measures (linting, typing, good design) reduce bugs.
5.  **Maintainability First:** Future changes, debugging, and feature additions should be straightforward.
6.  **Consistency:** Follow established patterns and conventions within the project.

## Phased Development & Verification

Each feature or major component should be developed in stages. **Do not proceed to the next stage until the current one is fully verified.**

---

## Important

**There should be no room for errors, no bugs or illogical behavior, and poor performance. The code must be tested throughout development.**

Using the console.log command is strongly recommended to validate actions in the browser. This allows for testing using the CLINE browser module.

Each stage of development will need to be completed by a local commit of the code with GIT.

---

### Stage 1: Planning & Design (Per Feature/Module)

- **Objective:** Understand requirements, define scope, and plan the implementation.
- **Tasks:**
    1.  Thoroughly review the feature specification or task description.
    2.  Identify necessary Three.js objects, custom classes, assets, and interactions.
    3.  Sketch out the class structure (names, primary responsibilities, key methods, and properties).
    4.  Define data structures and how game state will be managed for this feature.
    5.  Identify potential challenges and edge cases.
- **Verification:**
    - [ ] **Design Review:** Discuss your proposed class structure and implementation plan with the lead developer or team.
    - [ ] **Clarity of Purpose:** Confirm that each planned class/object has a single, well-defined responsibility.
    - [ ] **Dependencies Understood:** External dependencies (other modules, assets) are identified.

---

### Stage 2: Core Implementation & Unit Testing

- **Objective:** Write the foundational code for the feature/module.
- **Tasks:**
    1.  Create the necessary directories and files based on the agreed-upon project structure.
    2.  Implement the classes and functions as designed.
        - Focus on clear logic and adherence to coding standards (see below).
        - Use placeholder assets if final assets are not yet available.
    3.  Write unit tests for critical logic within your classes/functions.
        - Test pure functions and individual methods in isolation.
        - Ensure edge cases identified in planning are covered.
- **Verification:**
    - [ ] **Code Compiles/Runs:** No syntax errors or immediate runtime crashes.
    - [ ] **Unit Tests Pass:** All unit tests for the new code are green.
    - [ ] **Code Review (Partial):** A preliminary review for structure, naming, and basic logic.
    - [ ] **Functionality (Isolated):** The core logic of the feature works as expected in a controlled or isolated test environment (e.g., a minimal test scene).

---

### Stage 3: Integration & Integration Testing

- **Objective:** Integrate the new feature/module into the main game application.
- **Tasks:**
    1.  Connect your new code with existing game systems (e.g., game loop, event system, entity manager).
    2.  Ensure data flows correctly between your module and others.
    3.  Implement or update asset loading and management for any new assets.
    4.  Write integration tests to verify interactions between your module and other parts of the game.
- **Verification:**
    - [ ] **Successful Integration:** The feature is present in the main game build without breaking existing functionality.
    - [ ] **Integration Tests Pass:** Tests verifying interactions between modules are green.
    - [ ] **Basic Functionality in Game:** The feature works as expected within the context of the game.
    - [ ] **No Regressions:** Existing game features are unaffected (manual check or automated regression tests).

---

### Stage 4: Polish, Optimization & Final Review

- **Objective:** Refine the feature, optimize performance, and ensure all requirements are met.
- **Tasks:**
    1.  Replace placeholder assets with final assets.
    2.  Add visual polish, animations, sound effects as required.
    3.  Profile performance:
        - Check for frame rate drops.
        - Monitor memory usage (dispose of Three.js objects correctly!).
        - Optimize draw calls, shader complexity, and JavaScript performance where necessary.
    4.  Thoroughly test all aspects of the feature, including edge cases and user interactions.
    5.  Ensure all debugging code (`console.log`, temporary variables) is removed or appropriately guarded.
- **Verification:**
    - [ ] **All Requirements Met:** The feature fulfills all specified requirements.
    - [ ] **Performance Targets Met:** The game runs smoothly with the new feature.
    - [ ] **No Memory Leaks:** Verify proper disposal of Three.js geometries, materials, textures, and objects when they are no longer needed.
    - [ ] **Code Cleanliness:** Code is well-commented, adheres to style guides, and is free of dead code.
    - [ ] **Final Code Review:** A thorough review by a peer or lead developer.
    - [ ] **Playtesting:** The feature is enjoyable and intuitive to use from a player's perspective.

---

## Coding Standards

- **Language:** Use modern JavaScript (ES6+) or TypeScript (if the project uses it). TypeScript is highly preferred for its type safety and improved code structure.
- **Naming Conventions:**
    - `PascalCase` for classes and constructor functions.
    - `camelCase` for variables, functions, and methods.
    - `UPPER_SNAKE_CASE` for constants.
    - Descriptive names are paramount.
- **Comments:**
    - Use JSDoc for classes, methods, and complex functions.
    - Comment _why_ something is done, not _what_ is done (the code itself should explain the _what_).
    - Remove commented-out code before committing, unless it's a temporary `// TODO:` with an explanation.
- **Formatting:**
    - Use a consistent code formatter (e.g., Prettier) and linter (e.g., ESLint). Configure your IDE to use the project's settings.
    - Consistent indentation (e.g., 2 or 4 spaces).
- **Modularity:**
    - Keep functions and methods short and focused on a single task.
    - Avoid deeply nested control structures.
- **DRY (Don't Repeat Yourself):** Abstract common logic into reusable functions or classes.
- **Error Handling:**
    - Implement robust error handling.
    - Provide informative error messages.
    - Fail gracefully where possible.
- **Three.js Specifics:**
    - **Object Disposal:** Always dispose of `Geometry`, `Material`, `Texture` when they are no longer needed to prevent memory leaks: `geometry.dispose(); material.dispose(); texture.dispose();`. When removing objects from the scene, ensure their resources are cleaned up.
    - **Scene Graph Management:** Keep the scene graph organized. Use `THREE.Group` to logically group related objects.
    - **Vector/Math Operations:** Utilize `THREE.Vector3`, `THREE.Quaternion`, `THREE.Matrix4`, etc., for transformations and calculations. Avoid manual math where Three.js provides robust solutions. Prefer non-mutating operations where possible or be very clear about mutations.

## Code Organization

- **Directory Structure:**
    - Follow the established project directory structure. A typical structure might be:
        ```
        /src
            /assets
                /models
                /textures
                /sounds
            /components       # Reusable game logic components (e.g., Health, Movement)
            /entities         # Game objects (e.g., Player, Enemy, Collectible)
            /scenes           # Different game levels or views
            /core             # Core engine/game loop, renderer setup, input manager
            /ui               # UI elements and logic
            /utils            # Utility functions
            main.js           # Entry point
        ```
- **Class Design:**
    - **Single Responsibility Principle (SRP):** Each class should have one primary responsibility.
    - **Clear API:** Public methods and properties should form a clear and concise interface. Minimize the public API.
    - **Constructor:** Initialize object state in the constructor. Avoid doing complex logic or asynchronous operations directly in the constructor if possible; use an `init()` method.
    - **State Management:** Be clear about how state is managed. Is it internal to the class, passed in, or managed by a global store/event system?
- **Object Management:**
    - Clearly define the lifecycle of objects (creation, updates, destruction).
    - If using an Entity-Component-System (ECS) architecture, adhere to its principles.

## Version Control (Git)

- **Branching:**
    - Develop features on separate branches (e.g., `feature/my-new-feature`).
    - Create branches from the main development branch (e.g., `develop` or `main`).
- **Commits:**
    - Commit frequently with small, logical changes.
    - Write clear, descriptive commit messages (e.g., "Feat: Implement player jump mechanic", "Fix: Resolve enemy collision bug").
- **Pull Requests (PRs):**
    - Submit PRs for review when a feature is complete and verified according to the stages above.
    - Ensure your branch is up-to-date with the target branch before submitting.
    - Address all review comments before merging.

## Tools

- **IDE:** Use a modern IDE like VS Code with relevant extensions (ESLint, Prettier, Debugger for Chrome/Firefox).
- **Browser Developer Tools:** Become proficient with the console, debugger, performance profiler, and network inspector.
- **Three.js Developer Tools:** (Browser extension) Extremely useful for inspecting the scene graph, materials, and textures at runtime.

## Communication

- **Ask Questions:** If anything is unclear, ask for clarification _before_ spending significant time on an incorrect path.
- **Report Progress:** Provide regular updates on your progress and any blockers.
- **Document Decisions:** If important design decisions are made, document them (e.g., in code comments, task descriptions, or README.md).

```

```
