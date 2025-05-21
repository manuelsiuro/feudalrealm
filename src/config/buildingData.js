// src/config/buildingData.js
import * as Buildings from '../entities/buildings.js';
import { RESOURCE_TYPES } from './resourceTypes.js';
import { SERF_PROFESSIONS } from './serfProfessions.js';
import { COLORS } from './colors.js'; // Added import for COLORS

export const BUILDING_DATA = {
    CASTLE: {
        name: 'Castle',
        cost: {},
        creator: Buildings.createCastle,
        tier: 0,
        gridSize: { width: 4, height: 4 }, // From BUILDING_INFO
        color: COLORS.MEDIUM_GREY, // From BUILDING_INFO
        produces: [],
        consumes: []
        // No input/output buffers needed as it's a central hub / spawner
    },
    WOODCUTTERS_HUT: {
        name: "Woodcutter's Hut",
        cost: { [RESOURCE_TYPES.WOOD]: 20 }, // BUILDING_DATA cost
        creator: Buildings.createWoodcuttersHut,
        tier: 1,
        produces: [{ resource: RESOURCE_TYPES.WOOD, quantity: 1, interval: 10000 }], // From BUILDING_INFO
        jobSlots: 1, // BUILDING_DATA
        jobProfession: SERF_PROFESSIONS.WOODCUTTER,
        requiredTool: RESOURCE_TYPES.TOOLS_AXE,
        consumesFood: [RESOURCE_TYPES.BREAD, RESOURCE_TYPES.FISH],
        foodConsumptionRate: 0.1,
        foodCheckIntervalMs: 15000,
        gridSize: { width: 2, height: 2 }, // From BUILDING_INFO
        color: COLORS.BROWN, // From BUILDING_INFO
        consumes: [],
        outputBufferCapacity: { [RESOURCE_TYPES.WOOD]: 5 }
    },
    FORESTERS_HUT: {
        name: "Forester's Hut",
        cost: { [RESOURCE_TYPES.WOOD]: 15 },
        creator: Buildings.createForestersHut,
        tier: 1,
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.FORESTER,
        gridSize: { width: 2, height: 1 }, // From BUILDING_INFO
        color: COLORS.DARK_GREEN, // From BUILDING_INFO
        produces: [], // Foresters plant trees, handled by task logic
        consumes: [],
        saplingGrowthTime: 60000 // Default: 60 seconds
    },
    TRANSPORTER_HUT: {
        name: "Transporter's Hut",
        cost: { [RESOURCE_TYPES.WOOD]: 5 },
        creator: Buildings.createTransportersHut,
        tier: 1,
        jobSlots: 5,
        jobProfession: SERF_PROFESSIONS.TRANSPORTER,
        gridSize: { width: 1, height: 1 }, // From BUILDING_INFO
        color: COLORS.BROWN, // From BUILDING_INFO
        produces: [],
        consumes: []
        // No production/consumption buffers
    },
    QUARRY: {
        name: 'Quarry',
        cost: { [RESOURCE_TYPES.WOOD]: 25 }, // BUILDING_DATA cost
        creator: Buildings.createQuarry,
        tier: 1,
        produces: [{ resource: RESOURCE_TYPES.STONE, quantity: 1, interval: 12000 }], // From BUILDING_INFO
        jobSlots: 1, // BUILDING_DATA (BUILDING_INFO had 2)
        jobProfession: SERF_PROFESSIONS.STONEMASON,
        requiredTool: RESOURCE_TYPES.TOOLS_PICKAXE,
        consumesFood: [RESOURCE_TYPES.BREAD, RESOURCE_TYPES.FISH],
        foodConsumptionRate: 0.1,
        foodCheckIntervalMs: 10000,
        gridSize: { width: 2, height: 2 }, // From BUILDING_INFO
        color: COLORS.STONE_GREY, // Using a more descriptive color name if available, else direct value
        consumes: [],
        outputBufferCapacity: { [RESOURCE_TYPES.STONE]: 5 }
    },
    FISHERMANS_HUT: {
        name: "Fisherman's Hut",
        cost: { [RESOURCE_TYPES.WOOD]: 15 },
        creator: Buildings.createFishermansHut,
        tier: 1,
        produces: [{ resource: RESOURCE_TYPES.FISH, quantity: 1, interval: 18000 }], // interval is fishingInterval
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.FISHERMAN,
        requiredTool: RESOURCE_TYPES.TOOLS_FISHING_ROD,
        gridSize: { width: 1, height: 3 }, // From BUILDING_INFO
        color: COLORS.LIGHT_BLUE, // From BUILDING_INFO
        consumes: [],
        outputBufferCapacity: { [RESOURCE_TYPES.FISH]: 5 }
        // Consumes food not specified in original BUILDING_DATA, add if necessary
    },
    GEOLOGISTS_HUT: {
        name: "Geologist's Hut",
        cost: { [RESOURCE_TYPES.WOOD]: 20, [RESOURCE_TYPES.STONE]: 5 },
        creator: Buildings.createGeologistsHut,
        tier: 1,
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.GEOLOGIST,
        gridSize: { width: 1, height: 1 }, // From BUILDING_INFO
        color: COLORS.DARK_BROWN, // From BUILDING_INFO
        produces: [], // Geologists find spots, not direct production
        consumes: []
        // No production/consumption buffers
    },
    BLACKSMITH: { // This is Tier 2, specific to tools like axes
        name: 'Blacksmith',
        cost: { [RESOURCE_TYPES.WOOD]: 30, [RESOURCE_TYPES.STONE]: 10 },
        creator: Buildings.createBlacksmithArmory, // Uses same creator as armory, might need distinct one
        tier: 2,
        produces: [{resource: RESOURCE_TYPES.TOOLS_AXE, quantity:1, interval: 10000}], // Converted from BUILDING_DATA
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.BLACKSMITH,
        requiredTool: RESOURCE_TYPES.TOOLS_HAMMER,
        consumesFood: [RESOURCE_TYPES.BREAD, RESOURCE_TYPES.FISH],
        foodConsumptionRate: 0.1,
        foodCheckIntervalMs: 10000,
        gridSize: { width: 2, height: 2 }, // Default, not in BUILDING_INFO for "BLACKSMITH"
        color: COLORS.DARK_GREY, // Default
        consumes: [{resource: RESOURCE_TYPES.IRON_BAR, quantity: 1}], // Assuming it consumes iron bars for tools
        inputBufferCapacity: { [RESOURCE_TYPES.IRON_BAR]: 5 },
        outputBufferCapacity: { [RESOURCE_TYPES.TOOLS_AXE]: 3 }
    },
    BAKERY: {
        name: 'Bakery',
        cost: { [RESOURCE_TYPES.WOOD]: 25, [RESOURCE_TYPES.STONE]: 5 },
        creator: Buildings.createBakery,
        tier: 2,
        produces: [{ resource: RESOURCE_TYPES.BREAD, quantity: 3, interval: 20000 }], // From BUILDING_INFO (3 bread)
        consumes: [ // From BUILDING_INFO
            { resource: RESOURCE_TYPES.FLOUR, quantity: 1 },
            { resource: RESOURCE_TYPES.COAL_ORE, quantity: 1 } // Added COAL_ORE as fuel based on game.md
        ],
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.BAKER,
        // requiredTool: RESOURCE_TYPES.TOOLS_HAMMER, // In BUILDING_DATA, but not typical for baker. Removed for now.
        consumesFood: [RESOURCE_TYPES.GRAIN], // BUILDING_DATA had GRAIN, but bakery consumes FLOUR. This is serf upkeep.
        foodConsumptionRate: 0.1, // BUILDING_DATA
        foodCheckIntervalMs: 10000, // BUILDING_DATA
        gridSize: { width: 2, height: 2 }, // From BUILDING_INFO
        color: COLORS.TERRACOTTA, // From BUILDING_INFO
        inputBufferCapacity: { [RESOURCE_TYPES.FLOUR]: 5, [RESOURCE_TYPES.COAL_ORE]: 5 },
        outputBufferCapacity: { [RESOURCE_TYPES.BREAD]: 15 }
    },
    PIG_FARM: {
        name: 'Pig Farm',
        cost: { [RESOURCE_TYPES.WOOD]: 20, [RESOURCE_TYPES.STONE]: 10 },
        creator: Buildings.createPigFarm,
        tier: 2,
        produces: [{ resource: RESOURCE_TYPES.PIG, quantity: 1, interval: 35000 }], // From BUILDING_INFO (Corrected PIGS to PIG)
        consumes: [{ resource: RESOURCE_TYPES.GRAIN, quantity: 1 }], // From BUILDING_INFO
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.PIG_FARMER,
        requiredTool: RESOURCE_TYPES.TOOLS_SCYTHE, // For collecting grain? Or general farm tool
        consumesFood: [RESOURCE_TYPES.GRAIN], // Serf upkeep
        foodConsumptionRate: 0.05,
        foodCheckIntervalMs: 10000,
        gridSize: { width: 3, height: 2 }, // From BUILDING_INFO
        color: COLORS.LIGHT_BROWN, // From BUILDING_INFO
        inputBufferCapacity: { [RESOURCE_TYPES.GRAIN]: 10 },
        outputBufferCapacity: { [RESOURCE_TYPES.PIG]: 3 }
    },
    FARM: {
        name: 'Farm',
        cost: { [RESOURCE_TYPES.WOOD]: 20 }, // BUILDING_DATA cost (INFO had WOOD:30, STONE:10)
        creator: Buildings.createFarm,
        tier: 1,
        produces: [{ resource: RESOURCE_TYPES.GRAIN, quantity: 2, interval: 25000 }], // From BUILDING_INFO (2 grain)
        jobSlots: 1, // BUILDING_DATA (INFO had 2)
        jobProfession: SERF_PROFESSIONS.FARMER,
        requiredTool: RESOURCE_TYPES.TOOLS_SCYTHE,
        gridSize: { width: 3, height: 3 }, // From BUILDING_INFO
        color: COLORS.YELLOW, // From BUILDING_INFO
        consumes: [],
        cropGrowthTime: 25000, // Explicitly added, matches produces[0].interval
        outputBufferCapacity: { [RESOURCE_TYPES.GRAIN]: 10 }
        // consumesFood not specified in original BUILDING_DATA
    },
    IRON_MINE: {
        name: 'Iron Mine',
        cost: { [RESOURCE_TYPES.WOOD]: 30, [RESOURCE_TYPES.STONE]: 15 },
        creator: () => Buildings.createMine('iron'),
        tier: 2,
        produces: [{ resource: RESOURCE_TYPES.IRON_ORE, quantity: 1, interval: 20000 }], // From BUILDING_INFO
        jobSlots: 2, // BUILDING_DATA (INFO had 3)
        jobProfession: SERF_PROFESSIONS.MINER,
        requiredTool: RESOURCE_TYPES.TOOLS_PICKAXE,
        consumesFood: [RESOURCE_TYPES.BREAD, RESOURCE_TYPES.FISH],
        foodConsumptionRate: 0.2,
        foodCheckIntervalMs: 12000,
        gridSize: { width: 2, height: 1 }, // From BUILDING_INFO
        color: COLORS.DARK_GREY, // From BUILDING_INFO
        mineType: 'iron', // From BUILDING_INFO
        consumes: [],
        outputBufferCapacity: { [RESOURCE_TYPES.IRON_ORE]: 5 }
    },
    COAL_MINE: {
        name: 'Coal Mine',
        cost: { [RESOURCE_TYPES.WOOD]: 30, [RESOURCE_TYPES.STONE]: 15 },
        creator: () => Buildings.createMine('coal'),
        tier: 2,
        produces: [{ resource: RESOURCE_TYPES.COAL_ORE, quantity: 1, interval: 18000 }], // From BUILDING_INFO
        jobSlots: 2, // BUILDING_DATA (INFO had 3)
        jobProfession: SERF_PROFESSIONS.MINER,
        requiredTool: RESOURCE_TYPES.TOOLS_PICKAXE,
        consumesFood: [RESOURCE_TYPES.BREAD, RESOURCE_TYPES.FISH],
        foodConsumptionRate: 0.2,
        foodCheckIntervalMs: 12000,
        gridSize: { width: 2, height: 1 }, // From BUILDING_INFO
        color: COLORS.BLACK, // From BUILDING_INFO
        mineType: 'coal', // From BUILDING_INFO
        consumes: [],
        outputBufferCapacity: { [RESOURCE_TYPES.COAL_ORE]: 5 }
    },
    GOLD_MINE: {
        name: 'Gold Mine',
        cost: { [RESOURCE_TYPES.WOOD]: 40, [RESOURCE_TYPES.STONE]: 25 },
        creator: () => Buildings.createMine('gold'),
        tier: 3,
        produces: [{ resource: RESOURCE_TYPES.GOLD_ORE, quantity: 1, interval: 30000 }], // From BUILDING_INFO
        jobSlots: 2, // BUILDING_DATA (INFO had 3)
        jobProfession: SERF_PROFESSIONS.MINER,
        requiredTool: RESOURCE_TYPES.TOOLS_PICKAXE,
        consumesFood: [RESOURCE_TYPES.BREAD, RESOURCE_TYPES.FISH],
        foodConsumptionRate: 0.2,
        foodCheckIntervalMs: 12000,
        gridSize: { width: 2, height: 1 }, // From BUILDING_INFO
        color: COLORS.GOLD, // From BUILDING_INFO (assuming COLORS.GOLD)
        mineType: 'gold', // From BUILDING_INFO
        consumes: [],
        outputBufferCapacity: { [RESOURCE_TYPES.GOLD_ORE]: 5 }
    },
    SAWMILL: {
        name: 'Sawmill',
        cost: { [RESOURCE_TYPES.WOOD]: 25, [RESOURCE_TYPES.STONE]: 10 }, // BUILDING_DATA cost (INFO had STONE:5)
        creator: Buildings.createSawmill,
        tier: 2,
        produces: [{ resource: RESOURCE_TYPES.PLANKS, quantity: 2, interval: 15000 }], // From BUILDING_INFO
        consumes: [{ resource: RESOURCE_TYPES.WOOD, quantity: 1 }], // From BUILDING_INFO
        jobSlots: 1, // BUILDING_DATA (INFO had 2)
        jobProfession: SERF_PROFESSIONS.SAWMILL_WORKER,
        requiredTool: RESOURCE_TYPES.TOOLS_HAMMER,
        consumesFood: [RESOURCE_TYPES.BREAD],
        foodConsumptionRate: 0.1,
        foodCheckIntervalMs: 15000,
        gridSize: { width: 3, height: 2 }, // From BUILDING_INFO
        color: COLORS.BROWN, // From BUILDING_INFO
        inputBufferCapacity: { [RESOURCE_TYPES.WOOD]: 5 },
        outputBufferCapacity: { [RESOURCE_TYPES.PLANKS]: 6 }
    },
    WINDMILL: {
        name: 'Windmill',
        cost: { [RESOURCE_TYPES.WOOD]: 25, [RESOURCE_TYPES.STONE]: 15 }, // BUILDING_DATA cost (INFO had WOOD:30, STONE:20)
        creator: Buildings.createWindmill,
        tier: 2,
        produces: [{ resource: RESOURCE_TYPES.FLOUR, quantity: 1, interval: 18000 }], // From BUILDING_INFO
        consumes: [{ resource: RESOURCE_TYPES.GRAIN, quantity: 2 }], // From BUILDING_INFO
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.MILLER,
        requiredTool: RESOURCE_TYPES.TOOLS_HAMMER, // Or none?
        gridSize: { width: 2, height: 2 }, // From BUILDING_INFO
        color: COLORS.BEIGE, // From BUILDING_INFO
        inputBufferCapacity: { [RESOURCE_TYPES.GRAIN]: 10 },
        outputBufferCapacity: { [RESOURCE_TYPES.FLOUR]: 5 }
        // consumesFood not specified in original BUILDING_DATA
    },
    SLAUGHTERHOUSE: {
        name: 'Slaughterhouse',
        cost: { [RESOURCE_TYPES.WOOD]: 20, [RESOURCE_TYPES.STONE]: 10 },
        creator: Buildings.createSlaughterhouse,
        tier: 2,
        produces: [{ resource: RESOURCE_TYPES.MEAT, quantity: 2, interval: 12000 }], // From BUILDING_INFO
        consumes: [{ resource: RESOURCE_TYPES.PIG, quantity: 1 }], // From BUILDING_INFO
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.BUTCHER,
        requiredTool: RESOURCE_TYPES.TOOLS_AXE, // Cleaver might be better, but keeping AXE from BUILDING_DATA
        gridSize: { width: 2, height: 2 }, // From BUILDING_INFO
        color: COLORS.MAROON, // From BUILDING_INFO
        inputBufferCapacity: { [RESOURCE_TYPES.PIG]: 3 },
        outputBufferCapacity: { [RESOURCE_TYPES.MEAT]: 10 }
        // consumesFood not specified
    },
    IRON_SMELTER: {
        name: 'Iron Smelter',
        cost: { [RESOURCE_TYPES.WOOD]: 30, [RESOURCE_TYPES.STONE]: 20 }, // BUILDING_DATA cost (INFO had STONE:50, WOOD:20)
        creator: Buildings.createIronSmelter,
        tier: 2,
        produces: [{ resource: RESOURCE_TYPES.IRON_BAR, quantity: 1, interval: 22000 }], // From BUILDING_INFO
        consumes: [ // From BUILDING_INFO
            { resource: RESOURCE_TYPES.IRON_ORE, quantity: 2 },
            { resource: RESOURCE_TYPES.COAL_ORE, quantity: 1 }
        ],
        jobSlots: 1, // BUILDING_DATA (INFO had 2)
        jobProfession: SERF_PROFESSIONS.SMELTER_WORKER,
        consumesFood: [RESOURCE_TYPES.BREAD],
        foodConsumptionRate: 0.1,
        foodCheckIntervalMs: 20000,
        gridSize: { width: 2, height: 2 }, // From BUILDING_INFO
        color: COLORS.DARK_GREY, // From BUILDING_INFO
        inputBufferCapacity: { [RESOURCE_TYPES.IRON_ORE]: 10, [RESOURCE_TYPES.COAL_ORE]: 5 },
        outputBufferCapacity: { [RESOURCE_TYPES.IRON_BAR]: 5 }
    },
    TOOLMAKERS_WORKSHOP: { // Tier 3 in BUILDING_DATA
        name: "Toolmaker's Workshop",
        cost: { [RESOURCE_TYPES.WOOD]: 25, [RESOURCE_TYPES.STONE]: 10 }, // BUILDING_DATA cost (INFO had STONE:15)
        creator: Buildings.createToolmakersWorkshop,
        tier: 3,
        produces: [], // Produces multiple tool types, handled by specific logic/UI
        // Consumes based on tool being made, handled by specific UI action later
        consumes: [], // Placeholder, actual consumption is dynamic
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.TOOLMAKER,
        requiredTool: RESOURCE_TYPES.TOOLS_HAMMER,
        gridSize: { width: 2, height: 2 }, // From BUILDING_INFO
        color: COLORS.BROWN, // From BUILDING_INFO
        // Based on game.md: Input: Iron Bars, Planks.
        inputBufferCapacity: { [RESOURCE_TYPES.IRON_BARS]: 10, [RESOURCE_TYPES.PLANKS]: 10 },
        outputBufferCapacity: { // Generic capacity for various tools
            [RESOURCE_TYPES.TOOLS_AXE]: 2, 
            [RESOURCE_TYPES.TOOLS_PICKAXE]: 2,
            [RESOURCE_TYPES.TOOLS_SCYTHE]: 2,
            [RESOURCE_TYPES.TOOLS_HAMMER]: 2,
            [RESOURCE_TYPES.TOOLS_FISHING_ROD]: 2
        }
    },
    GOLDSMITHS_MINT: { // Tier 3 in BUILDING_DATA
        name: "Goldsmith's Mint",
        cost: { [RESOURCE_TYPES.WOOD]: 20, [RESOURCE_TYPES.STONE]: 20 }, // BUILDING_DATA cost (INFO had STONE:40, WOOD:10)
        creator: Buildings.createGoldsmithsMint,
        tier: 3,
        produces: [{ resource: RESOURCE_TYPES.GOLD_BARS, quantity: 1, interval: 25000 }], // From BUILDING_INFO
        consumes: [ // From BUILDING_INFO
            { resource: RESOURCE_TYPES.GOLD_ORE, quantity: 1 },
            { resource: RESOURCE_TYPES.COAL_ORE, quantity: 1 }
        ],
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.GOLDSMITH,
        gridSize: { width: 2, height: 2 }, // From BUILDING_INFO
        color: COLORS.BEIGE, // From BUILDING_INFO
        inputBufferCapacity: { [RESOURCE_TYPES.GOLD_ORE]: 5, [RESOURCE_TYPES.COAL_ORE]: 5 },
        outputBufferCapacity: { [RESOURCE_TYPES.GOLD_BARS]: 5 }
        // consumesFood not specified
    },
    BLACKSMITH_ARMORY: { // Tier 3 in BUILDING_DATA
        name: 'Blacksmith Armory', // BUILDING_DATA name (INFO had "Blacksmith / Armory")
        cost: { [RESOURCE_TYPES.WOOD]: 30, [RESOURCE_TYPES.STONE]: 15 }, // BUILDING_DATA cost (INFO had STONE:35, WOOD:20)
        creator: Buildings.createBlacksmithArmory,
        tier: 3,
        produces: [], // Produces weapons and tools, handled by specific logic/UI
        consumes: [], // Placeholder, actual consumption is dynamic (e.g. Iron Bars for swords)
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.BLACKSMITH,
        requiredTool: RESOURCE_TYPES.TOOLS_HAMMER,
        gridSize: { width: 3, height: 2 }, // From BUILDING_INFO
        color: COLORS.DARK_GREY, // From BUILDING_INFO
        // Based on game.md: Input: Iron Bars, Coal (as fuel). (Planks may be needed for shields).
        inputBufferCapacity: { [RESOURCE_TYPES.IRON_BARS]: 10, [RESOURCE_TYPES.COAL_ORE]: 5, [RESOURCE_TYPES.PLANKS]: 10 },
        outputBufferCapacity: { [RESOURCE_TYPES.SWORD]: 3, [RESOURCE_TYPES.SHIELD]: 3 }
        // consumesFood not specified
    },
    GUARD_HUT: {
        name: 'Guard Hut',
        cost: { [RESOURCE_TYPES.WOOD]: 15, [RESOURCE_TYPES.STONE]: 5 }, // BUILDING_DATA cost (INFO had WOOD:10)
        creator: Buildings.createGuardHut,
        tier: 1,
        jobSlots: 1,
        // jobProfession: SERF_PROFESSIONS.GUARD, // Add if GUARD profession exists
        gridSize: { width: 1, height: 1 }, // From BUILDING_INFO
        color: COLORS.DARK_GREY, // From BUILDING_INFO
        produces: [],
        consumes: []
    },
    WATCHTOWER: {
        name: 'Watchtower',
        cost: { [RESOURCE_TYPES.WOOD]: 20, [RESOURCE_TYPES.STONE]: 15 },
        creator: Buildings.createWatchtower,
        tier: 2,
        jobSlots: 1,
        // jobProfession: SERF_PROFESSIONS.GUARD, // Add if GUARD profession exists
        territoryIncrease: 5, // From BUILDING_INFO
        gridSize: { width: 1, height: 1 }, // From BUILDING_INFO
        color: COLORS.STONE_GREY, // From BUILDING_INFO
        produces: [],
        consumes: []
    },
    BARRACKS_FORTRESS: {
        name: 'Barracks/Fortress',
        cost: { [RESOURCE_TYPES.STONE]: 100, [RESOURCE_TYPES.WOOD]: 50 }, // BUILDING_DATA cost (INFO had IRON_BAR:10 too)
        creator: Buildings.createBarracksFortress,
        tier: 3,
        jobSlots: 5,
        // jobProfession: SERF_PROFESSIONS.KNIGHT, // Or trainer
        canTrain: ['KNIGHT'], // From BUILDING_INFO
        territoryIncrease: 10, // From BUILDING_INFO
        gridSize: { width: 4, height: 3 }, // From BUILDING_INFO
        color: COLORS.DARK_GREY, // From BUILDING_INFO
        produces: [],
        consumes: [] // Resource consumption for training handled by training action
    },
    WAREHOUSE_STOREHOUSE: {
        name: 'Warehouse/Storehouse',
        cost: { [RESOURCE_TYPES.WOOD]: 50, [RESOURCE_TYPES.STONE]: 20 },
        creator: Buildings.createWarehouseStorehouse,
        tier: 1,
        storageCapacityIncrease: { // From BUILDING_INFO
            [RESOURCE_TYPES.WOOD]: 200, [RESOURCE_TYPES.STONE]: 200, [RESOURCE_TYPES.IRON_ORE]: 100,
            [RESOURCE_TYPES.COAL_ORE]: 100, [RESOURCE_TYPES.GOLD_ORE]: 50, [RESOURCE_TYPES.PLANKS]: 150,
            [RESOURCE_TYPES.IRON_BAR]: 100, [RESOURCE_TYPES.GOLD_BARS]: 50, [RESOURCE_TYPES.TOOLS_AXE]: 20,
            [RESOURCE_TYPES.TOOLS_PICKAXE]: 20, [RESOURCE_TYPES.GRAIN]: 100, [RESOURCE_TYPES.FLOUR]: 80,
            [RESOURCE_TYPES.BREAD]: 100, [RESOURCE_TYPES.FISH]: 100, [RESOURCE_TYPES.PIG]: 30,
            [RESOURCE_TYPES.MEAT]: 80, [RESOURCE_TYPES.SWORD]: 20, [RESOURCE_TYPES.SHIELD]: 20,
        },
        gridSize: { width: 4, height: 2 }, // From BUILDING_INFO
        color: COLORS.BEIGE, // From BUILDING_INFO
        produces: [],
        consumes: [],
        jobSlots: 0
    },
    BUILDERS_HUT: {
        name: "Builder's Hut",
        cost: { [RESOURCE_TYPES.WOOD]: 5 },
        creator: Buildings.createBuildersHut,
        tier: 1,
        jobSlots: 3,
        jobProfession: SERF_PROFESSIONS.BUILDER,
        gridSize: { width: 1, height: 1 }, // From BUILDING_INFO
        color: COLORS.BROWN, // From BUILDING_INFO
        produces: [],
        consumes: []
    },
    HARBOR: {
        name: 'Harbor',
        cost: { [RESOURCE_TYPES.WOOD]: 75, [RESOURCE_TYPES.STONE]: 25 },
        creator: Buildings.createHarbor,
        tier: 3,
        jobSlots: 2, // From BUILDING_INFO (not in BUILDING_DATA)
        // jobProfession: SERF_PROFESSIONS.TRADER, // Add if exists
        gridSize: { width: 2, height: 4 }, // From BUILDING_INFO
        color: COLORS.DARK_BROWN, // From BUILDING_INFO
        produces: [],
        consumes: [] // Consumption for trade/transport handled by specific logic
    },
    MARKETPLACE: { // Not in BUILDING_INFO snippet
        name: 'Marketplace',
        cost: { [RESOURCE_TYPES.WOOD]: 40, [RESOURCE_TYPES.STONE]: 10 },
        creator: Buildings.createMarketplace,
        tier: 2,
        gridSize: { width: 3, height: 3 }, // Default
        color: COLORS.BEIGE, // Default
        produces: [],
        consumes: [],
        jobSlots: 0 // Example
    },
    CHURCH_TEMPLE: { // Not in BUILDING_INFO snippet
        name: 'Church/Temple',
        cost: { [RESOURCE_TYPES.STONE]: 150, [RESOURCE_TYPES.WOOD]: 50, [RESOURCE_TYPES.GOLD_BARS]: 10 },
        creator: Buildings.createChurchTemple,
        tier: 3,
        gridSize: { width: 3, height: 4 }, // Default
        color: COLORS.WHITE, // Default
        produces: [],
        consumes: [],
        jobSlots: 1 // Example (Priest)
    },
    SHIPYARD: { // Not in BUILDING_INFO snippet
        name: 'Shipyard',
        cost: { [RESOURCE_TYPES.WOOD]: 100, [RESOURCE_TYPES.PLANKS]: 50 },
        creator: Buildings.createShipyard,
        tier: 3,
        gridSize: { width: 4, height: 3 }, // Default
        color: COLORS.BROWN, // Default
        produces: [], // Produces ships (special logic)
        consumes: [], // Consumes planks, etc.
        jobSlots: 2, // Example
        // Example capacities for ship components
        inputBufferCapacity: { [RESOURCE_TYPES.PLANKS]: 100, [RESOURCE_TYPES.WOOD]: 50, [RESOURCE_TYPES.IRON_BARS]: 10 },
        outputBufferCapacity: {} // Or a way to signify one ship is ready
    },
    UNIVERSITY_LIBRARY: { // Not in BUILDING_INFO snippet
        name: 'University/Library',
        cost: { [RESOURCE_TYPES.STONE]: 120, [RESOURCE_TYPES.WOOD]: 60, [RESOURCE_TYPES.GOLD_BARS]: 20 },
        creator: Buildings.createUniversityLibrary,
        tier: 4,
        gridSize: { width: 4, height: 3 }, // Default
        color: COLORS.BEIGE, // Default
        produces: [], // Research/upgrades
        consumes: [] // Consumes resources for research (dynamic)
    },
    SIEGE_WORKSHOP: { // Not in BUILDING_INFO snippet
        name: 'Siege Workshop',
        cost: { [RESOURCE_TYPES.WOOD]: 70, [RESOURCE_TYPES.STONE]: 30, [RESOURCE_TYPES.IRON_BARS]: 20 },
        creator: Buildings.createSiegeWorkshop,
        tier: 4,
        gridSize: { width: 3, height: 3 }, // Default
        color: COLORS.DARK_GREY, // Default
        produces: [], // Siege engines
        consumes: [], // Consumes resources for siege engines (dynamic)
        jobSlots: 1, // Example
        inputBufferCapacity: { [RESOURCE_TYPES.PLANKS]: 50, [RESOURCE_TYPES.IRON_BARS]: 20, [RESOURCE_TYPES.WOOD]: 30 }
    },
    TREASURY_MINT: { // Not in BUILDING_INFO snippet, distinct from Goldsmith's Mint
        name: 'Treasury/Mint',
        cost: { [RESOURCE_TYPES.STONE]: 100, [RESOURCE_TYPES.GOLD_BARS]: 50 },
        creator: Buildings.createTreasuryMint, // Assuming this creator exists
        tier: 4,
        gridSize: { width: 3, height: 2 }, // Default
        color: COLORS.GOLD, // Default
        produces: [], // Could produce coins or increase gold storage significantly
        consumes: []
    }
};
