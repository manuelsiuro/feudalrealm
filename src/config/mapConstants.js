// src/config/mapConstants.js
export const TILE_SIZE = 5;

export const TERRAIN_TYPES = {
    GRASSLAND: 'grassland',
    FOREST: 'forest',
    MOUNTAIN: 'mountain',
    WATER: 'water',
    DESERT: 'desert',
};

export const TERRAIN_COLORS = {
    [TERRAIN_TYPES.GRASSLAND]: 0x008000, // LimeGreen
    [TERRAIN_TYPES.FOREST]: 0x228B22,    // ForestGreen
    [TERRAIN_TYPES.MOUNTAIN]: 0x808080,   // Grey
    [TERRAIN_TYPES.WATER]: 0x1E90FF,     // DodgerBlue
    [TERRAIN_TYPES.DESERT]: 0xF4A460,    // SandyBrown
};
