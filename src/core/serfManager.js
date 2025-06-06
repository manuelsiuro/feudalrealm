// src/core/serfManager.js
import * as THREE from 'three';
import { SERF_PROFESSIONS } from '../config/serfProfessions.js';
import * as Units from '../entities/units.js';
import ConstructBuildingTask from './tasks/ConstructBuildingTask.js';
import GatherResourceTask from './tasks/GatherResourceTask.js';
import TransportResourceTask from './tasks/TransportResourceTask.js';
import PlantSaplingTask from './tasks/PlantSaplingTask.js';
import ProcessItemsTask from './tasks/ProcessItemsTask.js';
import { TASK_STATUS } from './tasks/Task.js';
import { SERF_ACTION_STATES } from '../config/serfActionStates.js';
import resourceManager from './resourceManager.js';
import { FORESTER_PLANTING_RADIUS } from '../config/unitConstants.js';
import ReturnToJobBuildingTask from './tasks/ReturnToJobBuildingTask.js';
import { BUILDING_DATA } from '../config/buildingData.js';

class SerfManager {
    constructor(
        scene,
        gameMap,
        constructionManager,
        gameElementsGroup,
        game,
        resourceFlowManager
    ) {
        this.scene = scene;
        this.gameMap = gameMap;
        this.constructionManager = constructionManager;
        this.gameElementsGroup = gameElementsGroup;
        this.game = game;
        this.resourceFlowManager = resourceFlowManager;
        this.serfs = [];
        this.maxSerfs = 50;
        this.serfIdCounter = 0;
        this.tasks = [];

        this.serfVisualsGroup = new THREE.Group();
        this.serfVisualsGroup.name = 'SerfVisuals';
        this.gameElementsGroup.add(this.serfVisualsGroup);

        this.onChangeCallback = null;
    }

    addConstructionTask(buildingInstance, specificBuilderId = null) {
        // Added specificBuilderId
        // Ensure the building is not null and has an ID
        if (!buildingInstance || !buildingInstance.id) {
            console.error(
                'SerfManager: Attempted to add construction task for invalid building instance.',
                buildingInstance
            );
            return;
        }
        // Pass this.scene to the ConstructBuildingTask constructor
        const newTask = new ConstructBuildingTask(buildingInstance, this.scene);

        if (specificBuilderId) {
            const builder = this.getSerfById(specificBuilderId);
            if (
                builder &&
                builder.serfType === SERF_PROFESSIONS.BUILDER &&
                builder.currentState.name === SERF_ACTION_STATES.IDLE &&
                !builder.currentTask
            ) {
                console.log(
                    `SerfManager: Assigning new ConstructBuildingTask for ${buildingInstance.name} (ID: ${buildingInstance.id}) directly to Builder ${specificBuilderId}.`
                );
                builder.assignTask(newTask);
                // Task is immediately assigned, so don't add to the general pool if successfully assigned.
                // However, ConstructionManager might still want to track it via its activeConstructions list.
                // For simplicity here, we assume direct assignment means it bypasses the general `this.tasks` queue for assignment phase.
                // But it should still be known to the system. Let's add it to tasks for tracking, but it will be quickly ACTIVE.
                this.tasks.push(newTask);
            } else {
                console.warn(
                    `SerfManager: Could not assign construction task directly to builder ${specificBuilderId}. Builder not found, not a builder, not idle, or already has a task. Adding to general queue.`
                );
                this.tasks.push(newTask);
            }
        } else {
            this.tasks.push(newTask);
            console.log(
                `SerfManager: Added new ConstructBuildingTask for ${buildingInstance.name} (ID: ${buildingInstance.id}) to general task queue. Total tasks: ${this.tasks.length}`
            );
        }

        // Optional: Immediately try to assign tasks, or let the main assignJobsAndTasks loop handle it.
        // this.assignJobsAndTasks();
    }

    spawnInitialSerfs() {
        // Determine the center of the map
        const centerX = Math.floor(this.gameMap.width / 2);
        const centerZ = Math.floor(this.gameMap.height / 2); // Using Z for the Y-axis in grid

        let spawnX = centerX;
        let spawnZ = centerZ;

        // Spawn 1 Builder serf
        let builderSpawnX = spawnX - 1;
        let builderSpawnZ = spawnZ - 1;
        // Ensure spawn position is within map bounds
        builderSpawnX = Math.max(
            0,
            Math.min(builderSpawnX, this.gameMap.width - 1)
        );
        builderSpawnZ = Math.max(
            0,
            Math.min(builderSpawnZ, this.gameMap.height - 1)
        );

        console.log(
            `Spawning initial Builder serf at (${builderSpawnX}, ${builderSpawnZ})`
        );
        const builderSerf = this.createSerf(
            SERF_PROFESSIONS.BUILDER,
            builderSpawnX,
            builderSpawnZ
        );

        if (builderSerf) {
            console.log(
                `Initial Builder serf ${builderSerf.id} spawned at (${builderSpawnX}, ${builderSpawnZ}).`
            );
            // Find the BUILDERS_HUT
            const buildersHut = this.constructionManager.placedBuildings.find(
                (b) => b.type === BUILDING_DATA.BUILDERS_HUT.key
            );

            if (buildersHut) {
                console.log(
                    `Found BUILDERS_HUT (ID: ${buildersHut.id}) for initial Builder assignment.`
                );
                // Assign the builder to the hut
                builderSerf.setProfession(
                    SERF_PROFESSIONS.BUILDER,
                    buildersHut
                );
                const workerAdded = buildersHut.addWorker(builderSerf.id);
                if (workerAdded) {
                    console.log(
                        `Builder serf ${builderSerf.id} successfully added as worker to BUILDERS_HUT ${buildersHut.id}.`
                    );
                } else {
                    console.warn(
                        `Failed to add Builder serf ${builderSerf.id} as worker to BUILDERS_HUT ${buildersHut.id}. Hut might be full or serf already added.`
                    );
                }
                // Ensure the serf is idle to pick up tasks
                builderSerf.changeState(SERF_ACTION_STATES.IDLE);
            } else {
                console.warn(
                    'SerfManager: BUILDERS_HUT not found after spawning initial builder. Builder will be idle without a specific hut.'
                );
            }
        } else {
            console.error('SerfManager: Failed to spawn initial Builder serf.');
        }

        // Spawn 1 Woodcutter serf
        let woodcutterSpawnX = spawnX + 1;
        let woodcutterSpawnZ = spawnZ + 1;

        // Ensure spawn position is within map bounds
        woodcutterSpawnX = Math.max(
            0,
            Math.min(woodcutterSpawnX, this.gameMap.width - 1)
        );
        woodcutterSpawnZ = Math.max(
            0,
            Math.min(woodcutterSpawnZ, this.gameMap.height - 1)
        );
        console.log(
            `Spawning initial Woodcutter serf at (${woodcutterSpawnX}, ${woodcutterSpawnZ})`
        );
        const woodcutterSerf = this.createSerf(
            SERF_PROFESSIONS.WOODCUTTER,
            woodcutterSpawnX,
            woodcutterSpawnZ
        );

        if (woodcutterSerf) {
            console.log(
                `Initial Woodcutter serf ${woodcutterSerf.id} spawned at (${woodcutterSpawnX}, ${woodcutterSpawnZ}).`
            );
            woodcutterSerf.setProfession;
        }
    }

    createSerf(type, gridX, gridY) {
        if (this.serfs.length >= this.maxSerfs) {
            console.log('Max serf limit reached.');
            return null;
        }

        this.serfIdCounter++;
        const serfId = `serf-${this.serfIdCounter}`;

        // Pass the game instance (this.game) and resourceFlowManager to the Serf constructor
        const newSerf = new Units.Serf(
            serfId,
            gridX,
            gridY,
            type,
            this.scene,
            this.gameMap,
            this.serfVisualsGroup,
            this.game,
            this.resourceFlowManager
        );

        if (newSerf && newSerf.model) {
            this.serfs.push(newSerf);
            console.log(
                `${type} serf ${serfId} created at grid (${gridX}, ${gridY}). Model: ${newSerf.model.name}`
            );

            const dropOffGridX = Math.floor(this.gameMap.width / 2);
            const dropOffGridZ = Math.floor(this.gameMap.height / 2);
            newSerf.setDropOffPoint({ x: dropOffGridX, y: dropOffGridZ });

            newSerf.job = null;
            newSerf.hasTool = false;

            this._notifyUI(); // Notify UI about the new serf
            return newSerf;
        } else {
            console.error(
                `Failed to create serf or serf model for type: ${type} at grid (${gridX},${gridY}).`
            );
            this.serfIdCounter--;
            return null;
        }
    }

    createGatherResourceTasks() {
        if (!this.gameMap || !this.gameMap.grid) {
            console.error(
                'SerfManager: gameMap or gameMap.grid is not available to create gather tasks.'
            );
            return;
        }

        for (let r = 0; r < this.gameMap.height; r++) {
            for (let c = 0; c < this.gameMap.width; c++) {
                const tile = this.gameMap.grid[r][c];
                if (tile && tile.resource && tile.resource.amount > 0) {
                    // Check if a task for this specific resource node already exists and is active/pending
                    const existingTask = this.tasks.find(
                        (task) =>
                            task.type === 'GATHER_RESOURCE' &&
                            task.targetResourceNode &&
                            task.targetResourceNode.x === tile.x &&
                            task.targetResourceNode.y === tile.y &&
                            task.resourceType === tile.resource.type &&
                            (task.status === TASK_STATUS.PENDING ||
                                task.status === TASK_STATUS.ACTIVE)
                    );

                    if (!existingTask) {
                        // Create a new GatherResourceTask
                        // The 'tile' object itself contains x, y, and the resource object.
                        if (
                            !tile.resource ||
                            typeof tile.resource.type === 'undefined'
                        ) {
                            console.warn(
                                `SerfManager: Attempted to create GatherResourceTask for tile at (${tile.x}, ${tile.y}) but tile.resource.type is undefined. Resource object:`,
                                tile.resource
                            );
                            continue; // Skip creating this task
                        }
                        const newTask = new GatherResourceTask(
                            tile,
                            tile.resource.type
                        );
                        this.tasks.push(newTask);
                        // console.log(`SerfManager: Created GatherResourceTask for ${tile.resource.type} at (${tile.x}, ${tile.y}). Total tasks: ${this.tasks.length}`);
                    }
                }
            }
        }
    }

    update(deltaTime) {
        this.serfs.forEach((serf) => {
            if (serf.update) {
                serf.update(deltaTime);
            }

            // After serf update, check if a builder has completed a construction task
            // and needs to return to its hut.
            if (
                serf.serfType === SERF_PROFESSIONS.BUILDER &&
                serf.currentState.name === SERF_ACTION_STATES.IDLE &&
                !serf.currentTask && // No new task picked up yet
                serf.jobBuilding
            ) {
                // Has a job building (Builder's Hut)

                // Check if the serf is NOT at its job building's location.
                // The jobBuilding itself has gridX and gridZ.
                if (
                    serf.x !== serf.jobBuilding.gridX ||
                    serf.y !== serf.jobBuilding.gridZ
                ) {
                    // Use gridX/gridZ from building
                    // Check if the serf already has a ReturnToJobBuildingTask or is already moving towards it.
                    // This check might be redundant if serf.returnToJobBuilding() handles it,
                    // but good for preventing duplicate task creation from SerfManager's side.
                    const alreadyReturning =
                        serf.currentTask instanceof ReturnToJobBuildingTask &&
                        serf.currentTask.jobBuilding === serf.jobBuilding;

                    if (!alreadyReturning) {
                        console.log(
                            `SerfManager: Builder ${serf.id} is IDLE, has a hut (${serf.jobBuilding.name} at ${serf.jobBuilding.gridX},${serf.jobBuilding.gridZ}), and is not at it (${serf.x},${serf.y}). Commanding return.`
                        );
                        serf.returnToJobBuilding();
                        // serf.returnToJobBuilding() will create and assign the ReturnToJobBuildingTask.
                        // The task will then be managed by the serf's update cycle.
                        // No need to add this specific task to this.tasks here, as it's directly assigned.
                    }
                }
            }
        });
        this.assignJobsAndTasks();
        this.cleanUpCompletedTasks();
    }

    cleanUpCompletedTasks() {
        const activeTaskIds = new Set();
        this.serfs.forEach((serf) => {
            if (serf.currentTask) {
                activeTaskIds.add(serf.currentTask.id);
            }
        });

        this.tasks = this.tasks.filter((task) => {
            const keep =
                task.status === TASK_STATUS.PENDING ||
                task.status === TASK_STATUS.ACTIVE ||
                (task.status === TASK_STATUS.ASSIGNED &&
                    activeTaskIds.has(task.id)); // Keep if assigned and serf still holds it

            if (
                !keep &&
                (task.status === TASK_STATUS.COMPLETED ||
                    task.status === TASK_STATUS.FAILED ||
                    task.status === TASK_STATUS.CANCELLED)
            ) {
                // console.log(`SerfManager: Removing task ${task.id} (${task.type}) with status ${task.status}`);
            }
            return keep;
        });
    }

    assignJobsAndTasks() {
        if (!this.constructionManager) return;

        // Create new gathering tasks based on map resources before assigning any tasks
        this.createGatherResourceTasks();

        // Create PlantSaplingTasks for available Foresters
        this.createPlantSaplingTasks();

        // Create ProcessItemsTasks for buildings that can process
        this.createProcessItemsTasks();

        const availableSerfs = this.serfs.filter(
            (serf) =>
                serf.currentState.name === SERF_ACTION_STATES.IDLE &&
                !serf.currentTask
        );

        if (availableSerfs.length > 0) {
            // Sort tasks by priority (higher first) - Optional, but good practice
            this.tasks.sort((a, b) => b.priority - a.priority);

            for (const task of this.tasks) {
                if (task.status === TASK_STATUS.PENDING) {
                    for (let i = availableSerfs.length - 1; i >= 0; i--) {
                        // Iterate backwards for safe removal
                        const serf = availableSerfs[i];
                        if (task.canBeExecutedBy(serf)) {
                            console.log(
                                `SerfManager: Assigning task ${task.id} (${task.type}) to serf ${serf.id}`
                            );
                            serf.assignTask(task);
                            availableSerfs.splice(i, 1);
                            break;
                        }
                    }
                }
            }
        }

        this.tasks = this.tasks.filter(
            (task) =>
                task.status !== TASK_STATUS.COMPLETED &&
                task.status !== TASK_STATUS.FAILED &&
                task.status !== TASK_STATUS.CANCELLED
        );

        // Check for serfs with resources needing to transport them to a general drop-off
        for (const serf of this.serfs) {
            const inventorySize = Object.values(serf.inventory).reduce(
                (sum, count) => sum + count,
                0
            );

            // Ensure serf is IDLE, has no active task, and has items
            if (
                serf.currentState.name === SERF_ACTION_STATES.IDLE &&
                !serf.currentTask &&
                inventorySize > 0
            ) {
                // Find a primary drop-off point (e.g., Castle, Town Hall, or fallback to Transporter Hut)
                let dropOffBuildingInstance =
                    this.constructionManager.placedBuildings.find(
                        (b) =>
                            (b.type === 'CASTLE' || b.type === 'TOWN_HALL') &&
                            b.isConstructed
                    );

                if (!dropOffBuildingInstance) {
                    // Fallback if no Castle/TownHall
                    dropOffBuildingInstance =
                        this.constructionManager.placedBuildings.find(
                            (b) =>
                                b.type === 'TRANSPORTER_HUT' && b.isConstructed
                        );
                }

                if (dropOffBuildingInstance) {
                    console.log(
                        `SerfManager: Serf ${serf.id} has ${inventorySize} items. Creating TransportResourceTask to ${dropOffBuildingInstance.name || dropOffBuildingInstance.type}.`
                    );

                    // TransportResourceTask constructor: (serf, destinationBuilding, itemsToTransport = null, specificResourceType = null)
                    // Passing null for itemsToTransport and specificResourceType means transport all current inventory.
                    const transportTask = new TransportResourceTask(
                        serf,
                        dropOffBuildingInstance
                    );

                    this.tasks.push(transportTask); // Add to general task pool
                    serf.assignTask(transportTask); // Assign immediately, serf state will change.
                } else {
                    console.warn(
                        `SerfManager: Serf ${serf.id} has ${inventorySize} items but no drop-off building (Castle, Town Hall, Transporter Hut) found.`
                    );
                }
            }
        }

        // --- Existing Job/Task Assignment Logic (for non-task-system items) ---
        // Filter serfs that are STILL idle and have NO currentTask after the new task assignments
        const stillUnassignedIdleSerfs = this.serfs.filter(
            (serf) =>
                serf.currentState.name === SERF_ACTION_STATES.IDLE &&
                !serf.currentTask &&
                (!serf.job || (serf.job && serf.task === 'idle')) // Legacy job check
        );

        /*const forestersAtHutReadyToPlant = stillUnassignedIdleSerfs.filter(
            (
                serf // Modified filter
            ) =>
                serf.serfType === SERF_PROFESSIONS.FORESTER &&
                serf.job &&
                serf.job.info &&
                serf.job.info.jobProfession === SERF_PROFESSIONS.FORESTER &&
                serf.currentState.name === SERF_ACTION_STATES.IDLE &&
                (!serf.task || serf.task === 'idle') // Old task string check for this specific logic
        );*/

        let candidatesForProfessionJobs = stillUnassignedIdleSerfs.filter(
            (serf) => {
                // Modified filter
                return (
                    serf.serfType !== SERF_PROFESSIONS.BUILDER && // Builders now handled by Task system
                    serf.currentState.name === SERF_ACTION_STATES.IDLE &&
                    !serf.job &&
                    (!serf.task || serf.task === 'idle')
                );
            }
        );

        if (candidatesForProfessionJobs.length > 0) {
            this.tryAssignSerfsToProfessionJobs(candidatesForProfessionJobs);
        }

        const stillIdleTransporters = stillUnassignedIdleSerfs.filter(
            (
                serf // Modified filter
            ) =>
                serf.serfType === SERF_PROFESSIONS.TRANSPORTER &&
                serf.currentState.name === SERF_ACTION_STATES.IDLE &&
                (!serf.task || serf.task === 'idle') &&
                Object.keys(serf.inventory).reduce(
                    (sum, key) => sum + serf.inventory[key],
                    0
                ) === 0
        );
        if (stillIdleTransporters.length > 0) {
            this.tryAssignTransportTasksToIdleTransporters(
                stillIdleTransporters
            );
        }
    }

    createProcessItemsTasks() {
        if (
            !this.constructionManager ||
            !this.constructionManager.placedBuildings
        ) {
            // console.warn("SerfManager: ConstructionManager not available for creating ProcessItemsTasks.");
            return;
        }

        for (const building of this.constructionManager.placedBuildings) {
            if (
                !building.isConstructed ||
                !building.buildingTypeData ||
                !building.buildingTypeData.consumesMaterials ||
                building.buildingTypeData.consumesMaterials.length === 0 ||
                !building.buildingTypeData.producesMaterials ||
                building.buildingTypeData.producesMaterials.length === 0 ||
                !building.buildingTypeData.jobProfession
            ) {
                continue; // Skip if not a processing building or no profession defined
            }

            // Check if a ProcessItemsTask for this building already exists and is pending or active
            const existingTaskForBuilding = this.tasks.find(
                (task) =>
                    task instanceof ProcessItemsTask &&
                    task.building === building &&
                    (task.status === TASK_STATUS.PENDING ||
                        task.status === TASK_STATUS.ACTIVE)
            );

            if (existingTaskForBuilding) {
                // console.log(`SerfManager: Building ${building.name} (${building.id}) already has a ProcessItemsTask.`);
                continue;
            }

            // Check if the building itself can process (has inputs, has space for outputs)
            // These checks are also in ProcessItemsTask.canBeExecutedBy, but good to check early.
            if (
                !building.hasSufficientInputMaterials() ||
                !building.hasSpaceForOutput()
            ) {
                // console.log(`SerfManager: Building ${building.name} (${building.id}) cannot process (input/output issue).`);
                continue;
            }

            // Check if there's an assigned worker available (IDLE, correct profession, at the building or can move)
            // This is a simplified check. The task's canBeExecutedBy will be more thorough.
            const hasPotentialWorker = this.serfs.some(
                (serf) =>
                    serf.jobBuilding === building &&
                    serf.serfType === building.buildingTypeData.jobProfession &&
                    (serf.currentState.name === SERF_ACTION_STATES.IDLE ||
                        serf.currentState.name ===
                            SERF_ACTION_STATES.WORKING_AT_BUILDING) && // Serf might already be at building and idle
                    !serf.currentTask
            );

            if (!hasPotentialWorker) {
                // Check if there is any serf with the correct profession that is idle and could be assigned to this building
                const canAssignWorkerToBuilding = this.serfs.some(
                    (serf) =>
                        serf.serfType ===
                            building.buildingTypeData.jobProfession &&
                        serf.currentState.name === SERF_ACTION_STATES.IDLE &&
                        !serf.jobBuilding && // Not currently assigned to any job building
                        !serf.currentTask
                );
                if (
                    !canAssignWorkerToBuilding &&
                    building.workers.length === 0
                ) {
                    // console.log(`SerfManager: Building ${building.name} (${building.id}) has no potential or assignable worker for processing.`);
                    continue;
                }
            }

            // console.log(`SerfManager: Creating ProcessItemsTask for building ${building.name} (${building.id}).`);
            const newTask = new ProcessItemsTask(building);
            this.tasks.push(newTask);
        }
    }

    createPlantSaplingTasks() {
        if (
            !this.game ||
            !this.game.gameMap ||
            !this.game.natureManager ||
            !this.constructionManager
        ) {
            // console.error("SerfManager: Game instance, GameMap, NatureManager, or ConstructionManager not properly initialized for creating PlantSaplingTasks.");
            return;
        }

        const idleForesters = this.serfs.filter(
            (serf) =>
                serf.serfType === SERF_PROFESSIONS.FORESTER &&
                serf.currentState.name === SERF_ACTION_STATES.IDLE &&
                !serf.currentTask && // Not already having a task
                serf.jobBuilding // Must be assigned to a Forester's Hut
        );

        for (const forester of idleForesters) {
            const forestersHut = forester.jobBuilding; // This is the Building instance
            if (
                !forestersHut ||
                forestersHut.buildingTypeData.key !== 'FORESTERS_HUT' ||
                !forestersHut.isConstructed
            ) {
                continue; // Skip if not a valid, constructed Forester's Hut
            }

            // Check if a PlantSaplingTask originating from this hut is already pending or active for this forester
            const existingTaskForForester = this.tasks.find(
                (task) =>
                    task instanceof PlantSaplingTask &&
                    task.forestersHut === forestersHut &&
                    (task.status === TASK_STATUS.PENDING ||
                        (task.status === TASK_STATUS.ACTIVE &&
                            task.assignedSerf === forester))
            );
            if (existingTaskForForester) {
                // console.log(`SerfManager: Forester ${forester.id} already has/is considered for a PlantSaplingTask from hut ${forestersHut.id}.`);
                continue;
            }

            // Check planting limit for the forester
            if (forester.plantedSaplingsCount >= forester.maxPlantedSaplings) {
                // Simplified this line
                // console.log(`SerfManager: Forester ${forester.id} has reached max saplings (${forester.plantedSaplingsCount}/${forester.maxPlantedSaplings}).`);
                continue;
            }

            const hutGridX = forestersHut.gridX;
            const hutGridZ = forestersHut.gridZ;
            let bestTargetTile = null;

            // Search for a suitable tile
            for (
                let r = -FORESTER_PLANTING_RADIUS;
                r <= FORESTER_PLANTING_RADIUS;
                r++
            ) {
                for (
                    let c = -FORESTER_PLANTING_RADIUS;
                    c <= FORESTER_PLANTING_RADIUS;
                    c++
                ) {
                    if (r === 0 && c === 0) continue;

                    const currentTileX = hutGridX + c;
                    const currentTileZ = hutGridZ + r;

                    if (
                        this.game.gameMap.isValidTile(
                            currentTileX,
                            currentTileZ
                        )
                    ) {
                        const tile =
                            this.game.gameMap.grid[currentTileZ][currentTileX];

                        // Check if another PlantSaplingTask is already targeting this tile
                        const isTileTargetedByOtherPlantTask = this.tasks.some(
                            (task) =>
                                task instanceof PlantSaplingTask &&
                                task.targetTile &&
                                task.targetTile.x === currentTileX &&
                                task.targetTile.y === currentTileZ &&
                                (task.status === TASK_STATUS.PENDING ||
                                    task.status === TASK_STATUS.ACTIVE)
                        );

                        if (
                            tile.terrainType === 'Grassland' &&
                            !tile.resource &&
                            !tile.building &&
                            !isTileTargetedByOtherPlantTask
                        ) {
                            bestTargetTile = {
                                x: currentTileX,
                                y: currentTileZ,
                            };
                            break;
                        }
                    }
                }
                if (bestTargetTile) break;
            }

            if (bestTargetTile) {
                // console.log(`SerfManager: Creating PlantSaplingTask for Forester ${forester.id} from hut ${forestersHut.id} to tile (${bestTargetTile.x}, ${bestTargetTile.y}).`);
                const newTask = new PlantSaplingTask(
                    bestTargetTile,
                    forestersHut
                );
                this.tasks.push(newTask);
            } else {
                // console.log(`SerfManager: Forester ${forester.id} could not find a suitable spot to plant a sapling near hut ${forestersHut.id}.`);
            }
        }
    }

    isTileOccupiedForPlanting(tileX, tileY, serfIdToExclude = null) {
        // Check if any other serf (excluding serfIdToExclude) is ALREADY assigned a PlantSaplingTask targeting this tile
        for (const task of this.tasks) {
            if (
                task instanceof PlantSaplingTask &&
                task.targetTile &&
                task.targetTile.x === tileX &&
                task.targetTile.y === tileY
            ) {
                if (
                    task.status === TASK_STATUS.ACTIVE ||
                    task.status === TASK_STATUS.PENDING
                ) {
                    if (
                        serfIdToExclude &&
                        task.assignedSerf &&
                        task.assignedSerf.id === serfIdToExclude
                    ) {
                        // This is the serf we are trying to assign the task to, so don't count its own potential task.
                        continue;
                    }
                    // console.log(`Tile (${tileX},${tileY}) targeted by existing PlantSaplingTask ${task.id}`);
                    return true; // Tile is targeted by another plant task
                }
            }
        }

        // Check for existing resources or buildings on the tile
        if (
            this.gameMap &&
            this.gameMap.grid[tileY] &&
            this.gameMap.grid[tileY][tileX]
        ) {
            const tile = this.gameMap.grid[tileY][tileX];
            if (tile.resource || tile.building) {
                // Check for any resource or building
                // console.log(`Tile (${tileX},${tileY}) occupied by resource: ${tile.resource ? tile.resource.type : 'N/A'} or building: ${tile.building ? tile.building.type : 'N/A'}`);
                return true;
            }
        } else {
            console.warn(
                `isTileOccupiedForPlanting: Tile (${tileX}, ${tileY}) is out of bounds or gameMap not ready.`
            );
            return true;
        }
        return false;
    }

    tryAssignSerfsToProfessionJobs(idleSerfs) {
        for (const building of this.constructionManager.placedBuildings) {
            if (
                !building.isConstructed ||
                !building.info.jobSlots ||
                building.workers.length >= building.info.jobSlots
            ) {
                continue;
            }

            const requiredProfession = building.info.jobProfession;
            if (!requiredProfession) continue;

            const requiredTool = building.info.requiredTool;
            let assignedThisCycle = false;

            // Attempt to assign existing idle serfs first
            for (let i = idleSerfs.length - 1; i >= 0; i--) {
                const serf = idleSerfs[i];
                if (serf.serfType === requiredProfession) {
                    // ... (tool checking and assignment logic remains the same)
                    let hasRequiredTool = !requiredTool;
                    if (requiredTool) {
                        if (
                            resourceManager.getResourceCount(requiredTool) > 0
                        ) {
                            if (
                                resourceManager.removeResource(requiredTool, 1)
                            ) {
                                hasRequiredTool = true;
                                serf.hasTool = true;
                                console.log(
                                    `Serf ${serf.id} acquired ${requiredTool} for ${building.info.name}.`
                                );
                            } else {
                                console.warn(
                                    `Failed to remove ${requiredTool} from RM for Serf ${serf.id}.`
                                );
                            }
                        }
                    }

                    if (hasRequiredTool) {
                        // Set the serf's profession properly
                        serf.setProfession(requiredProfession, building);

                        building.workers.push(serf.id);
                        serf.job = building;

                        // Create a ProcessItemsTask for building work instead of legacy string-based tasks
                        const processTask = new ProcessItemsTask(
                            serf,
                            building,
                            building.info.producesResource || null,
                            building.info.consumesResources || null
                        );

                        // Add the task to the task system
                        this.tasks.push(processTask);
                        serf.currentTask = processTask;

                        if (
                            building.type === 'WOODCUTTERS_HUT' &&
                            building.info.producesResource
                        ) {
                            console.log(
                                `Serf ${serf.id} (${serf.serfType}) assigned to GATHER ${building.info.producesResource} from ${building.info.name}.`
                            );
                        } else if (
                            requiredProfession === SERF_PROFESSIONS.FORESTER &&
                            building.info.name === "Forester's Hut"
                        ) {
                            // Forester assigned to hut, should become idle to be picked up by plant_sapling logic
                            console.log(
                                `Serf ${serf.id} (Forester) assigned to ${building.info.name}. Will become IDLE for planting tasks.`
                            );
                        } else {
                            console.log(
                                `Serf ${serf.id} (${serf.serfType}) assigned to WORK AT ${building.info.name}.`
                            );
                        }

                        idleSerfs.splice(i, 1);
                        assignedThisCycle = true;
                        if (building.workers.length >= building.info.jobSlots)
                            break;
                    }
                }
            }

            // If no existing idle serf of the required profession was assigned AND there are still open slots
            if (
                !assignedThisCycle &&
                building.workers.length < building.info.jobSlots
            ) {
                // Check if we should spawn a new serf for this profession (e.g., for Foresters)
                if (requiredProfession === SERF_PROFESSIONS.FORESTER) {
                    // Initially, only auto-spawn Foresters
                    const newForester = this.createSerf(
                        SERF_PROFESSIONS.FORESTER,
                        building.gridX,
                        building.gridZ - 1
                    ); // Spawn near the hut
                    if (newForester) {
                        console.log(
                            `SerfManager: Spawned new Forester ${newForester.id} for ${building.info.name}.`
                        );
                        // The new serf will be idle and picked up in the next assignJobsAndTasks cycle
                        // or we can attempt to assign immediately (though it might be simpler to let the existing logic handle it)
                        // For simplicity, let the next cycle assign the job.
                        // To make it more immediate, we could add it to a temporary list of newly spawned serfs
                        // and re-run a targeted assignment for it.
                        // For now, let's assume it will be picked up.
                    }
                }
            }
            if (
                idleSerfs.length === 0 &&
                building.workers.length >= building.info.jobSlots &&
                requiredProfession !== SERF_PROFESSIONS.FORESTER
            ) {
                // If all idle serfs are processed and this building is full (and not a forester hut which might spawn more)
                // then we might not need to continue checking other buildings if the goal was to fill this one.
                // However, the loop should continue for other buildings.
            }
        }
    }

    tryAssignTransportTasksToIdleTransporters(idleTransporters) {
        let castle = this.constructionManager.placedBuildings.find(
            (b) => b.isConstructed && b.type === 'CASTLE'
        );
        if (!castle) {
            // console.log("No Castle found for transport tasks.");
            return;
        }
        // Access buildingInstance from building.model.userData.buildingInstance
        const castleInstance = castle.model.userData.buildingInstance;

        for (const building of this.constructionManager.placedBuildings) {
            const buildingInstance = building.model.userData.buildingInstance;
            if (
                !buildingInstance ||
                !buildingInstance.isConstructed ||
                buildingInstance.model.uuid === castleInstance.model.uuid ||
                !buildingInstance.inventory ||
                typeof buildingInstance.getStock !== 'function'
            ) {
                continue;
            }

            for (const resourceType in buildingInstance.inventory) {
                const availableAmount = buildingInstance.getStock(resourceType);
                if (availableAmount > 0) {
                    if (idleTransporters.length > 0) {
                        const transporter = idleTransporters.pop();
                        const amountToTransport = Math.min(
                            availableAmount,
                            transporter.maxInventoryCapacity
                        );

                        if (amountToTransport > 0) {
                            transporter.setTask('transport_resource', {
                                sourceBuildingId: buildingInstance.model.uuid, // Corrected path
                                sourceBuildingName: buildingInstance.info.name,
                                resourceType: resourceType,
                                amountToTransport: amountToTransport,
                                destinationBuildingId:
                                    castleInstance.model.uuid, // Corrected path
                                destinationBuildingName:
                                    castleInstance.info.name,
                            });
                            console.log(
                                `SerfManager: Transporter ${transporter.id} assigned to transport ${amountToTransport} ${resourceType} from ${buildingInstance.info.name} to ${castleInstance.info.name}.`
                            );
                        }
                        if (idleTransporters.length === 0) return;
                    }
                }
            }
        }
    }

    /*unassignSerfFromBuilding(serfId, buildingId) {
        const building = this.constructionManager.placedBuildings.find(
            (b) => b.model.uuid === buildingId
        );
        if (!building) {
            console.error(
                `Building with ID ${buildingId} not found for unassignment.`
            );
            return;
        }

        const serfWorkerIndex = building.workers.indexOf(serfId);
        if (serfWorkerIndex > -1) {
            building.workers.splice(serfWorkerIndex, 1);
            const serf = this.serfs.find((s) => s.id === serfId);
            if (serf) {
                console.log(
                    `Serf ${serf.id} unassigned from ${building.info.name}.`
                );
                serf.job = null;
                serf.state = SERF_ACTION_STATES.IDLE; // Use direct import
                if (serf.hasTool && building.info.requiredTool) {
                    resourceManager.addResource(building.info.requiredTool, 1); // Return tool to stockpile
                    serf.hasTool = false;
                    console.log(
                        `Serf ${serf.id} returned ${building.info.requiredTool} to stockpile.`
                    );
                }
                // Reset serf's drop-off point to default or make it seek new tasks
                const dropOffGridX = Math.floor(this.gameMap.width / 2);
                const dropOffGridZ = Math.floor(this.gameMap.height / 2);
                serf.setDropOffPoint({ x: dropOffGridX, y: dropOffGridZ });
            }
        } else {
            console.warn(
                `Serf ${serfId} not found as a worker in ${building.info.name}.`
            );
        }
    }*/

    getSerfsGroupedByProfession() {
        const grouped = {};
        for (const serf of this.serfs) {
            if (!grouped[serf.serfType]) {
                grouped[serf.serfType] = [];
            }
            grouped[serf.serfType].push({
                id: serf.id,
                serfType: serf.serfType,
            }); // Add more details if needed by UI
        }
        return grouped;
    }

    getSerfById(serfId) {
        return this.serfs.find((serf) => serf.id === serfId);
    }

    getAvailableSerfsByProfession(profession) {
        return this.serfs.filter(
            (serf) =>
                serf.serfType === profession &&
                serf.currentState.name === SERF_ACTION_STATES.IDLE &&
                !serf.currentTask
        );
    }

    // onChange callback for UIManager to listen to serf changes
    // This needs to be called whenever serfs are created, or their professions change (if that's possible)
    _notifyUI() {
        if (this.onChangeCallback) {
            this.onChangeCallback();
        }
    }

    onChange(callback) {
        this.onChangeCallback = callback;
    }

    // If serfs can be removed or change profession, call _notifyUI there as well.
    // For example, if a serf dies or is removed:
    /*removeSerf(serfId) {
        const index = this.serfs.findIndex((s) => s.id === serfId);
        if (index !== -1) {
            // Proper cleanup of the serf model from the scene would be needed here
            if (this.serfs[index].model) {
                this.serfVisualsGroup.remove(this.serfs[index].model);
                // Dispose of geometries and materials if necessary
            }
            this.serfs.splice(index, 1);
            console.log(`Serf ${serfId} removed.`);
            this._notifyUI(); // Notify UI about the change
            return true;
        }
        return false;
    }*/
}

// Export the class
export default SerfManager;
