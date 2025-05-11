// src/core/serfManager.js
import * as THREE from 'three';
import * as Units from '../entities/units.js'; // For creating serf 3D models
import resourceManager, { RESOURCE_TYPES } from './resourceManager.js'; // For tool/food checks

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
            task: null, // e.g., 'moving', 'working', 'idle'
            target: null, // Target Vector3 or building object
            path: [], // Array of Vector3 for pathfinding
            currentJob: null, // Reference to job object or building
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
            
            serf.task = 'working'; 
            console.log(`Serf ID ${serf.id} (now ${serf.profession}) assigned to ${jobInfo.name}. Slots left: ${buildingData.jobSlotsAvailable}`);
            
            // Initialize food check timer if job consumes food
            if (jobInfo.consumesFood && jobInfo.foodCheckIntervalMs) {
                serf.lastFoodCheckTime = Date.now();
            }

            serf.model.position.set(buildingData.x, 0, buildingData.z + 1); 
            return true;
        }
        return false;
    }


    update(deltaTime, placedBuildings) { // Pass placedBuildings from constructionManager
        this.serfs.forEach(serf => {
            if (serf.task === null || serf.task === 'idle') {
                // Try to find a job if idle (and currently a Transporter, or logic to switch professions)
                if (serf.profession === SERF_PROFESSIONS.TRANSPORTER) { // Basic: only transporters look for jobs for now
                    for (const building of placedBuildings) {
                        if (building.isConstructed && building.info.jobSlots && building.jobSlotsAvailable > 0) {
                            // Check if serf can do this job (e.g. based on current profession or if it's a general labor job)
                            // For now, any transporter can become the required profession
                            if (this.assignSerfToBuilding(serf, building)) {
                                break; // Serf found a job
                            }
                        }
                    }
                }
            }
            
            // Basic placeholder movement or task update
            if (serf.model && serf.task === 'working' && serf.currentJob) {
                // Food consumption logic for working serfs
                const jobInfo = serf.currentJob.info;
                // Make food consumption generic for any profession that defines it
                if (jobInfo.consumesFood && jobInfo.foodConsumptionRate && jobInfo.foodCheckIntervalMs) {
                    const now = Date.now();
                    if (now >= (serf.lastFoodCheckTime || 0) + jobInfo.foodCheckIntervalMs) {
                        let foodConsumed = false;
                        for (const foodType of jobInfo.consumesFood) {
                            if (resourceManager.getResourceCount(foodType) >= jobInfo.foodConsumptionRate) {
                                resourceManager.removeResource(foodType, jobInfo.foodConsumptionRate);
                                console.log(`Serf ID ${serf.id} (Miner) consumed ${jobInfo.foodConsumptionRate} ${foodType}.`);
                                serf.lastFoodCheckTime = now;
                                foodConsumed = true;
                                break; 
                            }
                        }
                        if (!foodConsumed) {
                            console.warn(`Serf ID ${serf.id} (${serf.profession}) at ${jobInfo.name} has no food! Stopping work.`);
                            serf.task = 'idle'; // Becomes idle, stops working
                            // Remove serf from building's worker list
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
