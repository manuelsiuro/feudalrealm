// src/entities/buildings/Blacksmith.js
import * as THREE from 'three';
import Building from '../Building.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class Blacksmith extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry, resourceFlowManager = null) {
        super(buildingDataEntry.key, gridX, gridZ, gameMap, buildingDataEntry, resourceFlowManager); // Use buildingDataEntry.key
        this.model = this.createModel();
        this.currentProcessingProgress = 0; // Initialize for this building type
    }

    createModel() {
        const group = new THREE.Group();

        const buildingColor = 0x8B4513; // Brown
        const roofColor = 0x808080; // Grey
        const anvilColor = 0x606060; // Darker Grey for anvil

        // Building: Medium cuboid
        const buildingWidth = TILE_SIZE * 0.9;
        const buildingHeight = TILE_SIZE * 0.7;
        const buildingDepth = TILE_SIZE * 0.7;
        const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
        const buildingMaterial = new THREE.MeshStandardMaterial({ color: buildingColor });
        const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
        buildingMesh.position.y = buildingHeight / 2; // ADJUST Y to position correctly in the group
        group.add(buildingMesh);

        // Roof: Sloped cuboid roof
        const roofWidth = buildingWidth * 1.1;
        const roofHeight = TILE_SIZE * 0.2;
        const roofDepth = buildingDepth * 1.1;
        const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
        const roofMaterial = new THREE.MeshStandardMaterial({ color: roofColor });
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        roofMesh.position.y = buildingHeight + roofHeight / 2 - TILE_SIZE * 0.05; // ADJUST (relative to group origin, buildingMesh is already centered)
        group.add(roofMesh);

        // Anvil (Optional): A small, T-shaped structure made of two grey cuboids next to the building.
        const anvilBaseHeight = TILE_SIZE * 0.2;
        const anvilBaseSize = TILE_SIZE * 0.15;
        const anvilTopHeight = TILE_SIZE * 0.1;
        const anvilTopWidth = TILE_SIZE * 0.3;
        const anvilTopDepth = TILE_SIZE * 0.15;

        const anvilBaseGeometry = new THREE.BoxGeometry(anvilBaseSize, anvilBaseHeight, anvilBaseSize);
        const anvilMaterial = new THREE.MeshStandardMaterial({ color: anvilColor });
        const anvilBaseMesh = new THREE.Mesh(anvilBaseGeometry, anvilMaterial);
        anvilBaseMesh.position.set(buildingWidth / 2 + anvilBaseSize / 2 + TILE_SIZE * 0.1, anvilBaseHeight / 2, 0); // ADJUST Y
        group.add(anvilBaseMesh);

        const anvilTopGeometry = new THREE.BoxGeometry(anvilTopWidth, anvilTopHeight, anvilTopDepth);
        const anvilTopMesh = new THREE.Mesh(anvilTopGeometry, anvilMaterial);
        anvilTopMesh.position.set(anvilBaseMesh.position.x, anvilBaseHeight + anvilTopHeight / 2, 0); // ADJUST Y (relative to group origin)
        group.add(anvilTopMesh);
        
        return group;
    }

    update(deltaTime, currentTime) {
        super.update(deltaTime, currentTime); // Base update (handles construction, etc.)

        // Use the enhanced production chain processing from the base class
        this.updateProductionChain(deltaTime, currentTime);
    }

    /**
     * Gets the current production status for UI display.
     * @returns {object} Status information for the blacksmith
     */
    getStatus() {
        const baseStatus = this.getProductionChainStatus();
        return {
            ...baseStatus,
            buildingType: 'Blacksmith',
            specialty: 'Tool Production',
            currentProduct: this.producesMaterials.length > 0 ? this.producesMaterials[0].resource : 'None'
        };
    }
}

export default Blacksmith;
