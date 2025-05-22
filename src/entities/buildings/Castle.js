// src/entities/buildings/Castle.js
import Building from '../Building.js';
import { createCastle } from '../buildings.js'; // Assuming this is where createCastle model function is

class Castle extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry) {
        super('CASTLE', gridX, gridZ, gameMap, buildingDataEntry);
        this.model = this.createModel();
    }

    createModel() {
        return createCastle(); // Call the specific model creation function
    }

    update(deltaTime, currentTime) {
        super.update(deltaTime, currentTime); // Call base class update

        // Castles typically don't have active production in this game's context
        // but might have other logic (e.g., spawning units, research) in a more complex game.
        // For now, it's passive.
    }
}

export default Castle;
