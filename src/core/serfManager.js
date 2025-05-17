// src/core/serfManager.js
import * as THREE from 'three';
// Import SERF_MODEL_CREATORS directly from units.js
import * as Units from '../entities/units.js'; 
import { SERF_ACTION_STATES } from '../entities/units.js'; // Import SERF_ACTION_STATES directly
import * as ResourceModels from '../entities/resources.js'; // Import all resource model creators
import resourceManager, { RESOURCE_TYPES } from './resourceManager.js'; // For tool/food checks
import { TERRAIN_TYPES, TILE_SIZE } from './MapManager.js'; 
import { findPathAStar } from '../utils/pathfinding.js'; 
// import { createCastle } from '../entities/buildings.js'; // Removed to break potential circular dependency

export const SERF_PROFESSIONS = {
    TRANSPORTER: 'Transporter',
    BUILDER: 'Builder',
    WOODCUTTER: 'Woodcutter',
    FORESTER: 'Forester',
    STONEMASON: 'Stonemason',
    MINER: 'Miner',
    FARMER: 'Farmer',
    FISHERMAN: 'Fisherman',
    MILLER: 'Miller',
    BAKER: 'Baker',
    PIG_FARMER: 'Pig Farmer', // Note: Key in SERF_MODEL_CREATORS is 'PigFarmer'
    BUTCHER: 'Butcher',
    SAWMILL_WORKER: 'Sawmill Worker', // Note: Key in SERF_MODEL_CREATORS is 'SawmillWorker'
    SMELTER_WORKER: 'Smelter Worker', // Note: Key in SERF_MODEL_CREATORS is 'SmelterWorker'
    GOLDSMITH: 'Goldsmith',
    TOOLMAKER: 'Toolmaker',
    BLACKSMITH: 'Blacksmith',
    GEOLOGIST: 'Geologist',
    // KNIGHT is a military unit, handled separately
};

// Mapping professions to their 3D model creation functions from units.js
// This local SERF_MODEL_CREATORS can be removed if we directly use the one from Units.js
// const SERF_MODEL_CREATORS = {
//     [SERF_PROFESSIONS.TRANSPORTER]: Units.createTransporter,
//     [SERF_PROFESSIONS.BUILDER]: Units.createBuilder,
//     [SERF_PROFESSIONS.WOODCUTTER]: Units.createWoodcutter,
//     [SERF_PROFESSIONS.FORESTER]: Units.createForester, 
//     [SERF_PROFESSIONS.STONEMASON]: Units.createStonemason,
//     [SERF_PROFESSIONS.MINER]: Units.createMiner,
//     [SERF_PROFESSIONS.FARMER]: Units.createFarmer,
//     [SERF_PROFESSIONS.FISHERMAN]: Units.createFisherman,
//     [SERF_PROFESSIONS.MILLER]: Units.createMiller,
//     [SERF_PROFESSIONS.BAKER]: Units.createBaker,
//     [SERF_PROFESSIONS.PIG_FARMER]: Units.createPigFarmer,
//     [SERF_PROFESSIONS.BUTCHER]: Units.createButcher,
//     [SERF_PROFESSIONS.SAWMILL_WORKER]: Units.createSawmillWorker,
//     [SERF_PROFESSIONS.SMELTER_WORKER]: Units.createSmelterWorker,
//     [SERF_PROFESSIONS.GOLDSMITH]: Units.createGoldsmith,
//     [SERF_PROFESSIONS.TOOLMAKER]: Units.createToolmaker,
//     [SERF_PROFESSIONS.BLACKSMITH]: Units.createBlacksmith,
//     [SERF_PROFESSIONS.GEOLOGIST]: Units.createGeologist,
// };

class SerfManager {
    constructor(scene, gameMap, constructionManager) { // Added constructionManager
        this.scene = scene;
        this.gameMap = gameMap;
        this.constructionManager = constructionManager; // Store constructionManager
        this.serfs = [];
        this.maxSerfs = 50; // Example limit
        this.serfIdCounter = 0;
        // No serfVisualsGroup needed if Serf constructor handles adding to scene directly
        // this.serfVisualsGroup = new THREE.Group();
        // this.serfVisualsGroup.name = "SerfVisuals";
        // this.scene.add(this.serfVisualsGroup);

        this.spawnInitialSerfs();
    }

    spawnInitialSerfs() {
        // Determine the center of the map
        const centerX = Math.floor(this.gameMap.width / 2);
        const centerZ = Math.floor(this.gameMap.height / 2); // Using Z for the Y-axis in grid

        const serfTypeToSpawn = 'Woodcutter'; // Directly specify Woodcutter

        console.log(`Spawning a single ${serfTypeToSpawn} at grid center (${centerX}, ${centerZ})`);

        // Create the Woodcutter serf
        this.createSerf(serfTypeToSpawn, centerX, centerZ);
    }

    createSerf(type, gridX, gridY) {
        if (this.serfs.length >= this.maxSerfs) {
            console.log("Max serf limit reached.");
            return null;
        }

        this.serfIdCounter++;
        const serfId = `serf-${this.serfIdCounter}`;
        
        // Serf constructor expects: id, gridX, gridY, type, scene, mapManager
        const newSerf = new Units.Serf(serfId, gridX, gridY, type, this.scene, this.gameMap);

        if (newSerf && newSerf.model) {
            this.serfs.push(newSerf);
            console.log(`${type} serf ${serfId} created at grid (${gridX}, ${gridY}). Model: ${newSerf.model.name}`);
            
            // Set a default drop-off point (e.g., their spawn point or a designated central spot)
            // For simplicity, let's use the map center as the drop-off for now.
            const dropOffGridX = Math.floor(this.gameMap.width / 2);
            const dropOffGridZ = Math.floor(this.gameMap.height / 2);
            newSerf.setDropOffPoint({ x: dropOffGridX, y: dropOffGridZ }); 
            // console.log(`Serf ${serfId} drop-off point set to: (${dropOffGridX}, ${dropOffGridZ})`);

            // Initial task assignment can be removed or changed if job assignment handles it
            // if (type === 'Woodcutter') { 
            //     newSerf.setTask('mine', { resourceType: RESOURCE_TYPES.WOOD });
            // }

            newSerf.job = null; // Initialize job property for the serf
            newSerf.hasTool = false; // Initialize tool status for the serf

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

        const idleSerfs = this.serfs.filter(serf => serf.state === SERF_ACTION_STATES.IDLE && !serf.job);
        const idleTransporters = this.serfs.filter(serf => 
            serf.serfType === SERF_PROFESSIONS.TRANSPORTER && 
            serf.state === SERF_ACTION_STATES.IDLE &&
            !serf.taskDetails && // Not already on a transport task
            Object.keys(serf.inventory).reduce((sum, key) => sum + serf.inventory[key], 0) === 0
        );

        // Prioritize assigning specific jobs first
        if (idleSerfs.length > 0) {
            this.tryAssignSerfsToProfessionJobs(idleSerfs);
        }

        // Then assign transport tasks to available transporters
        if (idleTransporters.length > 0) {
            this.tryAssignTransportTasksToIdleTransporters(idleTransporters);
        }
    }

    tryAssignSerfsToProfessionJobs(idleSerfs) {
        for (const building of this.constructionManager.placedBuildings) {
            if (!building.isConstructed || !building.info.jobSlots || building.workers.length >= building.info.jobSlots) {
                continue;
            }

            const requiredProfession = building.info.jobProfession;
            if (!requiredProfession) continue; // Skip buildings that don't define a profession (e.g. Castle)

            const requiredTool = building.info.requiredTool;

            for (let i = idleSerfs.length - 1; i >= 0; i--) {
                const serf = idleSerfs[i];
                if (serf.serfType === requiredProfession) {
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
                        // buildingModel.userData.buildingInstance is the new way to access building data
                        const taskDetails = {
                            buildingId: building.model.userData.buildingInstance.model.uuid, // Corrected path to uuid
                            buildingName: building.info.name,
                        };

                        // If the building is a Woodcutter's Hut, assign gather_resource_for_building
                        if (building.type === 'WOODCUTTERS_HUT' && building.info.producesResource) {
                            taskDetails.resourceType = building.info.producesResource; // e.g. WOOD
                            serf.setTask('gather_resource_for_building', taskDetails);
                            console.log(`Serf ${serf.id} (${serf.serfType}) assigned to GATHER from ${building.info.name}.`);
                        }
                        // For other professions that work directly at the building (not gathering from map)
                        // This part might need refinement based on specific professions that don't gather from the map
                        // but still have a primary building they are associated with.
                        // For now, the `gather_resource_for_building` is specific to Woodcutters.
                        // Other professions might get a generic 'work_at_building' or more specific tasks later.
                        // If not a woodcutter, they might just become active at the building without a specific sub-task yet
                        // or we assume their `work_at_building` task is set if they are not woodcutters.
                        // For now, let's ensure non-woodcutters also get a task if they are assigned to a building.
                        // This maintains the previous logic for general work_at_building tasks.
                        else {
                             serf.setTask('work_at_building', taskDetails);
                             console.log(`Serf ${serf.id} (${serf.serfType}) assigned to WORK AT ${building.info.name}.`);
                        }
                        
                        idleSerfs.splice(i, 1);
                        if (building.workers.length >= building.info.jobSlots) break;
                    }
                }
            }
            if (idleSerfs.length === 0) return;
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
}

// Export the class
export default SerfManager;
