import * as THREE from 'three';
import Building from '../Building.js';
import { BUILDING_DATA } from '../../config/buildingData.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class ToolmakersWorkshop extends Building {
    constructor(gridX, gridZ, gameMap) {
        const buildingDataEntry = BUILDING_DATA.TOOLMAKERS_WORKSHOP;
        super(buildingDataEntry.key, gridX, gridZ, gameMap, buildingDataEntry);

        this.model = this.createModel();
        if (this.model) {
            this.model.position.set(gridX * TILE_SIZE, 0, gridZ * TILE_SIZE);
            this.model.userData.building = this;
            // this.gameMap.scene.add(this.model); // Removed as gameMap does not have a scene property directly
        }
    }

    createModel() {
        const modelGroup = new THREE.Group();

        const buildingColor = 0x8B4513; // Brown (SaddleBrown as per original)
        const roofColor = 0x808080;     // Grey
        const anvilColor = 0x606060;    // Darker Grey

        // Building: Medium cuboid
        const buildingWidth = TILE_SIZE * 0.8;
        const buildingHeight = TILE_SIZE * 0.6;
        const buildingDepth = TILE_SIZE * 0.7;
        const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
        const buildingMaterial = new THREE.MeshPhongMaterial({ color: buildingColor });
        const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
        buildingMesh.position.y = buildingHeight / 2; // Base of mesh at y=0
        // buildingMesh.castShadow = true; // Handled by Building.js
        // buildingMesh.receiveShadow = true; // Handled by Building.js
        modelGroup.add(buildingMesh);

        // Roof: Sloped cuboid roof
        const roofOverhang = TILE_SIZE * 0.05;
        const roofThickness = TILE_SIZE * 0.15; 
        const pitchedRoofHeight = TILE_SIZE * 0.25; 
        const roofPieceWidth = buildingWidth + roofOverhang * 2;
        const roofPieceDepth = (buildingDepth / Math.sqrt(2)) / 2 + roofOverhang; 
        const roofMaterial = new THREE.MeshPhongMaterial({ color: roofColor });

        const roofSlope1Mesh = new THREE.Mesh(
            new THREE.BoxGeometry(roofPieceWidth, roofThickness, roofPieceDepth),
            roofMaterial
        );
        // Position roof relative to the top of the main building
        roofSlope1Mesh.position.set(0, buildingHeight + pitchedRoofHeight * 0.45 - roofThickness * 0.5, buildingDepth / 4 * 0.7);
        roofSlope1Mesh.rotation.x = -Math.PI / 6; 
        // roofSlope1Mesh.castShadow = true; // Handled by Building.js
        // roofSlope1Mesh.receiveShadow = true; // Handled by Building.js
        modelGroup.add(roofSlope1Mesh);

        const roofSlope2Mesh = new THREE.Mesh(
            new THREE.BoxGeometry(roofPieceWidth, roofThickness, roofPieceDepth),
            roofMaterial
        );
        // Position roof relative to the top of the main building
        roofSlope2Mesh.position.set(0, buildingHeight + pitchedRoofHeight * 0.45 - roofThickness * 0.5, -buildingDepth / 4 * 0.7);
        roofSlope2Mesh.rotation.x = Math.PI / 6; 
        // roofSlope2Mesh.castShadow = true; // Handled by Building.js
        // roofSlope2Mesh.receiveShadow = true; // Handled by Building.js
        modelGroup.add(roofSlope2Mesh);

        // Anvil (Optional): T-shaped structure
        const anvilBaseWidth = TILE_SIZE * 0.1;
        const anvilBaseHeight = TILE_SIZE * 0.15;
        const anvilBaseDepth = TILE_SIZE * 0.1;
        const anvilMaterial = new THREE.MeshPhongMaterial({ color: anvilColor });

        const anvilBaseMesh = new THREE.Mesh(
            new THREE.BoxGeometry(anvilBaseWidth, anvilBaseHeight, anvilBaseDepth),
            anvilMaterial
        );
        // Position anvil base so its bottom is at y=0
        anvilBaseMesh.position.set(buildingWidth / 2 + anvilBaseWidth, anvilBaseHeight / 2, 0);
        // anvilBaseMesh.castShadow = true; // Handled by Building.js
        // anvilBaseMesh.receiveShadow = true; // Handled by Building.js
        modelGroup.add(anvilBaseMesh);

        const anvilTopWidth = TILE_SIZE * 0.25;
        const anvilTopHeight = TILE_SIZE * 0.08;
        const anvilTopDepth = TILE_SIZE * 0.1;
        const anvilTopMesh = new THREE.Mesh(
            new THREE.BoxGeometry(anvilTopWidth, anvilTopHeight, anvilTopDepth),
            anvilMaterial
        );
        // Position anvil top relative to anvil base
        anvilTopMesh.position.set(buildingWidth / 2 + anvilBaseWidth, anvilBaseHeight + anvilTopHeight / 2, 0);
        // anvilTopMesh.castShadow = true; // Handled by Building.js
        // anvilTopMesh.receiveShadow = true; // Handled by Building.js
        modelGroup.add(anvilTopMesh);
        
        return modelGroup;
    }
}

export default ToolmakersWorkshop;
