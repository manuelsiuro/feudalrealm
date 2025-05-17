// src/config/buildingData.js
import * as Buildings from '../entities/buildings.js';
import { RESOURCE_TYPES } from './resourceTypes.js';
import { SERF_PROFESSIONS } from './serfProfessions.js';

export const BUILDING_DATA = {
    CASTLE: { name: 'Castle', cost: {}, creator: Buildings.createCastle, tier: 0 },
    WOODCUTTERS_HUT: { 
        name: "Woodcutter's Hut", 
        cost: { [RESOURCE_TYPES.WOOD]: 20 }, 
        creator: Buildings.createWoodcuttersHut, 
        tier: 1,
        producesResource: RESOURCE_TYPES.WOOD,
        productionRate: 5,
        productionIntervalMs: (60 / 5) * 1000,
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.WOODCUTTER, 
        requiredTool: RESOURCE_TYPES.TOOLS_AXE,
        consumesFood: [RESOURCE_TYPES.BREAD, RESOURCE_TYPES.FISH], 
        foodConsumptionRate: 0.1,
        foodCheckIntervalMs: 15000,
    },
    FORESTERS_HUT: { 
        name: "Forester's Hut", 
        cost: { [RESOURCE_TYPES.WOOD]: 15 }, 
        creator: Buildings.createForestersHut, 
        tier: 1,
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.FORESTER,
    },
    TRANSPORTER_HUT: {
        name: "Transporter's Hut",
        cost: { [RESOURCE_TYPES.WOOD]: 5 },
        creator: Buildings.createTransportersHut,
        tier: 1,
        jobSlots: 5,
        jobProfession: SERF_PROFESSIONS.TRANSPORTER
    },
    QUARRY: { 
        name: 'Quarry', 
        cost: { [RESOURCE_TYPES.WOOD]: 25 }, 
        creator: Buildings.createQuarry, 
        tier: 1,
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.STONEMASON,
        requiredTool: RESOURCE_TYPES.TOOLS_PICKAXE,
        consumesFood: [RESOURCE_TYPES.BREAD, RESOURCE_TYPES.FISH],
        foodConsumptionRate: 0.1, 
        foodCheckIntervalMs: 10000, 
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
    },
    BLACKSMITH: {
        name: 'Blacksmith',
        cost: { [RESOURCE_TYPES.WOOD]: 30, [RESOURCE_TYPES.STONE]: 10 },
        creator: Buildings.createBlacksmithArmory,
        tier: 2,
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.BLACKSMITH,
        producesResource: RESOURCE_TYPES.TOOLS_AXE,
        productionRate: 1,
        productionIntervalMs: 10000,
        requiredTool: RESOURCE_TYPES.TOOLS_HAMMER,
        consumesFood: [RESOURCE_TYPES.BREAD, RESOURCE_TYPES.FISH],
        foodConsumptionRate: 0.1,
        foodCheckIntervalMs: 10000,
    },
    BAKERY: {
        name: 'Bakery',
        cost: { [RESOURCE_TYPES.WOOD]: 25, [RESOURCE_TYPES.STONE]: 5 },
        creator: Buildings.createBakery,
        tier: 2,
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.BAKER,
        producesResource: RESOURCE_TYPES.BREAD,
        productionRate: 1,
        productionIntervalMs: 10000,
        requiredTool: RESOURCE_TYPES.TOOLS_HAMMER,
        consumesFood: [RESOURCE_TYPES.GRAIN],
        foodConsumptionRate: 0.1,
        foodCheckIntervalMs: 10000,
    },
    PIG_FARM: {
        name: 'Pig Farm',
        cost: { [RESOURCE_TYPES.WOOD]: 20, [RESOURCE_TYPES.STONE]: 10 },
        creator: Buildings.createPigFarm,
        tier: 2,
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.PIG_FARMER,
        producesResource: RESOURCE_TYPES.PIGS, // This should be PIG, not PIGS
        productionRate: 1,
        productionIntervalMs: 20000,
        requiredTool: RESOURCE_TYPES.TOOLS_SCYTHE,
        consumesFood: [RESOURCE_TYPES.GRAIN],
        foodConsumptionRate: 0.05,
        foodCheckIntervalMs: 10000,
    },
    FARM: {
        name: 'Farm',
        cost: { [RESOURCE_TYPES.WOOD]: 20 },
        creator: Buildings.createFarm,
        tier: 1,
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.FARMER,
        producesResource: RESOURCE_TYPES.GRAIN,
        productionRate: 1,
        productionIntervalMs: 15000,
        requiredTool: RESOURCE_TYPES.TOOLS_SCYTHE
    },
    IRON_MINE: {
        name: 'Iron Mine',
        cost: { [RESOURCE_TYPES.WOOD]: 30, [RESOURCE_TYPES.STONE]: 15 },
        creator: () => Buildings.createMine('iron'),
        tier: 2,
        jobSlots: 2,
        jobProfession: SERF_PROFESSIONS.MINER,
        producesResource: RESOURCE_TYPES.IRON_ORE,
        productionRate: 1,
        productionIntervalMs: 20000,
        requiredTool: RESOURCE_TYPES.TOOLS_PICKAXE,
        consumesFood: [RESOURCE_TYPES.BREAD, RESOURCE_TYPES.FISH],
        foodConsumptionRate: 0.2,
        foodCheckIntervalMs: 12000
    },
    COAL_MINE: {
        name: 'Coal Mine',
        cost: { [RESOURCE_TYPES.WOOD]: 30, [RESOURCE_TYPES.STONE]: 15 },
        creator: () => Buildings.createMine('coal'),
        tier: 2,
        jobSlots: 2,
        jobProfession: SERF_PROFESSIONS.MINER,
        producesResource: RESOURCE_TYPES.COAL_ORE,
        productionRate: 1,
        productionIntervalMs: 18000,
        requiredTool: RESOURCE_TYPES.TOOLS_PICKAXE,
        consumesFood: [RESOURCE_TYPES.BREAD, RESOURCE_TYPES.FISH],
        foodConsumptionRate: 0.2,
        foodCheckIntervalMs: 12000
    },
    GOLD_MINE: {
        name: 'Gold Mine',
        cost: { [RESOURCE_TYPES.WOOD]: 40, [RESOURCE_TYPES.STONE]: 25 },
        creator: () => Buildings.createMine('gold'),
        tier: 3,
        jobSlots: 2,
        jobProfession: SERF_PROFESSIONS.MINER,
        producesResource: RESOURCE_TYPES.GOLD_ORE,
        productionRate: 1,
        productionIntervalMs: 25000,
        requiredTool: RESOURCE_TYPES.TOOLS_PICKAXE,
        consumesFood: [RESOURCE_TYPES.BREAD, RESOURCE_TYPES.FISH],
        foodConsumptionRate: 0.2,
        foodCheckIntervalMs: 12000
    },
    SAWMILL: {
        name: 'Sawmill',
        cost: { [RESOURCE_TYPES.WOOD]: 25, [RESOURCE_TYPES.STONE]: 10 },
        creator: Buildings.createSawmill,
        tier: 2,
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.SAWMILL_WORKER,
        producesResource: RESOURCE_TYPES.PLANKS,
        productionRate: 1,
        productionIntervalMs: 12000,
        requiredTool: RESOURCE_TYPES.TOOLS_HAMMER,
        consumesFood: [RESOURCE_TYPES.BREAD],
        foodConsumptionRate: 0.1,
        foodCheckIntervalMs: 15000
    },
    WINDMILL: {
        name: 'Windmill',
        cost: { [RESOURCE_TYPES.WOOD]: 25, [RESOURCE_TYPES.STONE]: 15 },
        creator: Buildings.createWindmill,
        tier: 2,
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.MILLER,
        producesResource: RESOURCE_TYPES.FLOUR,
        productionRate: 1,
        productionIntervalMs: 15000,
        requiredTool: RESOURCE_TYPES.TOOLS_HAMMER
    },
    SLAUGHTERHOUSE: {
        name: 'Slaughterhouse',
        cost: { [RESOURCE_TYPES.WOOD]: 20, [RESOURCE_TYPES.STONE]: 10 },
        creator: Buildings.createSlaughterhouse,
        tier: 2,
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.BUTCHER,
        producesResource: RESOURCE_TYPES.MEAT,
        productionRate: 2,
        productionIntervalMs: 15000,
        requiredTool: RESOURCE_TYPES.TOOLS_AXE // Cleaver might be more appropriate
    },
    IRON_SMELTER: {
        name: 'Iron Smelter',
        cost: { [RESOURCE_TYPES.WOOD]: 30, [RESOURCE_TYPES.STONE]: 20 },
        creator: Buildings.createIronSmelter,
        tier: 2,
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.SMELTER_WORKER,
        producesResource: RESOURCE_TYPES.IRON_BARS,
        productionRate: 1,
        productionIntervalMs: 20000,
        consumesFood: [RESOURCE_TYPES.BREAD],
        foodConsumptionRate: 0.1,
        foodCheckIntervalMs: 20000
    },
    TOOLMAKERS_WORKSHOP: {
        name: "Toolmaker's Workshop",
        cost: { [RESOURCE_TYPES.WOOD]: 25, [RESOURCE_TYPES.STONE]: 10 },
        creator: Buildings.createToolmakersWorkshop,
        tier: 3,
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.TOOLMAKER,
        producesResource: null, // Produces multiple tool types
        productionRate: 1,
        productionIntervalMs: 25000,
        requiredTool: RESOURCE_TYPES.TOOLS_HAMMER
    },
    GOLDSMITHS_MINT: {
        name: "Goldsmith's Mint",
        cost: { [RESOURCE_TYPES.WOOD]: 20, [RESOURCE_TYPES.STONE]: 20 },
        creator: Buildings.createGoldsmithsMint,
        tier: 3,
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.GOLDSMITH,
        producesResource: RESOURCE_TYPES.GOLD_BARS,
        productionRate: 1,
        productionIntervalMs: 30000
    },
    BLACKSMITH_ARMORY: {
        name: 'Blacksmith Armory',
        cost: { [RESOURCE_TYPES.WOOD]: 30, [RESOURCE_TYPES.STONE]: 15 },
        creator: Buildings.createBlacksmithArmory,
        tier: 3,
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.BLACKSMITH,
        producesResource: null, // Produces weapons and tools
        productionRate: 1,
        productionIntervalMs: 25000,
        requiredTool: RESOURCE_TYPES.TOOLS_HAMMER
    },
    GUARD_HUT: {
        name: 'Guard Hut',
        cost: { [RESOURCE_TYPES.WOOD]: 15, [RESOURCE_TYPES.STONE]: 5 },
        creator: Buildings.createGuardHut,
        tier: 1,
        jobSlots: 1
    },
    WATCHTOWER: {
        name: 'Watchtower',
        cost: { [RESOURCE_TYPES.WOOD]: 20, [RESOURCE_TYPES.STONE]: 15 },
        creator: Buildings.createWatchtower,
        tier: 2,
        jobSlots: 1
    },
    BARRACKS_FORTRESS: {
        name: 'Barracks/Fortress',
        cost: { [RESOURCE_TYPES.STONE]: 100, [RESOURCE_TYPES.WOOD]: 50 },
        creator: Buildings.createBarracksFortress,
        tier: 3,
        jobSlots: 5
    },
    WAREHOUSE_STOREHOUSE: {
        name: 'Warehouse/Storehouse',
        cost: { [RESOURCE_TYPES.WOOD]: 50, [RESOURCE_TYPES.STONE]: 20 },
        creator: Buildings.createWarehouseStorehouse,
        tier: 1
    },
    BUILDERS_HUT: {
        name: "Builder's Hut",
        cost: { [RESOURCE_TYPES.WOOD]: 5 },
        creator: Buildings.createBuildersHut,
        tier: 1,
        jobSlots: 3,
        jobProfession: SERF_PROFESSIONS.BUILDER
    },
    HARBOR: {
        name: 'Harbor',
        cost: { [RESOURCE_TYPES.WOOD]: 75, [RESOURCE_TYPES.STONE]: 25 },
        creator: Buildings.createHarbor,
        tier: 3
    },
    MARKETPLACE: {
        name: 'Marketplace',
        cost: { [RESOURCE_TYPES.WOOD]: 40, [RESOURCE_TYPES.STONE]: 10 },
        creator: Buildings.createMarketplace,
        tier: 2
    },
    CHURCH_TEMPLE: {
        name: 'Church/Temple',
        cost: { [RESOURCE_TYPES.STONE]: 150, [RESOURCE_TYPES.WOOD]: 50, [RESOURCE_TYPES.GOLD_BARS]: 10 },
        creator: Buildings.createChurchTemple,
        tier: 3
    },
    SHIPYARD: {
        name: 'Shipyard',
        cost: { [RESOURCE_TYPES.WOOD]: 100, [RESOURCE_TYPES.PLANKS]: 50 },
        creator: Buildings.createShipyard,
        tier: 3
    },
    UNIVERSITY_LIBRARY: {
        name: 'University/Library',
        cost: { [RESOURCE_TYPES.STONE]: 120, [RESOURCE_TYPES.WOOD]: 60, [RESOURCE_TYPES.GOLD_BARS]: 20 },
        creator: Buildings.createUniversityLibrary,
        tier: 4
    },
    SIEGE_WORKSHOP: {
        name: 'Siege Workshop',
        cost: { [RESOURCE_TYPES.WOOD]: 70, [RESOURCE_TYPES.STONE]: 30, [RESOURCE_TYPES.IRON_BARS]: 20 },
        creator: Buildings.createSiegeWorkshop,
        tier: 4
    },
    TREASURY_MINT: { // Goldsmiths_Mint is already defined, this might be a duplicate or higher tier
        name: 'Treasury/Mint',
        cost: { [RESOURCE_TYPES.STONE]: 100, [RESOURCE_TYPES.GOLD_BARS]: 50 },
        creator: Buildings.createTreasuryMint, // Assuming this creator exists
        tier: 4
    }
};
