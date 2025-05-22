// src/core/serfManager.js
import * as THREE from 'three';
import * as Units from '../entities/units.js'; 
import { SERF_ACTION_STATES } from '../config/serfActionStates.js'; // Updated import
import resourceManager from './resourceManager.js'; // For tool/food checks
import { TILE_SIZE, TERRAIN_TYPES } from '../config/mapConstants.js'; // Corrected import path
import { SERF_PROFESSIONS } from '../config/serfProfessions.js'; // Updated import
import { FORESTER_PLANTING_RADIUS } from '../config/unitConstants.js';

class SerfManager {
    constructor(scene, gameMap, constructionManager, gameElementsGroup, game) { // Added game argument
        this.scene = scene; // Still needed for Serf visual creation if Serf adds itself
        this.gameMap = gameMap;
        this.constructionManager = constructionManager;
        this.gameElementsGroup = gameElementsGroup; // Store gameElementsGroup
        this.game = game; // Store the game instance
        this.serfs = [];
        this.maxSerfs = 50;
        this.serfIdCounter = 0;

        // Serf models will be added to this group by the Serf class itself if it takes gameElementsGroup
        // Or, SerfManager can add them here after creation.
        // For now, let's assume Serf class will handle adding its model to a passed group.
        this.serfVisualsGroup = new THREE.Group();
        this.serfVisualsGroup.name = "SerfVisuals";
        this.gameElementsGroup.add(this.serfVisualsGroup); // Add the dedicated serf group to the main game elements group

        this.onChangeCallback = null; // Initialize onChangeCallback

        this.spawnInitialSerfs();
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
        this.assignJobsAndTasks(); // Combined logic
    }

    assignJobsAndTasks() {
        if (!this.constructionManager) return;

        // Serfs who are IDLE and DO NOT have a job assignment yet.
        const unemployedIdleSerfs = this.serfs.filter(serf => 
            serf.state === SERF_ACTION_STATES.IDLE && 
            !serf.job && 
            (!serf.task || serf.task === 'idle')
        );

        // Foresters who ARE ASSIGNED to a Forester's Hut, are IDLE at the hut, and ready for a planting task.
        const forestersAtHutReadyToPlant = this.serfs.filter(serf =>
            serf.serfType === SERF_PROFESSIONS.FORESTER &&
            serf.job && // They must have a job (their hut)
            serf.job.info && serf.job.info.jobProfession === SERF_PROFESSIONS.FORESTER && // Ensure the job is a Forester's Hut
            serf.state === SERF_ACTION_STATES.IDLE &&
            (!serf.task || serf.task === 'idle') // And they are ready for a new task
        );
        
        const idleTransportersOriginal = this.serfs.filter(serf => 
            serf.serfType === SERF_PROFESSIONS.TRANSPORTER && 
            serf.state === SERF_ACTION_STATES.IDLE &&
            (!serf.task || serf.task === 'idle') && 
            Object.keys(serf.inventory).reduce((sum, key) => sum + serf.inventory[key], 0) === 0
        );
        
        // 1. Assign Builders to Construction Sites
        // `tryAssignBuildersToConstruction` takes a list of builders and pops from it.
        // This means the original `unemployedIdleSerfs` list is not directly modified by this call.
        const idleBuildersForConstruction = unemployedIdleSerfs.filter(serf => serf.serfType === SERF_PROFESSIONS.BUILDER);
        if (idleBuildersForConstruction.length > 0 && this.constructionManager.buildingsUnderConstruction.length > 0) {
            this.tryAssignBuildersToConstruction(idleBuildersForConstruction, this.constructionManager.buildingsUnderConstruction);
            // Builders assigned will have their task/state changed, so they won't be picked up by subsequent filters for idle/jobless serfs.
        }

        // 2. Assign Foresters (already at their huts) to Plant Saplings
        if (forestersAtHutReadyToPlant.length > 0) {
            this.tryAssignForestersToPlantSaplings(forestersAtHutReadyToPlant);
        }

        // 3. Assign Serfs to Profession Jobs 
        //    This includes assigning unemployed Foresters to Forester's Huts.
        //    `tryAssignSerfsToProfessionJobs` modifies the list it's given by splicing.
        //    We need serfs who are still idle, without a job, and are not builders (builders handled above).
        let candidatesForProfessionJobs = unemployedIdleSerfs.filter(serf => {
            return serf.serfType !== SERF_PROFESSIONS.BUILDER && // Exclude builders
                   serf.state === SERF_ACTION_STATES.IDLE &&    // Still idle
                   !serf.job &&                                 // Still no job
                   (!serf.task || serf.task === 'idle');        // Still no task (or task is 'idle')
        });

        if (candidatesForProfessionJobs.length > 0) {
            this.tryAssignSerfsToProfessionJobs(candidatesForProfessionJobs); // This list is modified by splice
        }

        // 4. Assign Transport Tasks
        //    Re-filter transporters to ensure they are still idle and available after other assignments.
        const stillIdleTransporters = this.serfs.filter(serf => 
            serf.serfType === SERF_PROFESSIONS.TRANSPORTER && 
            serf.state === SERF_ACTION_STATES.IDLE &&
            (!serf.task || serf.task === 'idle') && 
            Object.keys(serf.inventory).reduce((sum, key) => sum + serf.inventory[key], 0) === 0
        );
        if (stillIdleTransporters.length > 0) {
            this.tryAssignTransportTasksToIdleTransporters(stillIdleTransporters);
        }
    }

    tryAssignBuildersToConstruction(idleBuilders, sites) {
        for (const site of sites) {
            if (site.isConstructed) continue; // Skip already completed sites

            // Check if this site already has a builder assigned
            // This requires tracking assigned builders per site or checking serf.assignedConstructionSite
            const alreadyAssignedBuilder = this.serfs.find(s => s.assignedConstructionSite && s.assignedConstructionSite.model.uuid === site.model.uuid);
            if (alreadyAssignedBuilder) {
                // console.log(`Site ${site.info.name} (ID: ${site.model.uuid}) already has builder ${alreadyAssignedBuilder.id}. Skipping assignment.`);
                continue; 
            }

            if (idleBuilders.length > 0) {
                const builder = idleBuilders.pop(); // Take the first available idle builder
                
                // Determine target location for the builder (e.g., site's grid position)
                const targetLocation = site.getEntryPointGridPosition ? site.getEntryPointGridPosition() : { x: site.gridX, y: site.gridZ };

                builder.setTask('construct_building', {
                    constructionSiteId: site.model.uuid, // Pass the UUID of the building model under construction
                    targetLocation: { x: targetLocation.x, y: targetLocation.z } // Pass y for grid Z
                });
                console.log(`SerfManager: Builder ${builder.id} assigned to construct ${site.info.name} (ID: ${site.model.uuid}) at (${targetLocation.x}, ${targetLocation.z}).`);
            }
            if (idleBuilders.length === 0) return; // All builders assigned
        }
    }

    tryAssignForestersToPlantSaplings(forestersAtHutReadyToPlant) {
        // Corrected condition to use this.game.gameMap and check all necessary instances
        if (!this.game || !this.game.gameMap || !this.game.natureManager) {
            console.error("SerfManager: Game instance, Game's MapManager (gameMap), or Game's NatureManager not properly initialized or available.");
            return;
        }
        console.log(`SerfManager: Attempting to assign planting tasks to ${forestersAtHutReadyToPlant.length} foresters.`);

        for (const forester of forestersAtHutReadyToPlant) {
            console.log(`SerfManager: Checking forester ${forester.id} (Profession: ${forester.profession}, SerfType: ${forester.serfType}) for planting task.`);
            // This check is somewhat redundant if forestersAtHutReadyToPlant is correctly filtered, but good for sanity.

            console.log(`SerfManager: Forester ${forester.id} - plantedSaplingsCount: ${forester.plantedSaplingsCount}, maxPlantedSaplings: ${forester.maxPlantedSaplings}`);
            if (forester.plantedSaplingsCount >= forester.maxPlantedSaplings) {
                console.log(`SerfManager: Forester ${forester.id} has reached max saplings (${forester.plantedSaplingsCount}/${forester.maxPlantedSaplings}). Skipping.`);
                continue; 
            }

            const hut = forester.job; // The Forester's Hut (building instance)
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
                        // console.log(`SerfManager: Checking tile (${currentTileX}, ${currentTileZ}) - Terrain: ${tile.terrainType}, Resource: ${tileResource}`);
                        
                        const isOccupied = this.isTileOccupiedForPlanting(currentTileX, currentTileZ);
                        // console.log(`SerfManager: Tile (${currentTileX}, ${currentTileZ}) - isTileOccupiedForPlanting: ${isOccupied}`);

                        if (tile.terrainType === TERRAIN_TYPES.GRASSLAND && !tile.resource && !isOccupied) {
                            bestTargetTile = { x: currentTileX, y: currentTileZ };
                            console.log(`SerfManager: Forester ${forester.id} found suitable tile (${currentTileX}, ${currentTileZ}).`);
                            break; 
                        } else {
                            let skipReason = [];
                            if (tile.terrainType !== TERRAIN_TYPES.GRASSLAND) skipReason.push(`Not Grassland (is ${tile.terrainType})`);
                            if (tile.resource) skipReason.push(`Has resource (${tileResource})`);
                            if (isOccupied) skipReason.push("Occupied for planting");
                            // console.log(`SerfManager: Tile (${currentTileX}, ${currentTileZ}) skipped: ${skipReason.join(', ')}.`);
                        }
                    } else {
                        // console.log(`SerfManager: Tile (${currentTileX}, ${currentTileZ}) skipped: Out of bounds.`);
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

    isTileOccupiedForPlanting(tileX, tileY) { // tileY here represents the Z coordinate on the grid
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
