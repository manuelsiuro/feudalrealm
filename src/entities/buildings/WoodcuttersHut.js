// src/entities/buildings/WoodcuttersHut.js
import * as THREE from 'three';
import Building from '../Building.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

/**
 * @class WoodcuttersHut
 * @classdesc Represents a Woodcutter's Hut building, which produces wood.
 * @extends Building
 */
class WoodcuttersHut extends Building {
    /**
     * Creates an instance of WoodcuttersHut.
     * @param {number} gridX - The 0-indexed X grid coordinate.
     * @param {number} gridZ - The 0-indexed Z grid coordinate.
     * @param {GameMap} gameMap - Reference to the game's map instance.
     * @param {object} buildingDataEntry - Configuration data for this building type.
     */
    constructor(gridX, gridZ, gameMap, buildingDataEntry) {
        super(buildingDataEntry.key, gridX, gridZ, gameMap, buildingDataEntry); // Use buildingDataEntry.key
        this.model = this.createModel();
    }

    /**
     * Creates the 3D model for the Woodcutter's Hut.
     * Based on buildings.md: 
     * - Hut: Small, low cuboid (color: Brown).
     * - Roof: A slightly larger, shallow-angled cuboid placed on top, creating eaves (color: Dark Brown).
     * - Logs: A small stack of 2-3 short cylinders beside the hut (color: Light Brown).
     * @returns {THREE.Group} The Three.js model group.
     * @override
     */
    createModel() {
        const modelGroup = new THREE.Group();
        modelGroup.name = 'WoodcuttersHutModel';

        // Key Colors from buildings.md: Brown, Dark Brown, Light Brown.
        const brown = 0xA52A2A;
        const darkBrown = 0x5C4033; // SaddleBrown is a bit reddish, using a more standard dark brown
        const lightBrown = 0xD2B48C; // Tan / Light Brown

        // Hut: Small, low cuboid (color: Brown).
        const hutWidth = TILE_SIZE * 0.7;
        const hutHeight = TILE_SIZE * 0.5;
        const hutDepth = TILE_SIZE * 0.6;
        const hutGeometry = new THREE.BoxGeometry(hutWidth, hutHeight, hutDepth);
        const hutMaterial = new THREE.MeshStandardMaterial({ color: brown });
        const hutMesh = new THREE.Mesh(hutGeometry, hutMaterial);
        hutMesh.castShadow = true;
        hutMesh.receiveShadow = true;
        modelGroup.add(hutMesh);

        // Roof: A slightly larger, shallow-angled cuboid placed on top, creating eaves (color: Dark Brown).
        const roofWidth = hutWidth * 1.15; // Slightly larger for eaves
        const roofHeight = TILE_SIZE * 0.2; // Shallow-angled
        const roofDepth = hutDepth * 1.15; // Slightly larger for eaves
        const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
        const roofMaterial = new THREE.MeshStandardMaterial({ color: darkBrown });
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        roofMesh.position.y = hutHeight * 0.5 + roofHeight * 0.5; // Position on top of the hut
        roofMesh.castShadow = true;
        roofMesh.receiveShadow = true;
        modelGroup.add(roofMesh);

        // Logs: A small stack of 2-3 short cylinders beside the hut (color: Light Brown).
        const logRadius = TILE_SIZE * 0.08;
        const logLength = TILE_SIZE * 0.4;
        const logGeometry = new THREE.CylinderGeometry(logRadius, logRadius, logLength, 8);
        const logMaterial = new THREE.MeshStandardMaterial({ color: lightBrown });

        const logStackOffset = hutWidth * 0.5 + logRadius * 1.5; // Position beside the hut

        const log1 = new THREE.Mesh(logGeometry, logMaterial);
        log1.rotation.z = Math.PI / 2; // Lay logs on their side
        log1.position.set(logStackOffset, -hutHeight * 0.5 + logRadius, 0);
        log1.castShadow = true;
        log1.receiveShadow = true;
        modelGroup.add(log1);

        const log2 = new THREE.Mesh(logGeometry, logMaterial);
        log2.rotation.z = Math.PI / 2;
        log2.position.set(logStackOffset, -hutHeight * 0.5 + logRadius * 3, 0); // Stack on top
        log2.castShadow = true;
        log2.receiveShadow = true;
        modelGroup.add(log2);
        
        // Optional 3rd log
        const log3 = new THREE.Mesh(logGeometry, logMaterial);
        log3.rotation.z = Math.PI / 2;
        log3.position.set(logStackOffset + logRadius * 0.1, -hutHeight * 0.5 + logRadius * 2, logLength * 0.1); // Slightly offset
        log3.castShadow = true;
        log3.receiveShadow = true;
        // modelGroup.add(log3); // Uncomment to add a third log

        return modelGroup;
    }

    /**
     * Updates the Woodcutter's Hut logic each frame.
     * Handles food consumption for workers and wood production if conditions are met.
     * @param {number} deltaTime - Time since the last update.
     * @param {number} currentTime - The current game time (e.g., Date.now()).
     * @override
     */
    update(deltaTime, currentTime) {
        super.update(deltaTime, currentTime); // Base update (handles construction, etc.)

        if (!this.isConstructed || this.workers.length === 0) {
            return; // Needs to be built and have workers to produce
        }

        // Handle food consumption
        this._checkAndConsumeFood(currentTime); // Use helper from base class
        if (this.isHaltedByNoFood) {
            return; // Stop production if no food
        }

        // Simple direct production logic (already defined in this.info from buildingData)
        if (this.producesResource && this.productionIntervalMs > 0) {
            if (currentTime >= (this.lastProductionTime || 0) + this.productionIntervalMs) {
                if (this.hasSpaceFor(this.producesResource, 1)) { // Assuming produces 1 unit at a time
                    this.addResource(this.producesResource, 1);
                    this.lastProductionTime = currentTime;
                    // console.log(`${this.name} (${this.id}) produced 1 ${this.producesResource}. Workers: ${this.workers.length}`);
                } else {
                    // console.log(`${this.name} (${this.id}) cannot produce ${this.producesResource}, output full.`);
                }
            }
        }
    }
}

export default WoodcuttersHut;
