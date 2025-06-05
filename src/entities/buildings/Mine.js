// UNUSED: This generic Mine class is not imported or used anywhere in the codebase
// TODO: Consider removing this file as specific mine types (IronMine, CoalMine, GoldMine) are used instead
import * as THREE from 'three';
import Building from '../Building.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class Mine extends Building {
    constructor(key, gridX, gridZ, gameMap, buildingDataEntry, oreColor = 0x808080, resourceFlowManager = null) { // Default ore color: Grey
        super(key, gridX, gridZ, gameMap, buildingDataEntry, resourceFlowManager);
        this.oreColor = oreColor;
        // Model creation is handled by the base Building class
        // Model will be created when construction starts, not immediately
    }

    createModel() {
        const group = new THREE.Group();
        const entranceColor = 0x4A4A4A; // Dark Grey
        const openingColor = 0x202020; // Darker (near black)

        // Entrance: Dark grey cuboid
        const entranceWidth = TILE_SIZE * 0.8;
        const entranceHeight = TILE_SIZE * 0.7;
        const entranceDepth = TILE_SIZE * 0.5;
        const entranceGeometry = new THREE.BoxGeometry(entranceWidth, entranceHeight, entranceDepth);
        const entranceMaterial = new THREE.MeshStandardMaterial({ color: entranceColor });
        const entranceMesh = new THREE.Mesh(entranceGeometry, entranceMaterial);
        group.add(entranceMesh);

        // Opening: Darker, smaller square/rectangle on the front face
        const openingWidth = entranceWidth * 0.4;
        const openingHeight = entranceHeight * 0.6;
        const openingDepth = TILE_SIZE * 0.05; // Very thin
        const openingGeometry = new THREE.BoxGeometry(openingWidth, openingHeight, openingDepth);
        const openingMaterial = new THREE.MeshStandardMaterial({ color: openingColor });
        const openingMesh = new THREE.Mesh(openingGeometry, openingMaterial);
        openingMesh.position.set(0, 0, entranceDepth / 2 + openingDepth / 2 - 0.01); // Slightly in front of the entrance face
        entranceMesh.add(openingMesh); // Add as child to position relative to entrance

        // Ore Indicator: A small, distinctively colored shape near the entrance
        // This will be customized by subclasses (IronMine, CoalMine, GoldMine)
        const indicatorMesh = this.createOreIndicatorModel(this.oreColor);
        
        // Position it to the side of the entrance
        const indicatorBoundingBox = new THREE.Box3().setFromObject(indicatorMesh);
        const indicatorHeight = indicatorBoundingBox.max.y - indicatorBoundingBox.min.y;
        indicatorMesh.position.set(entranceWidth / 2 + (indicatorBoundingBox.max.x - indicatorBoundingBox.min.x) / 2 + TILE_SIZE * 0.05, -entranceHeight / 2 + indicatorHeight / 2, entranceDepth / 2 - (indicatorBoundingBox.max.z - indicatorBoundingBox.min.z) / 2);
        group.add(indicatorMesh);
        
        group.position.y = entranceHeight / 2; // Adjust group pivot to be at the base
        return group;
    }

    // Subclasses can override this if they need a different shape for the indicator
    createOreIndicatorModel(color) {
        const indicatorSize = TILE_SIZE * 0.15;
        const geometry = new THREE.BoxGeometry(indicatorSize, indicatorSize, indicatorSize);
        const material = new THREE.MeshStandardMaterial({ color: color });
        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }
}

export default Mine;
