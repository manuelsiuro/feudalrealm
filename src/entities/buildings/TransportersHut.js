// src/entities/buildings/TransportersHut.js
import Building from '../Building.js';
import { createTransportersHut } from '../buildings.js'; // Model creation function

class TransportersHut extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry) {
        super('TRANSPORTER_HUT', gridX, gridZ, gameMap, buildingDataEntry);
        this.model = this.createModel();
    }

    createModel() {
        return createTransportersHut();
    }

    update(deltaTime, currentTime) {
        super.update(deltaTime, currentTime);
        // Transporter's Hut is typically a job provider and drop-off/pickup point.
        // It doesn't actively produce resources itself.
        // Food consumption for workers, if any, would be handled by _checkAndConsumeFood
        // if its data in buildingData.js is configured for it.
        if (this.isConstructed && this.workers.length > 0) {
            this._checkAndConsumeFood(currentTime);
        }
    }
}

export default TransportersHut;
