import * as THREE from 'three';
import Building from '../Building.js';
import { BUILDING_DATA } from '../../config/buildingData.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class WarehouseStorehouse extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry = null, resourceFlowManager = null) {
        const buildingData = buildingDataEntry || BUILDING_DATA.WAREHOUSE_STOREHOUSE;
        super(buildingData.key, gridX, gridZ, gameMap, buildingData, resourceFlowManager);

        this.model = this.createModel();
        if (this.model) {
            this.model.position.set(gridX * TILE_SIZE, 0, gridZ * TILE_SIZE);
            this.model.userData.building = this;
        }
    }

    createModel() {
        const modelGroup = new THREE.Group();

        // Building: A long, wide, plain cuboid (color: Light Brown or Beige)
        const buildingWidth = TILE_SIZE * 0.9; // Adjusted from 2.0
        const buildingHeight = TILE_SIZE * 0.6; // Adjusted from 1.0
        const buildingDepth = TILE_SIZE * 0.9; // Adjusted from 1.25
        const buildingMaterial = new THREE.MeshPhongMaterial({ color: 0xD2B48C }); // Tan (Beige/Light Brown)
        const buildingMesh = new THREE.Mesh(
            new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth),
            buildingMaterial
        );
        buildingMesh.position.y = buildingHeight / 2;
        modelGroup.add(buildingMesh);

        // Roof: A simple, large, slightly sloped cuboid roof (Darker Brown or Grey)
        const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // SaddleBrown (Darker Brown)
        const roofWidth = buildingWidth + TILE_SIZE * 0.05; // Adjusted from 0.1
        const roofSlopeHeight = TILE_SIZE * 0.15; // Adjusted from 0.3
        const roofPanelDepth = (buildingDepth / 2) + TILE_SIZE * 0.025; // Adjusted from 0.05

        // Create two sloped roof panels
        const roofSlopeGeometry = new THREE.BoxGeometry(roofWidth, TILE_SIZE * 0.05, roofPanelDepth); // Adjusted thickness from 0.1

        const roofSlope1Mesh = new THREE.Mesh(roofSlopeGeometry, roofMaterial);
        // Position and rotate the first slope
        roofSlope1Mesh.position.set(0, buildingHeight + roofSlopeHeight * 0.4, buildingDepth / 4);
        roofSlope1Mesh.rotation.x = -Math.atan2(roofSlopeHeight, buildingDepth / 2); 
        modelGroup.add(roofSlope1Mesh);

        const roofSlope2Mesh = new THREE.Mesh(roofSlopeGeometry, roofMaterial);
        // Position and rotate the second slope
        roofSlope2Mesh.position.set(0, buildingHeight + roofSlopeHeight * 0.4, -buildingDepth / 4);
        roofSlope2Mesh.rotation.x = Math.atan2(roofSlopeHeight, buildingDepth / 2);
        modelGroup.add(roofSlope2Mesh);

        // Doors: Several wide, darker rectangular indentations
        const doorWidth = TILE_SIZE * 0.2; // Adjusted from 0.4
        const doorHeight = buildingHeight * 0.7; // Adjusted from 0.6
        const doorDepth = TILE_SIZE * 0.05; // Kept same, relative to new building size
        const doorMaterial = new THREE.MeshPhongMaterial({ color: 0x5C3317 }); // Darker than building
        
        const doorPositions = [
            // Front doors (reduced to one central door due to smaller size)
            new THREE.Vector3(0, doorHeight/2, buildingDepth/2 - doorDepth/2 + 0.01),
            // Back doors (optional, for symmetry or if needed by design)
            // new THREE.Vector3(0, doorHeight/2, -buildingDepth/2 + doorDepth/2 - 0.01),
        ];

        doorPositions.forEach(pos => {
            const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth), doorMaterial);
            doorMesh.position.copy(pos);
            modelGroup.add(doorMesh);
        });

        return modelGroup;
    }
}

export default WarehouseStorehouse;
