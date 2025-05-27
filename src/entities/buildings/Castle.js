// src/entities/buildings/Castle.js
import * as THREE from 'three';
import Building from '../Building.js';
import { TILE_SIZE } from '../../config/mapConstants.js'; // Assuming TILE_SIZE might be useful for scaling

class Castle extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry) {
        super(buildingDataEntry.key, gridX, gridZ, gameMap, buildingDataEntry); // Use buildingDataEntry.key
        this.model = this.createModel();
    }

    createModel() {
        const modelGroup = new THREE.Group();
        modelGroup.name = 'CastleModel';

        // Key Colors: Medium Grey, Dark Grey, Light Grey, Red.
        const mediumGrey = 0x808080;
        const darkGrey = 0xA9A9A9; // Corrected to be visually distinct from medium
        const lightGrey = 0xD3D3D3;
        const red = 0xFF0000;

        // Base: Large, wide, medium-height square cuboid (color: Medium Grey).
        const baseWidth = TILE_SIZE * 1.8;
        const baseHeight = TILE_SIZE * 0.8;
        const baseDepth = TILE_SIZE * 1.8;
        const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: mediumGrey });
        const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        modelGroup.add(baseMesh);

        // Keep: Centered on the base, a taller, slightly narrower square cuboid (color: Dark Grey).
        const keepWidth = baseWidth * 0.6;
        const keepHeight = TILE_SIZE * 1.2; // Taller than base
        const keepDepth = baseDepth * 0.6;
        const keepGeometry = new THREE.BoxGeometry(keepWidth, keepHeight, keepDepth);
        const keepMaterial = new THREE.MeshStandardMaterial({ color: darkGrey });
        const keepMesh = new THREE.Mesh(keepGeometry, keepMaterial);
        keepMesh.position.y = baseHeight * 0.5 + keepHeight * 0.5; // Stack on top of base
        keepMesh.castShadow = true;
        keepMesh.receiveShadow = true;
        modelGroup.add(keepMesh);

        // Towers: Four smaller square cuboids at each corner of the base, 
        // slightly taller than the base but shorter than the keep (color: Light Grey). 
        // Each tower is topped with a small, sharp pyramid (color: Red).
        const towerSize = TILE_SIZE * 0.4;
        const towerHeight = baseHeight * 1.2; // Slightly taller than base
        const pyramidHeight = TILE_SIZE * 0.2;

        const towerPositions = [
            { x: baseWidth * 0.5 - towerSize * 0.5, z: baseDepth * 0.5 - towerSize * 0.5 },
            { x: -baseWidth * 0.5 + towerSize * 0.5, z: baseDepth * 0.5 - towerSize * 0.5 },
            { x: baseWidth * 0.5 - towerSize * 0.5, z: -baseDepth * 0.5 + towerSize * 0.5 },
            { x: -baseWidth * 0.5 + towerSize * 0.5, z: -baseDepth * 0.5 + towerSize * 0.5 },
        ];

        towerPositions.forEach(pos => {
            const towerGroup = new THREE.Group();

            const towerGeometry = new THREE.BoxGeometry(towerSize, towerHeight, towerSize);
            const towerMaterial = new THREE.MeshStandardMaterial({ color: lightGrey });
            const towerMesh = new THREE.Mesh(towerGeometry, towerMaterial);
            towerMesh.position.y = baseHeight * 0.5; // Align bottom with base top
            towerMesh.castShadow = true;
            towerMesh.receiveShadow = true;
            towerGroup.add(towerMesh);

            const pyramidGeometry = new THREE.ConeGeometry(towerSize * 0.7, pyramidHeight, 4); // Sharp pyramid
            const pyramidMaterial = new THREE.MeshStandardMaterial({ color: red });
            const pyramidMesh = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
            pyramidMesh.position.y = baseHeight * 0.5 + towerHeight * 0.5 + pyramidHeight * 0.5;
            pyramidMesh.rotation.y = Math.PI / 4; // Align flat sides
            pyramidMesh.castShadow = true;
            pyramidMesh.receiveShadow = true;
            towerGroup.add(pyramidMesh);
            
            towerGroup.position.set(pos.x, 0, pos.z); // Position the group, Y is relative to baseMesh center
            modelGroup.add(towerGroup);
        });
        
        // Entrance: A darker grey rectangular indentation on one side of the base.
        const entranceWidth = baseWidth * 0.3;
        const entranceHeight = baseHeight * 0.5;
        const entranceDepth = TILE_SIZE * 0.1; // Indentation depth
        const entranceGeometry = new THREE.BoxGeometry(entranceWidth, entranceHeight, entranceDepth);
        // Use a slightly darker shade of medium grey for indentation
        const entranceMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(mediumGrey).multiplyScalar(0.7).getHex() });
        const entranceMesh = new THREE.Mesh(entranceGeometry, entranceMaterial);
        // Position on the front face of the base, slightly indented
        entranceMesh.position.set(0, -baseHeight * 0.25 + entranceHeight * 0.5, baseDepth * 0.5 - entranceDepth * 0.4);
        entranceMesh.receiveShadow = true; // Indentation would receive shadow
        modelGroup.add(entranceMesh);


        return modelGroup;
    }

    update(deltaTime, currentTime) {
        super.update(deltaTime, currentTime); // Call base class update

        // Castles typically don't have active production in this game's context
        // but might have other logic (e.g., spawning units, research) in a more complex game.
        // For now, it's passive.
    }
}

export default Castle;
