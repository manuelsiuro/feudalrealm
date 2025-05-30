// src/entities/Building.js
import * as THREE from 'three';
import { TILE_SIZE } from '../config/mapConstants.js';

/** @private Counter for generating unique building IDs */
let nextBuildingId = 1;

// Export Building States
export const BUILDING_STATE_NEEDS_CONSTRUCTION = 'NEEDS_CONSTRUCTION';
export const BUILDING_STATE_UNDER_CONSTRUCTION = 'UNDER_CONSTRUCTION';
export const BUILDING_STATE_CONSTRUCTED = 'CONSTRUCTED';

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
     * @property {string} currentConstructionState - The current state of construction.
     * @property {number} constructionRequiredTime - Total time required for construction in ms.
     * @property {number} currentConstructionProgress - Current progress of construction in ms.
     * @property {string|null} assignedBuilderId - ID of the serf assigned to construct this building.
     * @property {THREE.Mesh|null} progressBarMesh - The UI mesh for the construction progress bar.
     */
    constructor(type, gridX, gridZ, gameMap, buildingDataEntry, resourceFlowManager = null) {
        this.id = `building-${nextBuildingId++}`;
        this.type = type; 
        this.gridX = gridX;
        this.gridZ = gridZ;
        this.gameMap = gameMap; 
        
        this.model = null; 
        this.isConstructed = false; // Will be managed by currentConstructionState
        this.constructionEndTime = 0; // Deprecated in favor of progress tracking
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
        this.resourceFlowManager = resourceFlowManager; // Store reference to ResourceFlowManager 

        // Initialize new construction properties
        this.constructionRequiredTime = buildingDataEntry.constructionTime === undefined ? 5000 : buildingDataEntry.constructionTime; // Default if not specified
        this.currentConstructionProgress = 0;
        this.assignedBuilderId = null;
        this.progressBarMesh = null; // Will be created when construction starts
        this.progressBarGroup = null; // Group containing background and foreground of progress bar


        // Set initial construction state
        // Castles or pre-built structures might start as CONSTRUCTED
        if (this.type === 'CASTLE' || this.constructionRequiredTime === 0) {
            this.currentConstructionState = BUILDING_STATE_CONSTRUCTED;
            this.isConstructed = true; // Keep isConstructed for compatibility for now
            
            // Create the model immediately for constructed buildings
            this.model = this.createModel();
        } else {
            this.currentConstructionState = BUILDING_STATE_NEEDS_CONSTRUCTION;
            this.isConstructed = false;
            
            // Don't create the model yet - it will be created when construction starts
            this.model = null;
        }
        console.log(`[Building CONSTRUCTOR] ${this.id} (${this.name}): Initial constructionRequiredTime: ${this.constructionRequiredTime}, currentConstructionState: ${this.currentConstructionState}`);
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
     * Sets castShadow and receiveShadow to true for all meshes in the object.
     * @param {THREE.Object3D} object3D - The object to traverse.
     * @protected
     */
    _setShadowsRecursive(object3D) {
        if (!object3D) return;
        object3D.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    /**
     * Places the building's model onto the game map at its grid coordinates.
     * Adds the model to the specified parent group.
     * @param {THREE.Group} buildingsGroup - The parent group in the scene to add this building's model to.
     */
    placeModel(buildingsGroup) {
        if (!this.model) {
            console.warn(`Building ${this.id} (${this.name}): Cannot place model - model not created yet (construction state: ${this.currentConstructionState}).`);
            return;
        }

        // Ensure all parts of the model are set to cast and receive shadows
        this._setShadowsRecursive(this.model);

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
            
            // Record resource flow for visualization (incoming resources)
            if (this.resourceFlowManager && this.model?.position) {
                // This records resources being added to the building from an external source
                const buildingPosition = this.model.position.clone();
                this.resourceFlowManager.recordFlow(
                    null, // No specific source position for direct addition
                    buildingPosition,
                    resourceType,
                    amountToAdd,
                    'external_to_building'
                );
            }
            
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
            
            // Record resource flow for visualization (outgoing resources)
            if (this.resourceFlowManager && this.model?.position) {
                // This records resources being picked up from the building
                const buildingPosition = this.model.position.clone();
                this.resourceFlowManager.recordFlow(
                    buildingPosition,
                    null, // No specific destination position for direct pickup
                    resourceType,
                    amountToPickup,
                    'building_to_external'
                );
            }
            
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
     * Removes a serf from this building\'s list of workers.
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
     * Validates if a complete production cycle can be started.
     * Checks both input material availability and output storage capacity.
     * @returns {{canStart: boolean, reason: string}} Result with detailed reason
     */
    validateProductionCycle() {
        if (!this.isConstructed) {
            return { canStart: false, reason: 'Building not constructed' };
        }

        if (this.workers.length === 0) {
            return { canStart: false, reason: 'No workers assigned' };
        }

        if (this.isHaltedByNoFood) {
            return { canStart: false, reason: 'Halted due to lack of food' };
        }

        if (!this.consumesMaterials || this.consumesMaterials.length === 0) {
            return { canStart: false, reason: 'No input materials defined' };
        }

        if (!this.producesMaterials || this.producesMaterials.length === 0) {
            return { canStart: false, reason: 'No output materials defined' };
        }

        if (this.processingTime <= 0) {
            return { canStart: false, reason: 'No processing time defined' };
        }

        // Check input material availability
        if (!this.hasResources(this.consumesMaterials)) {
            const missingResources = this.consumesMaterials
                .filter(item => (this.inventory[item.resource] || 0) < item.quantity)
                .map(item => `${item.resource}(${(this.inventory[item.resource] || 0)}/${item.quantity})`)
                .join(', ');
            return { canStart: false, reason: `Insufficient input materials: ${missingResources}` };
        }

        // Check output storage capacity
        for (const product of this.producesMaterials) {
            if (!this.hasSpaceFor(product.resource, product.quantity)) {
                return { canStart: false, reason: `Insufficient storage space for ${product.resource}` };
            }
        }

        return { canStart: true, reason: 'Ready for production' };
    }

    /**
     * Executes a complete production cycle, consuming inputs and producing outputs.
     * Should only be called after validateProductionCycle() returns true.
     * @returns {{success: boolean, consumed: Array<object>, produced: Array<object>}} Production result
     */
    executeProductionCycle() {
        const validation = this.validateProductionCycle();
        if (!validation.canStart) {
            console.warn(`${this.name} (${this.id}): Cannot execute production cycle - ${validation.reason}`);
            return { success: false, consumed: [], produced: [] };
        }

        const consumed = [];
        const produced = [];

        // Consume input materials
        for (const item of this.consumesMaterials) {
            const actualConsumed = this.pickupResource(item.resource, item.quantity);
            if (actualConsumed > 0) {
                consumed.push({ resource: item.resource, quantity: actualConsumed });
            }
        }

        // Produce output materials
        for (const product of this.producesMaterials) {
            const actualProduced = this.addResource(product.resource, product.quantity);
            if (actualProduced > 0) {
                produced.push({ resource: product.resource, quantity: actualProduced });
                
                // Record resource flow for visualization
                if (this.resourceFlowManager && this.model?.position) {
                    const buildingPosition = this.model.position.clone();
                    this.resourceFlowManager.recordFlow(
                        buildingPosition,
                        buildingPosition.clone().add(new THREE.Vector3(0, 1, 0)), // Slightly above for production flow
                        product.resource,
                        actualProduced,
                        'production'
                    );
                }
            }
        }

        return { success: true, consumed, produced };
    }

    /**
     * Gets the current processing progress as a percentage.
     * @returns {number} Progress percentage (0.0 to 1.0)
     */
    getProcessingProgress() {
        if (this.processingTime <= 0) return 0;
        return Math.min(this.currentProcessingProgress / this.processingTime, 1.0);
    }

    /**
     * Estimates time remaining for current processing cycle.
     * @returns {number} Time remaining in milliseconds
     */
    getProcessingTimeRemaining() {
        if (this.processingTime <= 0) return 0;
        return Math.max(this.processingTime - this.currentProcessingProgress, 0);
    }

    /**
     * Gets a summary of the building's production chain status.
     * @returns {object} Status summary with detailed information
     */
    getProductionChainStatus() {
        const validation = this.validateProductionCycle();
        const progress = this.getProcessingProgress();
        const timeRemaining = this.getProcessingTimeRemaining();

        // Calculate input material status
        const inputStatus = this.consumesMaterials.map(item => ({
            resource: item.resource,
            required: item.quantity,
            available: this.inventory[item.resource] || 0,
            sufficient: (this.inventory[item.resource] || 0) >= item.quantity
        }));

        // Calculate output storage status
        const outputStatus = this.producesMaterials.map(product => {
            const currentAmount = this.inventory[product.resource] || 0;
            const maxCap = (this.outputBufferCapacity && this.outputBufferCapacity[product.resource]) 
                           ? this.outputBufferCapacity[product.resource] 
                           : (this.maxStock && this.maxStock[product.resource]) 
                               ? this.maxStock[product.resource]
                               : (this.maxStock && this.maxStock.default) 
                                   ? this.maxStock.default 
                                   : 0;
            return {
                resource: product.resource,
                produced: product.quantity,
                current: currentAmount,
                capacity: maxCap,
                hasSpace: currentAmount + product.quantity <= maxCap
            };
        });

        return {
            canProduce: validation.canStart,
            reason: validation.reason,
            isProcessing: this.currentProcessingProgress > 0,
            progress: progress,
            timeRemaining: timeRemaining,
            workers: this.workers.length,
            maxWorkers: this.jobSlots,
            isHaltedByNoFood: this.isHaltedByNoFood,
            inputStatus: inputStatus,
            outputStatus: outputStatus
        };
    }

    /**
     * Transfers resources to another building if possible.
     * @param {Building} targetBuilding - The building to transfer resources to
     * @param {string} resourceType - The type of resource to transfer
     * @param {number} amount - The amount to transfer
     * @returns {{transferred: number, reason: string}} Transfer result
     */
    transferResourceTo(targetBuilding, resourceType, amount) {
        if (!this.isConstructed) {
            return { transferred: 0, reason: 'Source building not constructed' };
        }

        if (!targetBuilding.isConstructed) {
            return { transferred: 0, reason: 'Target building not constructed' };
        }

        const availableAmount = this.inventory[resourceType] || 0;
        if (availableAmount <= 0) {
            return { transferred: 0, reason: 'No resources available to transfer' };
        }

        const amountToTransfer = Math.min(amount, availableAmount);
        const actualPickedUp = this.pickupResource(resourceType, amountToTransfer);
        
        if (actualPickedUp <= 0) {
            return { transferred: 0, reason: 'Failed to pickup resources from source' };
        }

        const actualDelivered = targetBuilding.addResource(resourceType, actualPickedUp);
        
        // If we couldn't deliver all resources, add the remainder back
        if (actualDelivered < actualPickedUp) {
            const remainder = actualPickedUp - actualDelivered;
            this.addResource(resourceType, remainder);
        }

        // Record resource flow for visualization
        if (this.resourceFlowManager && this.model?.position && targetBuilding.model?.position) {
            this.resourceFlowManager.recordFlow(
                this.model.position.clone(),
                targetBuilding.model.position.clone(),
                resourceType,
                actualDelivered,
                'building_to_building'
            );
        }

        return { 
            transferred: actualDelivered, 
            reason: actualDelivered > 0 ? 'Success' : 'Target building has no space' 
        };
    }

    /**
     * Base update method that subclasses can override or extend.
     * Provides a standard update implementation that handles production chain processing.
     * @param {number} deltaTime - The time elapsed since the last update in milliseconds.
     * @param {number} currentTime - The current game time (e.g., Date.now()).
     */
    update(deltaTime, currentTime) {
        // Handle production chain updates for buildings that have production capabilities
        this.updateProductionChain(deltaTime, currentTime);
    }

    /**
     * Starts the construction process for this building.
     * Called by ConstructBuildingTask when a builder is assigned.
     * @param {string} serfId - The ID of the serf assigned to build this building.
     * @param {THREE.Scene} scene - The scene to add visual elements to.
     * @returns {boolean} True if construction started successfully, false otherwise.
     */
    startConstructionProcess(serfId, scene) {
        if (this.currentConstructionState !== BUILDING_STATE_NEEDS_CONSTRUCTION) {
            console.warn(`${this.name} (${this.id}): Cannot start construction - current state is ${this.currentConstructionState}`);
            return false;
        }

        if (this.assignedBuilderId) {
            console.warn(`${this.name} (${this.id}): Cannot start construction - already assigned to builder ${this.assignedBuilderId}`);
            return false;
        }

        console.log(`[Building startConstructionProcess] Starting construction of ${this.name} (${this.id}) with builder ${serfId}`);
        
        this.assignedBuilderId = serfId;
        this.currentConstructionState = BUILDING_STATE_UNDER_CONSTRUCTION;
        this.currentConstructionProgress = 0;

        // Create the 3D model now that construction has started
        if (!this.model) {
            this.model = this.createModel();
            console.log(`[Building startConstructionProcess] Created 3D model for ${this.name} (${this.id})`);
            
            // Place the model in the scene if we have access to buildingsGroup
            if (scene && this.model) {
                // Find or create the GameBuildings group
                let buildingsGroup = null;
                scene.traverse((child) => {
                    if (child.name === "GameBuildings") {
                        buildingsGroup = child;
                    }
                });
                
                if (buildingsGroup) {
                    this.placeModel(buildingsGroup);
                    console.log(`[Building startConstructionProcess] Placed model for ${this.name} (${this.id}) in scene`);
                }
            }
        }

        // Create 3D progress bar
        if (this.model && scene) {
            this._createProgressBar(scene);
        }

        return true;
    }

    /**
     * Updates the construction progress of this building.
     * Called by ConstructionManager during its update loop.
     * @param {number} deltaTime - The time elapsed since the last update in milliseconds.
     * @returns {boolean} True if construction is complete, false otherwise.
     */
    updateConstructionProgress(deltaTime) {
        if (this.currentConstructionState !== BUILDING_STATE_UNDER_CONSTRUCTION) {
            return false; // Not under construction
        }

        if (!this.assignedBuilderId) {
            console.warn(`${this.name} (${this.id}): No builder assigned but state is UNDER_CONSTRUCTION`);
            return false;
        }

        // Check if the assigned builder is actually constructing this building
        // We need access to the serfManager to check builder state
        // For now, we'll assume progress should only happen when builder is at the site
        // This check will be done by the ConstructionManager or we trust the task system
        
        // Increment construction progress
        this.currentConstructionProgress += deltaTime;

        // Update progress bar visual
        this._updateProgressBar();

        // Check if construction is complete
        if (this.currentConstructionProgress >= this.constructionRequiredTime) {
            //console.log(`[Building updateConstructionProgress] Construction of ${this.name} (${this.id}) completed!`);
            this.completeConstructionProcess();
            return true;
        }

        return false;
    }

    /**
     * Completes the construction process for this building.
     * Called internally when construction progress reaches 100%.
     */
    completeConstructionProcess() {
        //console.log(`[Building completeConstructionProcess] Completing construction of ${this.name} (${this.id})`);
        
        this.currentConstructionState = BUILDING_STATE_CONSTRUCTED;
        this.isConstructed = true; // Keep for compatibility
        this.currentConstructionProgress = this.constructionRequiredTime; // Ensure it's exactly at completion
        this.assignedBuilderId = null; // Release the builder

        // Remove progress bar
        this._removeProgressBar();

        //console.log(`[Building completeConstructionProcess] ${this.name} (${this.id}) construction complete!`);
    }

    /**
     * Creates a 3D progress bar above the building.
     * @param {THREE.Scene} scene - The scene to add the progress bar to.
     * @private
     */
    _createProgressBar(scene) {
        if (this.progressBarGroup) {
            this._removeProgressBar(); // Remove existing one
        }

        if (!this.model) {
            console.warn(`${this.name} (${this.id}): Cannot create progress bar - no model available`);
            return;
        }

        // Create progress bar group
        this.progressBarGroup = new THREE.Group();
        this.progressBarGroup.name = `ProgressBar_${this.id}`;

        // Calculate position above the building
        const modelBox = new THREE.Box3().setFromObject(this.model);
        const modelHeight = modelBox.max.y - modelBox.min.y;
        const barHeight = 0.15;
        const barWidth = TILE_SIZE * 0.8;
        const barDepth = 0.05;

        // Position above the building
        this.progressBarGroup.position.copy(this.model.position);
        this.progressBarGroup.position.y += modelHeight + 0.5;

        // Background bar (red/dark)
        const backgroundGeometry = new THREE.BoxGeometry(barWidth, barHeight, barDepth);
        const backgroundMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x444444,
            transparent: true,
            opacity: 0.8
        });
        const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
        this.progressBarGroup.add(backgroundMesh);

        // Progress bar (green) - create at full width but scale it down
        const progressGeometry = new THREE.BoxGeometry(barWidth, barHeight, barDepth + 0.01); 
        const progressMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 0.9
        });
        this.progressBarMesh = new THREE.Mesh(progressGeometry, progressMaterial);
        this.progressBarMesh.scale.x = 0.01; // Start at minimum scale
        this.progressBarMesh.position.x = -(barWidth / 2) + (barWidth * 0.01 / 2); // Start from left edge
        this.progressBarGroup.add(this.progressBarMesh);

        // Add to scene
        scene.add(this.progressBarGroup);

        //console.log(`[Building _createProgressBar] Created progress bar for ${this.name} (${this.id})`);
    }

    /**
     * Updates the visual representation of the progress bar.
     * Uses the actual construction progress and time.
     * @private
     */
    _updateProgressBar() {
        if (!this.progressBarGroup || !this.progressBarMesh) {
            return;
        }

        // Calculate progress percentage based on actual construction progress
        const progressPercentage = Math.min(this.currentConstructionProgress / this.constructionRequiredTime, 1.0);
        
        // Update progress bar using scale instead of recreating geometry
        const barWidth = TILE_SIZE * 0.8;
        
        // Use scale to change the width instead of recreating geometry
        this.progressBarMesh.scale.x = Math.max(progressPercentage, 0.01); // Minimum scale to keep it visible
        
        // Reposition to grow from left to right
        this.progressBarMesh.position.x = -(barWidth / 2) + (barWidth * progressPercentage / 2);
        
        // Debug log for first few updates - now shows both actual and visual progress
        //if (this.currentConstructionProgress < 1000) {
        //    const actualProgress = (this.currentConstructionProgress / this.constructionRequiredTime * 100).toFixed(1);
        //    const visualProgress = (visualProgressPercentage * 100).toFixed(1);
        //    console.log(`[Building _updateProgressBar] ${this.name}: Actual: ${actualProgress}% | Visual: ${visualProgress}% | Scale: ${this.progressBarMesh.scale.x.toFixed(3)}`);
        //}
    }

    /**
     * Removes the progress bar from the scene.
     * @private
     */
    _removeProgressBar() {
        if (this.progressBarGroup && this.progressBarGroup.parent) {
            // Dispose of geometries and materials
            this.progressBarGroup.traverse((child) => {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });

            // Remove from scene
            this.progressBarGroup.parent.remove(this.progressBarGroup);
            this.progressBarGroup = null;
            this.progressBarMesh = null;

            //console.log(`[Building _removeProgressBar] Removed progress bar for ${this.name} (${this.id})`);
        }
    }

    /**
     * Gets the current construction progress as a percentage.
     * @returns {number} Progress percentage (0.0 to 1.0)
     */
    getConstructionProgress() {
        if (this.constructionRequiredTime <= 0) return 1.0;
        return Math.min(this.currentConstructionProgress / this.constructionRequiredTime, 1.0);
    }

    /**
     * Estimates time remaining for construction.
     * @returns {number} Time remaining in milliseconds
     */
    getConstructionTimeRemaining() {
        if (this.constructionRequiredTime <= 0) return 0;
        return Math.max(this.constructionRequiredTime - this.currentConstructionProgress, 0);
    }

    /**
     * Enhanced update method with improved production chain processing.
     * This provides a base implementation that subclasses can use or override.
     * @param {number} deltaTime - The time elapsed since the last update in milliseconds.
     * @param {number} currentTime - The current game time (e.g., Date.now()).
     */
    updateProductionChain(deltaTime, currentTime) {
        if (!this.isConstructed || this.workers.length === 0) {
            return;
        }

        // Handle food consumption
        this._checkAndConsumeFood(currentTime);
        if (this.isHaltedByNoFood) {
            // Reset processing progress if halted by food
            this.currentProcessingProgress = 0;
            return;
        }

        // Handle processing chain logic
        if (this.consumesMaterials && this.consumesMaterials.length > 0 && 
            this.producesMaterials && this.producesMaterials.length > 0 && 
            this.processingTime > 0) {

            const validation = this.validateProductionCycle();
            
            if (validation.canStart) {
                // Continue or start processing
                this.currentProcessingProgress += deltaTime;

                if (this.currentProcessingProgress >= this.processingTime) {
                    // Complete the production cycle
                    const result = this.executeProductionCycle();
                    
                    if (result.success) {
                        // Log production result
                        const consumedStr = result.consumed.map(item => `${item.quantity} ${item.resource}`).join(', ');
                        const producedStr = result.produced.map(item => `${item.quantity} ${item.resource}`).join(', ');
                        console.log(`${this.name} (${this.id}) completed production: consumed [${consumedStr}] → produced [${producedStr}]`);
                    }
                    
                    // Reset progress for next cycle
                    this.currentProcessingProgress = 0;
                }
            } else {
                // Cannot start or continue processing, reset progress
                if (this.currentProcessingProgress > 0) {
                    console.log(`${this.name} (${this.id}) production halted: ${validation.reason}`);
                }
                this.currentProcessingProgress = 0;
            }
        }
    }
    
    /**
     * Checks and consumes food for workers if necessary.
     * This method handles the food consumption logic that halts production when workers don't have food.
     * @param {number} currentTime - The current game time (e.g., Date.now()).
     * @private
     */
    _checkAndConsumeFood(currentTime) {
        // Only check food if this building consumes food and has workers
        if (!this.consumesFood || this.consumesFood.length === 0 || this.workers.length === 0) {
            this.isHaltedByNoFood = false;
            return;
        }
        
        // Check if it's time for a food check
        if (this.lastFoodCheckTime === 0) {
            this.lastFoodCheckTime = currentTime;
        }
        
        if (currentTime - this.lastFoodCheckTime < this.foodCheckIntervalMs) {
            return; // Not time for food check yet
        }
        
        // Calculate food needed based on workers and consumption rate
        const foodNeeded = this.workers.length * this.foodConsumptionRate;
        
        if (foodNeeded <= 0) {
            this.isHaltedByNoFood = false;
            this.lastFoodCheckTime = currentTime;
            return;
        }
        
        // Try to find and consume any available food type
        let foodConsumed = false;
        for (const foodType of this.consumesFood) {
            const availableFood = this.inventory[foodType] || 0;
            
            if (availableFood >= foodNeeded) {
                // Consume the food
                this.inventory[foodType] = availableFood - foodNeeded;
                foodConsumed = true;
                console.log(`${this.name} (${this.id}) consumed ${foodNeeded} ${foodType} for ${this.workers.length} workers`);
                break;
            }
        }
        
        if (!foodConsumed) {
            // No food available, halt production
            if (!this.isHaltedByNoFood) {
                console.log(`${this.name} (${this.id}) halted: No food available for ${this.workers.length} workers`);
            }
            this.isHaltedByNoFood = true;
        } else {
            // Food consumed successfully, resume production
            if (this.isHaltedByNoFood) {
                console.log(`${this.name} (${this.id}) resumed: Food consumed for workers`);
            }
            this.isHaltedByNoFood = false;
        }
        
        this.lastFoodCheckTime = currentTime;
    }

    /**
     * Gets the entry point grid position where serfs should stand to interact with this building.
     * This is typically adjacent to the building, often in front of it.
     * @returns {{x: number, z: number}} The grid coordinates of the building's entry point.
     */
    getEntryPointGridPosition() {
        // For most buildings, the entry point is just in front of the building (south side)
        // Buildings are typically accessed from the south (positive Z direction)
        return {
            x: this.gridX,
            z: this.gridZ + 1
        };
    }
}

export default Building;
