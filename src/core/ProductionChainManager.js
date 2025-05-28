// src/core/ProductionChainManager.js
import { RESOURCE_TYPES } from '../config/resourceTypes.js';

/**
 * @class ProductionChainManager
 * @classdesc Manages production chains and resource flows between buildings
 */
class ProductionChainManager {
    constructor(gameMap, resourceManager) {
        this.gameMap = gameMap;
        this.resourceManager = resourceManager;
        this.buildings = new Map(); // Building ID -> Building instance
        this.productionChains = new Map(); // Chain ID -> Chain definition
        this.resourceFlows = new Map(); // Resource type -> Array of flow configurations
        this.autoTransferRules = new Map(); // Building type -> Transfer rules
        
        this.lastUpdateTime = Date.now();
        this.updateInterval = 5000; // Update every 5 seconds
        
        this.initializeDefaultChains();
        this.setupAutoTransferRules();
    }

    /**
     * Registers a building with the production chain manager
     * @param {Building} building - The building to register
     */
    registerBuilding(building) {
        this.buildings.set(building.id, building);
        console.log(`ProductionChainManager: Registered building ${building.name} (${building.id})`);
    }

    /**
     * Unregisters a building from the production chain manager
     * @param {string} buildingId - The ID of the building to unregister
     */
    unregisterBuilding(buildingId) {
        this.buildings.delete(buildingId);
        console.log(`ProductionChainManager: Unregistered building ${buildingId}`);
    }

    /**
     * Initializes default production chains
     * @private
     */
    initializeDefaultChains() {
        // Wood processing chain
        this.productionChains.set('wood_processing', {
            id: 'wood_processing',
            name: 'Wood Processing Chain',
            stages: [
                { buildingType: 'WOODCUTTERS_HUT', produces: [RESOURCE_TYPES.WOOD] },
                { buildingType: 'SAWMILL', consumes: [RESOURCE_TYPES.WOOD], produces: [RESOURCE_TYPES.PLANKS] }
            ]
        });

        // Iron production chain
        this.productionChains.set('iron_production', {
            id: 'iron_production',
            name: 'Iron Production Chain',
            stages: [
                { buildingType: 'IRON_MINE', produces: [RESOURCE_TYPES.IRON_ORE] },
                { buildingType: 'COAL_MINE', produces: [RESOURCE_TYPES.COAL_ORE] },
                { buildingType: 'IRON_SMELTER', consumes: [RESOURCE_TYPES.IRON_ORE, RESOURCE_TYPES.COAL_ORE], produces: [RESOURCE_TYPES.IRON_BAR] },
                { buildingType: 'BLACKSMITH', consumes: [RESOURCE_TYPES.IRON_BAR], produces: [RESOURCE_TYPES.TOOLS_AXE] }
            ]
        });

        // Food production chain
        this.productionChains.set('food_production', {
            id: 'food_production',
            name: 'Food Production Chain',
            stages: [
                { buildingType: 'FARM', produces: [RESOURCE_TYPES.GRAIN] },
                { buildingType: 'WINDMILL', consumes: [RESOURCE_TYPES.GRAIN], produces: [RESOURCE_TYPES.FLOUR] },
                { buildingType: 'BAKERY', consumes: [RESOURCE_TYPES.FLOUR, RESOURCE_TYPES.COAL_ORE], produces: [RESOURCE_TYPES.BREAD] }
            ]
        });

        // Meat production chain
        this.productionChains.set('meat_production', {
            id: 'meat_production',
            name: 'Meat Production Chain',
            stages: [
                { buildingType: 'FARM', produces: [RESOURCE_TYPES.GRAIN] },
                { buildingType: 'PIG_FARM', consumes: [RESOURCE_TYPES.GRAIN], produces: [RESOURCE_TYPES.PIG] },
                { buildingType: 'SLAUGHTERHOUSE', consumes: [RESOURCE_TYPES.PIG], produces: [RESOURCE_TYPES.MEAT] }
            ]
        });
    }

    /**
     * Sets up automatic transfer rules between building types
     * @private
     */
    setupAutoTransferRules() {
        // Sawmill auto-pickup from woodcutters
        this.autoTransferRules.set('SAWMILL', {
            pickup: [
                { resourceType: RESOURCE_TYPES.WOOD, fromBuildingTypes: ['WOODCUTTERS_HUT'], maxDistance: 10 }
            ]
        });

        // Iron Smelter auto-pickup from mines
        this.autoTransferRules.set('IRON_SMELTER', {
            pickup: [
                { resourceType: RESOURCE_TYPES.IRON_ORE, fromBuildingTypes: ['IRON_MINE'], maxDistance: 15 },
                { resourceType: RESOURCE_TYPES.COAL_ORE, fromBuildingTypes: ['COAL_MINE'], maxDistance: 15 }
            ]
        });

        // Blacksmith auto-pickup from iron smelter
        this.autoTransferRules.set('BLACKSMITH', {
            pickup: [
                { resourceType: RESOURCE_TYPES.IRON_BAR, fromBuildingTypes: ['IRON_SMELTER'], maxDistance: 12 }
            ]
        });

        // Bakery auto-pickup ingredients
        this.autoTransferRules.set('BAKERY', {
            pickup: [
                { resourceType: RESOURCE_TYPES.FLOUR, fromBuildingTypes: ['WINDMILL'], maxDistance: 10 },
                { resourceType: RESOURCE_TYPES.COAL_ORE, fromBuildingTypes: ['COAL_MINE'], maxDistance: 15 }
            ]
        });

        // Windmill auto-pickup from farms
        this.autoTransferRules.set('WINDMILL', {
            pickup: [
                { resourceType: RESOURCE_TYPES.GRAIN, fromBuildingTypes: ['FARM'], maxDistance: 10 }
            ]
        });

        // Pig Farm auto-pickup from farms
        this.autoTransferRules.set('PIG_FARM', {
            pickup: [
                { resourceType: RESOURCE_TYPES.GRAIN, fromBuildingTypes: ['FARM'], maxDistance: 10 }
            ]
        });

        // Slaughterhouse auto-pickup from pig farms
        this.autoTransferRules.set('SLAUGHTERHOUSE', {
            pickup: [
                { resourceType: RESOURCE_TYPES.PIG, fromBuildingTypes: ['PIG_FARM'], maxDistance: 8 }
            ]
        });
    }

    /**
     * Calculates distance between two buildings
     * @param {Building} building1 - First building
     * @param {Building} building2 - Second building
     * @returns {number} Distance in grid units
     */
    calculateDistance(building1, building2) {
        const dx = building1.gridX - building2.gridX;
        const dz = building1.gridZ - building2.gridZ;
        return Math.sqrt(dx * dx + dz * dz);
    }

    /**
     * Finds the best supplier for a resource within a given distance
     * @param {Building} consumerBuilding - The building that needs the resource
     * @param {string} resourceType - The type of resource needed
     * @param {Array<string>} supplierTypes - Array of building types that can supply
     * @param {number} maxDistance - Maximum distance to search
     * @returns {Building|null} The best supplier building or null
     */
    findBestSupplier(consumerBuilding, resourceType, supplierTypes, maxDistance) {
        let bestSupplier = null;
        let bestScore = -1;

        for (const building of this.buildings.values()) {
            if (!supplierTypes.includes(building.type)) continue;
            if (!building.isConstructed) continue;
            
            const distance = this.calculateDistance(consumerBuilding, building);
            if (distance > maxDistance) continue;

            const availableAmount = building.getStock(resourceType);
            if (availableAmount <= 0) continue;

            // Score based on available amount and proximity
            const score = availableAmount * (maxDistance - distance) / maxDistance;
            
            if (score > bestScore) {
                bestScore = score;
                bestSupplier = building;
            }
        }

        return bestSupplier;
    }

    /**
     * Executes automatic resource transfers based on rules
     * @private
     */
    executeAutoTransfers() {
        for (const building of this.buildings.values()) {
            if (!building.isConstructed || building.workers.length === 0) continue;

            const transferRule = this.autoTransferRules.get(building.type);
            if (!transferRule || !transferRule.pickup) continue;

            for (const pickupRule of transferRule.pickup) {
                const { resourceType, fromBuildingTypes, maxDistance } = pickupRule;
                
                // Check if building needs this resource
                const neededAmount = this.calculateNeededAmount(building, resourceType);
                if (neededAmount <= 0) continue;

                // Find best supplier
                const supplier = this.findBestSupplier(building, resourceType, fromBuildingTypes, maxDistance);
                if (!supplier) continue;

                // Execute transfer
                const transferAmount = Math.min(neededAmount, supplier.getStock(resourceType), 5); // Limit to 5 per transfer
                if (transferAmount > 0) {
                    const result = supplier.transferResourceTo(building, resourceType, transferAmount);
                    if (result.transferred > 0) {
                        console.log(`Auto-transfer: ${result.transferred} ${resourceType} from ${supplier.name} to ${building.name}`);
                    }
                }
            }
        }
    }

    /**
     * Calculates how much of a resource a building needs
     * @param {Building} building - The building to check
     * @param {string} resourceType - The resource type
     * @returns {number} Amount needed
     * @private
     */
    calculateNeededAmount(building, resourceType) {
        // Check if this resource is consumed by the building
        const consumedResource = building.consumesMaterials?.find(item => item.resource === resourceType);
        if (!consumedResource) return 0;

        const currentAmount = building.getStock(resourceType);
        const maxStock = building.maxStock?.[resourceType] || building.maxStock?.default || 0;
        
        // Need resources if current stock is less than 3 cycles worth
        const cyclesWorth = consumedResource.quantity * 3;
        const targetAmount = Math.min(cyclesWorth, maxStock * 0.8); // Don't fill completely
        
        return Math.max(0, targetAmount - currentAmount);
    }

    /**
     * Gets production chain efficiency metrics
     * @param {string} chainId - The ID of the production chain
     * @returns {object} Efficiency metrics
     */
    getChainEfficiency(chainId) {
        const chain = this.productionChains.get(chainId);
        if (!chain) return null;

        const stageMetrics = [];
        let overallEfficiency = 100;

        for (const stage of chain.stages) {
            const stageBuildings = Array.from(this.buildings.values())
                .filter(b => b.type === stage.buildingType && b.isConstructed);

            let stageEfficiency = 0;
            let totalCapacity = 0;
            let activeProduction = 0;

            for (const building of stageBuildings) {
                totalCapacity += building.jobSlots;
                activeProduction += building.workers.length;
                
                if (building.workers.length > 0 && !building.isHaltedByNoFood) {
                    const status = building.getProductionChainStatus();
                    if (status.canProduce) {
                        stageEfficiency += (building.workers.length / building.jobSlots) * 100;
                    }
                }
            }

            if (stageBuildings.length > 0) {
                stageEfficiency = stageEfficiency / stageBuildings.length;
            }

            stageMetrics.push({
                buildingType: stage.buildingType,
                buildings: stageBuildings.length,
                efficiency: stageEfficiency,
                capacity: totalCapacity,
                active: activeProduction
            });

            // Overall efficiency is limited by the least efficient stage
            overallEfficiency = Math.min(overallEfficiency, stageEfficiency);
        }

        return {
            chainId,
            name: chain.name,
            overallEfficiency,
            stages: stageMetrics
        };
    }

    /**
     * Gets all production chains efficiency
     * @returns {Array<object>} Array of chain efficiency metrics
     */
    getAllChainEfficiencies() {
        const efficiencies = [];
        for (const chainId of this.productionChains.keys()) {
            const efficiency = this.getChainEfficiency(chainId);
            if (efficiency) {
                efficiencies.push(efficiency);
            }
        }
        return efficiencies;
    }

    /**
     * Updates the production chain manager
     * @param {number} currentTime - Current game time
     */
    update(currentTime) {
        if (currentTime - this.lastUpdateTime >= this.updateInterval) {
            this.executeAutoTransfers();
            this.lastUpdateTime = currentTime;
        }
    }

    /**
     * Gets detailed status of all production buildings
     * @returns {Array<object>} Array of building statuses
     */
    getProductionBuildingsStatus() {
        const statuses = [];
        
        for (const building of this.buildings.values()) {
            if (building.isConstructed && 
                (building.consumesMaterials?.length > 0 || building.producesResource)) {
                
                const status = building.getProductionChainStatus ? 
                    building.getProductionChainStatus() : 
                    { canProduce: false, reason: 'No production chain status available' };
                
                statuses.push({
                    id: building.id,
                    name: building.name,
                    type: building.type,
                    gridX: building.gridX,
                    gridZ: building.gridZ,
                    ...status
                });
            }
        }
        
        return statuses;
    }
}

export default ProductionChainManager;
