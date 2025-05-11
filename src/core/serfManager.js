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
        this.scene.add(this.serfVisualsGroup);

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
            serf.currentJob = buildingData; // Reference to the building object from constructionManager
            serf.profession = buildingData.info.jobProfession; // Change serf's profession
            // TODO: Update serf model if visual changes with profession
            
            buildingData.workers.push(serf.id);
            buildingData.jobSlotsAvailable--;
            
            serf.task = 'working'; // Or 'moving_to_work'
            // serf.target = new THREE.Vector3(buildingData.x, 0, buildingData.z); // Pathfind to building
            console.log(`Serf ID ${serf.id} assigned to ${buildingData.info.name} as a ${serf.profession}. Slots left: ${buildingData.jobSlotsAvailable}`);
            
            // For now, teleport serf to building for simplicity
            serf.model.position.set(buildingData.x, 0, buildingData.z + 1); // Place near building
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
                // Serf is at work, maybe a subtle animation or just stay put
                // serf.model.rotation.y += 0.01; 
            }
        });
    }
}

// Export the class, not an instance, so it can be instantiated with scene and gameMap in main.js
export default SerfManager;
