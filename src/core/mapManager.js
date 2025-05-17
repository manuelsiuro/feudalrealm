import * as THREE from 'three';
import * as Terrains from '../entities/terrains.js'; // Import detailed terrain generators
import * as Resources from '../entities/resources.js'; // Import resource generators
import { findPathAStar } from '../utils/pathfinding.js'; // Import A* pathfinding
import { TILE_SIZE, TERRAIN_TYPES, TERRAIN_COLORS } from '../config/mapConstants.js';

// Helper function to create a mesh (can be moved to a shared utils.js later)
function createMesh(geometry, color, name = '') {
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    return mesh;
}

// Mapping from MapManager's TERRAIN_TYPES to entities/terrains.js generator keys
const TERRAIN_GENERATOR_MAP = {
    [TERRAIN_TYPES.GRASSLAND]: Terrains.TERRAIN_GENERATORS.Grassland,
    [TERRAIN_TYPES.FOREST]: Terrains.TERRAIN_GENERATORS.Forest,
    [TERRAIN_TYPES.MOUNTAIN]: Terrains.TERRAIN_GENERATORS.Mountain,
    [TERRAIN_TYPES.WATER]: Terrains.TERRAIN_GENERATORS.Water,
    [TERRAIN_TYPES.DESERT]: Terrains.TERRAIN_GENERATORS.Desert,
};

// Simple Seeded Random Number Generator (LCG)
class SeededRandom {
    constructor(seed) {
        this.seed = seed % 2147483647;
        if (this.seed <= 0) this.seed += 2147483646;
    }

    next() {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }

    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    nextFloat() {
        return this.next();
    }
}

export class GameMap {
    constructor(width, height, seed = null) {
        this.width = width; // Number of tiles
        this.height = height; // Number of tiles
        this.seed = seed || Date.now(); // Use current time if no seed is provided
        this.rng = new SeededRandom(this.seed);
        this.grid = []; // 2D array for terrain data {x, y, terrainType, resource}
        this.tileMeshes = new THREE.Group(); // Group to hold all tile meshes
        this.tileMeshes.name = 'MapTiles';
        this.resourceNodesGroup = new THREE.Group(); // Group for resource node models
        this.resourceNodesGroup.name = 'ResourceNodes';

        // Expose TERRAIN_TYPES for pathfinding if not already globally available to it
        // This might not be strictly necessary if pathfinding.js imports it directly
        // but ensures it's available via the gameMap instance passed to findPathAStar.
        this.TERRAIN_TYPES = TERRAIN_TYPES; 

        this._initializeGrid();
        this._generateTerrain();
        this._placeResources(); 
        this._createTileMeshes();
        this._createResourceNodeMeshes(); // New method to create resource visuals
        console.log(`GameMap generated with seed: ${this.seed}`);
    }

    _initializeGrid() {
        for (let r = 0; r < this.height; r++) { // r for row (map y)
            this.grid[r] = [];
            for (let c = 0; c < this.width; c++) { // c for column (map x)
                this.grid[r][c] = {
                    x: c, // Map grid column
                    y: r, // Map grid row
                    terrainType: TERRAIN_TYPES.GRASSLAND, // Default
                    resource: null, // To be populated by _placeResources
                };
            }
        }
    }

    _generateTerrain() {
        console.log("Generating terrain using advanced algorithm...");

        // Initialize all to grassland
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                this.grid[r][c].terrainType = TERRAIN_TYPES.GRASSLAND;
            }
        }

        // Create a mountain range
        const mountainRangeLength = Math.floor(this.width * (this.rng.nextFloat() * 0.3 + 0.4));
        const mountainRangeThickness = Math.floor(this.width * (this.rng.nextFloat() * 0.1 + 0.15));
        const isVerticalRange = this.rng.nextFloat() > 0.5;

        let mountainStartX = this.rng.nextInt(0, this.width - (isVerticalRange ? mountainRangeThickness : mountainRangeLength));
        let mountainStartY = this.rng.nextInt(0, this.height - (isVerticalRange ? mountainRangeLength : mountainRangeThickness));
        
        // Ensure start positions are within bounds if calculated values are too large
        mountainStartX = Math.max(0, Math.min(mountainStartX, this.width - (isVerticalRange ? mountainRangeThickness : mountainRangeLength)));
        mountainStartY = Math.max(0, Math.min(mountainStartY, this.height - (isVerticalRange ? mountainRangeLength : mountainRangeThickness)));


        for (let i = 0; i < (isVerticalRange ? mountainRangeLength : mountainRangeThickness); i++) {
            for (let j = 0; j < (isVerticalRange ? mountainRangeThickness : mountainRangeLength); j++) {
                const currentX = mountainStartX + (isVerticalRange ? j : i);
                const currentY = mountainStartY + (isVerticalRange ? i : j);
                
                if (currentX >= 0 && currentX < this.width && currentY >= 0 && currentY < this.height) {
                    if (this.rng.nextFloat() > 0.25) {
                        this.grid[currentY][currentX].terrainType = TERRAIN_TYPES.MOUNTAIN;
                    } else if (this.rng.nextFloat() > 0.5) {
                        this.grid[currentY][currentX].terrainType = TERRAIN_TYPES.FOREST; // Some bordering tiles might be forest
                    }
                }
            }
        }

        // Create a large forest area
        const numForestPatches = this.rng.nextInt(2, 4);

        for (let p = 0; p < numForestPatches; p++) {
            const patchSizeX = Math.floor(this.width * (this.rng.nextFloat() * 0.15 + 0.1));
            const patchSizeY = Math.floor(this.height * (this.rng.nextFloat() * 0.15 + 0.1));
            const forestStartX = this.rng.nextInt(0, this.width - patchSizeX);
            const forestStartY = this.rng.nextInt(0, this.height - patchSizeY);

            for (let r = forestStartY; r < forestStartY + patchSizeY; r++) {
                for (let c = forestStartX; c < forestStartX + patchSizeX; c++) {
                    if (c >= 0 && c < this.width && r >= 0 && r < this.height) {
                        const tile = this.grid[r][c];
                        if (tile.terrainType !== TERRAIN_TYPES.MOUNTAIN && tile.terrainType !== TERRAIN_TYPES.WATER && this.rng.nextFloat() > 0.15) {
                            tile.terrainType = TERRAIN_TYPES.FOREST;
                        }
                    }
                }
            }
        }

        // Create a desert area
        const desertPatchSizeX = Math.floor(this.width * (this.rng.nextFloat() * 0.2 + 0.2));
        const desertPatchSizeY = Math.floor(this.height * (this.rng.nextFloat() * 0.2 + 0.2));
        let desertStartX, desertStartY;
        let attempts = 0;
        do {
            desertStartX = this.rng.nextInt(0, this.width - desertPatchSizeX);
            desertStartY = this.rng.nextInt(0, this.height - desertPatchSizeY);
            attempts++;
            if (attempts > 10) break; // Avoid infinite loop if map is too small or constrained
        } while (
            desertStartX + desertPatchSizeX / 2 < this.width && desertStartY + desertPatchSizeY / 2 < this.height && // check bounds
            desertStartX + desertPatchSizeX / 2 >= 0 && desertStartY + desertPatchSizeY / 2 >= 0 &&
            this.grid[Math.floor(desertStartY + desertPatchSizeY / 2)][Math.floor(desertStartX + desertPatchSizeX / 2)]?.terrainType === TERRAIN_TYPES.MOUNTAIN
        );


        for (let r = desertStartY; r < desertStartY + desertPatchSizeY; r++) {
            for (let c = desertStartX; c < desertStartX + desertPatchSizeX; c++) {
                 if (c >= 0 && c < this.width && r >= 0 && r < this.height) {
                    const tile = this.grid[r][c];
                    if (tile.terrainType === TERRAIN_TYPES.GRASSLAND && this.rng.nextFloat() > 0.2) {
                        tile.terrainType = TERRAIN_TYPES.DESERT;
                    } else if (tile.terrainType === TERRAIN_TYPES.FOREST && this.rng.nextFloat() > 0.8) {
                        tile.terrainType = TERRAIN_TYPES.DESERT;
                    }
                }
            }
        }

        // Add some water bodies
        const numWaterBodies = Math.max(1, Math.floor((this.width * this.height) / (this.rng.nextFloat() * 50 + 50)) + 1);
        for (let i = 0; i < numWaterBodies; i++) {
            const waterStartX = this.rng.nextInt(0, this.width -1);
            const waterStartY = this.rng.nextInt(0, this.height -1);
            const waterSizeBase = this.rng.nextInt(1, 2);
            const isRiverLike = this.rng.nextFloat() > 0.5;
            const waterLength = isRiverLike ? this.rng.nextInt(2, Math.floor(this.height / 3)) : waterSizeBase;
            const waterWidth = isRiverLike ? waterSizeBase : this.rng.nextInt(waterSizeBase, waterSizeBase + 1);

            for (let r = waterStartY; r < waterStartY + waterLength; r++) {
                for (let c = waterStartX; c < waterStartX + waterWidth; c++) {
                     if (c >= 0 && c < this.width && r >= 0 && r < this.height) {
                        if (this.rng.nextFloat() > 0.3) {
                            const tile = this.grid[r][c];
                            if (tile.terrainType !== TERRAIN_TYPES.MOUNTAIN) {
                                tile.terrainType = TERRAIN_TYPES.WATER;
                            }
                        }
                    }
                }
            }
        }
        console.log("Advanced terrain generation complete.");
    }

    _placeResources() {
        console.log("Placing resources...");
        const RESOURCE_NODES = {
            TREE: { type: 'wood', terrains: [TERRAIN_TYPES.FOREST], chance: 0.4, amount: () => this.rng.nextInt(50, 150), generator: Resources.RESOURCE_GENERATORS.wood, scale: {min: 0.8, max: 1.2} },
            ROCK: { type: 'stone', terrains: [TERRAIN_TYPES.MOUNTAIN], chance: 0.3, amount: () => this.rng.nextInt(100, 250), generator: Resources.RESOURCE_GENERATORS.stone, scale: {min: 0.7, max: 1.1} },
            GOLD_VEIN: { type: 'gold_ore', terrains: [TERRAIN_TYPES.MOUNTAIN], chance: 0.15, amount: () => this.rng.nextInt(20, 80), generator: Resources.RESOURCE_GENERATORS.gold_ore, scale: {min: 0.9, max: 1.1} },
            FERTILE_SOIL: { type: 'fertile_land', terrains: [TERRAIN_TYPES.GRASSLAND], chance: 0.2, amount: () => 1, generator: Resources.RESOURCE_GENERATORS.fertile_land, scale: {min: TILE_SIZE * 0.3, max: TILE_SIZE * 0.4} }, // Scale radius for fertile land marker
        };

        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                const tile = this.grid[r][c];
                if (tile.resource) continue; // Skip if already has a resource (e.g. from specific generation step)

                for (const resourceKey in RESOURCE_NODES) {
                    const resDef = RESOURCE_NODES[resourceKey];
                    if (resDef.terrains.includes(tile.terrainType)) {
                        if (this.rng.nextFloat() < resDef.chance) {
                            tile.resource = { 
                                type: resDef.type, 
                                amount: resDef.amount(),
                                generator: resDef.generator,
                                scaleOptions: resDef.scale,
                                visualNode: null // Placeholder for potential 3D model of the resource node
                            };
                            // console.log(`Placed ${resDef.type} at (${c},${r}) on ${tile.terrainType}`);
                            break; // Place only one type of resource per tile for now
                        }
                    }
                }
            }
        }
        console.log("Resource placement complete.");
    }

    _createTileMeshes() {
        // Clear existing meshes if any (e.g., if re-generating map)
        while(this.tileMeshes.children.length > 0){
            this.tileMeshes.remove(this.tileMeshes.children[0]);
        }

        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                const tileData = this.grid[r][c];
                const generatorFunction = TERRAIN_GENERATOR_MAP[tileData.terrainType];
                let tileVisual;

                if (generatorFunction) {
                    // Define size for the terrain model based on TILE_SIZE
                    // Most terrain functions in terrains.js expect { width, depth, height (optional) }
                    const terrainSize = { width: TILE_SIZE, depth: TILE_SIZE };
                    if (tileData.terrainType === TERRAIN_TYPES.MOUNTAIN) {
                        terrainSize.height = TILE_SIZE * (Math.random() * 0.5 + 0.5); // Randomize mountain height a bit
                    }
                    // For forest, density can be passed, using a default for now
                    // For water, type can be passed, using a default for now
                    tileVisual = generatorFunction(terrainSize);
                    tileVisual.name = `Tile_${c}_${r}_${tileData.terrainType}`;
                } else {
                    // Fallback to simple colored plane if no generator is found (should not happen with current setup)
                    const tileGeometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
                    const color = TERRAIN_COLORS[tileData.terrainType] || 0xffffff;
                    tileVisual = createMesh(tileGeometry, color, `Tile_${c}_${r}_fallback`);
                    tileVisual.rotation.x = -Math.PI / 2; // Lay flat
                }

                tileVisual.position.set(
                    (c - (this.width - 1) / 2) * TILE_SIZE,
                    0, // Assuming terrain models are based at y=0
                    (r - (this.height - 1) / 2) * TILE_SIZE
                );
                
                // Ensure all parts of the detailed terrain model cast/receive shadows
                tileVisual.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                this.tileMeshes.add(tileVisual);
            }
        }
    }

    _createResourceNodeMeshes() {
        // Clear existing resource nodes if any
        while(this.resourceNodesGroup.children.length > 0){
            const child = this.resourceNodesGroup.children[0];
            this.resourceNodesGroup.remove(child);
            // If the child has geometry/material, dispose them to free GPU memory
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }

        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                const tileData = this.grid[r][c];
                if (tileData.resource && tileData.resource.generator) {
                    let resourceVisual;
                    let randomScale = 1;
                    if (tileData.resource.scaleOptions) {
                        const {min, max} = tileData.resource.scaleOptions;
                        randomScale = this.rng.nextFloat() * (max - min) + min;
                    }

                    let options = {}; 
                    if (tileData.resource.type === 'fertile_land') {
                        options.radius = randomScale; // Pass radius for fertile land
                    } else if (tileData.resource.type === 'wood') {
                        options.height = TILE_SIZE * 0.4 * randomScale;
                        options.radius = TILE_SIZE * 0.08 * randomScale;
                        options.leavesHeight = TILE_SIZE * 0.3 * randomScale;
                        options.leavesRadius = TILE_SIZE * 0.16 * randomScale;
                    } else {
                        // Ensure options.size is defined for stone, gold_ore, etc.
                        options.size = TILE_SIZE * 0.15 * randomScale; 
                        if (tileData.resource.type === 'gold_ore') {
                            options.speckCount = this.rng.nextInt(3, 7);
                        } else if (tileData.resource.type === 'stone') {
                            // Potentially add stone specific options if any, e.g. rock formations
                        }
                    }

                    resourceVisual = tileData.resource.generator(options);
                    
                    // Position the resource node on the tile
                    // Add slight random offset within the tile for natural look, but ensure it's on its tile
                    const offsetX = (this.rng.nextFloat() - 0.5) * TILE_SIZE * 0.3;
                    const offsetZ = (this.rng.nextFloat() - 0.5) * TILE_SIZE * 0.3;

                    resourceVisual.position.set(
                        (c - (this.width - 1) / 2) * TILE_SIZE + offsetX,
                        0, // Base of resource models should be at y=0
                        (r - (this.height - 1) / 2) * TILE_SIZE + offsetZ
                    );

                    // Ensure resource nodes also cast/receive shadows
                    resourceVisual.traverse(child => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    
                    tileData.resource.visualNode = resourceVisual; // Store reference
                    this.resourceNodesGroup.add(resourceVisual);
                }
            }
        }
    }

    // Add this new method to MapManager
    removeResourceVisual(tile) {
        if (tile && tile.resource && tile.resource.visualNode) {
            const visualNode = tile.resource.visualNode;
            this.resourceNodesGroup.remove(visualNode);
            
            // Dispose of geometry and material to free GPU memory
            visualNode.traverse(child => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });
            tile.resource.visualNode = null; // Clear the reference
            console.log(`Removed visual for depleted resource at (${tile.x}, ${tile.y})`);
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
        scene.add(this.resourceNodesGroup); // Add resource nodes to the scene
    }

    getWrappedCoordinates(x, y) {
        const wrappedX = (x % this.width + this.width) % this.width;
        const wrappedY = (y % this.height + this.height) % this.height;
        return { x: wrappedX, y: wrappedY };
    }

    // New method to find a path using A*
    findPath(startPos, endPos) {
        // startPos and endPos are expected to be {x, y} objects representing grid coordinates
        if (!this.grid || this.grid.length === 0) {
            console.error("Map grid not initialized. Cannot find path.");
            return null;
        }
        if (!startPos || !endPos) {
            console.error("Start or end position not provided for pathfinding.");
            return null;
        }
        
        // The findPathAStar function needs the gameMap instance itself to call getTile and TERRAIN_TYPES
        // Ensure TERRAIN_TYPES is accessible within isWalkable in pathfinding.js
        // One way is to pass `this` (the GameMap instance) which contains TERRAIN_TYPES.
        const path = findPathAStar(startPos, endPos, this, this.TERRAIN_TYPES);
        
        if (path) {
            // console.log(`Path found from (${startPos.x},${startPos.y}) to (${endPos.x},${endPos.y}):`, path);
        } else {
            // console.log(`No path found from (${startPos.x},${startPos.y}) to (${endPos.x},${endPos.y}).`);
        }
        return path;
    }
}