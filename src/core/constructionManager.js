// src/core/constructionManager.js
import * as THREE from 'three';
import resourceManager from './resourceManager.js';
// Removed: import * as Buildings from '../entities/buildings.js';
import { TILE_SIZE, TERRAIN_TYPES } from '../config/mapConstants.js'; // Added TERRAIN_TYPES
// SERF_PROFESSIONS and RESOURCE_TYPES might not be directly needed here anymore if Building class handles relevant logic
// import { SERF_PROFESSIONS } from '../config/serfProfessions.js'; 
// import { RESOURCE_TYPES } from '../config/resourceTypes.js';
import { BUILDING_DATA } from '../config/buildingData.js';

// Import new Building classes
import Building from '../entities/Building.js'; // Base class (if needed for type checking, though map uses specific)
import Castle from '../entities/buildings/Castle.js';
import WoodcuttersHut from '../entities/buildings/WoodcuttersHut.js';
import TransportersHut from '../entities/buildings/TransportersHut.js';
import Blacksmith from '../entities/buildings/Blacksmith.js';
import ForestersHut from '../entities/buildings/ForestersHut.js';
import Quarry from '../entities/buildings/Quarry.js';
import FishermansHut from '../entities/buildings/FishermansHut';
import GeologistsHut from '../entities/buildings/GeologistsHut';
import Bakery from '../entities/buildings/Bakery.js';
import PigFarm from '../entities/buildings/PigFarm.js';
import Farm from '../entities/buildings/Farm.js';
import IronMine from '../entities/buildings/IronMine.js';
import CoalMine from '../entities/buildings/CoalMine.js';
import GoldMine from '../entities/buildings/GoldMine.js';
import Sawmill from '../entities/buildings/Sawmill.js';
import Windmill from '../entities/buildings/Windmill.js';
import Slaughterhouse from '../entities/buildings/Slaughterhouse.js';
import IronSmelter from '../entities/buildings/IronSmelter.js';
import ToolmakersWorkshop from '../entities/buildings/ToolmakersWorkshop.js';
import GoldsmithsMint from '../entities/buildings/GoldsmithsMint.js';
import BlacksmithArmory from '../entities/buildings/BlacksmithArmory.js';
import GuardHut from '../entities/buildings/GuardHut.js';
import Watchtower from '../entities/buildings/Watchtower.js';
import BarracksFortress from '../entities/buildings/BarracksFortress.js';
import WarehouseStorehouse from '../entities/buildings/WarehouseStorehouse.js';
import BuildersHut from '../entities/buildings/BuildersHut.js';
import Harbor from '../entities/buildings/Harbor.js';
import Marketplace from '../entities/buildings/Marketplace.js';
import ChurchTemple from '../entities/buildings/ChurchTemple.js';
import Shipyard from '../entities/buildings/Shipyard.js';
import UniversityLibrary from '../entities/buildings/UniversityLibrary.js';
import SiegeWorkshop from '../entities/buildings/SiegeWorkshop.js';
import TreasuryMint from '../entities/buildings/TreasuryMint.js';

// Building Class Mapper
const buildingClassMap = {
    CASTLE: Castle,
    WOODCUTTERS_HUT: WoodcuttersHut,
    TRANSPORTER_HUT: TransportersHut,
    BLACKSMITH: Blacksmith,
    FORESTERS_HUT: ForestersHut,
    QUARRY: Quarry,
    FISHERMANS_HUT: FishermansHut,
    GEOLOGISTS_HUT: GeologistsHut,
    BAKERY: Bakery,
    PIG_FARM: PigFarm,
    FARM: Farm,
    IRON_MINE: IronMine,
    COAL_MINE: CoalMine,
    GOLD_MINE: GoldMine,
    SAWMILL: Sawmill,
    WINDMILL: Windmill,
    SLAUGHTERHOUSE: Slaughterhouse,
    IRON_SMELTER: IronSmelter,
    TOOLMAKERS_WORKSHOP: ToolmakersWorkshop,
    GOLDSMITHS_MINT: GoldsmithsMint,
    BLACKSMITH_ARMORY: BlacksmithArmory,
    GUARD_HUT: GuardHut,
    WATCHTOWER: Watchtower,
    BARRACKS_FORTRESS: BarracksFortress,
    WAREHOUSE_STOREHOUSE: WarehouseStorehouse,
    BUILDERS_HUT: BuildersHut,
    HARBOR: Harbor,
    MARKETPLACE: Marketplace,
    CHURCH_TEMPLE: ChurchTemple,
    SHIPYARD: Shipyard,
    UNIVERSITY_LIBRARY: UniversityLibrary,
    SIEGE_WORKSHOP: SiegeWorkshop,
    TREASURY_MINT: TreasuryMint,
    // ... add other mappings here as classes are created
};

// ---- REMOVE DEBUG LOGS for old Buildings module ----

class ConstructionManager {
    constructor(scene, gameMap, gameElementsGroup) { // SerfManager will be set via setSerfManager
        this.scene = scene; 
        this.gameMap = gameMap;
        this.gameElementsGroup = gameElementsGroup;
        this.selectedBuildingType = null;
        this.placementIndicator = null;
        this.isPlacing = false;
        this.buildingsUnderConstruction = [];
        this.placedBuildings = [];
        this.serfManager = null; // Added serfManager property

        this.onChangeCallback = null;

        this._setupPlacementIndicator();
    }

    setSerfManager(serfManager) { // Added method to set SerfManager
        this.serfManager = serfManager;
    }

    _setupPlacementIndicator() {
        const geometry = new THREE.BoxGeometry(TILE_SIZE, 0.2, TILE_SIZE); // Use TILE_SIZE
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.5,
            wireframe: true
        });
        this.placementIndicator = new THREE.Mesh(geometry, material);
        this.placementIndicator.visible = false;
        this.gameElementsGroup.add(this.placementIndicator);
    }

    startPlacement(buildingKey) {
        // Creator function check is removed as it's handled by Building class now
        if (!BUILDING_DATA[buildingKey]) {
            console.error(`ConstructionManager: Building type ${buildingKey} not found in BUILDING_DATA.`);
            return;
        }
        if (!buildingClassMap[buildingKey]) {
            console.error(`ConstructionManager: No class mapping for building type ${buildingKey}. Ensure it's added to buildingClassMap and imported.`);
            // Optionally, allow placement if a generic Building class or a placeholder is intended,
            // but for now, strict checking is better.
            return;
        }
        this.selectedBuildingType = buildingKey;
        this.isPlacing = true;
        this.placementIndicator.visible = true;
        console.log(`ConstructionManager: Started placement for ${BUILDING_DATA[buildingKey].name}`);
    }

    updatePlacementIndicator(worldPosition) {
        if (!this.isPlacing || !this.placementIndicator) return;

        const snappedX = Math.round(worldPosition.x / TILE_SIZE) * TILE_SIZE;
        const snappedZ = Math.round(worldPosition.z / TILE_SIZE) * TILE_SIZE;
        this.placementIndicator.position.set(snappedX, 0.1, snappedZ);

        const gridX = Math.round(snappedX / TILE_SIZE + (this.gameMap.width - 1) / 2);
        const gridZ = Math.round(snappedZ / TILE_SIZE + (this.gameMap.height - 1) / 2);

        if (this.isBuildable(gridX, gridZ)) {
            this.placementIndicator.material.color.set(0x00ff00); // Green
        } else {
            this.placementIndicator.material.color.set(0xff0000); // Red
        }
    }

    isBuildable(gridX, gridZ) {
        if (gridX < 0 || gridX >= this.gameMap.width || gridZ < 0 || gridZ >= this.gameMap.height) {
            return false; // Out of bounds
        }
        const tile = this.gameMap.getTile(gridX, gridZ);
        if (!tile) return false; // Should not happen if bounds check is correct

        // Define non-buildable terrain types
        const nonBuildableTerrains = [TERRAIN_TYPES.MOUNTAIN, TERRAIN_TYPES.WATER, TERRAIN_TYPES.FOREST]; 
        
        if (nonBuildableTerrains.includes(tile.terrainType)) {
            return false;
        }

        // Check if tile is already occupied by another building
        if (tile.isOccupied) { // Assuming GameMap.getTile returns a tile object with an isOccupied property
            return false;
        }

        return true;
    }

    confirmPlacement(worldPosition) {
        if (!this.isPlacing || !this.selectedBuildingType) return false;

        const buildingKey = this.selectedBuildingType;
        const buildingDataEntry = BUILDING_DATA[buildingKey];

        // 0. Check if the location is buildable BEFORE resource checks
        const snappedWorldX = Math.round(worldPosition.x / TILE_SIZE) * TILE_SIZE;
        const snappedWorldZ = Math.round(worldPosition.z / TILE_SIZE) * TILE_SIZE;
        const placedGridX = Math.round(snappedWorldX / TILE_SIZE + (this.gameMap.width - 1) / 2);
        const placedGridZ = Math.round(snappedWorldZ / TILE_SIZE + (this.gameMap.height - 1) / 2);

        if (!this.isBuildable(placedGridX, placedGridZ)) {
            console.warn(`ConstructionManager: Cannot place ${buildingDataEntry.name} at (${placedGridX}, ${placedGridZ}). Location not buildable.`);
            return false; 
        }

        // 1. Check resource costs
        for (const resourceType in buildingDataEntry.cost) {
            if (resourceManager.getResourceCount(resourceType) < buildingDataEntry.cost[resourceType]) {
                console.warn(`ConstructionManager: Not enough ${resourceType} to build ${buildingDataEntry.name}.`);
                alert(`Not enough ${resourceType}!`); // Consider replacing alert with in-game UI message
                this.cancelPlacement();
                return false;
            }
        }

        // 2. Deduct resources
        for (const resourceType in buildingDataEntry.cost) {
            resourceManager.removeResource(resourceType, buildingDataEntry.cost[resourceType]);
        }
        
        const BuildingClass = buildingClassMap[buildingKey];
        if (!BuildingClass) {
            console.error(`ConstructionManager: No class mapping for building type ${buildingKey}`);
            this.cancelPlacement(); // Cancel if no class defined for this building type
            return false;
        }

        // Snapped positions already calculated above
        // const snappedWorldX = Math.round(worldPosition.x / TILE_SIZE) * TILE_SIZE;
        // const snappedWorldZ = Math.round(worldPosition.z / TILE_SIZE) * TILE_SIZE;
        // const placedGridX = Math.round(snappedWorldX / TILE_SIZE + (this.gameMap.width - 1) / 2);
        // const placedGridZ = Math.round(snappedWorldZ / TILE_SIZE + (this.gameMap.height - 1) / 2);

        const newBuilding = new BuildingClass(placedGridX, placedGridZ, this.gameMap, buildingDataEntry);
        newBuilding.setResourceManager(resourceManager); // Pass the imported singleton

        // Ensure the map tile is marked as occupied immediately
        const placementSuccessfulOnMap = this.gameMap.placeBuilding(placedGridX, placedGridZ, newBuilding);
        if (!placementSuccessfulOnMap) {
            console.warn(`ConstructionManager: GameMap rejected placement for ${buildingDataEntry.name} at (${placedGridX}, ${placedGridZ}) even after isBuildable check. Aborting.`);
            // Note: Resources were already deducted. Consider rollback logic if this state is critical and frequent.
            this.cancelPlacement();
            return false;
        }

        const buildingsGroup = this.gameElementsGroup.getObjectByName("GameBuildings") || new THREE.Group();
        if (!buildingsGroup.parent) {
            buildingsGroup.name = "GameBuildings";
            this.gameElementsGroup.add(buildingsGroup);
        }
        newBuilding.placeModel(buildingsGroup); // Model is created within constructor or placeModel

        const constructionTimeSeconds = buildingDataEntry.constructionTimeSeconds || 5; 
        newBuilding.startConstruction(constructionTimeSeconds);
        
        this.buildingsUnderConstruction.push(newBuilding);
        console.log(`ConstructionManager: ${newBuilding.name} (ID: ${newBuilding.id}) construction started. Will finish in ${constructionTimeSeconds}s.`);

        if (this.serfManager) { // Call SerfManager to add construction task
            this.serfManager.addConstructionTask(newBuilding);
        } else {
            console.warn("ConstructionManager: SerfManager not set. Cannot add construction task.");
        }
        
        this._notifyUI();
        this.cancelPlacement();
        return true;
    }

    cancelPlacement() {
        this.isPlacing = false;
        this.selectedBuildingType = null;
        if (this.placementIndicator) {
            this.placementIndicator.visible = false;
        }
        console.log("ConstructionManager: Placement cancelled or completed.");
    }

    getAvailableBuildings() {
        return Object.keys(BUILDING_DATA)
            .filter(key => buildingClassMap[key] && BUILDING_DATA[key].tier > 0) // Ensure class exists and tier > 0
            .map(key => ({ key, ...BUILDING_DATA[key] }));
    }

    // _setBuildingOpacity removed, handled by Building class

    placeAndConstructInitialBuilding(buildingKey, gridX, gridZ) {
        const buildingDataEntry = BUILDING_DATA[buildingKey];
        if (!buildingDataEntry) {
            console.error(`[InitialSetup] Building type ${buildingKey} not found in BUILDING_DATA.`);
            return null;
        }
        
        const BuildingClass = buildingClassMap[buildingKey];
        if (!BuildingClass) {
            console.error(`[InitialSetup] No class mapping for building type ${buildingKey}.`);
            return null;
        }

        console.log(`[InitialSetup] Placing and constructing ${buildingDataEntry.name} at grid (${gridX}, ${gridZ})`);

        const newBuilding = new BuildingClass(gridX, gridZ, this.gameMap, buildingDataEntry);
        newBuilding.setResourceManager(resourceManager);

        // Ensure the map tile is marked as occupied
        const placementSuccessfulOnMap = this.gameMap.placeBuilding(gridX, gridZ, newBuilding);
        if (!placementSuccessfulOnMap) {
            console.error(`[InitialSetup] GameMap rejected placement for ${buildingDataEntry.name} at (${gridX}, ${gridZ}). This should not happen for initial setup.`);
            return null; 
        }

        const buildingsGroup = this.gameElementsGroup.getObjectByName("GameBuildings") || new THREE.Group();
        if (!buildingsGroup.parent) {
            buildingsGroup.name = "GameBuildings";
            this.gameElementsGroup.add(buildingsGroup);
        }
        newBuilding.placeModel(buildingsGroup);
        newBuilding.finishConstruction(); // Instantly constructed

        this.placedBuildings.push(newBuilding);
        
        console.log(`[InitialSetup] ${newBuilding.name} (ID: ${newBuilding.id}) successfully placed and constructed.`);
        this._notifyUI();
        return newBuilding;
    }

    setupInitialStructures() {
        console.log("[ConstructionManager] Setting up initial structures...");
        const mapCenterX = Math.floor(this.gameMap.width / 2);
        const mapCenterZ = Math.floor(this.gameMap.height / 2);

        // Ensure Castle is placed if not already
        /*
        let castleInstance = this.placedBuildings.find(b => b.type === 'CASTLE');
        if (!castleInstance) {
            console.log("[ConstructionManager] No Castle found, placing one initially.");
            this.placeAndConstructInitialBuilding('CASTLE', mapCenterX, mapCenterZ);
        } else {
            console.log("[ConstructionManager] Castle already exists.");
        }
        */
        /*
        const hutGridX = mapCenterX + 3;
        const hutGridZ = mapCenterZ;
        this.placeAndConstructInitialBuilding('TRANSPORTER_HUT', hutGridX, hutGridZ);
        */
        // Place a Builder Hut nearby
        //const builderHutGridX = mapCenterX - 3;
        //const builderHutGridZ = mapCenterZ;
        //this.placeAndConstructInitialBuilding('BUILDERS_HUT', builderHutGridX, builderHutGridZ);
        
        /*
        // Place a Woodcutters Hut nearby
        const woodcutterHutGridX = mapCenterX - 5;
        const woodcutterHutGridZ = mapCenterZ;
        this.placeAndConstructInitialBuilding('WOODCUTTERS_HUT', woodcutterHutGridX, woodcutterHutGridZ);
        // Place a Foresters Hut nearby
        const forestersHutGridX = mapCenterX - 7;
        const forestersHutGridZ = mapCenterZ;
        this.placeAndConstructInitialBuilding('FORESTERS_HUT', forestersHutGridX, forestersHutGridZ);
        */
        console.log("[ConstructionManager] Initial structures setup complete.");
    }

    update(deltaTime) { // deltaTime is passed from Game loop
        const now = Date.now();

        // Handle construction completion
        for (let i = this.buildingsUnderConstruction.length - 1; i >= 0; i--) {
            const building = this.buildingsUnderConstruction[i];
            // Check !isConstructed to avoid multiple calls if somehow finishConstruction wasn't immediate
            if (now >= building.constructionEndTime && !building.isConstructed) { 
                building.finishConstruction();
                this.placedBuildings.push(building);
                this.buildingsUnderConstruction.splice(i, 1);
                this._notifyUI(); // Notify UI about construction completion
            }
        }

        // Update all placed (and constructed) buildings
        for (const building of this.placedBuildings) {
            if (building.isConstructed) { // Only update fully constructed buildings with active logic
                building.update(deltaTime, now); // Pass deltaTime and current time
            }
        }
        // Old food consumption and production loops are removed.
    }

    onChange(callback) {
        this.onChangeCallback = callback;
    }

    _notifyUI() {
        if (this.onChangeCallback) {
            this.onChangeCallback();
        }
    }

    getAllBuildings() {
        return this.placedBuildings.concat(this.buildingsUnderConstruction);
    }
}

export default ConstructionManager;
