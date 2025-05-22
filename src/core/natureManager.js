import * as THREE from 'three';
import * as Resources from '../entities/resources.js';
import { TILE_SIZE, TERRAIN_TYPES } from '../config/mapConstants.js';
import { RESOURCE_TYPES } from '../config/resourceTypes.js';
import { BUILDING_DATA } from '../config/buildingData.js'; // For saplingGrowthTime

export class NatureManager {
    constructor(mapManager, scene) {
        this.mapManager = mapManager; // For accessing grid, rng
        this.scene = scene; // For adding/removing meshes
        this.rng = mapManager.rng; // Convenience
        this.resourceNodesGroup = new THREE.Group();
        this.resourceNodesGroup.name = 'ResourceNodes';

        // These will be called by the Game class after NatureManager is instantiated
        // this._placeInitialResources();
        // this._createInitialResourceNodeMeshes();
    }

    initializeNaturalResources() {
        this._placeInitialResources();
        this._createInitialResourceNodeMeshes();
    }

    _placeInitialResources() {
        console.log("NatureManager: Placing initial resources...");
        const RESOURCE_NODES = {
            TREE: { type: RESOURCE_TYPES.WOOD, terrains: [TERRAIN_TYPES.FOREST], chance: 0.4, amount: () => this.rng.nextInt(50, 150), generator: Resources.RESOURCE_GENERATORS.wood, scale: {min: 0.8, max: 1.2} },
            ROCK: { type: RESOURCE_TYPES.STONE, terrains: [TERRAIN_TYPES.MOUNTAIN], chance: 0.3, amount: () => this.rng.nextInt(100, 250), generator: Resources.RESOURCE_GENERATORS.stone, scale: {min: 0.7, max: 1.1} },
            GOLD_VEIN: { type: RESOURCE_TYPES.GOLD_ORE, terrains: [TERRAIN_TYPES.MOUNTAIN], chance: 0.15, amount: () => this.rng.nextInt(20, 80), generator: Resources.RESOURCE_GENERATORS.gold_ore, scale: {min: 0.9, max: 1.1} },
            FERTILE_SOIL: { type: RESOURCE_TYPES.FERTILE_LAND, terrains: [TERRAIN_TYPES.GRASSLAND], chance: 0.2, amount: () => 1, generator: Resources.RESOURCE_GENERATORS.fertile_land, scale: {min: TILE_SIZE * 0.3, max: TILE_SIZE * 0.4} },
            SAPLING: { type: RESOURCE_TYPES.SAPLING, terrains: [TERRAIN_TYPES.GRASSLAND, TERRAIN_TYPES.FOREST], chance: 0, amount: () => 1, generator: Resources.RESOURCE_GENERATORS.sapling, scale: {min: 0.2, max: 0.3}, growthStartTime: null }, // Planted, not natural
        };
        this.RESOURCE_NODES_CONFIG = RESOURCE_NODES; // Store for later use if needed

        for (let r = 0; r < this.mapManager.height; r++) {
            for (let c = 0; c < this.mapManager.width; c++) {
                const tile = this.mapManager.grid[r][c];
                if (tile.resource) continue;

                for (const resourceKey in RESOURCE_NODES) {
                    const resDef = RESOURCE_NODES[resourceKey];
                    if (resDef.terrains.includes(tile.terrainType)) {
                        if (this.rng.nextFloat() < resDef.chance) {
                            tile.resource = {
                                type: resDef.type,
                                amount: resDef.amount(),
                                generator: resDef.generator,
                                scaleOptions: resDef.scale,
                                visualNode: null
                            };
                            if (resDef.type === RESOURCE_TYPES.SAPLING) {
                                tile.resource.growthStartTime = resDef.growthStartTime;
                            }
                            break;
                        }
                    }
                }
            }
        }
        console.log("NatureManager: Initial resource placement complete.");
    }

    _createInitialResourceNodeMeshes() {
        console.log("NatureManager: Creating initial resource node meshes...");
        while(this.resourceNodesGroup.children.length > 0){
            const child = this.resourceNodesGroup.children[0];
            this.resourceNodesGroup.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }

        for (let r = 0; r < this.mapManager.height; r++) {
            for (let c = 0; c < this.mapManager.width; c++) {
                const tile = this.mapManager.grid[r][c];
                if (tile.resource && tile.resource.generator) {
                    this._createSingleResourceNodeMesh(tile);
                }
            }
        }
        console.log("NatureManager: Initial resource node mesh creation complete.");
    }

    _createSingleResourceNodeMesh(tile) {
        if (!tile || !tile.resource || !tile.resource.generator) {
            console.warn("NatureManager: Attempted to create mesh for invalid tile or resource.", tile);
            return null;
        }

        let resourceVisual;
        let randomScale = 1;
        if (tile.resource.scaleOptions) {
            const {min, max} = tile.resource.scaleOptions;
            randomScale = this.rng.nextFloat() * (max - min) + min;
        }

        let options = {};
        if (tile.resource.type === RESOURCE_TYPES.FERTILE_LAND) {
            options.radius = randomScale;
        } else if (tile.resource.type === RESOURCE_TYPES.WOOD) {
            options.height = TILE_SIZE * 0.4 * randomScale;
            options.radius = TILE_SIZE * 0.08 * randomScale;
            options.leavesHeight = TILE_SIZE * 0.3 * randomScale;
            options.leavesRadius = TILE_SIZE * 0.16 * randomScale;
        } else if (tile.resource.type === RESOURCE_TYPES.SAPLING) {
            options.height = TILE_SIZE * 0.15 * randomScale;
            options.radius = TILE_SIZE * 0.05 * randomScale;
            options.color = 0x6B8E23; // Young green
        } else { // stone, gold_ore etc.
            options.size = TILE_SIZE * 0.15 * randomScale;
            if (tile.resource.type === RESOURCE_TYPES.GOLD_ORE) {
                options.speckCount = this.rng.nextInt(3, 7);
            }
        }

        try {
            resourceVisual = tile.resource.generator(options);
        } catch (e) {
            console.error(`NatureManager: Error generating resource visual for type ${tile.resource.type} with options ${JSON.stringify(options)}:`, e);
            return null;
        }

        const offsetX = (this.rng.nextFloat() - 0.5) * TILE_SIZE * 0.3;
        const offsetZ = (this.rng.nextFloat() - 0.5) * TILE_SIZE * 0.3;

        resourceVisual.position.set(
            (tile.x - (this.mapManager.width - 1) / 2) * TILE_SIZE + offsetX,
            0,
            (tile.y - (this.mapManager.height - 1) / 2) * TILE_SIZE + offsetZ
        );

        resourceVisual.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        tile.resource.visualNode = resourceVisual;
        this.resourceNodesGroup.add(resourceVisual);
        return resourceVisual;
    }

    removeResourceVisual(tile) {
        if (tile && tile.resource && tile.resource.visualNode) {
            const visualNode = tile.resource.visualNode;
            this.resourceNodesGroup.remove(visualNode);

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
            tile.resource.visualNode = null;
            // console.log(`NatureManager: Removed visual for resource at (${tile.x}, ${tile.y})`);
        }
    }

    addSapling(tileX, tileY) {
        const tile = this.mapManager.getTile(tileX, tileY);
        if (!tile) {
            console.error(`NatureManager: Cannot add sapling. Tile (${tileX}, ${tileY}) not found.`);
            return false;
        }
        if (tile.resource) {
            console.warn(`NatureManager: Tile (${tileX}, ${tileY}) already has a resource: ${tile.resource.type}. Cannot plant sapling.`);
            return false;
        }
        if (tile.terrainType !== TERRAIN_TYPES.GRASSLAND && tile.terrainType !== TERRAIN_TYPES.FOREST) {
             console.warn(`NatureManager: Tile (${tileX}, ${tileY}) is not GRASSLAND or FOREST. Type: ${tile.terrainType}. Cannot plant sapling here.`);
             return false;
        }

        if (!Resources.RESOURCE_GENERATORS.sapling) {
            console.error("NatureManager: Resources.RESOURCE_GENERATORS.sapling is not defined! Ensure it's added to entities/resources.js and exported in RESOURCE_GENERATORS. Cannot create sapling.");
            return false;
        }
        
        const saplingDef = this.RESOURCE_NODES_CONFIG.SAPLING;
        tile.resource = {
            type: RESOURCE_TYPES.SAPLING,
            amount: saplingDef.amount(),
            generator: saplingDef.generator,
            scaleOptions: saplingDef.scale,
            growthStartTime: Date.now(),
            visualNode: null
        };

        this._createSingleResourceNodeMesh(tile);
        console.log(`NatureManager: Added SAPLING at (${tileX}, ${tileY}). Growth started at ${tile.resource.growthStartTime}`);
        return true;
    }

    update(deltaTime) {
        const saplingGrowthTime = BUILDING_DATA.FORESTERS_HUT.saplingGrowthTime;

        for (let r = 0; r < this.mapManager.height; r++) {
            for (let c = 0; c < this.mapManager.width; c++) {
                const tile = this.mapManager.grid[r][c];
                if (tile.resource && tile.resource.type === RESOURCE_TYPES.SAPLING && tile.resource.growthStartTime) {
                    if (Date.now() - tile.resource.growthStartTime >= saplingGrowthTime) {
                        // console.log(`NatureManager: Sapling at (${c},${r}) is mature. Growing into a tree.`);
                        this.removeResourceVisual(tile);

                        tile.resource = {
                            type: RESOURCE_TYPES.WOOD,
                            amount: this.RESOURCE_NODES_CONFIG.TREE.amount(),
                            generator: Resources.RESOURCE_GENERATORS.wood,
                            scaleOptions: this.RESOURCE_NODES_CONFIG.TREE.scale,
                            visualNode: null
                        };
                        this._createSingleResourceNodeMesh(tile);
                        console.log(`NatureManager: Sapling at (${c},${r}) grew into a TREE.`);
                    }
                }
            }
        }
    }

    addToScene(scene) {
        scene.add(this.resourceNodesGroup);
    }
}
