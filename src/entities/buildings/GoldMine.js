import * as THREE from 'three';
import Mine from './Mine.js'; // Import the base Mine class
import { TILE_SIZE } from '../../config/mapConstants.js'; // TILE_SIZE might be needed for custom indicator

class GoldMine extends Mine {
    constructor(gridX, gridZ, gameMap, buildingDataEntry, resourceFlowManager = null) {
        const oreColor = 0xFFFF00; // Yellow for Gold
        super(buildingDataEntry.key, gridX, gridZ, gameMap, buildingDataEntry, oreColor, resourceFlowManager);
        // Model is created by the base Mine class constructor
    }

    // Override to create a sphere indicator for gold
    createOreIndicatorModel(color) {
        const indicatorRadius = TILE_SIZE * 0.1; // Slightly smaller than a cube of 0.15 size
        const geometry = new THREE.SphereGeometry(indicatorRadius, 16, 16);
        const material = new THREE.MeshStandardMaterial({ color: color });
        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }
}

export default GoldMine;
