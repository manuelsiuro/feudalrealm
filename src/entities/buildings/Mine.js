import * as THREE from 'three';
import Building from '../Building.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class Mine extends Building {
    constructor(key, gridX, gridZ, gameMap, buildingDataEntry, oreColor = 0x808080) { // Default ore color: Grey
        super(key, gridX, gridZ, gameMap, buildingDataEntry);
        this.oreColor = oreColor;
        this.model = this.createModel();
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
        entranceMesh.castShadow = true;
        entranceMesh.receiveShadow = true;
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
        const indicatorSize = TILE_SIZE * 0.15;
        // Default shape is a cube, subclasses can override createOreIndicatorModel if needed
        const indicatorGeometry = new THREE.BoxGeometry(indicatorSize, indicatorSize, indicatorSize);
        const indicatorMaterial = new THREE.MeshStandardMaterial({ color: this.oreColor });
        const indicatorMesh = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        // Position it to the side of the entrance
        indicatorMesh.position.set(entranceWidth / 2 + indicatorSize / 2 + TILE_SIZE * 0.05, -entranceHeight / 2 + indicatorSize / 2, entranceDepth / 2 - indicatorSize / 2);
        indicatorMesh.castShadow = true;
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
        mesh.castShadow = true;
        return mesh;
    }
}

export default Mine;
