import * as THREE from 'three';
import Building from '../Building.js';
import { BUILDING_DATA } from '../../config/buildingData.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class IronSmelter extends Building {
    constructor(gridX, gridZ, gameMap) {
        const buildingDataEntry = BUILDING_DATA.IRON_SMELTER;
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

        // Base: Sturdy, dark grey cuboid
        const baseWidth = TILE_SIZE * 0.9;
        const baseHeight = TILE_SIZE * 0.5;
        const baseDepth = TILE_SIZE * 0.7;
        const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
        const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 }); // Dark Grey (DimGray)
        const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
        baseMesh.position.y = baseHeight / 2;
        modelGroup.add(baseMesh);

        // Furnace/Chimney: Prominent, taller, slightly tapering square or cylindrical cuboid (Black or Very Dark Grey)
        // Let's make a square furnace base and a cylindrical chimney.
        const furnaceBaseSize = TILE_SIZE * 0.4;
        const furnaceBaseHeight = TILE_SIZE * 0.6;
        const furnaceMaterial = new THREE.MeshPhongMaterial({ color: 0x2F4F4F }); // Very Dark Grey (DarkSlateGray)

        const furnaceBaseGeometry = new THREE.BoxGeometry(furnaceBaseSize, furnaceBaseHeight, furnaceBaseSize);
        const furnaceBaseMesh = new THREE.Mesh(furnaceBaseGeometry, furnaceMaterial);
        furnaceBaseMesh.position.set(0, baseHeight + furnaceBaseHeight / 2, 0); // Centered on the main base
        modelGroup.add(furnaceBaseMesh);

        const chimneyHeight = TILE_SIZE * 0.8;
        const chimneyRadiusTop = TILE_SIZE * 0.15;
        const chimneyRadiusBottom = TILE_SIZE * 0.2;
        const chimneyGeometry = new THREE.CylinderGeometry(chimneyRadiusTop, chimneyRadiusBottom, chimneyHeight, 8);
        const chimneyMesh = new THREE.Mesh(chimneyGeometry, furnaceMaterial); // Same material as furnace base
        chimneyMesh.position.set(0, baseHeight + furnaceBaseHeight + chimneyHeight / 2, 0);
        modelGroup.add(chimneyMesh);

        // Glow: Small bright orange or red cube at the base of the furnace/chimney
        const glowSize = TILE_SIZE * 0.15;
        const glowGeometry = new THREE.BoxGeometry(glowSize, glowSize, glowSize);
        // OrangeRed with emissive property to make it glow
        const glowMaterial = new THREE.MeshPhongMaterial({ color: 0xFF4500, emissive: 0xFF4500, emissiveIntensity: 0.8 });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        // Position it at the front of the furnace base, near the bottom
        glowMesh.position.set(0, baseHeight + glowSize / 2, furnaceBaseSize / 2 + glowSize / 2);
        modelGroup.add(glowMesh);

        modelGroup.scale.set(0.9, 0.9, 0.9); // Overall scaling

        modelGroup.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return modelGroup;
    }

    // ... other methods
}

export default IronSmelter;
