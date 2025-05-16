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
     * Basic map generation logic.
     * This will be expanded significantly in future steps.
     * For now, it might create a few patches of different terrain.
     */
    generateMapFeatures() {
        // Example: Add a small forest
        for (let i = 0; i < 5; i++) {
            const randX = Math.floor(Math.random() * this.width);
            const randY = Math.floor(Math.random() * this.height);
            this.setTerrain(randX, randY, 'forest');
        }
        // Example: Add a small water body
        const waterX = Math.floor(this.width / 2);
        const waterY = Math.floor(this.height / 2);
        this.setTerrain(waterX, waterY, 'water');
        this.setTerrain(waterX + 1, waterY, 'water');
        this.setTerrain(waterX, waterY + 1, 'water');

        console.log("Basic map features generated.");
    }
}

// Export the classes for use in other modules
export { MapTile, GameMap };
