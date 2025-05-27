import * as THREE from 'three';
import Building from '../Building.js';
import { BUILDING_DATA } from '../../config/buildingData.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class SiegeWorkshop extends Building {
    constructor(gridX, gridZ, gameMap) {
        const buildingDataEntry = BUILDING_DATA.SIEGE_WORKSHOP;
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

        // Visual Description (based on Toolmaker's Workshop, adapted for Siege Workshop):
        // Aiming for overall width/depth of ~0.9 * TILE_SIZE.

        const buildingColor = 0x696969; // DimGray (Stone)
        const roofColor = 0x5C3317; // Dark Brown

        // Main Building: Large, sturdy cuboid
        const mainWidth = TILE_SIZE * 0.8; // Adjusted from 1.8
        const mainHeight = TILE_SIZE * 0.7; // Adjusted from 1.0
        const mainDepth = TILE_SIZE * 0.6; // Adjusted from 1.2
        const mainMaterial = new THREE.MeshPhongMaterial({ color: buildingColor });
        const mainMesh = new THREE.Mesh(new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth), mainMaterial);
        mainMesh.position.y = mainHeight / 2;
        mainMesh.castShadow = true;
        mainMesh.receiveShadow = true;
        modelGroup.add(mainMesh);

        // Roof: Sloped cuboid roof
        const roofHeight = TILE_SIZE * 0.2; // Adjusted from 0.4
        // Roof overhang should be proportional to the new mainWidth/mainDepth
        const roofGeometry = new THREE.BoxGeometry(mainWidth * 1.1, roofHeight, mainDepth * 1.1);
        const roofMaterial = new THREE.MeshPhongMaterial({ color: roofColor });
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        roofMesh.position.y = mainHeight + roofHeight / 2;
        roofMesh.castShadow = true;
        modelGroup.add(roofMesh);

        // Large Doors (represented by a darker indentation or slightly recessed cuboid)
        const doorWidth = mainWidth * 0.6; // Adjusted from 0.5 of old mainWidth
        const doorHeight = mainHeight * 0.8; // Relative to new mainHeight
        const doorDepth = TILE_SIZE * 0.05; // Adjusted from 0.1
        const doorMaterial = new THREE.MeshPhongMaterial({ color: 0x404040 }); // Darker Grey
        const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth), doorMaterial);
        doorMesh.position.set(0, doorHeight / 2, mainDepth / 2 - doorDepth / 2 + 0.01); // Slightly inset
        doorMesh.castShadow = true;
        modelGroup.add(doorMesh);

        // Optional: External Hoist/Crane (Simplified)
        // Scale hoist relative to the new building size
        const hoistPostHeight = mainHeight * 1.1; // Adjusted from 1.2 of old mainHeight
        const hoistPostSize = TILE_SIZE * 0.05; // Adjusted from 0.1
        const hoistMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // SaddleBrown (Wood)

        const post = new THREE.Mesh(new THREE.BoxGeometry(hoistPostSize, hoistPostHeight, hoistPostSize), hoistMaterial);
        // Position hoist next to the scaled building
        post.position.set(mainWidth / 2 + hoistPostSize * 1.5, hoistPostHeight / 2, mainDepth / 3);
        post.castShadow = true;
        post.receiveShadow = true;
        modelGroup.add(post);

        const armLength = TILE_SIZE * 0.3; // Adjusted from 0.6
        const arm = new THREE.Mesh(new THREE.BoxGeometry(hoistPostSize, hoistPostSize, armLength), hoistMaterial);
        // Position arm relative to the new post position and height
        arm.position.set(post.position.x, hoistPostHeight - hoistPostSize * 2, post.position.z - armLength / 2 + hoistPostSize / 2);
        arm.rotation.y = Math.PI / 8; // Slightly angled
        arm.castShadow = true;
        arm.receiveShadow = true;
        modelGroup.add(arm);

        // Overall model should not exceed TILE_SIZE in width/depth significantly.
        // The widest part is mainWidth (0.8) + hoist (post.position.x + hoistPostSize/2)
        // (0.8 * TILE_SIZE / 2) + (0.05 * TILE_SIZE * 1.5) + (0.05 * TILE_SIZE / 2) = 0.4 + 0.075 + 0.025 = 0.5 * TILE_SIZE from center
        // So total width with hoist is around (0.4 + 0.5) = 0.9 * TILE_SIZE. This should be acceptable.

        return modelGroup;
    }
}

export default SiegeWorkshop;
