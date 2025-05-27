import * as THREE from 'three';
import Building from '../Building.js';
import { BUILDING_DATA } from '../../config/buildingData.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class TreasuryMint extends Building {
    constructor(gridX, gridZ, gameMap) {
        const buildingDataEntry = BUILDING_DATA.TREASURY_MINT;
        super(buildingDataEntry.key, gridX, gridZ, gameMap, buildingDataEntry);

        this.model = this.createModel();
        if (this.model) {
            this.model.position.set(gridX * TILE_SIZE, 0, gridZ * TILE_SIZE);
            this.model.userData.building = this;
            // this.gameMap.scene.add(this.model); // Removed: Scene is not a property of gameMap from mapManager.js
        }
    }

    createModel() {
        const modelGroup = new THREE.Group();

        // Based on Goldsmith/Mint (#16) from buildings.md, adapted for a more secure "Treasury" feel.
        // Building: A sturdy, medium-sized cuboid (color: Light Grey or Beige).
        // Roof: Flat or slightly sloped cuboid roof (color: Dark Grey).
        // Accent: A prominent bright yellow cube or small pyramid on the roof or above the entrance.

        const buildingColor = 0x778899; // LightSlateGray (as per original, for a sturdy stone look)
        const roofColor = 0x404040;     // Dark Grey (for reinforced flat roof)
        const doorColor = 0x505050;     // Dark metal grey (for reinforced door)
        const accentColor = 0xFFD700;   // Gold

        // Building: Sturdy cuboid
        const buildingWidth = TILE_SIZE * 0.9;
        const buildingHeight = TILE_SIZE * 0.75;
        const buildingDepth = TILE_SIZE * 0.7;

        const buildingMaterial = new THREE.MeshPhongMaterial({ color: buildingColor });
        const buildingMesh = new THREE.Mesh(new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth), buildingMaterial);
        buildingMesh.position.y = buildingHeight / 2;
        buildingMesh.castShadow = true;
        buildingMesh.receiveShadow = true;
        modelGroup.add(buildingMesh);

        // Roof: Reinforced flat roof
        const roofThickness = TILE_SIZE * 0.1;
        const roofMaterial = new THREE.MeshPhongMaterial({ color: roofColor });
        const roofMesh = new THREE.Mesh(
            new THREE.BoxGeometry(buildingWidth + TILE_SIZE * 0.04, roofThickness, buildingDepth + TILE_SIZE * 0.04),
            roofMaterial
        );
        roofMesh.position.y = buildingHeight + roofThickness / 2;
        roofMesh.castShadow = true;
        // roofMesh.receiveShadow = true; // Flat roof might not receive much shadow from itself
        modelGroup.add(roofMesh);

        // Reinforced Door
        const doorWidth = TILE_SIZE * 0.25;
        const doorHeight = buildingHeight * 0.7;
        const doorThickness = TILE_SIZE * 0.06;
        const doorMaterial = new THREE.MeshPhongMaterial({ color: doorColor });
        const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness), doorMaterial);
        doorMesh.position.set(0, doorHeight / 2, buildingDepth / 2 - doorThickness / 2 + 0.01); // Slightly inset on front face
        doorMesh.castShadow = true;
        modelGroup.add(doorMesh);

        // Small, barred windows (dark rectangles on sides) - simplified as indentations or dark planes
        const windowHeight = TILE_SIZE * 0.12;
        const windowWidth = TILE_SIZE * 0.08;
        const windowMaterial = new THREE.MeshPhongMaterial({ color: 0x101010 }); // Black

        const window1 = new THREE.Mesh(new THREE.PlaneGeometry(windowWidth, windowHeight), windowMaterial);
        window1.position.set(buildingWidth / 2 + 0.01, buildingHeight * 0.65, 0); // Right side
        window1.rotation.y = Math.PI / 2;
        modelGroup.add(window1);

        const window2 = new THREE.Mesh(new THREE.PlaneGeometry(windowWidth, windowHeight), windowMaterial);
        window2.position.set(-buildingWidth / 2 - 0.01, buildingHeight * 0.65, 0); // Left side
        window2.rotation.y = -Math.PI / 2;
        modelGroup.add(window2);

        // Accent: Gold pyramid on the roof (as per buildings.md suggestion for Goldsmith/Mint)
        const accentSize = TILE_SIZE * 0.1;
        const accentGeometry = new THREE.ConeGeometry(accentSize, accentSize * 1.2, 4); // Pyramid shape
        const accentMaterial = new THREE.MeshPhongMaterial({ color: accentColor, emissive: 0xAA8C00 });
        const accentMesh = new THREE.Mesh(accentGeometry, accentMaterial);
        accentMesh.position.set(0, buildingHeight + roofThickness + (accentSize * 1.2) / 2, 0); // Centered on roof
        accentMesh.castShadow = true;
        modelGroup.add(accentMesh);

        return modelGroup;
    }
}

export default TreasuryMint;
