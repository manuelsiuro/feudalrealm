// src/config/resourceTypes.js

// Define all resource types used in the game
export const RESOURCE_TYPES = {
    WOOD: 'wood', // Logs
    STONE: 'stone',
    GRAIN: 'grain',
    FISH: 'fish',
    IRON_ORE: 'iron_ore',
    COAL_ORE: 'coal_ore',
    GOLD_ORE: 'gold_ore',
    PLANKS: 'planks',
    FLOUR: 'flour',
    BREAD: 'bread',
    MEAT: 'meat', // Pork
    IRON_BARS: 'iron_bars',
    GOLD_BARS: 'gold_bars',
    TOOL_AXE: 'tool_axe',
    TOOL_PICKAXE: 'tool_pickaxe',
    TOOL_SCYTHE: 'tool_scythe',
    TOOL_HAMMER: 'tool_hammer',
    TOOL_FISHING_ROD: 'tool_fishing_rod',
    SWORD: 'sword', // Singular, as per game.md for recruitment
    SHIELD: 'shield', // Singular, as per game.md for recruitment
    PIG: 'pig', // Added as a resource type for Pig Farm output / Slaughterhouse input
    SAPLING: 'sapling', // For foresters planting new trees
    // PIGS are handled as units/entities rather than simple stockpile items for now - This comment might be outdated
};
