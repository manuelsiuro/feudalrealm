// src/core/constructionManager.js
import * as THREE from 'three';
import resourceManager from './resourceManager.js';
import * as Buildings from '../entities/buildings.js'; // To get building creation functions
import { TILE_SIZE } from '../config/mapConstants.js'; // Corrected import path
import { SERF_PROFESSIONS } from '../config/serfProfessions.js'; // Corrected import path
import { RESOURCE_TYPES } from '../config/resourceTypes.js';
import { BUILDING_DATA } from '../config/buildingData.js';

// ---- START DEBUG LOG ----
console.log("[ConstructionManager] Initializing BUILDING_DATA. Inspecting Buildings module:", Buildings);
console.log("[ConstructionManager] Buildings.createCastle:", Buildings.createCastle);
console.log("[ConstructionManager] Buildings.createWoodcuttersHut:", Buildings.createWoodcuttersHut);
console.log("[ConstructionManager] Buildings.createTransportersHut:", Buildings.createTransportersHut);
// ---- END DEBUG LOG ----

class ConstructionManager {
    constructor(scene, gameMap, gameElementsGroup) { // Added gameElementsGroup
        this.scene = scene;
        this.gameMap = gameMap;
        this.gameElementsGroup = gameElementsGroup; // Store gameElementsGroup
        this.selectedBuildingType = null;
        this.placementIndicator = null; // Ghost mesh for placement
        this.isPlacing = false;
        this.buildingsUnderConstruction = []; // To track buildings being built
        this.placedBuildings = []; // To track completed game objects

        this.onChangeCallback = null; // For UIManager to listen to changes

        this._setupPlacementIndicator();
        // No automatic call to setupInitialStructures here, main.js will call it.
    }

    _setupPlacementIndicator() {
        // A simple semi-transparent box for now
        const geometry = new THREE.BoxGeometry(1, 0.2, 1); // Placeholder size
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00, 
            transparent: true, 
            opacity: 0.5,
            wireframe: true 
        });
        this.placementIndicator = new THREE.Mesh(geometry, material);
        this.placementIndicator.visible = false;
        this.gameElementsGroup.add(this.placementIndicator); // Add to gameElementsGroup
    }

    startPlacement(buildingKey) {
        if (!BUILDING_DATA[buildingKey] || !BUILDING_DATA[buildingKey].creator) {
            console.error(`Building type ${buildingKey} not found or no creator function.`);
            return;
        }
        this.selectedBuildingType = buildingKey;
        this.isPlacing = true;
        
        // Update placement indicator visual based on selected building (simplified)
        // For now, just make it visible. A better approach would be to show a ghost of the actual building.
        this.placementIndicator.visible = true; 
        console.log(`Started placement for ${BUILDING_DATA[buildingKey].name}`);
    }

    updatePlacementIndicator(worldPosition) {
        if (!this.isPlacing || !this.placementIndicator) return;

        // Snap to grid (basic implementation)
        // This needs to align with how map tiles are positioned
        const snappedX = Math.round(worldPosition.x / TILE_SIZE) * TILE_SIZE;
        const snappedZ = Math.round(worldPosition.z / TILE_SIZE) * TILE_SIZE;
        
        this.placementIndicator.position.set(snappedX, 0.1, snappedZ); // Slightly above ground

        // TODO: Check for valid placement (e.g., terrain type, collisions)
        // For now, always green
        this.placementIndicator.material.color.set(0x00ff00); // Green for valid
    }

    confirmPlacement(worldPosition) {
        if (!this.isPlacing || !this.selectedBuildingType) return false;

        const buildingInfo = BUILDING_DATA[this.selectedBuildingType];
        
        // 1. Check resource costs
        for (const resourceType in buildingInfo.cost) {
            if (resourceManager.getResourceCount(resourceType) < buildingInfo.cost[resourceType]) {
                console.warn(`Not enough ${resourceType} to build ${buildingInfo.name}.`);
                alert(`Not enough ${resourceType}!`);
                this.cancelPlacement();
                return false;
            }
        }

        // 2. Deduct resources
        for (const resourceType in buildingInfo.cost) {
            resourceManager.removeResource(resourceType, buildingInfo.cost[resourceType]);
        }

        // 3. Create and place building model
        const buildingModel = buildingInfo.creator();
        const snappedWorldX = Math.round(worldPosition.x / TILE_SIZE) * TILE_SIZE;
        const snappedWorldZ = Math.round(worldPosition.z / TILE_SIZE) * TILE_SIZE;
        buildingModel.position.set(snappedWorldX, 0, snappedWorldZ); 
        
        // Convert centered world coordinates to 0-indexed grid coordinates
        const placedGridX = Math.round(snappedWorldX / TILE_SIZE + (this.gameMap.width - 1) / 2);
        const placedGridZ = Math.round(snappedWorldZ / TILE_SIZE + (this.gameMap.height - 1) / 2);
        
        const buildingsGroup = this.gameElementsGroup.getObjectByName("GameBuildings") || new THREE.Group();
        if (!buildingsGroup.parent) {
            buildingsGroup.name = "GameBuildings";
            this.gameElementsGroup.add(buildingsGroup); // Add to gameElementsGroup
        }
        buildingsGroup.add(buildingModel);

        console.log(`${buildingInfo.name} placed at world (${snappedWorldX}, ${snappedWorldZ}), grid (${placedGridX}, ${placedGridZ})`);
        
        const constructionTime = 5000; // 5 seconds (example)
        const newBuildingData = {
            model: buildingModel,
            type: this.selectedBuildingType,
            info: buildingInfo,
            constructionEndTime: Date.now() + constructionTime,
            isConstructed: false,
            inventory: {}, 
            maxStock: buildingInfo.maxStock || 100, 
            workers: [], 
            gridX: placedGridX, // Store 0-indexed grid X
            gridZ: placedGridZ, // Store 0-indexed grid Z

            getEntryPointGridPosition: function() {
                return { x: this.gridX, z: this.gridZ };
            },

            // Method to add resources to this building's local inventory
            addResource: function(resourceType, amount) {
                if (!this.isConstructed) {
                    console.warn("Building not constructed yet, cannot add resources.");
                    return 0;
                }
                const currentAmount = this.inventory[resourceType] || 0;
                const availableSpace = this.maxStock - currentAmount;
                const amountToAdd = Math.min(amount, availableSpace);

                if (amountToAdd > 0) {
                    this.inventory[resourceType] = currentAmount + amountToAdd;
                    console.log(`${this.info.name} added ${amountToAdd} of ${resourceType}. New stock: ${this.inventory[resourceType]}`);
                }
                return amountToAdd;
            },

            // Method to pick up resources from this building's local inventory
            pickupResource: function(resourceType, amountRequested) {
                if (!this.isConstructed) {
                    console.warn("Building not constructed yet, cannot pick up resources.");
                    return 0;
                }
                const currentAmount = this.inventory[resourceType] || 0;
                const amountToPickup = Math.min(amountRequested, currentAmount);

                if (amountToPickup > 0) {
                    this.inventory[resourceType] = currentAmount - amountToPickup;
                    console.log(`${this.info.name} picked up ${amountToPickup} of ${resourceType}. Remaining stock: ${this.inventory[resourceType]}`);
                }
                return amountToPickup;
            },

            // Method to get current stock of a resource
            getStock: function(resourceType) {
                return this.inventory[resourceType] || 0;
            }
        };

        // Store a reference to this data object in the model's userData
        buildingModel.userData.buildingInstance = newBuildingData;
        buildingModel.userData.uuid = buildingModel.uuid; // Also store uuid for easier access if needed

        // Add building to tracking
        this.buildingsUnderConstruction.push(newBuildingData);
        
        console.log(`${buildingInfo.name} construction started. Will finish in ${constructionTime / 1000}s.`);

        // Make the building semi-transparent during construction
        this._setBuildingOpacity(buildingModel, 0.5);

        this._notifyUI(); // Notify UI about the new building under construction

        this.cancelPlacement();
        return true;
    }

    cancelPlacement() {
        this.isPlacing = false;
        this.selectedBuildingType = null;
        if (this.placementIndicator) {
            this.placementIndicator.visible = false;
        }
        console.log("Placement cancelled or completed.");
    }

    getAvailableBuildings() {
        // Filter by tier or other conditions later
        return Object.keys(BUILDING_DATA)
            .map(key => ({ key, ...BUILDING_DATA[key] }))
            .filter(b => b.tier > 0); // Exclude Castle from build menu for now
    }

    _setBuildingOpacity(buildingModel, opacity) {
        buildingModel.traverse((child) => {
            if (child.isMesh) {
                child.material.transparent = opacity < 1;
                child.material.opacity = opacity;
                child.material.needsUpdate = true;
            }
        });
    }

    // New method to place and instantly construct a building
    placeAndConstructInitialBuilding(buildingKey, gridX, gridZ) { // gridX, gridZ are 0-indexed map coordinates
        const buildingInfo = BUILDING_DATA[buildingKey];
        if (!buildingInfo || !buildingInfo.creator) {
            console.error(`[InitialSetup] Building type ${buildingKey} not found or no creator function.`);
            return null;
        }

        console.log(`[InitialSetup] Placing and constructing ${buildingInfo.name} at grid (${gridX}, ${gridZ})`);

        const buildingModel = buildingInfo.creator();
        // Convert 0-indexed grid coordinates to centered world coordinates
        const worldX = (gridX - (this.gameMap.width - 1) / 2) * TILE_SIZE;
        const worldZ = (gridZ - (this.gameMap.height - 1) / 2) * TILE_SIZE;
        buildingModel.position.set(worldX, 0, worldZ);

        const buildingsGroup = this.gameElementsGroup.getObjectByName("GameBuildings") || new THREE.Group();
        if (!buildingsGroup.parent) {
            buildingsGroup.name = "GameBuildings";
            this.gameElementsGroup.add(buildingsGroup); // Add to gameElementsGroup
        }
        buildingsGroup.add(buildingModel);

        const newBuildingData = {
            model: buildingModel,
            type: buildingKey,
            info: buildingInfo,
            isConstructed: true, // Instantly constructed
            constructionEndTime: Date.now(), // No construction time
            inventory: {},
            maxStock: buildingInfo.maxStock || 100,
            workers: [],
            gridX: gridX, // Store 0-indexed grid X
            gridZ: gridZ, // Store 0-indexed grid Z
            getEntryPointGridPosition: function() {
                return { x: this.gridX, z: this.gridZ };
            },
            addResource: function(resourceType, amount) {
                if (!this.isConstructed) return 0;
                const currentAmount = this.inventory[resourceType] || 0;
                const availableSpace = this.maxStock - currentAmount;
                const amountToAdd = Math.min(amount, availableSpace);
                if (amountToAdd > 0) {
                    this.inventory[resourceType] = currentAmount + amountToAdd;
                }
                return amountToAdd;
            },
            pickupResource: function(resourceType, amountRequested) {
                if (!this.isConstructed) return 0;
                const currentAmount = this.inventory[resourceType] || 0;
                const amountToPickup = Math.min(amountRequested, currentAmount);
                if (amountToPickup > 0) {
                    this.inventory[resourceType] = currentAmount - amountToPickup;
                }
                return amountToPickup;
            },
            getStock: function(resourceType) {
                return this.inventory[resourceType] || 0;
            }
        };

        buildingModel.userData.buildingInstance = newBuildingData;
        buildingModel.userData.uuid = buildingModel.uuid; 
        this.placedBuildings.push(newBuildingData);
        this._setBuildingOpacity(buildingModel, 1.0); // Fully opaque

        console.log(`[InitialSetup] ${buildingInfo.name} successfully placed and constructed at (${worldX}, ${worldZ}).`);
        this._notifyUI(); // Notify UI about the initially placed building
        return newBuildingData;
    }

    setupInitialStructures() {
        console.log("[ConstructionManager] Setting up initial structures...");
        // Determine placement for Transporter Hut (e.g., near center, offset from Castle if one exists)
        // For now, let's place it slightly offset from the absolute center.
        // Assuming Castle is at or very near map center.
        const mapCenterX = Math.floor(this.gameMap.width / 2);
        const mapCenterZ = Math.floor(this.gameMap.height / 2);

        // Place Castle first (if it's part of initial setup, assuming it is for drop-off points)
        // The Castle is usually tier 0 and placed by default logic if not explicitly handled.
        // Let's ensure a Castle is placed if not already.
        let castle = this.placedBuildings.find(b => b.type === 'CASTLE');
        if (!castle) {
            console.log("[ConstructionManager] No Castle found, placing one initially.");
            this.placeAndConstructInitialBuilding('CASTLE', mapCenterX, mapCenterZ);
        } else {
            console.log("[ConstructionManager] Castle already exists.");
        }
        
        // Place Transporter Hut near the Castle
        const hutGridX = mapCenterX + 3; // Example offset
        const hutGridZ = mapCenterZ;
        this.placeAndConstructInitialBuilding('TRANSPORTER_HUT', hutGridX, hutGridZ);
        console.log("[ConstructionManager] Initial structures setup complete.");
    }

    update() { 
        const now = Date.now();
        // console.log(`ConstructionManager update tick: ${now}`); // Can be too verbose

        for (let i = this.buildingsUnderConstruction.length - 1; i >= 0; i--) {
            const building = this.buildingsUnderConstruction[i];
            if (now >= building.constructionEndTime) {
                building.isConstructed = true;
                this._setBuildingOpacity(building.model, 1.0); // Make fully opaque
                
                // Initialize for production and jobs
                if (building.info.producesResource) {
                    building.lastProductionTime = now;
                }
                if (building.info.jobSlots) {
                    building.workers = []; // Array to store IDs of serfs working here
                    building.jobSlotsAvailable = building.info.jobSlots;
                    // Initialize food consumption properties
                    if (building.info.consumesFood && building.info.consumesFood.length > 0 && building.info.foodConsumptionRate > 0) {
                        building.lastFoodCheckTime = now;
                        building.isHaltedByNoFood = false;
                    }
                }

                this.placedBuildings.push(building); // Move to completed list
                this.buildingsUnderConstruction.splice(i, 1); // Remove from under construction
                console.log(`${building.info.name} at (${building.gridX}, ${building.gridZ}) construction complete!`);
                this._notifyUI(); // Notify UI about construction completion
            }
        }

        // Handle production and food consumption for completed buildings
        for (const building of this.placedBuildings) {
            if (!building.isConstructed) continue;

            const now = Date.now(); // Ensure 'now' is current for each building check

            // 1. Food Consumption Logic
            if (building.info.consumesFood && building.info.consumesFood.length > 0 &&
                building.info.foodConsumptionRate > 0 &&
                building.info.foodCheckIntervalMs > 0 &&
                building.workers && building.workers.length > 0) {

                if (building.lastFoodCheckTime === undefined) { // Should have been set at construction
                    building.lastFoodCheckTime = now;
                    building.isHaltedByNoFood = false;
                }

                if (now >= building.lastFoodCheckTime + building.info.foodCheckIntervalMs) {
                    const foodNeededThisInterval = building.info.foodConsumptionRate * building.workers.length;
                    let foodSatisfied = 0;
                    let consumedFoodDetails = [];

                    for (const foodType of building.info.consumesFood) {
                        if (foodSatisfied >= foodNeededThisInterval) break; // Already satisfied

                        const availableAmount = resourceManager.getResourceCount(foodType);
                        const amountToConsumeFromThisType = Math.min(availableAmount, foodNeededThisInterval - foodSatisfied);

                        if (amountToConsumeFromThisType > 0) {
                            if (resourceManager.removeResource(foodType, amountToConsumeFromThisType)) {
                                foodSatisfied += amountToConsumeFromThisType;
                                consumedFoodDetails.push(`${amountToConsumeFromThisType.toFixed(2)} ${foodType}`);
                            }
                        }
                    }

                    if (foodSatisfied >= foodNeededThisInterval) {
                        if (building.isHaltedByNoFood) { // If it was halted, log resumption
                            console.log(`${building.info.name} at (${building.gridX}, ${building.gridZ}) RESUMED production. Food available.`);
                        }
                        building.isHaltedByNoFood = false;
                        if (consumedFoodDetails.length > 0) {
                             console.log(`${building.info.name} at (${building.gridX}, ${building.gridZ}) consumed ${consumedFoodDetails.join(', ')} for ${building.workers.length} workers.`);
                        }
                    } else {
                        if (!building.isHaltedByNoFood) { // Log only when it newly halts
                           console.warn(`${building.info.name} at (${building.gridX}, ${building.gridZ}) HALTED. Insufficient food. Needed ${foodNeededThisInterval.toFixed(2)}, Got ${foodSatisfied.toFixed(2)}. Tried: ${building.info.consumesFood.join(', ')}.`);
                        }
                        building.isHaltedByNoFood = true;
                    }
                    building.lastFoodCheckTime = now;
                }
            }

            // 2. Production Logic (handles halting due to no food)
            if (building.info.producesResource && 
                building.info.productionIntervalMs && 
                building.lastProductionTime !== undefined && // Ensure it's initialized
                building.workers && building.workers.length > 0 &&
                !building.isHaltedByNoFood) { // Check if halted by no food
                
                if (now >= building.lastProductionTime + building.info.productionIntervalMs) {
                    // TODO: Add check for input materials if building.info.inputMaterials is defined
                    resourceManager.addResource(building.info.producesResource, 1); // Produce 1 unit for now
                    building.lastProductionTime = now; // Reset timer
                    console.log(`${building.info.name} at (${building.gridX}, ${building.gridZ}) produced 1 ${building.info.producesResource} (Workers: ${building.workers.length}).`);
                }
            }
        }
    }

    // Method for UIManager to subscribe to changes
    onChange(callback) {
        this.onChangeCallback = callback;
    }

    _notifyUI() {
        if (this.onChangeCallback) {
            this.onChangeCallback();
        }
    }
}

export default ConstructionManager;
