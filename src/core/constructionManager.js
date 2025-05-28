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
import FishermansHut from '../entities/buildings/FishermansHut.js';
import GeologistsHut from '../entities/buildings/GeologistsHut.js';
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
        // this.buildingsUnderConstruction = []; // Replaced by constructionQueue
        this.constructionQueue = []; // Buildings waiting for a builder
        this.activeConstructions = []; // Buildings actively being constructed by a serf
        this.placedBuildings = []; // Fully constructed and operational buildings
        this.serfManager = null; // Added serfManager property
        this.resourceFlowManager = null; // Added resourceFlowManager property

        this.onChangeCallback = null;

        this._setupPlacementIndicator();
    }

    setSerfManager(serfManager) { // Added method to set SerfManager
        this.serfManager = serfManager;
    }

    setResourceFlowManager(resourceFlowManager) { // Added method to set ResourceFlowManager
        this.resourceFlowManager = resourceFlowManager;
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

        const newBuilding = new BuildingClass(placedGridX, placedGridZ, this.gameMap, buildingDataEntry, this.resourceFlowManager);
        newBuilding.setResourceManager(resourceManager); // Pass the imported singleton
        console.log(`[CM confirmPlacement] New building ${newBuilding.id} (${newBuilding.name}) created. Initial state: ${newBuilding.currentConstructionState}, Required time: ${newBuilding.constructionRequiredTime}`);


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
        // newBuilding.startConstruction(constructionTimeSeconds); // Old direct start
        
        // Instead of starting construction directly, add to queue if it needs construction
        if (newBuilding.currentConstructionState === 'NEEDS_CONSTRUCTION') {
            this.addBuildingToConstructionQueue(newBuilding);
            console.log(`[CM confirmPlacement] ${newBuilding.name} (ID: ${newBuilding.id}) added to construction queue.`);
        } else if (newBuilding.currentConstructionState === 'CONSTRUCTED') {
            // This case is for pre-built things like Castle, or if constructionTime is 0
            this.placedBuildings.push(newBuilding);
            console.log(`[CM confirmPlacement] ${newBuilding.name} (ID: ${newBuilding.id}) is already constructed.`);
        }

        // SerfManager interaction is now handled by the update loop assigning tasks from the queue
        // if (this.serfManager) { 
        //     this.serfManager.addConstructionTask(newBuilding);
        // } else {
        //     console.warn(\\"ConstructionManager: SerfManager not set. Cannot add construction task.\\");
        // }\n        
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

        const newBuilding = new BuildingClass(gridX, gridZ, this.gameMap, buildingDataEntry, this.resourceFlowManager);
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
        // newBuilding.finishConstruction(); // Instantly constructed
        // For initial buildings, we now use the new state system.
        // If it's a Castle, it should initialize as CONSTRUCTED.
        // If it's something else meant to be pre-built, its constructionTime in buildingData.js should be 0 or very small,
        // and its constructor should handle setting state to CONSTRUCTED.
        // For this example, we assume Castle is correctly set to CONSTRUCTED by its own logic or data.
        if (newBuilding.currentConstructionState === 'CONSTRUCTED') {
            this.placedBuildings.push(newBuilding);
            console.log(`[InitialSetup] ${newBuilding.name} (ID: ${newBuilding.id}) successfully placed and is operational.`);
        } else {
            // If an initial building somehow needs construction (e.g. for testing), add it to the queue.
            this.addBuildingToConstructionQueue(newBuilding);
            console.log(`[InitialSetup] ${newBuilding.name} (ID: ${newBuilding.id}) added to construction queue.`);
        }
        
        // this.placedBuildings.push(newBuilding); // Moved to conditional logic above
        
        console.log(`[InitialSetup] ${newBuilding.name} (ID: ${newBuilding.id}) setup processed.`);
        this._notifyUI();
        return newBuilding;
    }

    setupInitialStructures() {
        console.log("[ConstructionManager] Setting up initial structures...");
        const mapCenterX = Math.floor(this.gameMap.width / 2);
        const mapCenterZ = Math.floor(this.gameMap.height / 2);

        // Ensure Castle is placed if not already
        let castleInstance = this.placedBuildings.find(b => b.type === 'CASTLE');
        if (!castleInstance) {
            console.log("[ConstructionManager] No Castle found, placing one initially.");
            this.placeAndConstructInitialBuilding('CASTLE', mapCenterX, mapCenterZ);
        } else {
            console.log("[ConstructionManager] Castle already exists.");
        }
        
        // Place a Builder Hut nearby to test construction cycle
        const builderHutGridX = mapCenterX - 3;
        const builderHutGridZ = mapCenterZ;
        this.placeAndConstructInitialBuilding('BUILDERS_HUT', builderHutGridX, builderHutGridZ);
        
        // Place a Transporter Hut to test priority queue
        const transporterHutGridX = mapCenterX + 3;
        const transporterHutGridZ = mapCenterZ;
        this.placeAndConstructInitialBuilding('TRANSPORTER_HUT', transporterHutGridX, transporterHutGridZ);
        
        console.log("[ConstructionManager] Initial structures setup complete.");
    }

    update(deltaTime) { // deltaTime is passed from Game loop
        // const now = Date.now(); // Not directly used with new progress system

        // 1. Assign tasks from constructionQueue to available builders
        if (this.constructionQueue.length > 0 && this.serfManager) {
            const availableBuilders = this.serfManager.getAvailableSerfsByProfession('BUILDER');
            
            for (const builder of availableBuilders) {
                if (this.constructionQueue.length === 0) break; // All queued items assigned

                const buildingToConstruct = this.constructionQueue.shift(); // Get the next building
                
                // Double-check the building still needs construction and isn't already assigned
                if (buildingToConstruct.currentConstructionState !== 'NEEDS_CONSTRUCTION' || 
                    buildingToConstruct.assignedBuilderId) {
                    console.warn(`[CM Update] Building ${buildingToConstruct.id} is no longer eligible for construction assignment. Skipping.`);
                    continue;
                }
                
                console.log(`[CM Update] Assigning Builder ${builder.id} to construct ${buildingToConstruct.name} (ID: ${buildingToConstruct.id}). Building state: ${buildingToConstruct.currentConstructionState}`);
                this.serfManager.addConstructionTask(buildingToConstruct, builder.id); // Assign to specific builder
                this.activeConstructions.push(buildingToConstruct);
            }
        }

        // 2. Update progress for active constructions and handle error recovery
        for (let i = this.activeConstructions.length - 1; i >= 0; i--) {
            const building = this.activeConstructions[i];
            
            if (building.currentConstructionState === 'UNDER_CONSTRUCTION') {
                // Error recovery: Check if assigned builder still exists and is working on this building
                if (building.assignedBuilderId) {
                    const assignedBuilder = this.serfManager.getSerf(building.assignedBuilderId);
                    if (!assignedBuilder) {
                        console.warn(`[CM Error Recovery] Builder ${building.assignedBuilderId} no longer exists. Returning ${building.name} (${building.id}) to queue.`);
                        this.returnBuildingToQueue(building);
                        continue;
                    }
                    
                    // Check if builder is still working on this specific building
                    const currentTask = assignedBuilder.currentTask;
                    if (!currentTask || currentTask.type !== 'CONSTRUCT_BUILDING' || 
                        currentTask.target.id !== building.id) {
                        console.warn(`[CM Error Recovery] Builder ${building.assignedBuilderId} is no longer working on ${building.name} (${building.id}). Returning to queue.`);
                        this.returnBuildingToQueue(building);
                        continue;
                    }
                }
                
                // Check if a builder is assigned. If not, something is wrong (e.g. builder died/reassigned mid-task)
                if (!building.assignedBuilderId) {
                    console.warn(`[CM Update] Building ${building.id} (${building.name}) is UNDER_CONSTRUCTION but has no assignedBuilderId. Moving back to queue.`);
                    this.returnBuildingToQueue(building);
                    continue; // Move to the next building
                }

                // Update construction progress
                // console.log(`[CM Update] About to call updateConstructionProgress for ${building.id} (${building.name}). DeltaTime: ${deltaTime}`);
                // Building.updateConstructionProgress returns true if construction is complete
                if (building.updateConstructionProgress(deltaTime)) {
                    // building.completeConstructionProcess() is called by updateConstructionProgress itself.
                    console.log(`[CM Update] ${building.name} (ID: ${building.id}) construction reported complete by updateConstructionProgress.`);
                    this.placedBuildings.push(building);
                    this.activeConstructions.splice(i, 1);
                    this._notifyUI();
                    
                    // The builder's task will automatically complete and they will return to their hut
                    // through the ConstructBuildingTask completion logic
                }
            } else if (building.currentConstructionState === 'NEEDS_CONSTRUCTION' && building.assignedBuilderId) {
                // This case might indicate that startConstructionProcess was not called or failed.
                console.warn(`[CM Update] Building ${building.id} (${building.name}) is in activeConstructions, has builder ${building.assignedBuilderId}, but state is still NEEDS_CONSTRUCTION. This might be an issue.`);
                // Return to queue for re-assignment
                this.returnBuildingToQueue(building);
            }
        }

        // Handle construction completion (OLD LOGIC - REMOVE/REFACTOR)
        // for (let i = this.buildingsUnderConstruction.length - 1; i >= 0; i--) {
        //     const building = this.buildingsUnderConstruction[i];
        //     if (now >= building.constructionEndTime && !building.isConstructed) { 
        //         building.finishConstruction();
        //         this.placedBuildings.push(building);
        //         this.buildingsUnderConstruction.splice(i, 1);
        //         this._notifyUI(); 
        //     }
        // }

        // Update all placed (and constructed) buildings
        for (const building of this.placedBuildings) {
            // if (building.isConstructed) { // isConstructed is deprecated, use currentConstructionState
            if (building.currentConstructionState === 'CONSTRUCTED') {
                building.update(deltaTime, Date.now()); // Pass deltaTime and current time
            }
        }
    }

    addBuildingToConstructionQueue(buildingInstance) {
        if (buildingInstance && buildingInstance.currentConstructionState === 'NEEDS_CONSTRUCTION') {
            // Avoid adding duplicates
            if (!this.constructionQueue.some(b => b.id === buildingInstance.id) && 
                !this.activeConstructions.some(b => b.id === buildingInstance.id)) {
                this.constructionQueue.push(buildingInstance);
                this._sortConstructionQueue(); // Sort queue by priority after adding
                console.log(`[CM] Added ${buildingInstance.name} (${buildingInstance.id}) to construction queue. Queue size: ${this.constructionQueue.length}`);
            } else {
                console.warn(`ConstructionManager: Building ${buildingInstance.id} is already in construction queue or active.`);
            }
        } else {
            console.error('ConstructionManager: Invalid building instance or building does not need construction.', buildingInstance);
        }
    }

    /**
     * Sorts the construction queue by priority.
     * Priority order: Essential buildings (BUILDERS_HUT, CASTLE) > Lower tier buildings > Higher tier buildings
     * This ensures basic infrastructure gets built first, then more complex buildings.
     * @private
     */
    _sortConstructionQueue() {
        this.constructionQueue.sort((a, b) => {
            // Define essential building types that should be built first
            const essentialBuildings = ['CASTLE', 'BUILDERS_HUT', 'TRANSPORTER_HUT'];
            const aIsEssential = essentialBuildings.includes(a.type);
            const bIsEssential = essentialBuildings.includes(b.type);

            // Essential buildings first
            if (aIsEssential && !bIsEssential) return -1;
            if (!aIsEssential && bIsEssential) return 1;

            // If both or neither are essential, sort by tier (lower tier = higher priority)
            const aTier = a.info?.tier || 999;
            const bTier = b.info?.tier || 999;
            
            if (aTier !== bTier) {
                return aTier - bTier; // Lower tier first
            }

            // If same tier, prioritize resource production buildings
            const resourceBuildings = ['WOODCUTTERS_HUT', 'QUARRY', 'FARM', 'IRON_MINE', 'COAL_MINE', 'GOLD_MINE'];
            const aIsResource = resourceBuildings.includes(a.type);
            const bIsResource = resourceBuildings.includes(b.type);

            if (aIsResource && !bIsResource) return -1;
            if (!aIsResource && bIsResource) return 1;

            // Finally, sort by construction time (shorter time first for quick wins)
            return (a.constructionRequiredTime || 0) - (b.constructionRequiredTime || 0);
        });
    }

    // Method to be called by ConstructBuildingTask when a builder is freed up or task fails
    // and the building needs to go back to the queue.
    returnBuildingToQueue(buildingInstance) {
        if (!buildingInstance) return;

        // Remove from activeConstructions if it's there
        const activeIndex = this.activeConstructions.findIndex(b => b.id === buildingInstance.id);
        if (activeIndex > -1) {
            this.activeConstructions.splice(activeIndex, 1);
        }

        // Add to constructionQueue if it still needs construction
        if (buildingInstance.currentConstructionState === 'NEEDS_CONSTRUCTION' || 
            (buildingInstance.currentConstructionState === 'UNDER_CONSTRUCTION' && !buildingInstance.assignedBuilderId)) {
            
            if (!this.constructionQueue.some(b => b.id === buildingInstance.id)) {
                // Reset construction state to NEEDS_CONSTRUCTION if it was UNDER_CONSTRUCTION
                if (buildingInstance.currentConstructionState === 'UNDER_CONSTRUCTION') {
                    buildingInstance.currentConstructionState = 'NEEDS_CONSTRUCTION';
                    buildingInstance.assignedBuilderId = null;
                    console.log(`[CM] Reset ${buildingInstance.name} (${buildingInstance.id}) state to NEEDS_CONSTRUCTION`);
                }
                
                this.constructionQueue.unshift(buildingInstance); // Add to the front for quicker re-assignment
                this._sortConstructionQueue(); // Re-sort queue to maintain priority
                console.log(`[CM] Building ${buildingInstance.id} (${buildingInstance.name}) returned to construction queue with priority sorting.`);
            } else {
                 console.log(`[CM] Building ${buildingInstance.id} (${buildingInstance.name}) was already in the queue.`);
            }
        } else {
            console.log(`[CM] Building ${buildingInstance.id} (${buildingInstance.name}) not returned to queue. State: ${buildingInstance.currentConstructionState}`);
        }
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
        return this.placedBuildings.concat(this.activeConstructions).concat(this.constructionQueue);
        // return this.placedBuildings.concat(this.buildingsUnderConstruction); // Old line
    }

    // Convenience methods for testing and UI
    getConstructionQueue() {
        return this.constructionQueue;
    }

    getActiveConstructions() {
        return this.activeConstructions;
    }

    getPlacedBuildings() {
        return this.placedBuildings;
    }

    // Convenience method to queue a building directly (for testing)
    queueBuilding(buildingType, gridX, gridZ) {
        const buildingDataEntry = BUILDING_DATA[buildingType];
        if (!buildingDataEntry) {
            throw new Error(`Building type ${buildingType} not found in BUILDING_DATA.`);
        }
        
        const BuildingClass = buildingClassMap[buildingType];
        if (!BuildingClass) {
            throw new Error(`No class mapping for building type ${buildingType}.`);
        }

        // Check if location is buildable
        if (!this.isBuildable(gridX, gridZ)) {
            throw new Error(`Cannot place building at (${gridX}, ${gridZ}). Location not buildable.`);
        }

        // Create building instance
        const newBuilding = new BuildingClass(gridX, gridZ, this.gameMap, buildingDataEntry, this.resourceFlowManager);
        newBuilding.setResourceManager(resourceManager);

        // Mark map tile as occupied
        const placementSuccessful = this.gameMap.placeBuilding(gridX, gridZ, newBuilding);
        if (!placementSuccessful) {
            throw new Error(`Failed to place building on map at (${gridX}, ${gridZ}).`);
        }

        // Create and place the 3D model
        const buildingsGroup = this.gameElementsGroup.getObjectByName("GameBuildings") || new THREE.Group();
        if (!buildingsGroup.parent) {
            buildingsGroup.name = "GameBuildings";
            this.gameElementsGroup.add(buildingsGroup);
        }
        newBuilding.placeModel(buildingsGroup);

        // Add to appropriate list based on construction state
        if (newBuilding.currentConstructionState === 'NEEDS_CONSTRUCTION') {
            this.addBuildingToConstructionQueue(newBuilding);
        } else if (newBuilding.currentConstructionState === 'CONSTRUCTED') {
            this.placedBuildings.push(newBuilding);
        }

        this._notifyUI();
        return newBuilding;
    }
}

export default ConstructionManager;
