// src/config/resourceTypes.js

// Define all resource types used in the game
export const RESOURCE_TYPES = {
    WOOD: {
        key: 'WOOD',
        name: 'Wood',
        icon: '🪵', // Emoji for UI
        description:
            'Logs harvested from trees, used for construction and crafting.',
    },
    WOOD_LOG: {
        key: 'WOOD_LOG',
        name: 'Wood Log',
        icon: '🪵', // Emoji for UI
        description:
            'Logs harvested from trees, used for construction and crafting.',
    },
    STONE: {
        key: 'STONE',
        name: 'Stone',
        icon: '🪨', // Emoji for UI (rock)
        description:
            'Rough stone quarried from deposits, a primary building material.',
    },
    GRAIN: {
        key: 'GRAIN',
        name: 'Grain',
        icon: '🌾',
        description: 'Harvested from farms, can be milled into flour.',
    },
    FISH: {
        key: 'FISH',
        name: 'Fish',
        icon: '🐟', // Placeholder, maybe a fish emoji if available or a colored circle
        description: 'Caught from water bodies, a source of food.',
    },
    IRON_ORE: {
        key: 'IRON_ORE',
        name: 'Iron Ore',
        icon: '🥈', // Placeholder, maybe an iron nugget emoji or colored circle
        description:
            'Raw ore containing iron, needs to be smelted for tools and weapons.',
    },
    COAL_ORE: {
        key: 'COAL_ORE',
        name: 'Coal Ore',
        icon: '🪨', // Placeholder, maybe a coal nugget emoji or colored circle
        description: 'Raw ore containing coal, used as a fuel source.',
    },
    GOLD_ORE: {
        key: 'GOLD_ORE',
        name: 'Gold Ore',
        icon: '🥇', // Placeholder, maybe a gold nugget emoji if available or a colored circle
        description: 'Raw ore containing gold, needs to be smelted.',
    },
    PLANKS: {
        key: 'PLANKS',
        name: 'Planks',
        icon: '🪵', // Placeholder, maybe a plank emoji if available or a colored circle
        description: 'Processed wood, used for building and crafting.',
    },
    FLOUR: {
        key: 'FLOUR',
        name: 'Flour',
        icon: '🌾', // Placeholder, maybe a flour emoji if available or a colored circle
        description: 'Ground grain, used for baking and cooking.',
    },
    BREAD: {
        key: 'BREAD',
        name: 'Bread',
        icon: '🍞', // Placeholder, maybe a bread emoji if available or a colored circle
        description: 'Baked food item made from flour, provides sustenance.',
    },
    MEAT: {
        key: 'MEAT',
        name: 'Meat',
        icon: '🍖', // Placeholder, maybe a meat emoji if available or a colored circle
        description: 'Raw meat from animals, used for cooking and crafting.',
    },
    IRON_BARS: {
        key: 'IRON_BARS',
        name: 'Iron Bars',
        icon: '🪨', // Placeholder, maybe an iron bar emoji if available or a colored circle
        description: 'Processed iron, used for crafting tools and building.',
    },
    GOLD_BARS: {
        key: 'GOLD_BARS',
        name: 'Gold Bars',
        icon: '🥇', // Placeholder, maybe a gold bar emoji if available or a colored circle
        description: 'Processed gold, used for crafting and trade.',
    },
    TOOL_AXE: {
        key: 'TOOL_AXE',
        name: 'Axe',
        icon: '🪓', // Placeholder, maybe an axe emoji if available or a colored circle
        description: 'Tool used for chopping wood and harvesting trees.',
    },
    TOOL_PICKAXE: {
        key: 'TOOL_PICKAXE',
        name: 'Pickaxe',
        icon: '⛏️', // Placeholder, maybe a pickaxe emoji if available or a colored circle
        description: 'Tool used for mining stone and ores.',
    },
    TOOL_SCYTHE: {
        key: 'TOOL_SCYTHE',
        name: 'Scythe',
        icon: '🌾', // Placeholder, maybe a scythe emoji if available or a colored circle
        description: 'Tool used for harvesting crops and cutting grass.',
    },
    TOOL_HAMMER: {
        key: 'TOOL_HAMMER',
        name: 'Hammer',
        icon: '🔨', // Placeholder, maybe a hammer emoji if available or a colored circle
        description: 'Tool used for building and crafting.',
    },
    TOOL_FISHING_ROD: {
        key: 'TOOL_FISHING_ROD',
        name: 'Fishing Rod',
        icon: '🎣', // Placeholder, maybe a fishing rod emoji if available or a colored circle
        description: 'Tool used for catching fish.',
    },
    SWORD: {
        key: 'SWORD',
        name: 'Sword',
        icon: '⚔️', // Placeholder, maybe a sword emoji if available or a colored circle
        description: 'Melee weapon for combat.',
    },
    SHIELD: {
        key: 'SHIELD',
        name: 'Shield',
        icon: '🛡️', // Placeholder, maybe a shield emoji if available or a colored circle
        description: 'Defensive equipment for protection.',
    },
    PIG: {
        key: 'PIG',
        name: 'Pig',
        icon: '🐖', // Placeholder, maybe a pig emoji if available or a colored circle
        description: 'Domesticated pig, a source of meat and leather.',
    },
    SAPLING: {
        key: 'SAPLING',
        name: 'Sapling',
        icon: '🌱', // Placeholder, maybe a sapling emoji if available or a colored circle
        description: 'Young tree, can be planted to grow into a full tree.',
    },
    FERTILE_LAND: {
        key: 'FERTILE_LAND',
        name: 'Fertile Land',
        icon: '🌾', // Placeholder, maybe a fertile land emoji if available or a colored circle
        description: 'Land suitable for farming and growing crops.',
    },
    // PIGS are handled as units/entities rather than simple stockpile items for now - This comment might be outdated

    TREE: {
        // The harvestable resource on the map
        key: 'TREE',
        name: 'Tree',
        isHarvestable: true,
        yield: { WOOD_LOG: 5 }, // Produces 5 of the resource with the key 'WOOD_LOG'
        // Ensure 'WOOD_LOG' matches the key of your wood log resource.
        icon: '🌳', // For UI or map representation if applicable
        // mapColor: 0x228B22, // Example: ForestGreen, if NatureManager uses this to color tree map entities
        // Other properties NatureManager might need for spawning/managing trees on the map.
    },
};
