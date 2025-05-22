// src/core/serfManager.js
import * as THREE from 'three';
import * as Units from '../entities/units.js'; 
import { SERF_ACTION_STATES } from '../config/serfActionStates.js';
import resourceManager from './resourceManager.js';
import { TILE_SIZE, TERRAIN_TYPES } from '../config/mapConstants.js';
import { SERF_PROFESSIONS } from '../config/serfProfessions.js';
import { FORESTER_PLANTING_RADIUS } from '../config/unitConstants.js';
import ConstructBuildingTask from '../core/tasks/ConstructBuildingTask.js'; // Added
import { TASK_STATUS } from '../core/tasks/Task.js'; // Added

class SerfManager {
    constructor(scene, gameMap, constructionManager, gameElementsGroup, game) {
        this.scene = scene;
        this.gameMap = gameMap;
        this.constructionManager = constructionManager;
        this.gameElementsGroup = gameElementsGroup;
        this.game = game;
        this.serfs = [];
        this.maxSerfs = 50;
        this.serfIdCounter = 0;
        this.tasks = []; // Added tasks array

        this.serfVisualsGroup = new THREE.Group();
        this.serfVisualsGroup.name = "SerfVisuals";
        this.gameElementsGroup.add(this.serfVisualsGroup);

        this.onChangeCallback = null;

        this.spawnInitialSerfs();
    }

    addConstructionTask(buildingInstance) {
        const newTask = new ConstructBuildingTask(buildingInstance);
        this.tasks.push(newTask);
        console.log(`SerfManager: Added new ConstructBuildingTask for ${buildingInstance.name} (${buildingInstance.id}). Total tasks: ${this.tasks.length}`);
        // Optional: Immediately try to assign tasks, or let the main assignJobsAndTasks loop handle it.
        // this.assignJobsAndTasks(); 
    }

    spawnInitialSerfs() {
        // Determine the center of the map
        const centerX = Math.floor(this.gameMap.width / 2);
        const centerZ = Math.floor(this.gameMap.height / 2); // Using Z for the Y-axis in grid

        // Find the Transporter Hut placed by setupInitialStructures
        const transporterHut = this.constructionManager.placedBuildings.find(
            b => b.type === 'TRANSPORTER_HUT' && b.isConstructed
        );

        let spawnX = centerX;
        let spawnZ = centerZ;

        if (transporterHut) {
            spawnX = Math.round(transporterHut.model.position.x / TILE_SIZE);
            spawnZ = Math.round(transporterHut.model.position.z / TILE_SIZE);
            console.log(`Found Transporter Hut for initial serf spawn at grid (${spawnX}, ${spawnZ})`);
        } else {
            console.warn("No Transporter Hut found for initial serf spawn. Spawning at map center.");
        }

        // Spawn 1 Woodcutter serf
        // Offset slightly from where transporters might cluster
        let woodcutterSpawnX = spawnX + 1; 
        let woodcutterSpawnZ = spawnZ + 1;

        // Ensure spawn position is within map bounds
        woodcutterSpawnX = Math.max(0, Math.min(woodcutterSpawnX, this.gameMap.width - 1));
        woodcutterSpawnZ = Math.max(0, Math.min(woodcutterSpawnZ, this.gameMap.height - 1));
        
        const woodcutterSerf = this.createSerf(SERF_PROFESSIONS.WOODCUTTER, woodcutterSpawnX, woodcutterSpawnZ);
        if (woodcutterSerf) {
            console.log(`Initial Woodcutter serf ${woodcutterSerf.id} spawned at (${woodcutterSpawnX}, ${woodcutterSpawnZ}).`);
        }

        // Spawn 5 Transporter serfs
        for (let i = 0; i < 5; i++) {
            // Offset them slightly so they don't all spawn on the exact same spot
            const offsetX = i % 2 === 0 ? Math.floor(i / 2) : -Math.floor((i + 1) / 2);
            const offsetZ = i % 3 === 0 ? 0 : (i % 3 === 1 ? 1 : -1);
            
            let finalSpawnX = spawnX + offsetX;
            let finalSpawnZ = spawnZ + offsetZ;

            // Ensure spawn position is within map bounds
            finalSpawnX = Math.max(0, Math.min(finalSpawnX, this.gameMap.width - 1));
            finalSpawnZ = Math.max(0, Math.min(finalSpawnZ, this.gameMap.height - 1));
            
            const newSerf = this.createSerf(SERF_PROFESSIONS.TRANSPORTER, finalSpawnX, finalSpawnZ);
            if (newSerf && transporterHut) {
                // Optionally, directly assign them to the Transporter Hut if game logic requires
                // For now, the general job assignment logic should pick them up if the hut has slots.
                // newSerf.job = transporterHut; // This might be too direct, let assignJobsAndTasks handle it.
                // transporterHut.workers.push(newSerf.id); // Also potentially too direct.
                console.log(`Initial Transporter serf ${newSerf.id} spawned near Transporter Hut at (${finalSpawnX}, ${finalSpawnZ}).`);
            } else if (newSerf) {
                console.log(`Initial Transporter serf ${newSerf.id} spawned at (${finalSpawnX}, ${finalSpawnZ}) (no hut found).`);
            }
        }

        // Remove the old single Woodcutter spawn
        // const serfTypeToSpawn = 'Woodcutter'; 
        // console.log(`Spawning a single ${serfTypeToSpawn} at grid center (${centerX}, ${centerZ})`);
        // this.createSerf(serfTypeToSpawn, centerX, centerZ);
    }

    createSerf(type, gridX, gridY) {
        if (this.serfs.length >= this.maxSerfs) {
            console.log("Max serf limit reached.");
            return null;
        }

        this.serfIdCounter++;
        const serfId = `serf-${this.serfIdCounter}`;
        
        // Pass the game instance (this.game) to the Serf constructor
        const newSerf = new Units.Serf(serfId, gridX, gridY, type, this.scene, this.gameMap, this.serfVisualsGroup, this.game);

        if (newSerf && newSerf.model) {
            this.serfs.push(newSerf);
            console.log(`${type} serf ${serfId} created at grid (${gridX}, ${gridY}). Model: ${newSerf.model.name}`);
            
            const dropOffGridX = Math.floor(this.gameMap.width / 2);
            const dropOffGridZ = Math.floor(this.gameMap.height / 2);
            newSerf.setDropOffPoint({ x: dropOffGridX, y: dropOffGridZ }); 

            newSerf.job = null; 
            newSerf.hasTool = false; 

            this._notifyUI(); // Notify UI about the new serf
            return newSerf;
        } else {
            console.error(`Failed to create serf or serf model for type: ${type} at grid (${gridX},${gridY}).`);
            this.serfIdCounter--; 
            return null;
        }
    }

    update(deltaTime) { 
        this.serfs.forEach(serf => {
            if (serf.update) { 
                serf.update(deltaTime);
            }
        });
        this.assignJobsAndTasks();
    }

    assignJobsAndTasks() {
        if (!this.constructionManager) return;

        const availableSerfs = this.serfs.filter(serf => 
            serf.currentState.name === SERF_ACTION_STATES.IDLE && 
            !serf.currentTask // Key change: ensure serf doesn't already have a new system task
        );

        if (availableSerfs.length > 0) {
            // Sort tasks by priority (higher first) - Optional, but good practice
            this.tasks.sort((a, b) => b.priority - a.priority);

            for (const task of this.tasks) {
                if (task.status === TASK_STATUS.PENDING) {
                    for (let i = 0; i < availableSerfs.length; i++) {
                        const serf = availableSerfs[i];
                        if (task.canBeExecutedBy(serf)) {
                            console.log(`SerfManager: Assigning task ${task.id} (${task.type}) to serf ${serf.id}`);
                            serf.currentTask = task;
                            task.onAssign(serf); // This should change task status to ACTIVE

                            availableSerfs.splice(i, 1); // Remove serf from available list
                            break; // Move to next task
                        }
                    }
                }
                if (availableSerfs.length === 0) break; // No more serfs to assign
            }
        }
        
        this.tasks = this.tasks.filter(task => 
            task.status !== TASK_STATUS.COMPLETED && 
            task.status !== TASK_STATUS.FAILED &&
            task.status !== TASK_STATUS.CANCELLED
        );

        // --- Existing Job/Task Assignment Logic (for non-task-system items) ---
        // Filter serfs that are STILL idle and have NO currentTask after the new task assignments
        const stillUnassignedIdleSerfs = this.serfs.filter(serf => 
            serf.currentState.name === SERF_ACTION_STATES.IDLE && 
            !serf.currentTask && 
            (!serf.job || (serf.job && serf.task === 'idle')) 
        );
        
        const forestersAtHutReadyToPlant = stillUnassignedIdleSerfs.filter(serf => // Modified filter
            serf.serfType === SERF_PROFESSIONS.FORESTER &&
            serf.job && 
            serf.job.info && serf.job.info.jobProfession === SERF_PROFESSIONS.FORESTER && 
            serf.currentState.name === SERF_ACTION_STATES.IDLE &&
            (!serf.task || serf.task === 'idle') // Old task string check for this specific logic
        );
        
        // tryAssignBuildersToConstruction call is removed.

        if (forestersAtHutReadyToPlant.length > 0) {
            this.tryAssignForestersToPlantSaplings(forestersAtHutReadyToPlant);
        }

        let candidatesForProfessionJobs = stillUnassignedIdleSerfs.filter(serf => { // Modified filter
            return serf.serfType !== SERF_PROFESSIONS.BUILDER && // Builders now handled by Task system
                   serf.currentState.name === SERF_ACTION_STATES.IDLE &&   
                   !serf.job &&                                
                   (!serf.task || serf.task === 'idle');       
        });

        if (candidatesForProfessionJobs.length > 0) {
            this.tryAssignSerfsToProfessionJobs(candidatesForProfessionJobs);
        }

        const stillIdleTransporters = stillUnassignedIdleSerfs.filter(serf => // Modified filter
            serf.serfType === SERF_PROFESSIONS.TRANSPORTER && 
            serf.currentState.name === SERF_ACTION_STATES.IDLE &&
            (!serf.task || serf.task === 'idle') && 
            Object.keys(serf.inventory).reduce((sum, key) => sum + serf.inventory[key], 0) === 0
        );
        if (stillIdleTransporters.length > 0) {
            this.tryAssignTransportTasksToIdleTransporters(stillIdleTransporters);
        }
    }

    // tryAssignBuildersToConstruction method is removed.

    tryAssignForestersToPlantSaplings(forestersAtHutReadyToPlant) {
        if (!this.game || !this.game.gameMap || !this.game.natureManager) {
            console.error("SerfManager: Game instance, Game's MapManager (gameMap), or Game's NatureManager not properly initialized or available.");
            return;
        }
        console.log(`SerfManager: Attempting to assign planting tasks to ${forestersAtHutReadyToPlant.length} foresters.`);

        for (const forester of forestersAtHutReadyToPlant) {
            console.log(`SerfManager: Checking forester ${forester.id} (Profession: ${forester.profession}, SerfType: ${forester.serfType}) for planting task.`);

            console.log(`SerfManager: Forester ${forester.id} - plantedSaplingsCount: ${forester.plantedSaplingsCount}, maxPlantedSaplings: ${forester.maxPlantedSaplings}`);
            if (forester.plantedSaplingsCount >= forester.maxPlantedSaplings) {
                console.log(`SerfManager: Forester ${forester.id} has reached max saplings (${forester.plantedSaplingsCount}/${forester.maxPlantedSaplings}). Skipping.`);
                continue; 
            }

            const hut = forester.job;
            if (!hut || hut.gridX == null || hut.gridZ == null) {
                console.warn(`SerfManager: Forester ${forester.id} has no valid hut assigned or hut has no gridX/gridZ position. Hut:`, hut);
                continue;
            }
            console.log(`SerfManager: Forester ${forester.id} is at hut ${hut.info.name} (Grid: ${hut.gridX}, ${hut.gridZ}). Searching for planting spot within radius ${FORESTER_PLANTING_RADIUS}.`);


            const hutGridX = hut.gridX;
            const hutGridZ = hut.gridZ; 
            let bestTargetTile = null;

            for (let r = -FORESTER_PLANTING_RADIUS; r <= FORESTER_PLANTING_RADIUS; r++) {
                for (let c = -FORESTER_PLANTING_RADIUS; c <= FORESTER_PLANTING_RADIUS; c++) {
                    if (r === 0 && c === 0) continue; 

                    const currentTileX = hutGridX + c;
                    const currentTileZ = hutGridZ + r;

                    if (currentTileX >= 0 && currentTileX < this.gameMap.width && currentTileZ >= 0 && currentTileZ < this.gameMap.height) {
                        const tile = this.gameMap.grid[currentTileZ][currentTileX];
                        const tileResource = tile.resource ? tile.resource.type : 'none';
                        
                        const isOccupied = this.isTileOccupiedForPlanting(currentTileX, currentTileZ);

                        if (tile.terrainType === TERRAIN_TYPES.GRASSLAND && !tile.resource && !isOccupied) {
                            bestTargetTile = { x: currentTileX, y: currentTileZ };
                            console.log(`SerfManager: Forester ${forester.id} found suitable tile (${currentTileX}, ${currentTileZ}).`);
                            break; 
                        } else {
                            let skipReason = [];
                            if (tile.terrainType !== TERRAIN_TYPES.GRASSLAND) skipReason.push(`Not Grassland (is ${tile.terrainType})`);
                            if (tile.resource) skipReason.push(`Has resource (${tileResource})`);
                            if (isOccupied) skipReason.push("Occupied for planting");
                        }
                    }
                }
                if (bestTargetTile) break;
            }

            if (bestTargetTile) {
                console.log(`SerfManager: Forester ${forester.id} from hut ${hut.info.name} assigned to plant sapling at (${bestTargetTile.x}, ${bestTargetTile.y}).`);
                forester.setTask('plant_sapling', { 
                    targetTile: bestTargetTile,
                });
            } else {
                console.log(`SerfManager: Forester ${forester.id} could not find a suitable spot to plant a sapling near ${hut.info.name} (Hut at ${hutGridX},${hutGridZ}, Radius ${FORESTER_PLANTING_RADIUS}).`);
            }
        }
    }

    isTileOccupiedForPlanting(tileX, tileY) {
        // Check if any other serf is already tasked to plant at this exact tile
        for (const serf of this.serfs) {
            if (serf.task === 'plant_sapling' && serf.taskDetails && serf.taskDetails.targetTile) {
                if (serf.taskDetails.targetTile.x === tileX && serf.taskDetails.targetTile.y === tileY) {
                    return true; 
                }
            }
            if (serf.state === SERF_ACTION_STATES.MOVING_TO_TARGET_TILE && serf.targetTile) {
                 if (serf.targetTile.x === tileX && serf.targetTile.y === tileY) {
                    return true;
                }
            }
        }
        // Check if a resource (like another sapling or tree) already exists on the tile
        // This requires this.gameMap to be available and initialized.
        if (this.gameMap && this.gameMap.grid[tileY] && this.gameMap.grid[tileY][tileX]) {
            if (this.gameMap.grid[tileY][tileX].resource) {
                return true; // Tile already has a resource
            }
        } else {
            // This case should ideally not happen if tileX, tileY are within bounds
            console.warn(`isTileOccupiedForPlanting: Tile (${tileX}, ${tileY}) is out of bounds or gameMap not ready.`);
            return true; // Treat as occupied if map data is inaccessible
        }
        return false;
    }

    tryAssignSerfsToProfessionJobs(idleSerfs) {
        for (const building of this.constructionManager.placedBuildings) {
            if (!building.isConstructed || !building.info.jobSlots || building.workers.length >= building.info.jobSlots) {
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
                        if (resourceManager.getResourceCount(requiredTool) > 0) {
                            if (resourceManager.removeResource(requiredTool, 1)) {
                                hasRequiredTool = true;
                                serf.hasTool = true;
                                console.log(`Serf ${serf.id} acquired ${requiredTool} for ${building.info.name}.`);
                            } else {
                                console.warn(`Failed to remove ${requiredTool} from RM for Serf ${serf.id}.`);
                            }
                        }
                    }

                    if (hasRequiredTool) {
                        building.workers.push(serf.id);
                        serf.job = building;
                        const taskDetails = {
                            buildingId: building.model.userData.buildingInstance.model.uuid,
                            buildingName: building.info.name,
                        };

                        if (building.type === 'WOODCUTTERS_HUT' && building.info.producesResource) {
                            taskDetails.resourceType = building.info.producesResource;
                            serf.setTask('gather_resource_for_building', taskDetails);
                            console.log(`Serf ${serf.id} (${serf.serfType}) assigned to GATHER from ${building.info.name}.`);
                        } else if (requiredProfession === SERF_PROFESSIONS.FORESTER && building.info.name === "Forester\'s Hut") {
                            // Forester assigned to hut, should become idle to be picked up by plant_sapling logic
                            serf.setTask('work_at_building', taskDetails); // Standard work task
                            console.log(`Serf ${serf.id} (Forester) assigned to ${building.info.name}. Will become IDLE for planting tasks.`);
                        } else {
                             serf.setTask('work_at_building', taskDetails);
                             console.log(`Serf ${serf.id} (${serf.serfType}) assigned to WORK AT ${building.info.name}.`);
                        }
                        
                        idleSerfs.splice(i, 1);
                        assignedThisCycle = true;
                        if (building.workers.length >= building.info.jobSlots) break; 
                    }
                }
            }

            // If no existing idle serf of the required profession was assigned AND there are still open slots
            if (!assignedThisCycle && building.workers.length < building.info.jobSlots) {
                // Check if we should spawn a new serf for this profession (e.g., for Foresters)
                if (requiredProfession === SERF_PROFESSIONS.FORESTER) { // Initially, only auto-spawn Foresters
                    const newForester = this.createSerf(SERF_PROFESSIONS.FORESTER, building.gridX, building.gridZ -1); // Spawn near the hut
                    if (newForester) {
                        console.log(`SerfManager: Spawned new Forester ${newForester.id} for ${building.info.name}.`);
                        // The new serf will be idle and picked up in the next assignJobsAndTasks cycle
                        // or we can attempt to assign immediately (though it might be simpler to let the existing logic handle it)
                        // For simplicity, let the next cycle assign the job.
                        // To make it more immediate, we could add it to a temporary list of newly spawned serfs
                        // and re-run a targeted assignment for it.
                        // For now, let's assume it will be picked up.
                    }
                }
            }
            if (idleSerfs.length === 0 && building.workers.length >= building.info.jobSlots && requiredProfession !== SERF_PROFESSIONS.FORESTER) {
                 // If all idle serfs are processed and this building is full (and not a forester hut which might spawn more)
                 // then we might not need to continue checking other buildings if the goal was to fill this one.
                 // However, the loop should continue for other buildings.
            }
        }
    }

    tryAssignTransportTasksToIdleTransporters(idleTransporters) {
        let castle = this.constructionManager.placedBuildings.find(b => b.isConstructed && b.type === 'CASTLE');
        if (!castle) {
            // console.log("No Castle found for transport tasks.");
            return;
        }
        // Access buildingInstance from building.model.userData.buildingInstance
        const castleInstance = castle.model.userData.buildingInstance;

        for (const building of this.constructionManager.placedBuildings) {
            const buildingInstance = building.model.userData.buildingInstance;
            if (!buildingInstance || !buildingInstance.isConstructed || buildingInstance.model.uuid === castleInstance.model.uuid || !buildingInstance.inventory || typeof buildingInstance.getStock !== 'function') {
                continue;
            }

            for (const resourceType in buildingInstance.inventory) {
                const availableAmount = buildingInstance.getStock(resourceType);
                if (availableAmount > 0) {
                    if (idleTransporters.length > 0) {
                        const transporter = idleTransporters.pop();
                        const amountToTransport = Math.min(availableAmount, transporter.maxInventoryCapacity);

                        if (amountToTransport > 0) {
                            transporter.setTask('transport_resource', {
                                sourceBuildingId: buildingInstance.model.uuid, // Corrected path
                                sourceBuildingName: buildingInstance.info.name,
                                resourceType: resourceType,
                                amountToTransport: amountToTransport,
                                destinationBuildingId: castleInstance.model.uuid, // Corrected path
                                destinationBuildingName: castleInstance.info.name
                            });
                            console.log(`SerfManager: Transporter ${transporter.id} assigned to transport ${amountToTransport} ${resourceType} from ${buildingInstance.info.name} to ${castleInstance.info.name}.`);
                        }
                        if (idleTransporters.length === 0) return;
                    }
                }
            }
        }
    }

    unassignSerfFromBuilding(serfId, buildingId) {
        const building = this.constructionManager.placedBuildings.find(b => b.model.uuid === buildingId);
        if (!building) {
            console.error(`Building with ID ${buildingId} not found for unassignment.`);
            return;
        }

        const serfWorkerIndex = building.workers.indexOf(serfId);
        if (serfWorkerIndex > -1) {
            building.workers.splice(serfWorkerIndex, 1);
            const serf = this.serfs.find(s => s.id === serfId);
            if (serf) {
                console.log(`Serf ${serf.id} unassigned from ${building.info.name}.`);
                serf.job = null;
                serf.state = SERF_ACTION_STATES.IDLE; // Use direct import
                if (serf.hasTool && building.info.requiredTool) {
                    resourceManager.addResource(building.info.requiredTool, 1); // Return tool to stockpile
                    serf.hasTool = false;
                    console.log(`Serf ${serf.id} returned ${building.info.requiredTool} to stockpile.`);
                }
                // Reset serf's drop-off point to default or make it seek new tasks
                const dropOffGridX = Math.floor(this.gameMap.width / 2);
                const dropOffGridZ = Math.floor(this.gameMap.height / 2);
                serf.setDropOffPoint({ x: dropOffGridX, y: dropOffGridZ }); 
            }
        } else {
            console.warn(`Serf ${serfId} not found as a worker in ${building.info.name}.`);
        }
    }

    getSerfsGroupedByProfession() {
        const grouped = {};
        for (const serf of this.serfs) {
            if (!grouped[serf.serfType]) {
                grouped[serf.serfType] = [];
            }
            grouped[serf.serfType].push({ id: serf.id, serfType: serf.serfType }); // Add more details if needed by UI
        }
        return grouped;
    }

    getSerfById(serfId) {
        return this.serfs.find(serf => serf.id === serfId);
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
    removeSerf(serfId) {
        const index = this.serfs.findIndex(s => s.id === serfId);
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
    }
}

// Export the class
export default SerfManager;
