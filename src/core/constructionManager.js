// src/core/constructionManager.js
// src/core/constructionManager.js
import * as THREE from 'three';
import resourceManager, { RESOURCE_TYPES } from './resourceManager.js';
import * as Buildings from '../entities/buildings.js'; // To get building creation functions
import { TILE_SIZE } from './MapManager.js'; // Changed casing: Import TILE_SIZE

// Define building costs and metadata
// This would ideally come from a more structured game data system later
export const BUILDING_DATA = {
    CASTLE: { name: 'Castle', cost: {}, creator: Buildings.createCastle, tier: 0 }, // No cost to place initially
    WOODCUTTERS_HUT: { name: "Woodcutter's Hut", cost: { [RESOURCE_TYPES.WOOD]: 20 }, creator: Buildings.createWoodcuttersHut, tier: 1 },
    FORESTERS_HUT: { name: "Forester's Hut", cost: { [RESOURCE_TYPES.WOOD]: 15 }, creator: Buildings.createForestersHut, tier: 1 },
    QUARRY: { name: 'Quarry', cost: { [RESOURCE_TYPES.WOOD]: 25 }, creator: Buildings.createQuarry, tier: 1 },
    FISHERMANS_HUT: { name: "Fisherman's Hut", cost: { [RESOURCE_TYPES.WOOD]: 15 }, creator: Buildings.createFishermansHut, tier: 1 },
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
}

export default ConstructionManager;
