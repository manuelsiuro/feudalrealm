// src/core/serfManager.js
import * as THREE from 'three';
// Import SERF_MODEL_CREATORS directly from units.js
import * as Units from '../entities/units.js'; 
import { SERF_ACTION_STATES } from '../entities/units.js'; // Import SERF_ACTION_STATES directly
import * as ResourceModels from '../entities/resources.js'; // Import all resource model creators
import resourceManager, { RESOURCE_TYPES } from './resourceManager.js'; // For tool/food checks
import { TERRAIN_TYPES, TILE_SIZE } from './MapManager.js'; 
import { findPathAStar } from '../utils/pathfinding.js'; // Import A*
import { createCastle } from '../entities/buildings.js'; // Added import for createCastle

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

    update(deltaTime) { // Removed placedBuildings as it's not used in this simplified version
        this.serfs.forEach(serf => {
            if (serf.update) { // Ensure serf has an update method
                serf.update(deltaTime);
            }
        });
        this.tryAssignSerfsToJobs(); // Call job assignment logic periodically
    }

    tryAssignSerfsToJobs() {
        if (!this.constructionManager) return;

        const idleSerfs = this.serfs.filter(serf => serf.state === SERF_ACTION_STATES.IDLE && !serf.job); // Use direct import
        if (idleSerfs.length === 0) return;

        for (const building of this.constructionManager.placedBuildings) {
            if (building.isConstructed && building.info.jobSlots > 0 && building.workers.length < building.info.jobSlots) {
                const requiredProfession = building.info.jobProfession;
                const requiredTool = building.info.requiredTool;

                for (let i = idleSerfs.length - 1; i >= 0; i--) { // Iterate backwards for safe removal
                    const serf = idleSerfs[i];
                    if (serf.serfType === requiredProfession) {
                        // Check for tool availability
                        let hasRequiredTool = !requiredTool; // If no tool is required, proceed
                        if (requiredTool) {
                            if (resourceManager.getResourceCount(requiredTool) > 0) {
                                if (resourceManager.removeResource(requiredTool, 1)) {
                                    hasRequiredTool = true;
                                    serf.hasTool = true; // Mark serf as having the tool
                                    console.log(`Serf ${serf.id} acquired ${requiredTool} for ${building.info.name}.`);
                                } else {
                                    console.warn(`Failed to remove ${requiredTool} from resourceManager for Serf ${serf.id}, though count was > 0.`);
                                }
                            } else {
                                // console.log(`Tool ${requiredTool} not available for ${building.info.name}.`);
                            }
                        }

                        if (hasRequiredTool) {
                            // Assign serf to building
                            building.workers.push(serf.id);
                            serf.job = building; // Assign building to serf's job property
                            // Convert building world coords (snappedX, snappedZ) to grid coords for dropoff
                            const buildingGridX = Math.round(building.x / TILE_SIZE + (this.gameMap.width - 1) / 2);
                            const buildingGridZ = Math.round(building.z / TILE_SIZE + (this.gameMap.height - 1) / 2);
                            serf.setDropOffPoint({ x: buildingGridX, y: buildingGridZ });
                            serf.setTask('work_at_building', { buildingId: building.model.uuid, buildingName: building.info.name });

                            console.log(`Serf ${serf.id} (${serf.serfType}) assigned to ${building.info.name} at grid (${buildingGridX}, ${buildingGridZ}). Workers: ${building.workers.length}/${building.info.jobSlots}`);
                            
                            idleSerfs.splice(i, 1); // Remove serf from idleSerfs list

                            if (building.workers.length >= building.info.jobSlots) break; // Building is full
                        }
                    }
                }
                if (idleSerfs.length === 0) return; // No more idle serfs to assign
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
