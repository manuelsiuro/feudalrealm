import * as THREE from 'three';
import Building from '../Building.js';
import { BUILDING_DATA } from '../../config/buildingData.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class SiegeWorkshop extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry = null, resourceFlowManager = null) {
        const buildingData = buildingDataEntry || BUILDING_DATA.SIEGE_WORKSHOP;
        super(buildingData.key, gridX, gridZ, gameMap, buildingData, resourceFlowManager);

        // Model will be created during construction process by startConstructionProcess()
        // this.model = this.createModel();
        // if (this.model) {
        //     this.model.position.set(gridX * TILE_SIZE, 0, gridZ * TILE_SIZE);
        //     this.model.userData.building = this;
        //     // this.gameMap.scene.add(this.model); // Removed as gameMap does not have a scene property directly
        // }
    }

    createModel() {
        const modelGroup = new THREE.Group();

        // Visual Description (based on Toolmaker's Workshop, adapted for Siege Workshop):
        // Aiming for overall width/depth of ~0.9 * TILE_SIZE.

        const buildingColor = 0x696969; // DimGray (Stone)
        const roofColor = 0x5C3317; // Dark Brown

        // Main Building: Large, sturdy cuboid
        const mainWidth = TILE_SIZE * 0.8; 
        const mainHeight = TILE_SIZE * 0.7; 
        const mainDepth = TILE_SIZE * 0.6; 
        const mainMaterial = new THREE.MeshPhongMaterial({ color: buildingColor });
        const mainMesh = new THREE.Mesh(new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth), mainMaterial);
        mainMesh.position.y = mainHeight / 2; // Base of mesh at y=0
        // mainMesh.castShadow = true; // Handled by Building.js
        // mainMesh.receiveShadow = true; // Handled by Building.js
        modelGroup.add(mainMesh);

        // Roof: Sloped cuboid roof
        const roofHeight = TILE_SIZE * 0.2; 
        const roofGeometry = new THREE.BoxGeometry(mainWidth * 1.1, roofHeight, mainDepth * 1.1);
        const roofMaterial = new THREE.MeshPhongMaterial({ color: roofColor });
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        roofMesh.position.y = mainHeight + roofHeight / 2; // Stack on top of main building
        // roofMesh.castShadow = true; // Handled by Building.js
        modelGroup.add(roofMesh);

        // Large Doors (represented by a darker indentation or slightly recessed cuboid)
        const doorWidth = mainWidth * 0.6; 
        const doorHeight = mainHeight * 0.8; 
        const doorDepth = TILE_SIZE * 0.05; 
        const doorMaterial = new THREE.MeshPhongMaterial({ color: 0x404040 }); // Darker Grey
        const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth), doorMaterial);
        // Position door relative to main building's base and front face
        doorMesh.position.set(0, doorHeight / 2, mainDepth / 2 - doorDepth / 2 + 0.01); 
        // doorMesh.castShadow = true; // Handled by Building.js
        modelGroup.add(doorMesh);

        // Optional: External Hoist/Crane (Simplified)
        const hoistPostHeight = mainHeight * 1.1; 
        const hoistPostSize = TILE_SIZE * 0.05; 
        const hoistMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // SaddleBrown (Wood)

        const post = new THREE.Mesh(new THREE.BoxGeometry(hoistPostSize, hoistPostHeight, hoistPostSize), hoistMaterial);
        // Position hoist post so its base is at y=0
        post.position.set(mainWidth / 2 + hoistPostSize * 1.5, hoistPostHeight / 2, mainDepth / 3);
        // post.castShadow = true; // Handled by Building.js
        // post.receiveShadow = true; // Handled by Building.js
        modelGroup.add(post);

        const armLength = TILE_SIZE * 0.3; 
        const arm = new THREE.Mesh(new THREE.BoxGeometry(hoistPostSize, hoistPostSize, armLength), hoistMaterial);
        // Position arm relative to the post
        arm.position.set(post.position.x, post.position.y + hoistPostHeight / 2 - hoistPostSize * 2, post.position.z - armLength / 2 + hoistPostSize / 2);
        arm.rotation.y = Math.PI / 8; // Slightly angled
        // arm.castShadow = true; // Handled by Building.js
        // arm.receiveShadow = true; // Handled by Building.js
        modelGroup.add(arm);

        return modelGroup;
    }
}

export default SiegeWorkshop;
