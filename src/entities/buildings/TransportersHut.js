// src/entities/buildings/TransportersHut.js
import * as THREE from 'three';
import Building from '../Building.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class TransportersHut extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry, resourceFlowManager = null) {
        super(buildingDataEntry.key, gridX, gridZ, gameMap, buildingDataEntry, resourceFlowManager); // Use buildingDataEntry.key
        this.model = this.createModel();
    }

    createModel() {
        const modelGroup = new THREE.Group();
        modelGroup.name = 'TransportersHutModel';

        // Simple model as no specific description in buildings.md
        // Key Colors: Light Brown, Dark Brown (generic hut colors)
        const lightBrown = 0xD2B48C; // Tan
        const darkBrown = 0x5C4033;  // Dark Brown

        // Hut: Small, simple cuboid (color: Light Brown).
        const hutWidth = TILE_SIZE * 0.6;
        const hutHeight = TILE_SIZE * 0.45;
        const hutDepth = TILE_SIZE * 0.55;
        const hutGeometry = new THREE.BoxGeometry(hutWidth, hutHeight, hutDepth);
        const hutMaterial = new THREE.MeshStandardMaterial({ color: lightBrown });
        const hutMesh = new THREE.Mesh(hutGeometry, hutMaterial);
        hutMesh.position.y = hutHeight / 2; // Adjust Y to place base at Y=0 of group
        modelGroup.add(hutMesh);

        // Roof: Simple flat or slightly sloped cuboid roof (color: Dark Brown).
        const roofWidth = hutWidth * 1.1;
        const roofHeight = TILE_SIZE * 0.15;
        const roofDepth = hutDepth * 1.1;
        const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
        const roofMaterial = new THREE.MeshStandardMaterial({ color: darkBrown });
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        roofMesh.position.y = hutHeight + roofHeight / 2; // Position on top of the hut (base of hut is now at Y=0 of group)
        modelGroup.add(roofMesh);

        return modelGroup;
    }

    update(deltaTime, currentTime) {
        super.update(deltaTime, currentTime);
        // Transporter's Hut is typically a job provider and drop-off/pickup point.
        // It doesn't actively produce resources itself.
        // Food consumption for workers, if any, would be handled by _checkAndConsumeFood
        // if its data in buildingData.js is configured for it.
        if (this.isConstructed && this.workers.length > 0) {
            this._checkAndConsumeFood(currentTime);
        }
    }
}

export default TransportersHut;
