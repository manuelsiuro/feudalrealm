/**
 * @fileoverview Handles the 3D rendering of the game map and its entities.
 */
import * as THREE from 'three';
import { GameMap } from './map.js';
import * as Terrains from '../entities/terrains.js';
// Import building and resource creators if needed for direct rendering (though often entities manage their own meshes)
// import * as Buildings from '../entities/buildings.js';
// import * as Resources from '../entities/resources.js';

const TILE_SIZE = 10; // Visual size of a tile in 3D space
const TILE_GAP = 0.1; // Small gap between tiles to distinguish them

class MapRenderer {
    /**
     * @param {GameMap} gameMap - The game map data.
     * @param {THREE.Scene} scene - The Three.js scene to render into.
     */
    constructor(gameMap, scene) {
        this.gameMap = gameMap;
        this.scene = scene;
        this.tileMeshes = new Map(); // To store and manage tile meshes {`x,y`: THREE.Mesh}
        this.buildingMeshes = new Map(); // To store and manage building meshes {`x,y`: THREE.Group}
        this.resourceMeshes = new Map(); // To store and manage resource meshes {`x,y`: THREE.Group}

        this.terrainCreators = {
            'grassland': () => Terrains.createGrassland({ width: TILE_SIZE, depth: TILE_SIZE }),
            'forest': () => Terrains.createForest({ width: TILE_SIZE, depth: TILE_SIZE }, 0.5), // density 0.5
            'mountain': () => Terrains.createMountain({ width: TILE_SIZE, depth: TILE_SIZE, height: TILE_SIZE * 0.8 }),
            'water': () => Terrains.createWater({ width: TILE_SIZE, depth: TILE_SIZE }, 'lake'),
            'desert': () => Terrains.createDesert({ width: TILE_SIZE, depth: TILE_SIZE }),
            // Add more terrain types as needed
        };
    }

    /**
     * Renders the entire map initially.
     */
    renderMap() {
        console.log("Rendering map...");
        for (let y = 0; y < this.gameMap.height; y++) {
            for (let x = 0; x < this.gameMap.width; x++) {
                const tile = this.gameMap.getTile(x, y);
                if (tile) {
                    this.renderTile(tile);
                    // Later, add rendering for buildings and resources on the tile
                }
            }
        }
        console.log("Map rendering complete.");
    }

    /**
     * Renders a single map tile, including its terrain.
     * @param {MapTile} tile - The map tile to render.
     */
    renderTile(tile) {
        const tileKey = `${tile.x},${tile.y}`;

        // Remove existing mesh if any (for updates)
        if (this.tileMeshes.has(tileKey)) {
            this.scene.remove(this.tileMeshes.get(tileKey));
            this.tileMeshes.delete(tileKey);
        }

        const terrainCreator = this.terrainCreators[tile.terrainType] || this.terrainCreators['grassland'];
        const terrainMesh = terrainCreator();

        // Calculate position based on tile coordinates and TILE_SIZE
        // Centering the map around (0,0,0) in the scene
        const posX = (tile.x - (this.gameMap.width -1) / 2) * (TILE_SIZE + TILE_GAP);
        const posZ = (tile.y - (this.gameMap.height-1) / 2) * (TILE_SIZE + TILE_GAP);
        
        terrainMesh.position.set(posX, 0, posZ); // Assuming Y=0 is the ground plane for terrains

        terrainMesh.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        this.scene.add(terrainMesh);
        this.tileMeshes.set(tileKey, terrainMesh);
    }

    /**
     * Updates the visual representation of a tile if its terrain type changes.
     * @param {number} x - The x-coordinate of the tile.
     * @param {number} y - The y-coordinate of the tile.
     */
    updateTileVisual(x, y) {
        const tile = this.gameMap.getTile(x, y);
        if (tile) {
            this.renderTile(tile);
            // Potentially update building/resource visuals if they depend on terrain
        }
    }

    // TODO: Add methods for rendering/updating buildings and resources on tiles
    // renderBuilding(tile, buildingData) { ... }
    // removeBuildingVisual(x,y) { ... }
}

export { MapRenderer, TILE_SIZE, TILE_GAP };
