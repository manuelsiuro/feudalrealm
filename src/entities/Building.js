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
    constructor(type, gridX, gridZ, gameMap, buildingDataEntry) {
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
        } else {
            this.currentConstructionState = BUILDING_STATE_NEEDS_CONSTRUCTION;
            this.isConstructed = false;
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
            console.error(`Building ${this.id} (${this.name}): Model not created before placing.`);
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
     * Initiates the construction process for this building.
     * @param {string} builderId - The ID of the serf assigned to build.
     * @param {THREE.Scene} scene - The main scene to add the progress bar to.
     */
    startConstructionProcess(builderId, scene) {
        console.log(`[Building START_CONSTRUCTION_PROCESS] ${this.id} (${this.name}): Called by builder ${builderId}. Current state: ${this.currentConstructionState}, Required time: ${this.constructionRequiredTime}`);
        
        if (this.currentConstructionState !== BUILDING_STATE_NEEDS_CONSTRUCTION) {
            console.warn(`${this.name} (${this.id}): Construction already started or completed. Current state: ${this.currentConstructionState}`);
            return;
        }
        
        if (this.assignedBuilderId && this.assignedBuilderId !== builderId) {
            console.warn(`${this.name} (${this.id}): Already assigned to builder ${this.assignedBuilderId}. Cannot assign to ${builderId}.`);
            return;
        }
        
        if (this.constructionRequiredTime <= 0) {
            console.log(`${this.name} (${this.id}): No construction time required. Marking as constructed.`);
            this.completeConstructionProcess();
            return;
        }

        this.currentConstructionState = BUILDING_STATE_UNDER_CONSTRUCTION;
        this.assignedBuilderId = builderId;
        this.currentConstructionProgress = 0;
        
        if (this.model) {
            this._setOpacityRecursive(this.model, 0.5);
        }

        // Create and display progress bar
        this._createProgressBar(scene);

        console.log(`[Building START_CONSTRUCTION_PROCESS] ${this.name} (${this.id}) construction started by builder ${builderId}. New state: ${this.currentConstructionState}. Required time: ${this.constructionRequiredTime}ms.`);
    }

    /**
     * Updates the construction progress.
     * @param {number} deltaTime - The time elapsed since the last update in milliseconds.
     * @returns {boolean} True if construction is complete, false otherwise.
     */
    updateConstructionProgress(deltaTime) {
        if (this.currentConstructionState !== BUILDING_STATE_UNDER_CONSTRUCTION) {
            // console.log(`[Building UPDATE_CONSTRUCTION_PROGRESS] ${this.id} (${this.name}): Not UNDER_CONSTRUCTION. State: ${this.currentConstructionState}. Skipping update.`);
            return false;
        }

        this.currentConstructionProgress += deltaTime;
        // console.log(`[Building UPDATE_CONSTRUCTION_PROGRESS] ${this.id} (${this.name}): deltaTime: ${deltaTime}, progress: ${this.currentConstructionProgress}/${this.constructionRequiredTime}`);
        this._updateProgressBar();

        if (this.currentConstructionProgress >= this.constructionRequiredTime) {
            // console.log(`[Building UPDATE_CONSTRUCTION_PROGRESS] ${this.id} (${this.name}): Progress met. Completing construction.`);
            this.completeConstructionProcess();
            return true;
        }
        return false;
    }

    /**
     * Finalizes the construction process for this building.
     */
    completeConstructionProcess() {
        console.log(`[Building COMPLETE_CONSTRUCTION_PROCESS] ${this.id} (${this.name}): Called. Current state before: ${this.currentConstructionState}`);
        
        this.currentConstructionState = BUILDING_STATE_CONSTRUCTED;
        this.isConstructed = true; // Ensure legacy flag is set
        this.currentConstructionProgress = this.constructionRequiredTime; // Cap progress
        
        // Clear builder assignment
        const previousBuilderId = this.assignedBuilderId;
        this.assignedBuilderId = null;

        // Restore full opacity
        if (this.model) {
            this._setOpacityRecursive(this.model, 1.0);
        }
        
        // Remove progress bar with cleanup
        this._removeProgressBar();

        // Initialize timing for production buildings
        this.lastProductionTime = Date.now();
        this.lastFoodCheckTime = Date.now();
        
        console.log(`[Building COMPLETE_CONSTRUCTION_PROCESS] ${this.name} (${this.id}) construction complete! Builder ${previousBuilderId} can return to hut. New state: ${this.currentConstructionState}`);
    }

    /**
     * @deprecated Use startConstructionProcess instead.
     * Initiates the construction process for this building.
     * @param {number} durationSeconds - The duration of the construction in seconds.
     */
    startConstruction(durationSeconds) {
        console.warn("Building.startConstruction() is deprecated. Use startConstructionProcess(builderId, scene) instead.");
        // This method is now largely a no-op or could redirect if a scene is available globally
        // For now, it just sets the old flags for minimal disruption if called by old code.
        this.isConstructed = false;
        // this.constructionEndTime = Date.now() + (durationSeconds * 1000); // No longer used
        if (this.model) {
            this._setOpacityRecursive(this.model, 0.5);
        }
    }

    /**
     * @deprecated Use completeConstructionProcess instead.
     * Finalizes the construction process for this building.
     * Makes the building fully opaque and initializes production/food check timers.
     */
    finishConstruction() {
        console.warn("Building.finishConstruction() is deprecated. Use completeConstructionProcess() instead.");
        // This method is now largely a no-op or could redirect.
        // For now, it just sets the old flags for minimal disruption if called by old code.
        this.isConstructed = true;
        if (this.model) {
            this._setOpacityRecursive(this.model, 1.0);
        }
        this.lastProductionTime = Date.now();
        this.lastFoodCheckTime = Date.now();
    }
    
    /**
     * Sets the opacity of the building's model.
     * Used to make the building semi-transparent during construction.
     * @param {number} opacity - The opacity value (0.0 to 1.0).
     */
    setOpacity(opacity) {
        if (this.model) {
            this._setOpacityRecursive(this.model, opacity);
        }
    }

    /**
     * Recursively sets opacity on all materials of meshes in the object.
     * @param {THREE.Object3D} object3D
     * @param {number} opacity
     * @protected
     */
    _setOpacityRecursive(object3D, opacity) {
        if (!object3D) return;
        object3D.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => {
                        material.transparent = opacity < 1.0;
                        material.opacity = opacity;
                        material.needsUpdate = true;
                    });
                } else {
                    child.material.transparent = opacity < 1.0;
                    child.material.opacity = opacity;
                    child.material.needsUpdate = true;
                }
            }
        });
    }

    /**
     * @private
     * Creates and displays a progress bar above the building.
     * @param {THREE.Scene} scene - The scene to add the progress bar to.
     */
    _createProgressBar(scene) {
        if (!this.model || !scene) return;
        if (this.progressBarGroup) { // Check for the group
            this._removeProgressBar();
        }

        const barWidth = TILE_SIZE * (this.info.size?.width || 1) * 0.8;
        const barHeight = TILE_SIZE * 0.1;
        const barDepth = TILE_SIZE * 0.05; // Very thin bar

        // Background (the empty part of the bar)
        const backgroundGeometry = new THREE.BoxGeometry(barWidth, barHeight, barDepth);
        const backgroundMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x333333, 
            transparent: true, 
            opacity: 0.8 
        });
        const backgroundBar = new THREE.Mesh(backgroundGeometry, backgroundMaterial);

        // Foreground (the filled part of the bar)
        const foregroundGeometry = new THREE.BoxGeometry(barWidth, barHeight, barDepth);
        const foregroundMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffaa00, // Orange color for construction
            transparent: true, 
            opacity: 0.9 
        });
        const foregroundBar = new THREE.Mesh(foregroundGeometry, foregroundMaterial);
        foregroundBar.position.x = -barWidth / 2; // Align left edge
        
        // Group them for easier positioning and management
        this.progressBarGroup = new THREE.Group();
        this.progressBarGroup.add(backgroundBar);
        this.progressBarGroup.add(foregroundBar);
        
        this.progressBarMesh = foregroundBar; // Store reference to the part that scales
        this.progressBarMesh.userData.isProgressBar = true;
        this.progressBarMesh.userData.buildingId = this.id;
        backgroundBar.userData.isProgressBarBackground = true;
        backgroundBar.userData.buildingId = this.id;
        this.progressBarGroup.name = `ProgressBar_${this.id}`;

        // Position the progress bar above the building model
        const buildingBox = new THREE.Box3().setFromObject(this.model);
        const buildingHeight = buildingBox.max.y - buildingBox.min.y;

        // Position the group relative to the building's model's world position
        this.progressBarGroup.position.set(
            this.model.position.x, 
            this.model.position.y + buildingHeight + TILE_SIZE * 0.3, // A bit above the building
            this.model.position.z
        );
        
        scene.add(this.progressBarGroup);
        this._updateProgressBar(); // Set initial scale
        
        console.log(`[Building] Progress bar created for ${this.name} (${this.id})`);
    }

    /**
     * @private
     * Updates the visual state of the progress bar.
     */
    _updateProgressBar() {
        if (!this.progressBarMesh || !this.progressBarGroup || this.constructionRequiredTime <= 0) {
            return;
        }

        const progressRatio = Math.min(this.currentConstructionProgress / this.constructionRequiredTime, 1);
        this.progressBarMesh.scale.x = progressRatio;
        
        // Adjust position to keep the left edge aligned as it scales
        const barWidth = TILE_SIZE * (this.info.size?.width || 1) * 0.8;
        this.progressBarMesh.position.x = - (barWidth * (1 - progressRatio)) / 2;

        // Change color based on progress
        if (this.progressBarMesh.material) {
            if (progressRatio < 0.33) {
                this.progressBarMesh.material.color.setHex(0xff4444); // Red for early progress
            } else if (progressRatio < 0.66) {
                this.progressBarMesh.material.color.setHex(0xffaa00); // Orange for mid progress
            } else {
                this.progressBarMesh.material.color.setHex(0x44ff44); // Green for near completion
            }
        }

        // Make sure the progress bar is visible only during construction
        if (this.progressBarGroup) {
            this.progressBarGroup.visible = this.currentConstructionState === BUILDING_STATE_UNDER_CONSTRUCTION;
        }
    }

    /**
     * @private
     * Removes the progress bar from the scene.
     */
    _removeProgressBar() {
        if (this.progressBarGroup && this.progressBarGroup.parent) {
            this.progressBarGroup.parent.remove(this.progressBarGroup);
            
            // Dispose of geometries and materials to free up resources
            this.progressBarGroup.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });
            
            console.log(`[Building] Progress bar removed for ${this.name} (${this.id})`);
        }
        this.progressBarMesh = null;
        this.progressBarGroup = null;
    }

    /**
     * Updates the building's state, e.g., production, food consumption.
     * Subclasses will override this to add specific behaviors (production, consumption)
     * @param {number} deltaTime - The time elapsed since the last update in milliseconds.
     * @param {number} currentTime - The current game time (e.g., Date.now()).
     */
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
