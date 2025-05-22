// src/config/buildingData.js
import { RESOURCE_TYPES } from './resourceTypes.js';
import { SERF_PROFESSIONS } from './serfProfessions.js';
//Removed: import { COLORS } from './colors.js'; - Visual properties are out of scope for this file now.
//Removed: import * as Buildings from '../entities/buildings.js'; - Creator functions are removed.

export const BUILDING_DATA = {
    CASTLE: {
        key: 'CASTLE',
        name: 'Castle',
        cost: {},
        tier: 0,
        maxHealth: 2000, // Added maxHealth
        jobSlots: 0,
        // Castle acts as a global drop-off, so its maxStock reflects that.
        maxStock: { 
            default: 100,
            [RESOURCE_TYPES.WOOD]: 200, [RESOURCE_TYPES.STONE]: 200, [RESOURCE_TYPES.IRON_ORE]: 100,
            [RESOURCE_TYPES.COAL_ORE]: 100, [RESOURCE_TYPES.GOLD_ORE]: 50, [RESOURCE_TYPES.PLANKS]: 150,
            [RESOURCE_TYPES.IRON_BAR]: 100, [RESOURCE_TYPES.GOLD_BARS]: 50, [RESOURCE_TYPES.TOOLS_AXE]: 20,
            [RESOURCE_TYPES.TOOLS_PICKAXE]: 20, [RESOURCE_TYPES.GRAIN]: 100, [RESOURCE_TYPES.FLOUR]: 80,
            [RESOURCE_TYPES.BREAD]: 100, [RESOURCE_TYPES.FISH]: 100, [RESOURCE_TYPES.PIG]: 30,
            [RESOURCE_TYPES.MEAT]: 80, [RESOURCE_TYPES.SWORD]: 20, [RESOURCE_TYPES.SHIELD]: 20,
        },
        outputBufferCapacity: { default: 0 }, // Castle doesn't produce into an output buffer
        producesMaterials: [], // Renamed from 'produces' for clarity with Building.js
        consumesMaterials: []  // Renamed from 'consumes' for clarity with Building.js
    },
    WOODCUTTERS_HUT: {
        key: 'WOODCUTTERS_HUT',
        name: "Woodcutter's Hut",
        cost: { [RESOURCE_TYPES.WOOD]: 20 },
        tier: 1,
        maxHealth: 150, // Added maxHealth
        producesResource: RESOURCE_TYPES.WOOD, // Simple direct production
        productionIntervalMs: 10000,         // Interval for simple production
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.WOODCUTTER,
        requiredTool: RESOURCE_TYPES.TOOLS_AXE,
        consumesFood: [RESOURCE_TYPES.BREAD, RESOURCE_TYPES.FISH],
        foodConsumptionRate: 0.1,
        foodCheckIntervalMs: 15000,
        maxStock: { [RESOURCE_TYPES.WOOD]: 10, default: 5 }, // Local storage for output
        outputBufferCapacity: { [RESOURCE_TYPES.WOOD]: 5 }
    },
    FORESTERS_HUT: {
        key: 'FORESTERS_HUT',
        name: "Forester's Hut",
        cost: { [RESOURCE_TYPES.WOOD]: 15 },
        tier: 1,
        maxHealth: 120, // Added maxHealth
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.FORESTER,
        // Foresters plant trees, no direct resource production into inventory
        saplingGrowthTime: 60000,
        maxStock: { default: 5 }, // Small storage for potential items like saplings if they become items
        outputBufferCapacity: { default: 0 }
    },
    TRANSPORTER_HUT: {
        key: 'TRANSPORTER_HUT',
        name: "Transporter's Hut",
        cost: { [RESOURCE_TYPES.WOOD]: 5 },
        tier: 1,
        maxHealth: 100, // Added maxHealth
        jobSlots: 5,
        jobProfession: SERF_PROFESSIONS.TRANSPORTER,
        maxStock: { default: 20 }, // General storage for items being transported
        outputBufferCapacity: { default: 0 } // Transporters pick up and drop off, don't produce to buffer
    },
    QUARRY: {
        key: 'QUARRY',
        name: 'Quarry',
        cost: { [RESOURCE_TYPES.WOOD]: 25 },
        tier: 1,
        maxHealth: 180, // Added maxHealth
        producesResource: RESOURCE_TYPES.STONE, // Simple direct production
        productionIntervalMs: 12000,        // Interval for simple production
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.STONEMASON,
        requiredTool: RESOURCE_TYPES.TOOLS_PICKAXE,
        consumesFood: [RESOURCE_TYPES.BREAD, RESOURCE_TYPES.FISH],
        foodConsumptionRate: 0.1,
        foodCheckIntervalMs: 10000,
        maxStock: { [RESOURCE_TYPES.STONE]: 10, default: 5 },
        outputBufferCapacity: { [RESOURCE_TYPES.STONE]: 5 }
    },
    FISHERMANS_HUT: {
        key: 'FISHERMANS_HUT',
        name: "Fisherman's Hut",
        cost: { [RESOURCE_TYPES.WOOD]: 15 },
        tier: 1,
        maxHealth: 120, // Added maxHealth
        producesResource: RESOURCE_TYPES.FISH, // Simple direct production
        productionIntervalMs: 18000,         // Interval for simple production
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.FISHERMAN,
        requiredTool: RESOURCE_TYPES.TOOLS_FISHING_ROD,
        maxStock: { [RESOURCE_TYPES.FISH]: 10, default: 5 },
        outputBufferCapacity: { [RESOURCE_TYPES.FISH]: 5 }
    },
    GEOLOGISTS_HUT: {
        key: 'GEOLOGISTS_HUT',
        name: "Geologist's Hut",
        cost: { [RESOURCE_TYPES.WOOD]: 20, [RESOURCE_TYPES.STONE]: 5 },
        tier: 1,
        maxHealth: 100, // Added maxHealth
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.GEOLOGIST,
        // Geologists find spots, not direct production
        maxStock: { default: 5 },
        outputBufferCapacity: { default: 0 }
    },
    BLACKSMITH: { // This is Tier 2, specific to tools like axes
        key: 'BLACKSMITH',
        name: 'Blacksmith',
        cost: { [RESOURCE_TYPES.WOOD]: 30, [RESOURCE_TYPES.STONE]: 10 },
        tier: 2,
        maxHealth: 250, // Added maxHealth
        // This Blacksmith produces TOOLS_AXE via processing
        consumesMaterials: [{resource: RESOURCE_TYPES.IRON_BAR, quantity: 1}], 
        producesMaterials: [{resource: RESOURCE_TYPES.TOOLS_AXE, quantity:1}], 
        processingTime: 10000, // ms, example
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.BLACKSMITH,
        requiredTool: RESOURCE_TYPES.TOOLS_HAMMER,
        consumesFood: [RESOURCE_TYPES.BREAD, RESOURCE_TYPES.FISH],
        foodConsumptionRate: 0.1,
        foodCheckIntervalMs: 10000,
        maxStock: { [RESOURCE_TYPES.IRON_BAR]: 5, [RESOURCE_TYPES.TOOLS_AXE]: 3, default: 2 },
        outputBufferCapacity: { [RESOURCE_TYPES.TOOLS_AXE]: 3 }
    },
    BAKERY: {
        key: 'BAKERY',
        name: 'Bakery',
        cost: { [RESOURCE_TYPES.WOOD]: 25, [RESOURCE_TYPES.STONE]: 5 },
        tier: 2,
        maxHealth: 200, // Added maxHealth
        consumesMaterials: [ 
            { resource: RESOURCE_TYPES.FLOUR, quantity: 1 },
            { resource: RESOURCE_TYPES.COAL_ORE, quantity: 1 } 
        ],
        producesMaterials: [{ resource: RESOURCE_TYPES.BREAD, quantity: 3 }], 
        processingTime: 20000, // ms
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.BAKER,
        consumesFood: [RESOURCE_TYPES.GRAIN], 
        foodConsumptionRate: 0.1, 
        foodCheckIntervalMs: 10000, 
        maxStock: { [RESOURCE_TYPES.FLOUR]: 5, [RESOURCE_TYPES.COAL_ORE]: 5, [RESOURCE_TYPES.BREAD]: 15, default: 5 },
        outputBufferCapacity: { [RESOURCE_TYPES.BREAD]: 15 }
    },
    PIG_FARM: {
        key: 'PIG_FARM',
        name: 'Pig Farm',
        cost: { [RESOURCE_TYPES.WOOD]: 20, [RESOURCE_TYPES.STONE]: 10 },
        tier: 2,
        maxHealth: 180, // Added maxHealth
        consumesMaterials: [{ resource: RESOURCE_TYPES.GRAIN, quantity: 1 }], 
        producesMaterials: [{ resource: RESOURCE_TYPES.PIG, quantity: 1 }], 
        processingTime: 35000, // ms
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.PIG_FARMER,
        requiredTool: RESOURCE_TYPES.TOOLS_SCYTHE, 
        consumesFood: [RESOURCE_TYPES.GRAIN], 
        foodConsumptionRate: 0.05,
        foodCheckIntervalMs: 10000,
        maxStock: { [RESOURCE_TYPES.GRAIN]: 10, [RESOURCE_TYPES.PIG]: 3, default: 5 },
        outputBufferCapacity: { [RESOURCE_TYPES.PIG]: 3 }
    },
    FARM: {
        key: 'FARM',
        name: 'Farm',
        cost: { [RESOURCE_TYPES.WOOD]: 20 }, 
        tier: 1,
        maxHealth: 150, // Added maxHealth
        producesResource: RESOURCE_TYPES.GRAIN, // Simple direct production
        productionIntervalMs: 25000,         // Interval for simple production
        jobSlots: 1, 
        jobProfession: SERF_PROFESSIONS.FARMER,
        requiredTool: RESOURCE_TYPES.TOOLS_SCYTHE,
        cropGrowthTime: 25000, 
        maxStock: { [RESOURCE_TYPES.GRAIN]: 10, default: 5 },
        outputBufferCapacity: { [RESOURCE_TYPES.GRAIN]: 10 }
    },
    IRON_MINE: {
        key: 'IRON_MINE',
        name: 'Iron Mine',
        cost: { [RESOURCE_TYPES.WOOD]: 30, [RESOURCE_TYPES.STONE]: 15 },
        tier: 2,
        maxHealth: 220, // Added maxHealth
        producesResource: RESOURCE_TYPES.IRON_ORE, // Simple direct production
        productionIntervalMs: 20000,         // Interval for simple production
        jobSlots: 2, 
        jobProfession: SERF_PROFESSIONS.MINER,
        requiredTool: RESOURCE_TYPES.TOOLS_PICKAXE,
        consumesFood: [RESOURCE_TYPES.BREAD, RESOURCE_TYPES.FISH],
        foodConsumptionRate: 0.2,
        foodCheckIntervalMs: 12000,
        mineType: 'iron', 
        maxStock: { [RESOURCE_TYPES.IRON_ORE]: 10, default: 5 },
        outputBufferCapacity: { [RESOURCE_TYPES.IRON_ORE]: 5 }
    },
    COAL_MINE: {
        key: 'COAL_MINE',
        name: 'Coal Mine',
        cost: { [RESOURCE_TYPES.WOOD]: 30, [RESOURCE_TYPES.STONE]: 15 },
        tier: 2,
        maxHealth: 220, // Added maxHealth
        producesResource: RESOURCE_TYPES.COAL_ORE, // Simple direct production
        productionIntervalMs: 18000,        // Interval for simple production
        jobSlots: 2, 
        jobProfession: SERF_PROFESSIONS.MINER,
        requiredTool: RESOURCE_TYPES.TOOLS_PICKAXE,
        consumesFood: [RESOURCE_TYPES.BREAD, RESOURCE_TYPES.FISH],
        foodConsumptionRate: 0.2,
        foodCheckIntervalMs: 12000,
        mineType: 'coal', 
        maxStock: { [RESOURCE_TYPES.COAL_ORE]: 10, default: 5 },
        outputBufferCapacity: { [RESOURCE_TYPES.COAL_ORE]: 5 }
    },
    GOLD_MINE: {
        key: 'GOLD_MINE',
        name: 'Gold Mine',
        cost: { [RESOURCE_TYPES.WOOD]: 40, [RESOURCE_TYPES.STONE]: 25 },
        tier: 3,
        maxHealth: 280, // Added maxHealth
        producesResource: RESOURCE_TYPES.GOLD_ORE, // Simple direct production
        productionIntervalMs: 30000,        // Interval for simple production
        jobSlots: 2, 
        jobProfession: SERF_PROFESSIONS.MINER,
        requiredTool: RESOURCE_TYPES.TOOLS_PICKAXE,
        consumesFood: [RESOURCE_TYPES.BREAD, RESOURCE_TYPES.FISH],
        foodConsumptionRate: 0.2,
        foodCheckIntervalMs: 12000,
        mineType: 'gold', 
        maxStock: { [RESOURCE_TYPES.GOLD_ORE]: 10, default: 5 },
        outputBufferCapacity: { [RESOURCE_TYPES.GOLD_ORE]: 5 }
    },
    SAWMILL: {
        key: 'SAWMILL',
        name: 'Sawmill',
        cost: { [RESOURCE_TYPES.WOOD]: 25, [RESOURCE_TYPES.STONE]: 10 }, 
        tier: 2,
        maxHealth: 200, // Added maxHealth
        consumesMaterials: [{ resource: RESOURCE_TYPES.WOOD, quantity: 1 }], 
        producesMaterials: [{ resource: RESOURCE_TYPES.PLANKS, quantity: 2 }], 
        processingTime: 15000, // ms
        jobSlots: 1, 
        jobProfession: SERF_PROFESSIONS.SAWMILL_WORKER,
        requiredTool: RESOURCE_TYPES.TOOLS_HAMMER,
        consumesFood: [RESOURCE_TYPES.BREAD],
        foodConsumptionRate: 0.1,
        foodCheckIntervalMs: 15000,
        maxStock: { [RESOURCE_TYPES.WOOD]: 10, [RESOURCE_TYPES.PLANKS]: 12, default: 5 },
        outputBufferCapacity: { [RESOURCE_TYPES.PLANKS]: 6 }
    },
    WINDMILL: {
        key: 'WINDMILL',
        name: 'Windmill',
        cost: { [RESOURCE_TYPES.WOOD]: 25, [RESOURCE_TYPES.STONE]: 15 }, 
        tier: 2,
        maxHealth: 180, // Added maxHealth
        consumesMaterials: [{ resource: RESOURCE_TYPES.GRAIN, quantity: 2 }], 
        producesMaterials: [{ resource: RESOURCE_TYPES.FLOUR, quantity: 1 }], 
        processingTime: 18000, // ms
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.MILLER,
        requiredTool: RESOURCE_TYPES.TOOLS_HAMMER, 
        maxStock: { [RESOURCE_TYPES.GRAIN]: 10, [RESOURCE_TYPES.FLOUR]: 5, default: 5 },
        outputBufferCapacity: { [RESOURCE_TYPES.FLOUR]: 5 }
    },
    SLAUGHTERHOUSE: {
        key: 'SLAUGHTERHOUSE',
        name: 'Slaughterhouse',
        cost: { [RESOURCE_TYPES.WOOD]: 20, [RESOURCE_TYPES.STONE]: 10 },
        tier: 2,
        maxHealth: 160, // Added maxHealth
        consumesMaterials: [{ resource: RESOURCE_TYPES.PIG, quantity: 1 }], 
        producesMaterials: [{ resource: RESOURCE_TYPES.MEAT, quantity: 2 }], 
        processingTime: 12000, // ms
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.BUTCHER,
        requiredTool: RESOURCE_TYPES.TOOLS_AXE, 
        maxStock: { [RESOURCE_TYPES.PIG]: 3, [RESOURCE_TYPES.MEAT]: 10, default: 5 },
        outputBufferCapacity: { [RESOURCE_TYPES.MEAT]: 10 }
    },
    IRON_SMELTER: {
        key: 'IRON_SMELTER',
        name: 'Iron Smelter',
        cost: { [RESOURCE_TYPES.WOOD]: 30, [RESOURCE_TYPES.STONE]: 20 }, 
        tier: 2,
        maxHealth: 250, // Added maxHealth
        consumesMaterials: [ 
            { resource: RESOURCE_TYPES.IRON_ORE, quantity: 2 },
            { resource: RESOURCE_TYPES.COAL_ORE, quantity: 1 }
        ],
        producesMaterials: [{ resource: RESOURCE_TYPES.IRON_BAR, quantity: 1 }], 
        processingTime: 22000, // ms
        jobSlots: 1, 
        jobProfession: SERF_PROFESSIONS.SMELTER_WORKER,
        consumesFood: [RESOURCE_TYPES.BREAD],
        foodConsumptionRate: 0.1,
        foodCheckIntervalMs: 20000,
        maxStock: { [RESOURCE_TYPES.IRON_ORE]: 10, [RESOURCE_TYPES.COAL_ORE]: 5, [RESOURCE_TYPES.IRON_BAR]: 5, default: 5 },
        outputBufferCapacity: { [RESOURCE_TYPES.IRON_BAR]: 5 }
    },
    TOOLMAKERS_WORKSHOP: { 
        key: 'TOOLMAKERS_WORKSHOP',
        name: "Toolmaker's Workshop",
        cost: { [RESOURCE_TYPES.WOOD]: 25, [RESOURCE_TYPES.STONE]: 10 }, 
        tier: 3,
        maxHealth: 280, // Added maxHealth
        // Production of specific tools will be handled by more complex logic tied to UI/player choice
        // For now, `consumesMaterials` and `producesMaterials` can be empty or define a default tool.
        // Let's assume it can produce any basic tool, and the specific recipe is chosen by the player.
        // This might mean `processingTime` also becomes dynamic.
        // For simplicity here, let's not define a default production item.
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.TOOLMAKER,
        requiredTool: RESOURCE_TYPES.TOOLS_HAMMER,
        // Max stock for various inputs and potential outputs
        maxStock: { 
            [RESOURCE_TYPES.IRON_BAR]: 10, [RESOURCE_TYPES.PLANKS]: 10, 
            [RESOURCE_TYPES.TOOLS_AXE]: 2, [RESOURCE_TYPES.TOOLS_PICKAXE]: 2, 
            [RESOURCE_TYPES.TOOLS_SCYTHE]: 2, [RESOURCE_TYPES.TOOLS_HAMMER]: 2,
            [RESOURCE_TYPES.TOOLS_FISHING_ROD]: 2,
            default: 5 
        },
        outputBufferCapacity: { 
            [RESOURCE_TYPES.TOOLS_AXE]: 2, [RESOURCE_TYPES.TOOLS_PICKAXE]: 2, 
            [RESOURCE_TYPES.TOOLS_SCYTHE]: 2, [RESOURCE_TYPES.TOOLS_HAMMER]: 2,
            [RESOURCE_TYPES.TOOLS_FISHING_ROD]: 2,
            default: 2
        }
    },
    GOLDSMITHS_MINT: { 
        key: 'GOLDSMITHS_MINT',
        name: "Goldsmith's Mint",
        cost: { [RESOURCE_TYPES.WOOD]: 20, [RESOURCE_TYPES.STONE]: 20 }, 
        tier: 3,
        maxHealth: 260, // Added maxHealth
        consumesMaterials: [ 
            { resource: RESOURCE_TYPES.GOLD_ORE, quantity: 1 },
            { resource: RESOURCE_TYPES.COAL_ORE, quantity: 1 }
        ],
        producesMaterials: [{ resource: RESOURCE_TYPES.GOLD_BARS, quantity: 1 }], 
        processingTime: 25000, // ms
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.GOLDSMITH,
        maxStock: { [RESOURCE_TYPES.GOLD_ORE]: 5, [RESOURCE_TYPES.COAL_ORE]: 5, [RESOURCE_TYPES.GOLD_BARS]: 5, default: 5 },
        outputBufferCapacity: { [RESOURCE_TYPES.GOLD_BARS]: 5 }
    },
    BLACKSMITH_ARMORY: { 
        key: 'BLACKSMITH_ARMORY',
        name: 'Blacksmith Armory', 
        cost: { [RESOURCE_TYPES.WOOD]: 30, [RESOURCE_TYPES.STONE]: 15 }, 
        tier: 3,
        maxHealth: 300, // Added maxHealth
        // Similar to Toolmaker, specific production (swords, shields) will be chosen by player.
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.BLACKSMITH,
        requiredTool: RESOURCE_TYPES.TOOLS_HAMMER,
        maxStock: { 
            [RESOURCE_TYPES.IRON_BAR]: 10, [RESOURCE_TYPES.COAL_ORE]: 5, [RESOURCE_TYPES.PLANKS]: 10,
            [RESOURCE_TYPES.SWORD]: 3, [RESOURCE_TYPES.SHIELD]: 3,
            default: 5
        },
        outputBufferCapacity: { [RESOURCE_TYPES.SWORD]: 3, [RESOURCE_TYPES.SHIELD]: 3, default: 2 }
    },
    GUARD_HUT: {
        key: 'GUARD_HUT',
        name: 'Guard Hut',
        cost: { [RESOURCE_TYPES.WOOD]: 15, [RESOURCE_TYPES.STONE]: 5 }, 
        tier: 1,
        maxHealth: 120, // Added maxHealth
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.GUARD, // Assuming GUARD profession
        maxStock: { default: 5 }, // For guard's equipment if any
        outputBufferCapacity: { default: 0 }
    },
    WATCHTOWER: {
        key: 'WATCHTOWER',
        name: 'Watchtower',
        cost: { [RESOURCE_TYPES.WOOD]: 20, [RESOURCE_TYPES.STONE]: 15 },
        tier: 2,
        maxHealth: 180, // Added maxHealth
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.GUARD, // Assuming GUARD profession
        territoryIncrease: 5, 
        maxStock: { default: 5 },
        outputBufferCapacity: { default: 0 }
    },
    BARRACKS_FORTRESS: {
        key: 'BARRACKS_FORTRESS',
        name: 'Barracks/Fortress',
        cost: { [RESOURCE_TYPES.STONE]: 100, [RESOURCE_TYPES.WOOD]: 50 }, 
        tier: 3,
        maxHealth: 500, // Added maxHealth
        jobSlots: 5, // For training or stationing units
        // jobProfession: SERF_PROFESSIONS.KNIGHT, // Or trainer
        canTrain: ['KNIGHT'], 
        territoryIncrease: 10, 
        maxStock: { default: 20 }, // For equipment used in training
        outputBufferCapacity: { default: 0 }
    },
    WAREHOUSE_STOREHOUSE: {
        key: 'WAREHOUSE_STOREHOUSE',
        name: 'Warehouse/Storehouse',
        cost: { [RESOURCE_TYPES.WOOD]: 50, [RESOURCE_TYPES.STONE]: 20 },
        tier: 1, // Should be accessible early
        maxHealth: 300, // Added maxHealth
        // This building primarily increases global storage, not local job-based storage.
        // The `storageCapacityIncrease` is handled by ResourceManager.
        // Building.js `maxStock` is for its own operational inventory, which is minimal here.
        jobSlots: 0, // Usually no direct workers, managed by transporters
        maxStock: { default: 10 }, // Small buffer for items being moved
        outputBufferCapacity: { default: 0 },
        storageCapacityIncrease: { 
            [RESOURCE_TYPES.WOOD]: 200, [RESOURCE_TYPES.STONE]: 200, [RESOURCE_TYPES.IRON_ORE]: 100,
            [RESOURCE_TYPES.COAL_ORE]: 100, [RESOURCE_TYPES.GOLD_ORE]: 50, [RESOURCE_TYPES.PLANKS]: 150,
            [RESOURCE_TYPES.IRON_BAR]: 100, [RESOURCE_TYPES.GOLD_BARS]: 50, [RESOURCE_TYPES.TOOLS_AXE]: 20,
            [RESOURCE_TYPES.TOOLS_PICKAXE]: 20, [RESOURCE_TYPES.GRAIN]: 100, [RESOURCE_TYPES.FLOUR]: 80,
            [RESOURCE_TYPES.BREAD]: 100, [RESOURCE_TYPES.FISH]: 100, [RESOURCE_TYPES.PIG]: 30,
            [RESOURCE_TYPES.MEAT]: 80, [RESOURCE_TYPES.SWORD]: 20, [RESOURCE_TYPES.SHIELD]: 20,
        }
    },
    BUILDERS_HUT: {
        key: 'BUILDERS_HUT',
        name: "Builder's Hut",
        cost: { [RESOURCE_TYPES.WOOD]: 5 },
        tier: 1,
        maxHealth: 100, // Added maxHealth
        jobSlots: 3,
        jobProfession: SERF_PROFESSIONS.BUILDER,
        maxStock: { default: 10 }, // For small amounts of materials builders might temporarily hold
        outputBufferCapacity: { default: 0 }
    },
    HARBOR: {
        key: 'HARBOR',
        name: 'Harbor',
        cost: { [RESOURCE_TYPES.WOOD]: 75, [RESOURCE_TYPES.STONE]: 25 },
        tier: 3,
        maxHealth: 350, // Added maxHealth
        jobSlots: 2, 
        // jobProfession: SERF_PROFESSIONS.TRADER, // Add if exists
        maxStock: { default: 50 }, // For goods being traded
        outputBufferCapacity: { default: 0 }
    },
    MARKETPLACE: { 
        key: 'MARKETPLACE',
        name: 'Marketplace',
        cost: { [RESOURCE_TYPES.WOOD]: 40, [RESOURCE_TYPES.STONE]: 10 },
        tier: 2,
        maxHealth: 200, // Added maxHealth
        jobSlots: 0, // Or 1 for a market tender if that's a role
        maxStock: { default: 100 }, // For various goods available at market
        outputBufferCapacity: { default: 0 }
    },
    CHURCH_TEMPLE: { 
        key: 'CHURCH_TEMPLE',
        name: 'Church/Temple',
        cost: { [RESOURCE_TYPES.STONE]: 150, [RESOURCE_TYPES.WOOD]: 50, [RESOURCE_TYPES.GOLD_BARS]: 10 },
        tier: 3,
        maxHealth: 400, // Added maxHealth
        jobSlots: 1, // Example (Priest)
        // jobProfession: SERF_PROFESSIONS.PRIEST, // If exists
        maxStock: { default: 10 },
        outputBufferCapacity: { default: 0 }
    },
    SHIPYARD: { 
        key: 'SHIPYARD',
        name: 'Shipyard',
        cost: { [RESOURCE_TYPES.WOOD]: 100, [RESOURCE_TYPES.PLANKS]: 50 },
        tier: 3,
        maxHealth: 300, // Added maxHealth
        // Produces ships (special logic, not simple resource)
        jobSlots: 2, // Example
        // jobProfession: SERF_PROFESSIONS.SHIPWRIGHT, // If exists
        maxStock: { [RESOURCE_TYPES.PLANKS]: 100, [RESOURCE_TYPES.WOOD]: 50, [RESOURCE_TYPES.IRON_BARS]: 10, default: 5 },
        outputBufferCapacity: { default: 0 } // Output is a ship, not resource items
    },
    UNIVERSITY_LIBRARY: { 
        key: 'UNIVERSITY_LIBRARY',
        name: 'University/Library',
        cost: { [RESOURCE_TYPES.STONE]: 120, [RESOURCE_TYPES.WOOD]: 60, [RESOURCE_TYPES.GOLD_BARS]: 20 },
        tier: 4,
        maxHealth: 350, // Added maxHealth
        // Produces research/upgrades (special logic)
        jobSlots: 1, // Example (Scholar)
        // jobProfession: SERF_PROFESSIONS.SCHOLAR, // If exists
        maxStock: { default: 20 }, // For books or research materials
        outputBufferCapacity: { default: 0 }
    },
    SIEGE_WORKSHOP: { 
        key: 'SIEGE_WORKSHOP',
        name: 'Siege Workshop',
        cost: { [RESOURCE_TYPES.WOOD]: 70, [RESOURCE_TYPES.STONE]: 30, [RESOURCE_TYPES.IRON_BARS]: 20 },
        tier: 4,
        maxHealth: 280, // Added maxHealth
        // Produces siege engines (special logic)
        jobSlots: 1, // Example
        // jobProfession: SERF_PROFESSIONS.ENGINEER, // If exists
        maxStock: { [RESOURCE_TYPES.PLANKS]: 50, [RESOURCE_TYPES.IRON_BARS]: 20, [RESOURCE_TYPES.WOOD]: 30, default: 5 },
        outputBufferCapacity: { default: 0 } // Output is a siege engine
    },
    TREASURY_MINT: { 
        key: 'TREASURY_MINT',
        name: 'Treasury/Mint',
        cost: { [RESOURCE_TYPES.STONE]: 100, [RESOURCE_TYPES.GOLD_BARS]: 50 },
        tier: 4,
        maxHealth: 320, // Added maxHealth
        // Could produce coins or increase gold storage (special logic)
        jobSlots: 1, // Example (Mint Master)
        maxStock: { [RESOURCE_TYPES.GOLD_BARS]: 100, default: 10 }, // For storing gold
        outputBufferCapacity: { default: 0 } // Or produces COIN resource
    }
};
