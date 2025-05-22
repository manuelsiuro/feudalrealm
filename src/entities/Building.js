// src/entities/Building.js
import * as THREE from 'three';
import { TILE_SIZE } from '../config/mapConstants.js';

/** @private Counter for generating unique building IDs */
let nextBuildingId = 1;

/**
 * @class Building
 * @classdesc Base class for all building types in the game.
 * Handles common functionalities like ID, placement, construction, inventory, and worker management.
 */
class Building {
    /**
     * Creates an instance of Building.
     * @param {string} type - The type key of the building (e.g., 'WOODCUTTERS_HUT').
     * @param {number} gridX - The 0-indexed X grid coordinate.
     * @param {number} gridZ - The 0-indexed Z grid coordinate.
     * @param {GameMap} gameMap - Reference to the game's map instance.
     * @param {object} buildingDataEntry - Configuration data for this building type from `buildingData.js`.
     * @property {string} id - Unique identifier for this building instance.
     * @property {string} type - Building type key.
     * @property {number} gridX - Grid X coordinate.
     * @property {number} gridZ - Grid Z coordinate.
     * @property {GameMap} gameMap - Reference to the game map.
     * @property {THREE.Object3D|null} model - The Three.js model of the building.
     * @property {boolean} isConstructed - True if construction is complete.
     * @property {number} constructionEndTime - Timestamp when construction finishes.
     * @property {number} health - Current health of the building.
     * @property {number} maxHealth - Maximum health of the building.
     * @property {object} info - Raw configuration data from `buildingDataEntry`.
     * @property {string} name - Display name of the building.
     * @property {object} cost - Resource cost to build.
     * @property {number} jobSlots - Number of available job slots.
     * @property {string|null} jobProfession - The profession required to work here.
     * @property {string|null} requiredTool - The tool required for the job.
     * @property {object} maxStock - Maximum stock capacity for various resources.
     * @property {object} outputBufferCapacity - Capacity for produced resources before pickup.
     * @property {object} inventory - Current resources stored in the building.
     * @property {Array<string>} workers - Array of serf IDs working here.
     * @property {string|null} producesResource - Resource type for simple direct production.
     * @property {number} productionIntervalMs - Interval for simple direct production.
     * @property {number} lastProductionTime - Timestamp of the last simple production.
     * @property {Array<string>} consumesFood - Types of food workers consume.
     * @property {number} foodConsumptionRate - Rate of food consumption per worker.
     * @property {number} foodCheckIntervalMs - Interval to check and consume food.
     * @property {number} lastFoodCheckTime - Timestamp of the last food check.
     * @property {boolean} isHaltedByNoFood - True if production is halted due to lack of food.
     * @property {Array<object>} consumesMaterials - Materials required for processing (e.g., [{ resource: 'IRON_ORE', quantity: 2 }]).
     * @property {Array<object>} producesMaterials - Materials produced by processing (e.g., [{ resource: 'IRON_INGOT', quantity: 1 }]).
     * @property {number} processingTime - Time in ms for one processing cycle.
     * @property {number} currentProcessingProgress - Current progress of the processing cycle in ms.
     * @property {ResourceManager|null} resourceManager - Reference to the global ResourceManager.
     */
    constructor(type, gridX, gridZ, gameMap, buildingDataEntry) {
        this.id = `building-${nextBuildingId++}`;
        this.type = type; 
        this.gridX = gridX;
        this.gridZ = gridZ;
        this.gameMap = gameMap; 
        
        this.model = null; 
        this.isConstructed = false;
        this.constructionEndTime = 0;
        this.health = buildingDataEntry.maxHealth || 100; 
        this.maxHealth = buildingDataEntry.maxHealth || 100;

        this.info = buildingDataEntry; 
        this.name = buildingDataEntry.name;
        this.cost = buildingDataEntry.cost;
        this.jobSlots = buildingDataEntry.jobSlots || 0;
        this.jobProfession = buildingDataEntry.jobProfession || null;
        this.requiredTool = buildingDataEntry.requiredTool || null;
        
        this.maxStock = buildingDataEntry.maxStock || { default: 50 }; 
        this.outputBufferCapacity = buildingDataEntry.outputBufferCapacity || this.maxStock;
        this.inventory = {}; 

        this.workers = []; 

        this.producesResource = buildingDataEntry.producesResource || null; 
        this.productionIntervalMs = buildingDataEntry.productionIntervalMs || 0; 
        this.lastProductionTime = 0;
        
        this.consumesFood = buildingDataEntry.consumesFood || [];
        this.foodConsumptionRate = buildingDataEntry.foodConsumptionRate || 0;
        this.foodCheckIntervalMs = buildingDataEntry.foodCheckIntervalMs || 0;
        this.lastFoodCheckTime = 0;
        this.isHaltedByNoFood = false;

        this.consumesMaterials = buildingDataEntry.consumesMaterials || []; // Corrected from buildingDataEntry.consumes
        this.producesMaterials = buildingDataEntry.producesMaterials || []; // Corrected from buildingDataEntry.produces
        this.processingTime = buildingDataEntry.processingTime || 0; // Corrected from processingTimeMs
        this.currentProcessingProgress = 0; 

        this.resourceManager = null; 
    }

    /**
     * Sets the ResourceManager instance for this building.
     * Called by ConstructionManager after the building is instantiated.
     * @param {ResourceManager} manager - The global ResourceManager instance.
     */
    setResourceManager(manager) {
        this.resourceManager = manager;
    }

    /**
     * Abstract method for creating the 3D model.
     * This method must be implemented by subclasses.
     * @abstract
     * @returns {THREE.Object3D} The Three.js model for the building.
     */
    createModel() {
        throw new Error("Subclasses must implement createModel()");
    }

    /**
     * Places the building's model onto the game map at its grid coordinates.
     * Adds the model to the specified parent group.
     * @param {THREE.Group} buildingsGroup - The parent group in the scene to add this building's model to.
     */
    placeModel(buildingsGroup) {
        if (!this.model) {
            console.error(`Building ${this.id} (${this.name}): Model not created before placing.`);
            return;
        }
        // Convert 0-indexed grid coordinates to centered world coordinates
        const worldX = (this.gridX - (this.gameMap.width - 1) / 2) * TILE_SIZE;
        const worldZ = (this.gridZ - (this.gameMap.height - 1) / 2) * TILE_SIZE;
        this.model.position.set(worldX, 0, worldZ);

        // Store a reference to this building instance in the model's userData
        this.model.userData.buildingInstance = this;
        this.model.userData.uuid = this.model.uuid;

        buildingsGroup.add(this.model);
        // console.log(`${this.name} (${this.id}) model placed at world (${worldX.toFixed(1)}, ${worldZ.toFixed(1)}), grid (${this.gridX}, ${this.gridZ}).`);
    }

    /**
     * Adds a specified amount of a resource to the building's inventory.
     * Respects the building's max stock or output buffer capacity.
     * @param {string} resourceType - The type of resource to add.
     * @param {number} amount - The amount of the resource to add.
     * @returns {number} The amount of the resource actually added.
     */
    addResource(resourceType, amount) {
        if (!this.isConstructed && this.type !== 'CONSTRUCTION_SITE') { // Allow adding to construction site
            console.warn(`${this.name} (${this.id}): Not constructed yet, cannot add resources normally.`);
            // return 0; // Or handle differently for initial resource delivery to site
        }
        
        const currentAmount = this.inventory[resourceType] || 0;
        // Use outputBufferCapacity for the specific resource if defined, else default maxStock
        const maxCap = (this.outputBufferCapacity && this.outputBufferCapacity[resourceType]) 
                       ? this.outputBufferCapacity[resourceType] 
                       : (this.maxStock && this.maxStock[resourceType]) 
                           ? this.maxStock[resourceType]
                           : (this.maxStock && this.maxStock.default) 
                               ? this.maxStock.default 
                               : 0;

        const availableSpace = maxCap - currentAmount;
        const amountToAdd = Math.min(amount, availableSpace);

        if (amountToAdd > 0) {
            this.inventory[resourceType] = currentAmount + amountToAdd;
            // console.log(`${this.name} (${this.id}) added ${amountToAdd} of ${resourceType}. New stock: ${this.inventory[resourceType]} / ${maxCap}`);
        } else if (amount > 0 && availableSpace <= 0) {
            // console.log(`${this.name} (${this.id}) cannot add ${resourceType}, stock is full (${currentAmount} / ${maxCap}).`);
        }
        return amountToAdd;
    }

    /**
     * Picks up a specified amount of a resource from the building's inventory.
     * @param {string} resourceType - The type of resource to pick up.
     * @param {number} amountRequested - The amount of the resource requested.
     * @returns {number} The amount of the resource actually picked up.
     */
    pickupResource(resourceType, amountRequested) {
        if (!this.isConstructed) {
            console.warn(`${this.name} (${this.id}): Not constructed yet, cannot pick up resources.`);
            return 0;
        }
        const currentAmount = this.inventory[resourceType] || 0;
        const amountToPickup = Math.min(amountRequested, currentAmount);

        if (amountToPickup > 0) {
            this.inventory[resourceType] = currentAmount - amountToPickup;
            // console.log(`${this.name} (${this.id}) picked up ${amountToPickup} of ${resourceType}. Remaining stock: ${this.inventory[resourceType]}`);
            if (this.inventory[resourceType] === 0) {
                // delete this.inventory[resourceType]; // Optional: clean up empty entries
            }
        }
        return amountToPickup;
    }

    /**
     * Checks if the building's inventory contains sufficient quantities of specified resources.
     * @param {Array<object>} resourceList - An array of resource objects, e.g., [{ resource: 'WOOD', quantity: 10 }].
     * @returns {boolean} True if all specified resources are available in sufficient quantities.
     */
    hasResources(resourceList) { 
        if (!resourceList || resourceList.length === 0) return true;
        return resourceList.every(item => (this.inventory[item.resource] || 0) >= item.quantity);
    }
    
    /**
     * Checks if there is enough space in the inventory/output buffer for a given resource and quantity.
     * @param {string} resourceType - The type of resource.
     * @param {number} quantity - The quantity to check space for.
     * @returns {boolean} True if there is enough space.
     */
    hasSpaceFor(resourceType, quantity) {
        const currentAmount = this.inventory[resourceType] || 0;
        const maxCap = (this.outputBufferCapacity && this.outputBufferCapacity[resourceType]) 
                       ? this.outputBufferCapacity[resourceType] 
                       : (this.maxStock && this.maxStock[resourceType]) 
                           ? this.maxStock[resourceType]
                           : (this.maxStock && this.maxStock.default) 
                               ? this.maxStock.default 
                               : 0;
        return currentAmount + quantity <= maxCap;
    }

    /**
     * Gets the current stock of a specific resource in the building's inventory.
     * @param {string} resourceType - The type of resource.
     * @returns {number} The current stock amount.
     */
    getStock(resourceType) {
        return this.inventory[resourceType] || 0;
    }

    /**
     * Adds a serf to this building's list of workers if there are open job slots.
     * @param {string} serfId - The ID of the serf to add.
     * @returns {boolean} True if the serf was successfully added, false otherwise.
     */
    addWorker(serfId) {
        if (this.workers.length < this.jobSlots) {
            if (!this.workers.includes(serfId)) {
                this.workers.push(serfId);
                return true;
            }
        }
        return false;
    }

    /**
     * Removes a serf from this building's list of workers.
     * @param {string} serfId - The ID of the serf to remove.
     * @returns {boolean} True if the serf was successfully removed, false otherwise.
     */
    removeWorker(serfId) {
        const index = this.workers.indexOf(serfId);
        if (index > -1) {
            this.workers.splice(index, 1);
            return true;
        }
        return false;
    }
    
    /**
     * Checks if there are any open job slots in this building.
     * @returns {boolean} True if there are open job slots.
     */
    hasOpenJobSlots() {
        return this.workers.length < this.jobSlots;
    }

    /**
     * Initiates the construction process for this building.
     * @param {number} durationSeconds - The duration of the construction in seconds.
     */
    startConstruction(durationSeconds) {
        this.isConstructed = false;
        this.constructionEndTime = Date.now() + (durationSeconds * 1000);
        this.setOpacity(0.5);
        // console.log(`${this.name} (${this.id}) construction started. Will finish in ${durationSeconds}s.`);
    }

    /**
     * Finalizes the construction process for this building.
     * Makes the building fully opaque and initializes production/food check timers.
     */
    finishConstruction() {
        this.isConstructed = true;
        this.setOpacity(1.0);
        this.lastProductionTime = Date.now();
        this.lastFoodCheckTime = Date.now();
        console.log(`${this.name} (${this.id}) construction complete!`);
    }
    
    /**
     * Sets the opacity of the building's model.
     * Used to make the building semi-transparent during construction.
     * @param {number} opacity - The opacity value (0.0 to 1.0).
     */
    setOpacity(opacity) {
        if (this.model) {
            this.model.traverse((child) => {
                if (child.isMesh) {
                    // Ensure material is compatible with opacity changes
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.transparent = opacity < 1;
                            mat.opacity = opacity;
                            mat.needsUpdate = true;
                        });
                    } else {
                        child.material.transparent = opacity < 1;
                        child.material.opacity = opacity;
                        child.material.needsUpdate = true;
                    }
                }
            });
        }
    }

    // --- Update loop (to be called by ConstructionManager) ---
    // Subclasses will override this to add specific behaviors (production, consumption)
    update(deltaTime, currentTime) {
        if (!this.isConstructed) {
            // ConstructionManager will handle checking constructionEndTime and calling finishConstruction
            return; 
        }

        // Basic update logic (e.g., for passive effects or animations)
        // Production, consumption, etc., will be handled in subclass update methods.
        // For example, a subclass might call _checkAndConsumeFood(currentTime) here.
    }

    /**
     * Gets the grid coordinates for the building's entry point.
     * Default is the building's own grid position. Subclasses can override this.
     * @returns {{x: number, z: number}} The grid coordinates of the entry point.
     */
    getEntryPointGridPosition() {
        return { x: this.gridX, z: this.gridZ };
    }

    /**
     * @private
     * Helper method to check and consume food for workers if applicable.
     * This is typically called by the `update` method of subclasses that have workers.
     * @param {number} currentTime - The current game time (e.g., Date.now()).
     */
    _checkAndConsumeFood(currentTime) {
        if (!this.resourceManager) {
            // console.warn(`${this.name} (${this.id}): ResourceManager not set. Cannot consume food.`);
            return; // Silently return if RM not set, it might be set later
        }
        if (!this.consumesFood || this.consumesFood.length === 0 || this.foodConsumptionRate === 0 || this.workers.length === 0) {
            this.isHaltedByNoFood = false;
            return;
        }

        if (currentTime >= (this.lastFoodCheckTime || 0) + this.foodCheckIntervalMs) {
            const foodNeededThisInterval = this.foodConsumptionRate * this.workers.length;
            let foodSatisfied = 0;
            let consumedFoodDetails = [];

            for (const foodType of this.consumesFood) {
                if (foodSatisfied >= foodNeededThisInterval) break;

                const availableAmount = this.resourceManager.getResourceCount(foodType);
                const amountToConsumeFromThisType = Math.min(availableAmount, foodNeededThisInterval - foodSatisfied);

                if (amountToConsumeFromThisType > 0) {
                    if (this.resourceManager.removeResource(foodType, amountToConsumeFromThisType)) {
                        foodSatisfied += amountToConsumeFromThisType;
                        consumedFoodDetails.push(`${amountToConsumeFromThisType.toFixed(2)} ${foodType}`);
                    }
                }
            }

            if (foodSatisfied >= foodNeededThisInterval) {
                if (this.isHaltedByNoFood) {
                    console.log(`${this.name} (${this.id}) RESUMED production due to food availability.`);
                }
                this.isHaltedByNoFood = false;
                // if (consumedFoodDetails.length > 0) {
                //      console.log(`${this.name} (${this.id}) consumed ${consumedFoodDetails.join(', ')} for ${this.workers.length} workers.`);
                // }
            } else {
                if (!this.isHaltedByNoFood) {
                   console.warn(`${this.name} (${this.id}) HALTED. Insufficient food for workers. Needed ${foodNeededThisInterval.toFixed(2)}, Got ${foodSatisfied.toFixed(2)}. Tried: ${this.consumesFood.join(', ')}.`);
                }
                this.isHaltedByNoFood = true;
            }
            this.lastFoodCheckTime = currentTime;
        }
    }
}

export default Building;
