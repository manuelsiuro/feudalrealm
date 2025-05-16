// src/core/serfManager.js
import * as THREE from 'three';
import { Serf, Unit } from '../entities/units.js'; // Import the Serf class directly
import { TILE_SIZE } from './MapManager.js'; 
// Removed findPathAStar from here, as Serf class will use mapManager.findPath
// Removed ResourceModels and resourceManager imports for now, will be handled by Serf or building interactions

export const SERF_PROFESSIONS = {
    MINER: 'miner',
    WOODCUTTER: 'woodcutter',
    BUILDER: 'builder',
    FARMER: 'farmer',
    IDLE_WORKER: 'idle_worker' // A general worker that can be assigned tasks
    // Add other professions as needed, matching what Serf class might expect for type
};

class SerfManager {
    constructor(scene, gameMap, resourceManager) {
        this.scene = scene;
        this.gameMap = gameMap;
        this.resourceManager = resourceManager; // Store resourceManager for drop-off
        this.serfs = [];
        this.maxSerfs = 10; // Adjusted for initial testing
        this.serfIdCounter = 0;
        this.serfVisualsGroup = new THREE.Group(); // This group might not be needed if Serfs add their models to scene directly
        this.serfVisualsGroup.name = "SerfVisualsManagedBySerfManager"; // To differentiate
        // scene.add(this.serfVisualsGroup); // Serf instances will add their models to the main scene.

        this.townHallPosition = { x: Math.floor(gameMap.width / 2), y: Math.floor(gameMap.height / 2) }; // Example, center of map
        console.log(`SerfManager: Town Hall (drop-off) position set to grid (${this.townHallPosition.x}, ${this.townHallPosition.y})`);

        this.spawnInitialSerfs(3);
    }

    spawnInitialSerfs(count) {
        for (let i = 0; i < count; i++) {
            let profession = SERF_PROFESSIONS.IDLE_WORKER;
            if (i === 0) profession = SERF_PROFESSIONS.MINER;
            if (i === 1) profession = SERF_PROFESSIONS.WOODCUTTER; 
            // if (i === 2) profession = SERF_PROFESSIONS.BUILDER; // Builder logic not yet in Serf class

            // Spawn near town hall or a designated start area
            const spawnX = this.townHallPosition.x + i - 1; 
            const spawnY = this.townHallPosition.y + 1;
            this.createSerf(profession, spawnX, spawnY);
        }
    }

    createSerf(profession = SERF_PROFESSIONS.IDLE_WORKER, gridX, gridY) {
        if (this.serfs.length >= this.maxSerfs) {
            console.warn("Max serf limit reached.");
            return null;
        }

        const serfId = `serf-${this.serfIdCounter++}`;
        // Ensure spawn position is valid (e.g., walkable)
        // For now, assume valid if within map bounds
        const validX = Math.max(0, Math.min(gridX, this.gameMap.width - 1));
        const validY = Math.max(0, Math.min(gridY, this.gameMap.height - 1));

        // The Serf class constructor from units.js takes (id, x, y, type, scene, mapManager)
        // The 'type' corresponds to our 'profession' here.
        const newSerf = new Serf(serfId, validX, validY, profession, this.scene, this.gameMap);
        
        // Pass the town hall (drop-off) position to the serf
        newSerf.setDropOffPoint(this.townHallPosition);
        newSerf.maxInventoryCapacity = 10; // Example capacity

        this.serfs.push(newSerf);
        // newSerf.model is added to the scene by the Serf class itself.
        console.log(`${profession} serf created: ${serfId} at grid (${validX},${validY})`);
        
        // Assign initial task based on profession for testing
        if (profession === SERF_PROFESSIONS.MINER) {
            newSerf.setTask('mine', { resourceType: 'stone' }); 
        } else if (profession === SERF_PROFESSIONS.WOODCUTTER) {
            newSerf.setTask('mine', { resourceType: 'wood' }); // Assuming 'mine' task can handle wood for now
        }

        return newSerf;
    }

    update(deltaTime) { 
        this.serfs.forEach(serf => {
            serf.update(deltaTime); // Call the Serf's own update method
        });
        // Complex logic previously here (job seeking, resource gathering states for Woodcutter/Stonemason)
        // will be progressively moved into the Serf class or profession-specific subclasses.
    }

    // Example: How other systems might request a serf for a task
    getAvailableSerf(profession = SERF_PROFESSIONS.IDLE_WORKER) {
        return this.serfs.find(serf => serf.serfType === profession && serf.task === 'idle');
    }

    // Placeholder for future interaction with buildings
    assignSerfToBuildingJob(serf, building) {
        // This would involve telling the serf about the building, the task, etc.
        // For now, serf tasks are more generic (mine wood, mine stone)
        console.log(`Assigning serf ${serf.id} to building ${building.id} (not yet implemented fully)`);
        // serf.setTask('work_at_building', { buildingId: building.id, buildingLocation: building.getPosition() });
    }
}

export default SerfManager;
