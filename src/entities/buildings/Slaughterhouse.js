import * as THREE from 'three';
import Building from '../Building.js';
import { BUILDING_DATA } from '../../config/buildingData.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class Slaughterhouse extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry = null, resourceFlowManager = null) {
        const buildingData = buildingDataEntry || BUILDING_DATA.SLAUGHTERHOUSE;
        super(buildingData.key, gridX, gridZ, gameMap, buildingData, resourceFlowManager);

        this.model = this.createModel();
        if (this.model) {
            this.model.position.set(gridX * TILE_SIZE, 0, gridZ * TILE_SIZE);
            this.model.userData.building = this;
        }
    }

    createModel() {
        const modelGroup = new THREE.Group();

        // Building: Medium cuboid (Dark Red or Maroon)
        const buildingWidth = TILE_SIZE * 0.9;
        const buildingHeight = TILE_SIZE * 0.7;
        const buildingDepth = TILE_SIZE * 0.7;
        const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
        const buildingMaterial = new THREE.MeshPhongMaterial({ color: 0x800000 }); // Maroon
        const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
        buildingMesh.position.y = buildingHeight / 2;
        modelGroup.add(buildingMesh);

        // Roof: Simple sloped cuboid roof (Dark Brown)
        const roofOverhang = TILE_SIZE * 0.05;
        const roofPanelThickness = TILE_SIZE * 0.08;
        const roofPitch = TILE_SIZE * 0.2;
        const roofPanelWidth = buildingWidth + roofOverhang * 2;
        const roofPanelDepth = (buildingDepth / 2) + roofOverhang * 1.5; // Adjusted for better coverage with slope

        const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x5C3317 }); // Dark Brown

        const roofSlope1Geometry = new THREE.BoxGeometry(roofPanelWidth, roofPanelThickness, roofPanelDepth);
        const roofSlope1Mesh = new THREE.Mesh(roofSlope1Geometry, roofMaterial);
        roofSlope1Mesh.position.set(0, buildingHeight + roofPitch * 0.45, buildingDepth * 0.25 - roofOverhang * 0.25);
        roofSlope1Mesh.rotation.x = -Math.PI / 7; // Approx 25 degrees slope
        modelGroup.add(roofSlope1Mesh);

        const roofSlope2Geometry = new THREE.BoxGeometry(roofPanelWidth, roofPanelThickness, roofPanelDepth);
        const roofSlope2Mesh = new THREE.Mesh(roofSlope2Geometry, roofMaterial);
        roofSlope2Mesh.position.set(0, buildingHeight + roofPitch * 0.45, -buildingDepth * 0.25 + roofOverhang * 0.25);
        roofSlope2Mesh.rotation.x = Math.PI / 7; // Approx 25 degrees slope
        modelGroup.add(roofSlope2Mesh);

        // Accent: A small grey cube near an entrance (chopping block)
        const accentSize = TILE_SIZE * 0.15;
        const accentGeometry = new THREE.BoxGeometry(accentSize, accentSize, accentSize);
        const accentMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 }); // Grey
        const accentMesh = new THREE.Mesh(accentGeometry, accentMaterial);
        // Position it to one side, in front of the building
        accentMesh.position.set(buildingWidth / 3, accentSize / 2, buildingDepth / 2 + accentSize / 2 + TILE_SIZE * 0.02);
        modelGroup.add(accentMesh);

        modelGroup.scale.set(0.9, 0.9, 0.9); // Overall scaling

        return modelGroup;
    }

    // ... other methods
}

export default Slaughterhouse;
