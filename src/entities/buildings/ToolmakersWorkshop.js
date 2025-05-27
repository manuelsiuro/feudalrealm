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

        // Visual Description from buildings.md (#15):
        // Building: Medium cuboid (color: Brown).
        // Roof: Sloped cuboid roof (color: Grey).
        // Anvil (Optional): A small, T-shaped structure made of two grey cuboids next to the building.

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
        buildingMesh.position.y = buildingHeight / 2;
        buildingMesh.castShadow = true;
        buildingMesh.receiveShadow = true;
        modelGroup.add(buildingMesh);

        // Roof: Sloped cuboid roof (simple single box for sloped effect)
        // For a simple sloped roof, we can use a single BoxGeometry and rotate it,
        // or use two thinner boxes. Given "sloped cuboid roof", a single box is simpler.
        // Let's make a slightly larger, taller box and place it appropriately.
        const roofOverhang = TILE_SIZE * 0.05;
        const roofThickness = TILE_SIZE * 0.15;
        const roofMesh = new THREE.Mesh(
            new THREE.BoxGeometry(buildingWidth + roofOverhang, roofThickness, buildingDepth + roofOverhang),
            new THREE.MeshPhongMaterial({ color: roofColor })
        );
        roofMesh.position.y = buildingHeight + roofThickness / 2; 
        // To make it appear sloped, one could rotate it slightly, or use a more complex geometry.
        // For simplicity, keeping it as a flat cuboid on top, slightly larger.
        // If a visible slope is desired, two rotated boxes or a custom shape would be needed.
        // The original code used two thin boxes to form a pitched roof, let's replicate that.

        const pitchedRoofHeight = TILE_SIZE * 0.25;
        const roofPieceWidth = buildingWidth + roofOverhang * 2;
        const roofPieceDepth = (buildingDepth / 2) + roofOverhang;
        const roofMaterial = new THREE.MeshPhongMaterial({ color: roofColor });

        const roofSlope1Mesh = new THREE.Mesh(
            new THREE.BoxGeometry(roofPieceWidth, roofThickness, roofPieceDepth),
            roofMaterial
        );
        // Position and rotate to form one side of the pitched roof
        roofSlope1Mesh.position.set(0, buildingHeight + pitchedRoofHeight * 0.5 - roofThickness * 0.2, buildingDepth / 4);
        roofSlope1Mesh.rotation.x = -Math.PI / 7; // Adjust angle for desired slope
        roofSlope1Mesh.castShadow = true;
        modelGroup.add(roofSlope1Mesh);

        const roofSlope2Mesh = new THREE.Mesh(
            new THREE.BoxGeometry(roofPieceWidth, roofThickness, roofPieceDepth),
            roofMaterial
        );
        // Position and rotate to form the other side
        roofSlope2Mesh.position.set(0, buildingHeight + pitchedRoofHeight * 0.5 - roofThickness * 0.2, -buildingDepth / 4);
        roofSlope2Mesh.rotation.x = Math.PI / 7; // Adjust angle for desired slope
        roofSlope2Mesh.castShadow = true;
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
        // Position it next to the building
        anvilBaseMesh.position.set(buildingWidth / 2 + anvilBaseWidth, anvilBaseHeight / 2, 0);
        anvilBaseMesh.castShadow = true;
        anvilBaseMesh.receiveShadow = true;
        modelGroup.add(anvilBaseMesh);

        const anvilTopWidth = TILE_SIZE * 0.25;
        const anvilTopHeight = TILE_SIZE * 0.08;
        const anvilTopDepth = TILE_SIZE * 0.1;
        const anvilTopMesh = new THREE.Mesh(
            new THREE.BoxGeometry(anvilTopWidth, anvilTopHeight, anvilTopDepth),
            anvilMaterial
        );
        anvilTopMesh.position.set(buildingWidth / 2 + anvilBaseWidth, anvilBaseHeight + anvilTopHeight / 2, 0);
        anvilTopMesh.castShadow = true;
        anvilTopMesh.receiveShadow = true;
        modelGroup.add(anvilTopMesh);
        
        // The modelGroup is already centered at (0,0,0) by default.
        // Its final position is set in the constructor.
        return modelGroup;
    }
}

export default ToolmakersWorkshop;
