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
        // Building: Large, sturdy, barn-like structure (Dark Wood or Stone)
        // Roof: Wide, functional sloped roof (Dark Brown or Grey)
        // Large Doors: Suitable for moving siege engines in/out.
        // External Hoist/Crane (optional): For lifting heavy components.

        const buildingColor = 0x696969; // DimGray (Stone)
        const roofColor = 0x5C3317; // Dark Brown

        // Main Building: Large, sturdy cuboid
        const mainWidth = TILE_SIZE * 1.8;
        const mainHeight = TILE_SIZE * 1.0;
        const mainDepth = TILE_SIZE * 1.2;
        const mainMaterial = new THREE.MeshPhongMaterial({ color: buildingColor });
        const mainMesh = new THREE.Mesh(new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth), mainMaterial);
        mainMesh.position.y = mainHeight / 2;
        mainMesh.castShadow = true;
        mainMesh.receiveShadow = true;
        modelGroup.add(mainMesh);

        // Roof: Sloped cuboid roof
        const roofHeight = TILE_SIZE * 0.4;
        const roofGeometry = new THREE.BoxGeometry(mainWidth * 1.1, roofHeight, mainDepth * 1.1);
        const roofMaterial = new THREE.MeshPhongMaterial({ color: roofColor });
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        roofMesh.position.y = mainHeight + roofHeight / 2;
        roofMesh.castShadow = true;
        // roofMesh.receiveShadow = true; // Roofs typically don't receive shadows from themselves in this way
        modelGroup.add(roofMesh);

        // Large Doors (represented by a darker indentation or slightly recessed cuboid)
        const doorWidth = mainWidth * 0.5;
        const doorHeight = mainHeight * 0.8;
        const doorDepth = TILE_SIZE * 0.1;
        const doorMaterial = new THREE.MeshPhongMaterial({ color: 0x404040 }); // Darker Grey
        const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth), doorMaterial);
        // Position it on the front face (positive Z assuming standard orientation)
        doorMesh.position.set(0, doorHeight / 2, mainDepth / 2 - doorDepth / 2 + 0.01); // Slightly inset
        doorMesh.castShadow = true;
        // doorMesh.receiveShadow = true;
        modelGroup.add(doorMesh);

        // Optional: External Hoist/Crane (Simplified)
        // A vertical post, a horizontal arm, and a small "winch" cylinder
        const hoistPostHeight = mainHeight * 1.2;
        const hoistPostSize = TILE_SIZE * 0.1;
        const hoistMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // SaddleBrown (Wood)

        const post = new THREE.Mesh(new THREE.BoxGeometry(hoistPostSize, hoistPostHeight, hoistPostSize), hoistMaterial);
        post.position.set(mainWidth / 2 + hoistPostSize, hoistPostHeight / 2, mainDepth / 3);
        post.castShadow = true;
        post.receiveShadow = true;
        modelGroup.add(post);

        const armLength = TILE_SIZE * 0.6;
        const arm = new THREE.Mesh(new THREE.BoxGeometry(hoistPostSize, hoistPostSize, armLength), hoistMaterial);
        arm.position.set(mainWidth / 2 + hoistPostSize, hoistPostHeight - hoistPostSize * 2, mainDepth / 3 - armLength / 2 + hoistPostSize/2);
        arm.rotation.y = Math.PI / 8; // Slightly angled
        arm.castShadow = true;
        arm.receiveShadow = true;
        modelGroup.add(arm);

        // Center the model group at the building's base
        // The individual meshes are positioned relative to the group's origin (0,0,0)
        // The group itself will be positioned at (gridX * TILE_SIZE, 0, gridZ * TILE_SIZE) by the constructor

        return modelGroup;
    }
}

export default SiegeWorkshop;
