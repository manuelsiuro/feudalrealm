import * as THREE from 'three';
import Building from '../Building.js';
import { BUILDING_DATA } from '../../config/buildingData.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class Windmill extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry = null, resourceFlowManager = null) {
        const buildingData = buildingDataEntry || BUILDING_DATA.WINDMILL;
        super(buildingData.key, gridX, gridZ, gameMap, buildingData, resourceFlowManager);

        this.model = this.createModel();
        if (this.model) {
            this.model.position.set(gridX * TILE_SIZE, 0, gridZ * TILE_SIZE);
            this.model.userData.building = this;
        }
    }

    createModel() {
        const modelGroup = new THREE.Group();

        // Base: Tall, slightly tapering cylinder (Beige or Light Grey)
        const baseHeight = TILE_SIZE * 1.5;
        const baseRadiusTop = TILE_SIZE * 0.4;
        const baseRadiusBottom = TILE_SIZE * 0.5;
        const baseGeometry = new THREE.CylinderGeometry(baseRadiusTop, baseRadiusBottom, baseHeight, 8); // 8 segments for octagonal feel
        const baseMaterial = new THREE.MeshPhongMaterial({ color: 0xD2B48C }); // Beige (Tan)
        const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
        baseMesh.position.y = baseHeight / 2;
        modelGroup.add(baseMesh);

        // Cap/Roof: Conical shape (Dark Brown or Red)
        const capHeight = TILE_SIZE * 0.4;
        const capRadius = baseRadiusTop + TILE_SIZE * 0.05; // Slightly wider than top of base
        const capGeometry = new THREE.ConeGeometry(capRadius, capHeight, 8);
        const capMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // Dark Brown (SaddleBrown)
        const capMesh = new THREE.Mesh(capGeometry, capMaterial);
        capMesh.position.y = baseHeight + capHeight / 2;
        modelGroup.add(capMesh);

        // Sails: Four long, thin cuboids (White or Light Grey)
        const sailsGroup = new THREE.Group();
        sailsGroup.name = 'sailsGroup';
        const sailMaterial = new THREE.MeshPhongMaterial({ color: 0xF5F5F5 }); // White (WhiteSmoke)
        const sailLength = TILE_SIZE * 1.2;
        const sailWidth = TILE_SIZE * 0.15;
        const sailDepth = TILE_SIZE * 0.05;
        // Create a central hub for the sails
        const hubRadius = TILE_SIZE * 0.1;
        const hubGeometry = new THREE.CylinderGeometry(hubRadius, hubRadius, TILE_SIZE * 0.15, 8);
        const hubMaterial = new THREE.MeshPhongMaterial({ color: 0xA9A9A9 }); // DarkGrey
        const hubMesh = new THREE.Mesh(hubGeometry, hubMaterial);
        hubMesh.rotation.x = Math.PI / 2; // Orient hub to face forward
        sailsGroup.add(hubMesh);

        const sailGeometry = new THREE.BoxGeometry(sailWidth, sailLength, sailDepth);

        for (let i = 0; i < 4; i++) {
            const sailMesh = new THREE.Mesh(sailGeometry, sailMaterial);
            const angle = (Math.PI / 2) * i;

            // Position the sail relative to the hub, then rotate the whole group
            sailMesh.position.y = sailLength / 2; // Attach bottom of sail to center of hub arm
            
            const arm = new THREE.Object3D();
            arm.add(sailMesh);
            arm.rotation.z = angle;
            // Tilt sails slightly
            sailMesh.rotation.x = Math.PI / 12; // Small tilt

            sailsGroup.add(arm);
        }

        // Position sails group on the upper part of the base, slightly in front of the cap
        sailsGroup.position.set(0, baseHeight * 0.75, baseRadiusTop + TILE_SIZE * 0.05);
        modelGroup.add(sailsGroup);

        modelGroup.scale.set(0.9, 0.9, 0.9); // Adjust overall scale if needed

        return modelGroup;
    }

    update(deltaTime) {
        super.update(deltaTime);
        const sails = this.model ? this.model.getObjectByName('sailsGroup') : null;
        if (sails) {
            sails.rotation.z += 0.5 * deltaTime; // Rotate sails around Z-axis of the sailsGroup
        }
    }
}

export default Windmill;
