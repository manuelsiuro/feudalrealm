import * as THREE from 'three';
import Building from '../Building.js';
import { BUILDING_DATA } from '../../config/buildingData.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class BlacksmithArmory extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry = null, resourceFlowManager = null) {
        const buildingData = buildingDataEntry || BUILDING_DATA.BLACKSMITH_ARMORY;
        super(buildingData.key, gridX, gridZ, gameMap, buildingData, resourceFlowManager);

        this.model = this.createModel();
        if (this.model) {
            this.model.position.set(gridX * TILE_SIZE, 0, gridZ * TILE_SIZE);
            this.model.userData.building = this;
            // this.gameMap.scene.add(this.model); // Removed as gameMap does not have a scene property directly
        }
    }

    createModel() {
        const modelGroup = new THREE.Group();

        // Building: A dark grey or black cuboid
        const buildingWidth = TILE_SIZE * 1.0; // Was 1.25
        const buildingHeight = TILE_SIZE * 0.65; // Was 0.85
        const buildingDepth = TILE_SIZE * 0.8; // Was 1.0
        const buildingMaterial = new THREE.MeshPhongMaterial({ color: 0x36454F }); // Dark Grey (Charcoal)
        const buildingMesh = new THREE.Mesh(
            new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth),
            buildingMaterial
        );
        buildingMesh.position.y = buildingHeight / 2;
        modelGroup.add(buildingMesh);

        // Roof (simple flat or slightly sloped)
        const roofMesh = new THREE.Mesh(
            new THREE.BoxGeometry(buildingWidth + TILE_SIZE * 0.05, TILE_SIZE * 0.1, buildingDepth + TILE_SIZE * 0.05),
            new THREE.MeshPhongMaterial({ color: 0x202020 }) // Very Dark Grey / Black
        );
        roofMesh.position.y = buildingHeight + (TILE_SIZE * 0.1) / 2;
        modelGroup.add(roofMesh);

        // Chimney: A short, wide, black cuboid chimney.
        const chimneyWidth = TILE_SIZE * 0.25;
        const chimneyHeight = TILE_SIZE * 0.4;
        const chimneyDepth = TILE_SIZE * 0.2;
        const chimneyMaterial = new THREE.MeshPhongMaterial({ color: 0x101010 }); // Near Black
        const chimneyMesh = new THREE.Mesh(
            new THREE.BoxGeometry(chimneyWidth, chimneyHeight, chimneyDepth),
            chimneyMaterial
        );
        // Position towards a back corner
        chimneyMesh.position.set(
            buildingWidth / 2 - chimneyWidth / 2 - TILE_SIZE * 0.1,
            buildingHeight + chimneyHeight / 2,
            -buildingDepth / 2 + chimneyDepth / 2 + TILE_SIZE * 0.1
        );
        modelGroup.add(chimneyMesh);

        // Forge Glow: An orange or red glow (represented by a colored cube) visible from an opening.
        // Creating a simple opening and a glow inside
        const openingWidth = TILE_SIZE * 0.4;
        const openingHeight = TILE_SIZE * 0.3;
        const openingDepth = TILE_SIZE * 0.05; // shallow indent
        const openingMaterial = new THREE.MeshPhongMaterial({ color: 0x252525 }); // Darker than building
        const openingMesh = new THREE.Mesh(
            new THREE.BoxGeometry(openingWidth, openingHeight, openingDepth),
            openingMaterial
        );
        openingMesh.position.set(0, buildingHeight * 0.4, buildingDepth / 2 - openingDepth / 2 + 0.01); // Front, lower part
        modelGroup.add(openingMesh);

        const glowSize = TILE_SIZE * 0.2;
        const glowGeometry = new THREE.BoxGeometry(glowSize, glowSize, glowSize);
        const glowMaterial = new THREE.MeshPhongMaterial({ color: 0xFF4500, emissive: 0xFF4500, emissiveIntensity: 0.7 });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        // Position inside the opening, slightly further back
        glowMesh.position.set(0, buildingHeight * 0.4, buildingDepth / 2 - openingDepth - glowSize / 2 + TILE_SIZE * 0.05);
        modelGroup.add(glowMesh);
        
        return modelGroup;
    }
}

export default BlacksmithArmory;
