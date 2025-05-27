import * as THREE from 'three';
import Building from '../Building.js';
import { BUILDING_DATA } from '../../config/buildingData.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class GoldsmithsMint extends Building {
    constructor(gridX, gridZ, gameMap) {
        const buildingDataEntry = BUILDING_DATA.GOLDSMITHS_MINT;
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

        // Building: A sturdy, medium-sized cuboid (color: Light Grey or Beige)
        const buildingWidth = TILE_SIZE * 0.8;
        const buildingHeight = TILE_SIZE * 0.7;
        const buildingDepth = TILE_SIZE * 0.6;
        const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
        const buildingMaterial = new THREE.MeshPhongMaterial({ color: 0xD3D3D3 }); // Light Grey
        const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
        buildingMesh.position.y = buildingHeight / 2;
        modelGroup.add(buildingMesh);

        // Roof: Flat or slightly sloped cuboid roof (color: Dark Grey)
        const roofOverhang = TILE_SIZE * 0.05;
        const roofThickness = TILE_SIZE * 0.1;
        const roofGeometry = new THREE.BoxGeometry(buildingWidth + roofOverhang * 2, roofThickness, buildingDepth + roofOverhang * 2);
        const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 }); // Dark Grey
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        roofMesh.position.y = buildingHeight + roofThickness / 2;
        // To make it slightly sloped (optional, as per description "Flat or slightly sloped")
        // roofMesh.rotation.x = -Math.PI / 36; // ~5 degree slope along Z axis if desired
        modelGroup.add(roofMesh);

        // Accent: A prominent bright yellow cube or small pyramid on the roof or above the entrance.
        // Using a cube for simplicity as per primary instruction, pyramid is optional.
        const accentSize = TILE_SIZE * 0.15;
        const accentGeometry = new THREE.BoxGeometry(accentSize, accentSize, accentSize); // Cube
        const accentMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700 }); // Gold (Yellow)
        const accentMesh = new THREE.Mesh(accentGeometry, accentMaterial);
        // Positioned centered on the roof
        accentMesh.position.set(0, buildingHeight + roofThickness + accentSize / 2, 0);
        modelGroup.add(accentMesh);
        
        modelGroup.scale.set(0.9, 0.9, 0.9); // Overall scaling, adjust as needed

        modelGroup.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return modelGroup;
    }
}

export default GoldsmithsMint;
