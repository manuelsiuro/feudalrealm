// src/entities/buildings/Blacksmith.js
import Building from '../Building.js';
import { createBlacksmith } from '../buildings.js'; // Model creation function

class Blacksmith extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry) {
        super('BLACKSMITH', gridX, gridZ, gameMap, buildingDataEntry);
        this.model = this.createModel();
        this.currentProcessingProgress = 0; // Initialize for this building type
    }

    createModel() {
        // Assuming createBlacksmith is the correct function name in buildings.js
        // If the actual Blacksmith model (for tools) is different from Armory, 
        // ensure the correct creator is used.
        // For this task, we'll assume createBlacksmith exists for the general Blacksmith.
        return createBlacksmith(); 
    }

    update(deltaTime, currentTime) {
        super.update(deltaTime, currentTime); // Base update (handles construction, etc.)

        if (!this.isConstructed || this.workers.length === 0) {
            return; // Needs to be built and have workers
        }

        // Handle food consumption
        this._checkAndConsumeFood(currentTime);
        if (this.isHaltedByNoFood) {
            return;
        }

        // Processing logic (consumes materials, produces materials after a delay)
        // Ensure buildingDataEntry for BLACKSMITH has 'consumesMaterials', 'producesMaterials', and 'processingTimeMs'
        if (this.info.consumesMaterials && this.info.consumesMaterials.length > 0 && 
            this.info.producesMaterials && this.info.producesMaterials.length > 0 && 
            this.info.processingTime > 0) { // Changed from processingTimeMs to processingTime to match buildingData.js

            if (this.hasResources(this.info.consumesMaterials)) {
                // Check if there's space for ALL products
                let canProduceAll = true;
                for (const product of this.info.producesMaterials) {
                    if (!this.hasSpaceFor(product.resource, product.quantity)) {
                        canProduceAll = false;
                        // console.log(`${this.name} (${this.id}) cannot start/continue processing, not enough space for ${product.resource}.`);
                        break;
                    }
                }

                if (canProduceAll) {
                    this.currentProcessingProgress += deltaTime * 1000; // Add milliseconds

                    if (this.currentProcessingProgress >= this.info.processingTime) { // Changed from processingTimeMs
                        // Consume input resources
                        for (const item of this.info.consumesMaterials) {
                            this.pickupResource(item.resource, item.quantity); // Use base class method
                        }

                        // Produce output resources
                        for (const product of this.info.producesMaterials) {
                            this.addResource(product.resource, product.quantity); // Use base class method
                            // console.log(`${this.name} (${this.id}) produced ${product.quantity} ${product.resource}.`);
                        }
                        this.currentProcessingProgress = 0; // Reset progress
                    }
                } else {
                    // Not enough space for output, reset or pause progress.
                    // Resetting for simplicity here.
                    this.currentProcessingProgress = 0; 
                }
            } else {
                // Not enough input materials, reset progress.
                this.currentProcessingProgress = 0;
                // console.log(`${this.name} (${this.id}) waiting for input materials: ${JSON.stringify(this.info.consumesMaterials)}.`);
            }
        }
    }
}

export default Blacksmith;
