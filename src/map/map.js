/**
 * @fileoverview Defines the data structures and core logic for the game map.
 */

/**
 * Represents a single tile on the game map.
 */
class MapTile {
    /**
     * @param {string} terrainType - The type of terrain (e.g., 'grassland', 'forest', 'water').
     * @param {number} x - The x-coordinate of the tile.
     * @param {number} y - The y-coordinate of the tile.
     * @param {object|null} building - The building occupying this tile, if any.
     * @param {object|null} resource - The resource on this tile, if any.
     */
    constructor(terrainType, x, y, building = null, resource = null) {
        this.terrainType = terrainType; // e.g., 'grassland', 'forest', 'mountain', 'water', 'desert'
        this.x = x;
        this.y = y;
        this.building = building; // Reference to a building object if one is on this tile
        this.resource = resource; // Reference to a resource object (e.g., a tree, a stone deposit)
        this.isOccupied = !!building;
        this.isExplored = false; // For fog of war or discovery mechanics
        this.isFlagged = false; // If a road flag is placed here
    }
}

/**
 * Represents the game map.
 */
class GameMap {
    /**
     * @param {number} width - The width of the map in tiles.
     * @param {number} height - The height of the map in tiles.
     */
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = []; // 2D array of MapTile objects
        this.initializeGrid();
    }

    /**
     * Initializes the map grid with default terrain.
     * For now, it will be all grassland.
     */
    initializeGrid() {
        this.grid = [];
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                // Default to grassland for now, actual generation will be more complex
                row.push(new MapTile('grassland', x, y));
            }
            this.grid.push(row);
        }
        console.log(`GameMap initialized with ${this.width}x${this.height} grid.`);
    }

    /**
     * Gets the tile at the given coordinates.
     * Implements world wrapping.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @returns {MapTile|null} The MapTile at the coordinates, or null if out of bounds (should not happen with wrapping).
     */
    getTile(x, y) {
        const wrappedX = (x % this.width + this.width) % this.width;
        const wrappedY = (y % this.height + this.height) % this.height;
        return this.grid[wrappedY] && this.grid[wrappedY][wrappedX] ? this.grid[wrappedY][wrappedX] : null;
    }

    /**
     * Sets the terrain type for a specific tile.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @param {string} terrainType - The new terrain type.
     */
    setTerrain(x, y, terrainType) {
        const tile = this.getTile(x, y);
        if (tile) {
            tile.terrainType = terrainType;
        }
    }

    /**
     * Places a building on the map.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @param {object} building - The building object to place.
     * @returns {boolean} True if placement was successful, false otherwise.
     */
    placeBuilding(x, y, building) {
        const tile = this.getTile(x, y);
        if (tile && !tile.isOccupied) {
            tile.building = building;
            tile.isOccupied = true;
            console.log(`Building ${building.type} placed at (${x}, ${y})`);
            return true;
        }
        console.warn(`Failed to place building at (${x}, ${y}). Tile occupied or invalid.`);
        return false;
    }

    /**
     * Removes a building from the map.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     */
    removeBuilding(x, y) {
        const tile = this.getTile(x, y);
        if (tile && tile.building) {
            console.log(`Building ${tile.building.type} removed from (${x}, ${y})`);
            tile.building = null;
            tile.isOccupied = false;
        }
    }

    /**
     * Generates more structured map features with distinct regions.
     */
    generateMapFeatures() {
        console.log("Generating more structured map features...");

        // Initialize all to grassland (primarily for clarity, as initializeGrid does this)
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.setTerrain(x, y, 'grassland');
            }
        }

        // Create a mountain range
        // Attempts to create a somewhat contiguous range, could be horizontal or vertical
        const mountainRangeLength = Math.floor(this.width * (Math.random() * 0.3 + 0.4)); // 40-70% of width/height
        const mountainRangeThickness = Math.floor(this.width * (Math.random() * 0.1 + 0.15)); // 15-25% of width/height
        const isVerticalRange = Math.random() > 0.5;
        
        let mountainStartX = Math.floor(Math.random() * (this.width - (isVerticalRange ? mountainRangeThickness : mountainRangeLength)));
        let mountainStartY = Math.floor(Math.random() * (this.height - (isVerticalRange ? mountainRangeLength : mountainRangeThickness)));

        for (let i = 0; i < (isVerticalRange ? mountainRangeLength : mountainRangeThickness); i++) { // Iterate along thickness
            for (let j = 0; j < (isVerticalRange ? mountainRangeThickness : mountainRangeLength); j++) { // Iterate along length
                const currentX = mountainStartX + (isVerticalRange ? j : i);
                const currentY = mountainStartY + (isVerticalRange ? i : j);
                if (Math.random() > 0.25) { // 75% chance to be mountain within the defined block
                    this.setTerrain(currentX, currentY, 'mountain');
                } else if (Math.random() > 0.5) { // Some bordering tiles might be forest
                     this.setTerrain(currentX, currentY, 'forest');
                }
            }
        }

        // Create a large forest area
        const forestSizeRatio = Math.random() * 0.2 + 0.25; // 25-45% of map area for forest
        const numForestPatches = Math.floor(Math.random() * 3) + 2; // 2-4 patches to form the forest area

        for (let p = 0; p < numForestPatches; p++) {
            const patchSizeX = Math.floor(this.width * (Math.random() * 0.15 + 0.1)); // 10-25% width
            const patchSizeY = Math.floor(this.height * (Math.random() * 0.15 + 0.1));
            const forestStartX = Math.floor(Math.random() * (this.width - patchSizeX));
            const forestStartY = Math.floor(Math.random() * (this.height - patchSizeY));

            for (let y = forestStartY; y < forestStartY + patchSizeY; y++) {
                for (let x = forestStartX; x < forestStartX + patchSizeX; x++) {
                    const tile = this.getTile(x, y);
                    if (tile && tile.terrainType !== 'mountain' && tile.terrainType !== 'water' && Math.random() > 0.15) {
                        this.setTerrain(x, y, 'forest');
                    }
                }
            }
        }

        // Create a desert area
        const desertSizeRatio = Math.random() * 0.15 + 0.2; // 20-35% of map area
        const desertPatchSizeX = Math.floor(this.width * (Math.random() * 0.2 + 0.2)); // 20-40% width
        const desertPatchSizeY = Math.floor(this.height * (Math.random() * 0.2 + 0.2));
        let desertStartX, desertStartY;
        let attempts = 0;
        do { // Try to place desert not directly on a dense forest/mountain area
            desertStartX = Math.floor(Math.random() * (this.width - desertPatchSizeX));
            desertStartY = Math.floor(Math.random() * (this.height - desertPatchSizeY));
            attempts++;
        } while (this.getTile(desertStartX + desertPatchSizeX / 2, desertStartY + desertPatchSizeY / 2)?.terrainType === 'mountain' && attempts < 10);

        for (let y = desertStartY; y < desertStartY + desertPatchSizeY; y++) {
            for (let x = desertStartX; x < desertStartX + desertPatchSizeX; x++) {
                const tile = this.getTile(x, y);
                if (tile && tile.terrainType === 'grassland' && Math.random() > 0.2) {
                    this.setTerrain(x, y, 'desert');
                } else if (tile && tile.terrainType === 'forest' && Math.random() > 0.8) { // Rarely turn edge of forest to desert
                    this.setTerrain(x, y, 'desert');
                }
            }
        }

        // Add some water bodies (lakes/rivers)
        const numWaterBodies = Math.floor((this.width * this.height) / (Math.random() * 50 + 50)) + 1; // e.g., 1-3 for 10x10
        for (let i = 0; i < numWaterBodies; i++) {
            const waterStartX = Math.floor(Math.random() * this.width);
            const waterStartY = Math.floor(Math.random() * this.height);
            const waterSizeBase = Math.floor(Math.random() * 2) + 1; // 1 to 2 base size
            const isRiverLike = Math.random() > 0.5;
            const waterLength = isRiverLike ? Math.floor(Math.random() * (this.height/3)) + 2 : waterSizeBase;
            const waterWidth = isRiverLike ? waterSizeBase : Math.floor(Math.random() * 2) + waterSizeBase;


            for (let wy = waterStartY; wy < waterStartY + waterLength; wy++) {
                for (let wx = waterStartX; wx < waterStartX + waterWidth; wx++) {
                    if (Math.random() > 0.3) { // 70% chance to be water in the patch
                        const tile = this.getTile(wx, wy);
                        if (tile && tile.terrainType !== 'mountain') { // Avoid placing directly on mountains
                            this.setTerrain(wx, wy, 'water');
                        }
                    }
                }
            }
        }
        console.log("More structured map features generated using the new algorithm.");
    }
}

// Export the classes for use in other modules
export { MapTile, GameMap };
