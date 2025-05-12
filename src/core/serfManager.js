// src/core/serfManager.js
import * as THREE from 'three';
import * as Units from '../entities/units.js'; // For creating serf 3D models
import * as ResourceModels from '../entities/resources.js'; // Import all resource model creators
import resourceManager, { RESOURCE_TYPES } from './resourceManager.js'; // For tool/food checks
import { TERRAIN_TYPES, TILE_SIZE } from './MapManager.js'; 
import { findPathAStar } from '../utils/pathfinding.js'; // Import A*

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
    PIG_FARMER: 'Pig Farmer',
    BUTCHER: 'Butcher',
    SAWMILL_WORKER: 'Sawmill Worker',
    SMELTER_WORKER: 'Smelter Worker',
    GOLDSMITH: 'Goldsmith',
    TOOLMAKER: 'Toolmaker',
    BLACKSMITH: 'Blacksmith',
    GEOLOGIST: 'Geologist',
    // KNIGHT is a military unit, handled separately
};

// Mapping professions to their 3D model creation functions from units.js
const SERF_MODEL_CREATORS = {
    [SERF_PROFESSIONS.TRANSPORTER]: Units.createTransporter,
    [SERF_PROFESSIONS.BUILDER]: Units.createBuilder,
    [SERF_PROFESSIONS.WOODCUTTER]: Units.createWoodcutter,
    [SERF_PROFESSIONS.FORESTER]: Units.createForester,
    [SERF_PROFESSIONS.STONEMASON]: Units.createStonemason,
    [SERF_PROFESSIONS.MINER]: Units.createMiner,
    [SERF_PROFESSIONS.FARMER]: Units.createFarmer,
    [SERF_PROFESSIONS.FISHERMAN]: Units.createFisherman,
    [SERF_PROFESSIONS.MILLER]: Units.createMiller,
    [SERF_PROFESSIONS.BAKER]: Units.createBaker,
    [SERF_PROFESSIONS.PIG_FARMER]: Units.createPigFarmer,
    [SERF_PROFESSIONS.BUTCHER]: Units.createButcher,
    [SERF_PROFESSIONS.SAWMILL_WORKER]: Units.createSawmillWorker,
    [SERF_PROFESSIONS.SMELTER_WORKER]: Units.createSmelterWorker,
    [SERF_PROFESSIONS.GOLDSMITH]: Units.createGoldsmith,
    [SERF_PROFESSIONS.TOOLMAKER]: Units.createToolmaker,
    [SERF_PROFESSIONS.BLACKSMITH]: Units.createBlacksmith,
    [SERF_PROFESSIONS.GEOLOGIST]: Units.createGeologist,
};

class SerfManager {
    constructor(scene, gameMap) {
        this.scene = scene;
        this.gameMap = gameMap;
        this.serfs = [];
        this.maxSerfs = 50; // Example limit
        this.serfIdCounter = 0;
        this.serfVisualsGroup = new THREE.Group();
        this.serfVisualsGroup.name = "SerfVisuals";
        // this.scene.add(this.serfVisualsGroup); // Will be added via gameElementsGroup in main.js
        // The SerfManager needs a way to return this group to main.js
        // Or main.js needs to retrieve it. For now, let's assume main.js will handle adding it.
        // This change means main.js needs to be updated to add serfManager.serfVisualsGroup to gameElementsGroup.

        // For now, spawn a few initial serfs (e.g., Transporters)
        this.spawnInitialSerfs(5);
    }

    spawnInitialSerfs(count) {
        for (let i = 0; i < count; i++) {
            // Spawn near castle (assuming castle is at or near 0,0 for now)
            const castlePosition = new THREE.Vector3(0, 0, 2); // Example spawn point
            this.createSerf(SERF_PROFESSIONS.TRANSPORTER, castlePosition);
        }
    }

    createSerf(profession = SERF_PROFESSIONS.TRANSPORTER, position = new THREE.Vector3(0,0,0)) {
        if (this.serfs.length >= this.maxSerfs) {
            console.warn("Max serf limit reached.");
            return null;
        }

        const modelCreator = SERF_MODEL_CREATORS[profession];
        if (!modelCreator) {
            console.error(`No model creator for profession: ${profession}`);
            return null;
        }

        const serfModel = modelCreator();
        serfModel.position.set(position.x, 0, position.z); // Serf models have origin at their base
        // serfModel.scale.set(1.5, 1.5, 1.5); // Removed, relying on base geometry size now

        const serfData = {
            id: this.serfIdCounter++,
            model: serfModel,
            profession: profession,
            state: 'idle', // Changed from 'task'. States: 'idle', 'moving_to_job', 'working', 'seeking_resource_node', 'moving_to_resource_node', 'gathering_resource', 'returning_resource'
            target: null, // Target Vector3, building object, or resource node object
            path: [], 
            currentJob: null, 
            targetResourceNode: null, // e.g., {x, z, type: 'tree'}
            gatheringTimer: 0,
            gatheringDuration: 5, // seconds to gather resource
            hasResource: false, // Tracks if serf is carrying a resource
            serfSpeed: 1.0, // World units per second
            // TODO: Add tool requirements, food needs, etc.
        };

        this.serfs.push(serfData);
        this.serfVisualsGroup.add(serfModel);
        console.log(`${profession} serf created with ID ${serfData.id} at (${position.x}, ${position.z})`);
        return serfData;
    }

    // TODO: Job assignment logic
    findAvailableJob(serf) {
        // This needs access to constructionManager.placedBuildings
        // For now, this will be called from main.js where both managers are available
        // This function will be more complex, considering serf profession, proximity, etc.
        // Simplified: find any building with an available job slot that matches serf's base profession (or if serf is Transporter, can take any)
        
        // This method should ideally be part of a higher-level game manager or passed placedBuildings
        return null; 
    }

    assignSerfToBuilding(serf, buildingData) {
        if (buildingData.jobSlotsAvailable > 0) {
            const jobInfo = buildingData.info;

            // Check for required tool
            if (jobInfo.requiredTool) {
                if (resourceManager.getResourceCount(jobInfo.requiredTool) > 0) {
                    resourceManager.removeResource(jobInfo.requiredTool, 1); // Consume one tool
                    console.log(`Serf ID ${serf.id} consumed 1 ${jobInfo.requiredTool} for ${jobInfo.name}.`);
                } else {
                    // hide this log to help browser reading logs
                    //console.warn(`Serf ID ${serf.id} cannot take job at ${jobInfo.name}. Missing tool: ${jobInfo.requiredTool}`);
                    // alert(`Cannot assign serf: Missing ${jobInfo.requiredTool}`); // UI feedback
                    return false; // Cannot assign job, missing tool
                }
            }

            serf.currentJob = buildingData; 
            serf.profession = jobInfo.jobProfession; 
            // TODO: Update serf model if visual changes with profession. 
            // This would involve removing old model, creating new one with SERF_MODEL_CREATORS[newProfession]
            // and adding it back to serfVisualsGroup. For now, model remains Transporter.
            
            buildingData.workers.push(serf.id);
            buildingData.jobSlotsAvailable--;
            
            console.log(`ASSIGN LOG: Serf ID ${serf.id} (Prof: ${serf.profession}) BEFORE state change. Current state: ${serf.state}`);
            serf.state = 'working'; 
            console.log(`ASSIGN LOG: Serf ID ${serf.id} (Prof: ${serf.profession}) AFTER state change. New state: ${serf.state}`);
            
            // Temporarily remove food check 
            // if (jobInfo.consumesFood && jobInfo.foodCheckIntervalMs) {
            //     serf.lastFoodCheckTime = Date.now();
            // }
            serf.model.position.set(buildingData.x, 0, buildingData.z + 1); // Restore teleport to job site
            console.log(`Serf ID ${serf.id} teleported to job site: (${buildingData.x.toFixed(1)}, ${buildingData.z.toFixed(1) + 1})`);
            return true;
        }
        // console.log(`--- assignSerfToBuilding returning false for Serf ID ${serf.id}, building ${buildingData.info.name} ---`);
        return false;
    }


    update(deltaTime, placedBuildings) { 
        this.serfs.forEach(serf => {
            // Job seeking logic (simplified)
            if (serf.state === 'idle') {
                if (serf.profession === SERF_PROFESSIONS.TRANSPORTER) { 
                    for (const building of placedBuildings) {
                        if (building.isConstructed && building.info.jobSlots && building.jobSlotsAvailable > 0) {
                            if (this.assignSerfToBuilding(serf, building)) {
                                console.log(`Serf ID ${serf.id} just got assigned to ${building.info.name}. Profession: ${serf.profession}, State: ${serf.state}`);
                                break; 
                            }
                        }
                    }
                }
            }

            // Woodcutter specific logic for finding, gathering, and returning resources
            if (serf.profession === SERF_PROFESSIONS.WOODCUTTER && serf.currentJob) {
                console.log(`DEBUG: Serf ID ${serf.id} is a Woodcutter with a job. Current state: ${serf.state}`); 
                if (serf.state === 'working' || serf.state === 'idle') { // If idle but has Woodcutter job, start seeking
                    serf.state = 'seeking_resource_node';
                    console.log(`Serf ID ${serf.id} (Woodcutter at ${serf.currentJob.info.name}) is now seeking a tree. Old state: ${serf.state === 'working' ? 'working' : 'idle'}`);
                }

                if (serf.state === 'seeking_resource_node') {
                    if (!serf.targetResourceNode) {
                        const searchRadius = 10; 
                        const buildingPos = serf.currentJob.model.position;
                        const buildingWorldX = buildingPos.x;
                        const buildingWorldZ = buildingPos.z;
                        
                        // Convert building's world coordinates to grid coordinates
                        const buildingGridX = Math.round(buildingWorldX / TILE_SIZE + (this.gameMap.width - 1) / 2); // Used imported TILE_SIZE
                        const buildingGridZ = Math.round(buildingWorldZ / TILE_SIZE + (this.gameMap.height - 1) / 2); // Used imported TILE_SIZE
                        console.log(`Serf ID ${serf.id} searching for tree. Hut at world (${buildingWorldX.toFixed(1)}, ${buildingWorldZ.toFixed(1)}), grid (${buildingGridX}, ${buildingGridZ}). Radius: ${searchRadius}`);
                        
                        let foundTree = false;
                        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                            for (let dz = -searchRadius; dz <= searchRadius; dz++) {
                                const targetGridX = buildingGridX + dx;
                                const targetGridZ = buildingGridZ + dz;
                                // console.log(`Checking grid (${targetGridX}, ${targetGridZ})`); // Optional: very verbose
                                const tile = this.gameMap.getTile(targetGridX, targetGridZ); 
                                
                                // Check if the tile is a forest and, if resource amounts are tracked, has resources
                                if (tile && tile.terrainType === TERRAIN_TYPES.FOREST) {
                                    // If resourceAmount is available and 0, skip this tile
                                    if (typeof tile.resourceAmount === 'number' && tile.resourceAmount <= 0) {
                                        // console.log(`Serf ID ${serf.id} found depleted tree at (${targetGridX}, ${targetGridZ}). Skipping.`);
                                        continue; // Skip this depleted forest tile
                                    }

                                    // Convert target grid coordinates back to world coordinates for the serf's target
                                    const treeWorldX = (targetGridX - (this.gameMap.width - 1) / 2) * TILE_SIZE; 
                                    const treeWorldZ = (targetGridZ - (this.gameMap.height - 1) / 2) * TILE_SIZE; 
                                    
                                    serf.targetResourceNode = { 
                                        gridX: targetGridX, // Store grid coords for reference
                                        gridZ: targetGridZ,
                                        worldX: treeWorldX, 
                                        worldZ: treeWorldZ,
                                        type: 'tree'
                                    };
                                    
                                    // Attempt to pathfind immediately
                                    const startGridX = Math.round(serf.model.position.x / TILE_SIZE + (this.gameMap.width - 1) / 2);
                                    const startGridZ = Math.round(serf.model.position.z / TILE_SIZE + (this.gameMap.height - 1) / 2);
                                    console.log(`Serf ID ${serf.id} (Woodcutter) found tree at grid (${targetGridX}, ${targetGridZ}). Attempting path from (${startGridX},${startGridZ}).`);
                                    const path = findPathAStar({x: startGridX, y: startGridZ}, {x: targetGridX, y: targetGridZ}, this.gameMap, TERRAIN_TYPES);

                                    if (path && path.length > 0) {
                                        serf.path = path;
                                        serf.state = 'following_path'; 
                                        console.log(`Serf ID ${serf.id} (Woodcutter) path to tree found. Length: ${serf.path.length}. State: ${serf.state}.`);
                                        foundTree = true; // Commit to this tree
                                        break; 
                                    } else {
                                        // console.log(`Serf ID ${serf.id} (Woodcutter) found tree at (${targetGridX},${targetGridZ}) but no path. Continuing search.`);
                                        serf.targetResourceNode = null; // Clear invalid target
                                    }
                                }
                            }
                            if (foundTree) break;
                        }
                        if (!foundTree) {
                            console.log(`Serf ID ${serf.id} (Woodcutter) found no pathable trees nearby. Idling at ${serf.currentJob.info.name}.`);
                            serf.state = 'idle'; 
                        }
                    }
                } else if (serf.state === 'following_path') { // This state is now entered from seeking or returning
                    if (!serf.path || serf.path.length === 0) {
                        if (serf.targetResourceNode && !serf.hasResource) { 
                            console.log(`Serf ID ${serf.id} (${serf.profession}) arrived at resource node. State: gathering_resource.`);
                            serf.state = 'gathering_resource'; serf.gatheringTimer = 0;
                        } else if (serf.currentJob && serf.hasResource) { 
                             console.log(`Serf ID ${serf.id} (${serf.profession}) arrived at ${serf.currentJob.info.name} to deposit. State: depositing_resource.`);
                             serf.state = 'depositing_resource';
                        } else {
                            console.warn(`Serf ID ${serf.id} finished path but unclear next state. Idling.`);
                            serf.state = 'idle';
                        }
                        serf.target = null; // Clear movement target
                        return; // End update for this serf this tick
                    }

                    const nextWaypointGrid = serf.path[0];
                    const nextWaypointWorldX = (nextWaypointGrid.x - (this.gameMap.width - 1) / 2) * TILE_SIZE;
                    const nextWaypointWorldZ = (nextWaypointGrid.y - (this.gameMap.height - 1) / 2) * TILE_SIZE;
                    
                    const targetPosition = new THREE.Vector3(nextWaypointWorldX, 0, nextWaypointWorldZ);
                    const direction = targetPosition.clone().sub(serf.model.position).normalize();
                    const distanceToWaypoint = serf.model.position.distanceTo(targetPosition);
                    const moveDistance = serf.serfSpeed * deltaTime;

                    if (distanceToWaypoint <= moveDistance || distanceToWaypoint < 0.05) { // Reached waypoint (or very close)
                        serf.model.position.copy(targetPosition);
                        serf.path.shift(); // Remove waypoint from path
                        // console.log(`Serf ID ${serf.id} reached waypoint. Path remaining: ${serf.path.length}`);
                    } else {
                        serf.model.position.add(direction.multiplyScalar(moveDistance));
                        // Optional: serf.model.lookAt(targetPosition); // Make serf face direction of movement
                    }
                } else if (serf.state === 'gathering_resource') {
                    if (!serf.targetResourceNode) { 
                        console.warn(`Serf ID ${serf.id} in gathering_resource state without targetResourceNode. Resetting to seeking.`);
                        serf.state = 'seeking_resource_node';
                    } else {
                        // Log current target at the beginning of each gathering tick
                        console.log(`DEBUG GATHER: Serf ID ${serf.id} (${serf.profession}) gathering at (${serf.targetResourceNode.gridX}, ${serf.targetResourceNode.gridZ}). Timer: ${serf.gatheringTimer.toFixed(1)}`);
                        
                        serf.gatheringTimer += deltaTime;
                        if (serf.gatheringTimer >= serf.gatheringDuration) {
                            console.log(`Serf ID ${serf.id} (${serf.profession}) finished gathering at node: grid(${serf.targetResourceNode.gridX}, ${serf.targetResourceNode.gridZ}).`);
                            
                            // Attempt to deplete the node on the map
                            if (this.gameMap && typeof this.gameMap.depleteResourceNode === 'function') {
                                const remaining = this.gameMap.depleteResourceNode(serf.targetResourceNode.gridX, serf.targetResourceNode.gridZ, 1);
                                if (remaining <= 0) {
                                    console.log(`Serf ID ${serf.id} noted that node (${serf.targetResourceNode.gridX}, ${serf.targetResourceNode.gridZ}) is now depleted.`);
                                }
                            } else {
                                console.warn("SerfManager: gameMap.depleteResourceNode method not found. Node depletion on map skipped.");
                            }

                            serf.hasResource = true; 
                            
                            // Create and attach log model
                            if (!serf.carriedItemMesh) {
                                const logMesh = ResourceModels.createWoodLog();
                                logMesh.scale.set(0.5, 0.5, 0.5); // Make it smaller to fit serf
                                // Position on serf's back (approximate)
                                // The log model from resources.js is oriented along its local Y axis.
                                // To lay it flat on back, rotate its local X by 90 deg.
                                // Then adjust Y (up/down on serf) and Z (forward/backward on serf).
                                logMesh.rotation.x = Math.PI / 2; 
                                logMesh.position.set(0, 0.25, -0.15); // x=0 (centered), y=up a bit, z=slightly behind
                                serf.model.add(logMesh);
                                serf.carriedItemMesh = logMesh;
                                console.log(`Serf ID ${serf.id} picked up a log.`);
                            }

                            serf.targetResourceNode = null; // Clear target resource, will find new one or path back
                            serf.gatheringTimer = 0;
                            serf.state = 'returning_resource'; // This state will now initiate pathfinding
                            // Target for returning is the hut itself
                            serf.target = serf.currentJob.model.position.clone(); // World coordinates of the hut
                            console.log(`Serf ID ${serf.id} (Woodcutter) needs to return to ${serf.currentJob.info.name} with resource. State: ${serf.state}.`);
                        }
                    }
                } else if (serf.state === 'returning_resource') { // New state logic for pathfinding back
                     if (!serf.path || serf.path.length === 0) { // Calculate path if not already doing so
                        const startGridX = Math.round(serf.model.position.x / TILE_SIZE + (this.gameMap.width - 1) / 2);
                        const startGridZ = Math.round(serf.model.position.z / TILE_SIZE + (this.gameMap.height - 1) / 2);
                        
                        const hutWorldPos = serf.currentJob.model.position;
                        const endGridX = Math.round(hutWorldPos.x / TILE_SIZE + (this.gameMap.width - 1) / 2);
                        const endGridZ = Math.round(hutWorldPos.z / TILE_SIZE + (this.gameMap.height - 1) / 2);
                        // Target one step before hut to avoid standing on it. e.g. hutGridZ +1 if space
                        // For simplicity, target hut's grid cell for now.
                        
                        console.log(`Serf ID ${serf.id} calculating path from (${startGridX},${startGridZ}) to hut at (${endGridX},${endGridZ})`);
                        serf.path = findPathAStar({x: startGridX, y: startGridZ}, {x: endGridX, y: endGridZ}, this.gameMap, TERRAIN_TYPES);

                        if (serf.path && serf.path.length > 0) {
                            console.log(`Serf ID ${serf.id} path to hut found. Length: ${serf.path.length}.`);
                            serf.state = 'following_path'; 
                        } else {
                            console.warn(`Serf ID ${serf.id} could not find path to hut. Stuck? Teleporting for now.`);
                            // Fallback to teleport if no path (should be rare with open maps)
                            serf.model.position.set(hutWorldPos.x, 0, hutWorldPos.z + 1); // Near hut
                            serf.state = 'depositing_resource';
                        }
                    }
                } else if (serf.state === 'depositing_resource') {
                    console.log(`Serf ID ${serf.id} (Woodcutter) deposited resource at ${serf.currentJob.info.name}.`);
                    serf.hasResource = false;
                    
                    // Remove and dispose of carried log model
                    if (serf.carriedItemMesh) {
                        serf.model.remove(serf.carriedItemMesh);
                        if (serf.carriedItemMesh.geometry) serf.carriedItemMesh.geometry.dispose();
                        if (serf.carriedItemMesh.material) { // Material might be an array
                            if (Array.isArray(serf.carriedItemMesh.material)) {
                                serf.carriedItemMesh.material.forEach(m => m.dispose());
                            } else {
                                serf.carriedItemMesh.material.dispose();
                            }
                        }
                        // If the log itself is a group with multiple meshes, iterate and dispose
                        serf.carriedItemMesh.traverse((object) => {
                            if (object.isMesh) {
                                if (object.geometry) object.geometry.dispose();
                                if (object.material) {
                                     if (Array.isArray(object.material)) {
                                        object.material.forEach(m => m.dispose());
                                    } else {
                                        object.material.dispose();
                                    }
                                }
                            }
                        });
                        serf.carriedItemMesh = null;
                        console.log(`Serf ID ${serf.id} dropped off the log.`);
                    }

                    // The building's updateProduction will handle adding the resource.
                    serf.state = 'working'; // Go back to 'working' state to seek new tree or idle if none
                }
            } else if (serf.profession === SERF_PROFESSIONS.STONEMASON && serf.currentJob) {
                console.log(`DEBUG: Serf ID ${serf.id} is a Stonemason with a job. Current state: ${serf.state}`);
                if (serf.state === 'working' || serf.state === 'idle') {
                    serf.state = 'seeking_resource_node';
                    console.log(`Serf ID ${serf.id} (Stonemason at ${serf.currentJob.info.name}) is now seeking a mountain. Old state: ${serf.state === 'working' ? 'working' : 'idle'}`);
                }

                if (serf.state === 'seeking_resource_node') {
                    if (!serf.targetResourceNode) {
                        const searchRadius = 10; 
                        const buildingPos = serf.currentJob.model.position;
                        const buildingWorldX = buildingPos.x;
                        const buildingWorldZ = buildingPos.z;
                        const buildingGridX = Math.round(buildingWorldX / TILE_SIZE + (this.gameMap.width - 1) / 2);
                        const buildingGridZ = Math.round(buildingWorldZ / TILE_SIZE + (this.gameMap.height - 1) / 2);
                        console.log(`Serf ID ${serf.id} (Stonemason) searching for mountain. Quarry at world (${buildingWorldX.toFixed(1)}, ${buildingWorldZ.toFixed(1)}), grid (${buildingGridX}, ${buildingGridZ}). Radius: ${searchRadius}`);
                        
                        let foundMountain = false;
                        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                            for (let dz = -searchRadius; dz <= searchRadius; dz++) {
                                const targetGridX = buildingGridX + dx;
                                const targetGridZ = buildingGridZ + dz;
                                const tile = this.gameMap.getTile(targetGridX, targetGridZ);
                                
                                if (tile && tile.terrainType === TERRAIN_TYPES.MOUNTAIN) {
                                    // Future: Check if mountain tile has stone resources if depletion is added for stone
                                    // if (typeof tile.resourceAmount === 'number' && tile.resourceAmount <= 0) continue;

                                    const mountainWorldX = (targetGridX - (this.gameMap.width - 1) / 2) * TILE_SIZE;
                                    const mountainWorldZ = (targetGridZ - (this.gameMap.height - 1) / 2) * TILE_SIZE;
                                    
                                    serf.targetResourceNode = { 
                                        gridX: targetGridX, gridZ: targetGridZ,
                                        worldX: mountainWorldX, worldZ: mountainWorldZ,
                                        type: 'mountain'
                                    };
                                    
                                    const startGridX = Math.round(serf.model.position.x / TILE_SIZE + (this.gameMap.width - 1) / 2);
                                    const startGridZ = Math.round(serf.model.position.z / TILE_SIZE + (this.gameMap.height - 1) / 2);
                                    console.log(`Serf ID ${serf.id} (Stonemason) found mountain at grid (${targetGridX}, ${targetGridZ}). Attempting path from (${startGridX},${startGridZ}).`);
                                    const path = findPathAStar({x: startGridX, y: startGridZ}, {x: targetGridX, y: targetGridZ}, this.gameMap, TERRAIN_TYPES);

                                    if (path && path.length > 0) {
                                        serf.path = path;
                                        serf.state = 'following_path';
                                        console.log(`Serf ID ${serf.id} (Stonemason) path to mountain found. Length: ${serf.path.length}. State: ${serf.state}.`);
                                        foundMountain = true; // Commit to this mountain
                                        break;
                                    } else {
                                        // console.log(`Serf ID ${serf.id} (Stonemason) found mountain at (${targetGridX},${targetGridZ}) but no path. Continuing search.`);
                                        serf.targetResourceNode = null; // Clear invalid target
                                    }
                                }
                            }
                            if (foundMountain) break;
                        }
                        if (!foundMountain) {
                            console.log(`Serf ID ${serf.id} (Stonemason) found no pathable mountains nearby. Idling at ${serf.currentJob.info.name}.`);
                            serf.state = 'idle';
                        }
                    }
                // Note: 'moving_to_resource_node' state is removed as path calculation is now in 'seeking_resource_node'
                // 'following_path' state is now entered from 'seeking_resource_node' or 'returning_resource'
                } else if (serf.state === 'following_path') { 
                    if (!serf.path || serf.path.length === 0) {
                        if (serf.targetResourceNode && !serf.hasResource) { 
                            console.log(`Serf ID ${serf.id} (${serf.profession}) arrived at resource node. State: gathering_resource.`);
                            serf.state = 'gathering_resource'; serf.gatheringTimer = 0;
                        } else if (serf.currentJob && serf.hasResource) { 
                             console.log(`Serf ID ${serf.id} (${serf.profession}) arrived at ${serf.currentJob.info.name} to deposit. State: depositing_resource.`);
                             serf.state = 'depositing_resource';
                        } else { serf.state = 'idle'; }
                        serf.target = null; return;
                    }
                    const nextWaypointGrid = serf.path[0];
                    const nextWaypointWorldX = (nextWaypointGrid.x - (this.gameMap.width - 1) / 2) * TILE_SIZE;
                    const nextWaypointWorldZ = (nextWaypointGrid.y - (this.gameMap.height - 1) / 2) * TILE_SIZE;
                    const targetPosition = new THREE.Vector3(nextWaypointWorldX, 0, nextWaypointWorldZ);
                    const direction = targetPosition.clone().sub(serf.model.position).normalize();
                    const distanceToWaypoint = serf.model.position.distanceTo(targetPosition);
                    const moveDistance = serf.serfSpeed * deltaTime;
                    if (distanceToWaypoint <= moveDistance || distanceToWaypoint < 0.05) {
                        serf.model.position.copy(targetPosition); serf.path.shift();
                    } else {
                        serf.model.position.add(direction.multiplyScalar(moveDistance));
                    }
                } else if (serf.state === 'gathering_resource') {
                     if (!serf.targetResourceNode) { 
                        console.warn(`Serf ID ${serf.id} (${serf.profession}) in gathering_resource without target. Resetting.`);
                        serf.state = 'seeking_resource_node';
                    } else {
                        serf.gatheringTimer += deltaTime;
                        if (serf.gatheringTimer >= serf.gatheringDuration) {
                            console.log(`Serf ID ${serf.id} (${serf.profession}) finished gathering at node: grid(${serf.targetResourceNode.gridX}, ${serf.targetResourceNode.gridZ}).`);
                            // Placeholder for map depletion call
                            if (this.gameMap && typeof this.gameMap.depleteResourceNode === 'function') {
                                 this.gameMap.depleteResourceNode(serf.targetResourceNode.gridX, serf.targetResourceNode.gridZ, 1);
                            } else {
                                console.warn(`SerfManager: gameMap.depleteResourceNode method not found (Profession: ${serf.profession}).`);
                            }
                            serf.hasResource = true;
                            if (!serf.carriedItemMesh) {
                                let itemMesh;
                                if (serf.profession === SERF_PROFESSIONS.STONEMASON) {
                                    itemMesh = ResourceModels.createStoneBlock();
                                    itemMesh.scale.set(0.15, 0.15, 0.15); // Stone block might be larger
                                    itemMesh.position.set(0, 0.3, 0); // Adjust as needed
                                }
                                // Add other professions here
                                if (itemMesh) {
                                    serf.model.add(itemMesh);
                                    serf.carriedItemMesh = itemMesh;
                                    console.log(`Serf ID ${serf.id} picked up a resource item.`);
                                }
                            }
                            serf.targetResourceNode = null; 
                            serf.gatheringTimer = 0;
                            serf.state = 'returning_resource';
                            serf.target = serf.currentJob.model.position.clone();
                            console.log(`Serf ID ${serf.id} (${serf.profession}) needs to return to ${serf.currentJob.info.name}. State: ${serf.state}.`);
                        }
                    }
                } else if (serf.state === 'returning_resource') { // Shared pathfinding initiation
                    if (!serf.path || serf.path.length === 0) {
                        const startGridX = Math.round(serf.model.position.x / TILE_SIZE + (this.gameMap.width - 1) / 2);
                        const startGridZ = Math.round(serf.model.position.z / TILE_SIZE + (this.gameMap.height - 1) / 2);
                        const hutWorldPos = serf.currentJob.model.position;
                        const endGridX = Math.round(hutWorldPos.x / TILE_SIZE + (this.gameMap.width - 1) / 2);
                        const endGridZ = Math.round(hutWorldPos.z / TILE_SIZE + (this.gameMap.height - 1) / 2);
                        console.log(`Serf ID ${serf.id} (${serf.profession}) calculating path from (${startGridX},${startGridZ}) to hut at (${endGridX},${endGridZ})`);
                        serf.path = findPathAStar({x: startGridX, y: startGridZ}, {x: endGridX, y: endGridZ}, this.gameMap, TERRAIN_TYPES);
                        if (serf.path && serf.path.length > 0) {
                            serf.state = 'following_path';
                        } else {
                            console.warn(`Serf ID ${serf.id} (${serf.profession}) could not find path to hut. Teleporting.`);
                            serf.model.position.set(hutWorldPos.x, 0, hutWorldPos.z + 1); 
                            serf.state = 'depositing_resource';
                        }
                    }
                } else if (serf.state === 'depositing_resource') {
                    console.log(`Serf ID ${serf.id} (${serf.profession}) deposited resource at ${serf.currentJob.info.name}.`);
                    serf.hasResource = false;
                    if (serf.carriedItemMesh) {
                        serf.model.remove(serf.carriedItemMesh);
                        serf.carriedItemMesh.traverse(o => { if(o.isMesh) { o.geometry.dispose(); o.material.dispose(); }});
                        serf.carriedItemMesh = null;
                        console.log(`Serf ID ${serf.id} dropped off the resource item.`);
                    }
                    serf.state = 'working'; 
                }
            }
            
            // Generic 'working' state logic (like food consumption for non-resource gathering jobs)
            // This is for serfs whose job is AT the building (e.g., Miller, Baker)
            // Woodcutters are handled above and their 'working' state is a transition to 'seeking_resource_node'.
            // This needs to be distinct from the woodcutter's 'working' state which is a precursor to seeking.
            // Let's assume 'working' for other jobs means they are at the building and consuming food.
            if (serf.model && serf.state === 'working' && serf.currentJob && serf.profession !== SERF_PROFESSIONS.WOODCUTTER) {
                const jobInfo = serf.currentJob.info;
                // Make food consumption generic for any profession that defines it
                if (jobInfo.consumesFood && jobInfo.foodConsumptionRate && jobInfo.foodCheckIntervalMs) {
                    const now = Date.now();
                    if (now >= (serf.lastFoodCheckTime || 0) + jobInfo.foodCheckIntervalMs) {
                        let foodConsumed = false;
                        for (const foodType of jobInfo.consumesFood) {
                            if (resourceManager.getResourceCount(foodType) >= jobInfo.foodConsumptionRate) {
                                resourceManager.removeResource(foodType, jobInfo.foodConsumptionRate);
                                console.log(`Serf ID ${serf.id} (${serf.profession}) consumed ${jobInfo.foodConsumptionRate} ${foodType}.`);
                                serf.lastFoodCheckTime = now;
                                foodConsumed = true;
                                break; 
                            }
                        }
                        if (!foodConsumed) {
                            console.warn(`Serf ID ${serf.id} (${serf.profession}) at ${jobInfo.name} has no food! Stopping work.`);
                            serf.state = 'idle'; // Changed from 'task'
                            const building = serf.currentJob;
                            const workerIndex = building.workers.indexOf(serf.id);
                            if (workerIndex > -1) {
                                building.workers.splice(workerIndex, 1);
                            }
                            building.jobSlotsAvailable++;
                            serf.currentJob = null; 
                            // TODO: Serf should ideally move away or show a status
                        }
                    }
                }
            }
        });
    }
}

// Export the class, not an instance, so it can be instantiated with scene and gameMap in main.js
export default SerfManager;
