// src/entities/buildings/WoodcuttersHut.js
import Building from '../Building.js';
import { createWoodcuttersHut } from '../buildings.js'; // Model creation function

/**
 * @class WoodcuttersHut
 * @classdesc Represents a Woodcutter's Hut building, which produces wood.
 * @extends Building
 */
class WoodcuttersHut extends Building {
    /**
     * Creates an instance of WoodcuttersHut.
     * @param {number} gridX - The 0-indexed X grid coordinate.
     * @param {number} gridZ - The 0-indexed Z grid coordinate.
     * @param {GameMap} gameMap - Reference to the game's map instance.
     * @param {object} buildingDataEntry - Configuration data for this building type.
     */
    constructor(gridX, gridZ, gameMap, buildingDataEntry) {
        super('WOODCUTTERS_HUT', gridX, gridZ, gameMap, buildingDataEntry);
        this.model = this.createModel();
    }

    /**
     * Creates the 3D model for the Woodcutter's Hut.
     * @returns {THREE.Object3D} The Three.js model.
     * @override
     */
    createModel() {
        return createWoodcuttersHut();
    }

    /**
     * Updates the Woodcutter's Hut logic each frame.
     * Handles food consumption for workers and wood production if conditions are met.
     * @param {number} deltaTime - Time since the last update.
     * @param {number} currentTime - The current game time (e.g., Date.now()).
     * @override
     */
    update(deltaTime, currentTime) {
        super.update(deltaTime, currentTime); // Base update (handles construction, etc.)

        if (!this.isConstructed || this.workers.length === 0) {
            return; // Needs to be built and have workers to produce
        }

        // Handle food consumption
        this._checkAndConsumeFood(currentTime); // Use helper from base class
        if (this.isHaltedByNoFood) {
            return; // Stop production if no food
        }

        // Simple direct production logic (already defined in this.info from buildingData)
        if (this.producesResource && this.productionIntervalMs > 0) {
            if (currentTime >= (this.lastProductionTime || 0) + this.productionIntervalMs) {
                if (this.hasSpaceFor(this.producesResource, 1)) { // Assuming produces 1 unit at a time
                    this.addResource(this.producesResource, 1);
                    this.lastProductionTime = currentTime;
                    // console.log(`${this.name} (${this.id}) produced 1 ${this.producesResource}. Workers: ${this.workers.length}`);
                } else {
                    // console.log(`${this.name} (${this.id}) cannot produce ${this.producesResource}, output full.`);
                }
            }
        }
    }
}

export default WoodcuttersHut;
