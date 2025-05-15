// src/core/constructionManager.js
// src/core/constructionManager.js
import * as THREE from 'three';
import resourceManager, { RESOURCE_TYPES } from './resourceManager.js';
import * as Buildings from '../entities/buildings.js'; // To get building creation functions
import { TILE_SIZE } from './MapManager.js'; // Changed casing: Import TILE_SIZE
import { SERF_PROFESSIONS } from './serfManager.js'; // Ensure this import is present

// Define building costs and metadata
// This would ideally come from a more structured game data system later
export const BUILDING_DATA = {
    CASTLE: { name: 'Castle', cost: {}, creator: Buildings.createCastle, tier: 0 }, // No cost to place initially
    WOODCUTTERS_HUT: { 
        name: "Woodcutter's Hut", 
        cost: { [RESOURCE_TYPES.WOOD]: 20 }, 
        creator: Buildings.createWoodcuttersHut, 
        tier: 1,
        producesResource: RESOURCE_TYPES.WOOD,
        productionRate: 5, // Units per minute (e.g., 5 wood per 60 seconds)
        productionIntervalMs: (60 / 5) * 1000, // Interval in ms for 1 unit
        jobSlots: 1, // Number of serfs this building can employ
        jobProfession: SERF_PROFESSIONS.WOODCUTTER, 
        requiredTool: RESOURCE_TYPES.TOOLS_AXE,
        consumesFood: [RESOURCE_TYPES.BREAD, RESOURCE_TYPES.FISH], // Added for testing
        foodConsumptionRate: 1, // 1 unit per interval
        foodCheckIntervalMs: 15000, // Check/consume food every 15 seconds (example)
    },
    FORESTERS_HUT: { 
        name: "Forester's Hut", 
        cost: { [RESOURCE_TYPES.WOOD]: 15 }, 
        creator: Buildings.createForestersHut, 
        tier: 1,
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.FORESTER, // No tool specified for Forester in game.md
    },
    QUARRY: { 
        name: 'Quarry', 
        cost: { [RESOURCE_TYPES.WOOD]: 25 }, 
        creator: Buildings.createQuarry, 
        tier: 1,
        jobSlots: 1, // Example
        jobProfession: SERF_PROFESSIONS.STONEMASON, // Let's change this to MINER for testing food
        // jobProfession: SERF_PROFESSIONS.MINER, 
        requiredTool: RESOURCE_TYPES.TOOLS_PICKAXE,
        consumesFood: [RESOURCE_TYPES.BREAD, RESOURCE_TYPES.FISH], // Types of food
        foodConsumptionRate: 0.1, // e.g., 0.1 units per some interval while working
        foodCheckIntervalMs: 10000, // Check/consume food every 10 seconds
    },
    FISHERMANS_HUT: { 
        name: "Fisherman's Hut", 
        cost: { [RESOURCE_TYPES.WOOD]: 15 }, 
        creator: Buildings.createFishermansHut, 
        tier: 1,
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.FISHERMAN,
        requiredTool: RESOURCE_TYPES.TOOLS_FISHING_ROD,
    },
    GEOLOGISTS_HUT: {
        name: "Geologist's Hut",
        cost: { [RESOURCE_TYPES.WOOD]: 20, [RESOURCE_TYPES.STONE]: 5 },
        creator: Buildings.createGeologistsHut,
        tier: 1,
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.GEOLOGIST,
        // Geologists don't produce resources directly, they find them.
        // No required tool specified for Geologist in game.md for basic scanning.
    },
    BLACKSMITH: {
        name: 'Blacksmith',
        cost: { [RESOURCE_TYPES.WOOD]: 30, [RESOURCE_TYPES.STONE]: 10 },
        creator: Buildings.createBlacksmithArmory,
        tier: 2,
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.BLACKSMITH,
        producesResource: RESOURCE_TYPES.TOOLS_AXE, // Example of producing tools
        productionRate: 1, // 1 tool per interval
        productionIntervalMs: 10000, // 10 seconds for 1 tool
        requiredTool: RESOURCE_TYPES.TOOLS_HAMMER, // Example of a tool needed for production
        consumesFood: [RESOURCE_TYPES.BREAD, RESOURCE_TYPES.FISH], // Added for testing
        foodConsumptionRate: 0.1, // e.g., 0.1 units per some interval while working
        foodCheckIntervalMs: 10000, // Check/consume food every 10 seconds
    },
    BAKERY: {
        name: 'Bakery',
        cost: { [RESOURCE_TYPES.WOOD]: 25, [RESOURCE_TYPES.STONE]: 5 },
        creator: Buildings.createBakery,
        tier: 2,
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.BAKER,
        producesResource: RESOURCE_TYPES.BREAD,
        productionRate: 1, // 1 bread per interval
        productionIntervalMs: 10000, // 10 seconds for 1 bread
        requiredTool: RESOURCE_TYPES.TOOLS_HAMMER, // Example of a tool needed for production
        consumesFood: [RESOURCE_TYPES.GRAIN], // Needs grain to produce bread
        foodConsumptionRate: 0.1, // e.g., 0.1 units per some interval while working
        foodCheckIntervalMs: 10000, // Check/consume food every 10 seconds
    },
    PIG_FARM: {
        name: 'Pig Farm',
        cost: { [RESOURCE_TYPES.WOOD]: 20, [RESOURCE_TYPES.STONE]: 10 },
        creator: Buildings.createPigFarm,
        tier: 2,
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.PIG_FARMER,
        producesResource: RESOURCE_TYPES.PIGS, // Assuming pigs are a resource type
        productionRate: 1, // 1 pig per interval
        productionIntervalMs: 20000, // 20 seconds for 1 pig
        requiredTool: RESOURCE_TYPES.TOOLS_SCYTHE, // Example of a tool needed for production
        consumesFood: [RESOURCE_TYPES.GRAIN], // Needs grain to produce pigs
        foodConsumptionRate: 0.1, // e.g., 0.1 units per some interval while working
        foodCheckIntervalMs: 10000, // Check/consume food every 10 seconds
    },

    // Add more buildings as they are implemented for construction
    // Example:
    // SAWMILL: { name: 'Sawmill', cost: { [RESOURCE_TYPES.WOOD]: 30, [RESOURCE_TYPES.STONE]: 10 }, creator: Buildings.createSawmill, tier: 2 },
};

class ConstructionManager {
    constructor(scene, gameMap) {
        this.scene = scene;
        this.gameMap = gameMap;
        this.selectedBuildingType = null;
        this.placementIndicator = null; // Ghost mesh for placement
        this.isPlacing = false;
        this.buildingsUnderConstruction = []; // To track buildings being built
        this.placedBuildings = []; // To track completed game objects

        this._setupPlacementIndicator();
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
        this.scene.add(this.placementIndicator);
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
        const snappedX = Math.round(worldPosition.x / TILE_SIZE) * TILE_SIZE;
        const snappedZ = Math.round(worldPosition.z / TILE_SIZE) * TILE_SIZE;
        buildingModel.position.set(snappedX, 0, snappedZ); // Assuming building models have origin at their base center
        
        // Add to a specific group for buildings in the scene, not directly to scene
        const buildingsGroup = this.scene.getObjectByName("GameBuildings") || new THREE.Group();
        if (!buildingsGroup.parent) {
            buildingsGroup.name = "GameBuildings";
            this.scene.add(buildingsGroup);
        }
        buildingsGroup.add(buildingModel);

        console.log(`${buildingInfo.name} placed at (${snappedX}, ${snappedZ})`);
        
        // TODO: Initiate construction process (Builder serf, timer, etc.)
        // For now, simulate a simple timer
        const constructionTime = 5000; // 5 seconds (example)
        const newBuildingData = {
            model: buildingModel,
            type: this.selectedBuildingType,
            info: buildingInfo,
            constructionEndTime: Date.now() + constructionTime,
            isConstructed: false,
            x: snappedX,
            z: snappedZ,
        };
        this.buildingsUnderConstruction.push(newBuildingData);
        
        console.log(`${buildingInfo.name} construction started. Will finish in ${constructionTime / 1000}s.`);

        // Make the building semi-transparent during construction
        this._setBuildingOpacity(buildingModel, 0.5);


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
                }

                this.placedBuildings.push(building); // Move to completed list
                this.buildingsUnderConstruction.splice(i, 1); // Remove from under construction
                console.log(`${building.info.name} at (${building.x}, ${building.z}) construction complete!`);
            }
        }

        // Handle production for completed buildings
        for (const building of this.placedBuildings) {
            if (building.isConstructed && 
                building.info.producesResource && 
                building.info.productionIntervalMs && 
                building.lastProductionTime &&
                building.workers && building.workers.length > 0) { // Production only if workers are present
                
                // console.log(`Checking production for ${building.info.name}: now=${now}, lastProd=${building.lastProductionTime}, interval=${building.info.productionIntervalMs}`);
                if (now >= building.lastProductionTime + building.info.productionIntervalMs) {
                    console.log(`Production condition met for ${building.info.name}. Now: ${now}, LastProd+Interval: ${building.lastProductionTime + building.info.productionIntervalMs}`);
                    resourceManager.addResource(building.info.producesResource, 1); // Produce 1 unit
                    building.lastProductionTime = now; // Reset timer
                    console.log(`${building.info.name} at (${building.x}, ${building.z}) produced 1 ${building.info.producesResource} (Workers: ${building.workers.length}).`);
                }
            }
        }
    }
}

export default ConstructionManager;
