import * as THREE from 'three';

// Helper function to create a mesh (can be moved to a shared utils.js later)
function createMesh(geometry, color, name = '') {
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    return mesh;
}

export const TILE_SIZE = 1; // Each tile is 1x1 world units

export const TERRAIN_TYPES = {
    GRASSLAND: 'grassland',
    FOREST: 'forest',
    MOUNTAIN: 'mountain',
    WATER: 'water',
    DESERT: 'desert',
};

export const TERRAIN_COLORS = {
    [TERRAIN_TYPES.GRASSLAND]: 0x32CD32, // LimeGreen
    [TERRAIN_TYPES.FOREST]: 0x228B22,    // ForestGreen
    [TERRAIN_TYPES.MOUNTAIN]: 0x808080,   // Grey
    [TERRAIN_TYPES.WATER]: 0x1E90FF,     // DodgerBlue
    [TERRAIN_TYPES.DESERT]: 0xF4A460,    // SandyBrown
};

export class GameMap {
    constructor(width, height, seed = null) {
        this.width = width; // Number of tiles
        this.height = height; // Number of tiles
        this.seed = seed || Math.random(); // Basic seeding, can be improved
        this.grid = []; // 2D array for terrain data {x, y, terrainType}
        this.tileMeshes = new THREE.Group(); // Group to hold all tile meshes
        this.tileMeshes.name = 'MapTiles';

        this._initializeGrid();
        this._generateTerrain(); // Basic generation for now
        this._createTileMeshes();
    }

    _initializeGrid() {
        for (let r = 0; r < this.height; r++) { // r for row (map y)
            this.grid[r] = [];
            for (let c = 0; c < this.width; c++) { // c for column (map x)
                this.grid[r][c] = {
                    x: c, // Map grid column
                    y: r, // Map grid row
                    terrainType: TERRAIN_TYPES.GRASSLAND, // Default
                };
            }
        }
    }

    _generateTerrain() {
        // Simple random patches for now - replace with seeded noise later
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                // Basic seeded random (not a great PRNG, but for predictability with seed)
                const val_c = (this.seed + c * 0.1123 + r * 0.0587);
                const val_r = (this.seed + r * 0.1097 + c * 0.0613);
                // Ensure positive random value between 0 and 1
                const randomVal = Math.abs((Math.sin(val_c) * Math.cos(val_r) * 10000) % 1);

                if (randomVal < 0.15) {
                    this.grid[r][c].terrainType = TERRAIN_TYPES.FOREST;
                } else if (randomVal < 0.25) {
                    this.grid[r][c].terrainType = TERRAIN_TYPES.MOUNTAIN;
                } else if (randomVal < 0.30) {
                    this.grid[r][c].terrainType = TERRAIN_TYPES.WATER;
                } else if (randomVal < 0.35 && this.width > 5 && this.height > 5) {
                    this.grid[r][c].terrainType = TERRAIN_TYPES.DESERT;
                } else {
                    this.grid[r][c].terrainType = TERRAIN_TYPES.GRASSLAND;
                }
            }
        }
    }

    _createTileMeshes() {
        const tileGeometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
        // tileGeometry.rotateX(-Math.PI / 2); // Do this to the mesh instance

        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                const tileData = this.grid[r][c];
                const color = TERRAIN_COLORS[tileData.terrainType] || 0xffffff; // Default to white if type unknown
                
                const tileMesh = createMesh(tileGeometry.clone(), color, `Tile_${c}_${r}`);
                
                tileMesh.position.set(
                    (c - (this.width - 1) / 2) * TILE_SIZE,
                    0, 
                    (r - (this.height - 1) / 2) * TILE_SIZE
                );
                tileMesh.rotation.x = -Math.PI / 2; // Lay flat
                this.tileMeshes.add(tileMesh);
            }
        }
    }

    getTile(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.grid[y][x];
        }
        return null; // Out of bounds
    }

    addToScene(scene) { 
        scene.add(this.tileMeshes);
    }

    getWrappedCoordinates(x, y) {
        const wrappedX = (x % this.width + this.width) % this.width;
        const wrappedY = (y % this.height + this.height) % this.height;
        return { x: wrappedX, y: wrappedY };
    }
}
//