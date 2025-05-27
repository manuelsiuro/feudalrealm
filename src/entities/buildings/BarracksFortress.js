import * as THREE from 'three';
import Building from '../Building.js';
import { BUILDING_DATA } from '../../config/buildingData.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class BarracksFortress extends Building {
    constructor(gridX, gridZ, gameMap) {
        const buildingDataEntry = BUILDING_DATA.BARRACKS_FORTRESS;
        super(buildingDataEntry.key, gridX, gridZ, gameMap, buildingDataEntry);

        this.model = this.createModel();
        if (this.model) {
            this.model.position.set(gridX * TILE_SIZE, 0, gridZ * TILE_SIZE);
            this.model.userData.building = this;
        }
    }

    createModel() {
        const modelGroup = new THREE.Group();

        // Aiming for overall width/depth of ~0.9 * TILE_SIZE.
        const targetTotalWidth = TILE_SIZE * 0.9;
        const targetTotalDepth = TILE_SIZE * 0.9;

        // Main Structure: A large, wide, medium-height cuboid (color: Dark Grey or Black)
        // Adjusted to be smaller to fit within the tile, considering towers.
        const mainWidth = targetTotalWidth * 0.7; // e.g., 70% of target for main, rest for towers
        const mainHeight = TILE_SIZE * 0.6; // Adjusted from 1.0
        const mainDepth = targetTotalDepth * 0.7; // e.g., 70% of target for main
        const mainMaterial = new THREE.MeshPhongMaterial({ color: 0x303030 }); // Very Dark Grey / Blackish
        const mainGeometry = new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth);
        const mainMesh = new THREE.Mesh(mainGeometry, mainMaterial);
        mainMesh.position.y = mainHeight / 2;
        mainMesh.castShadow = true;
        mainMesh.receiveShadow = true;
        modelGroup.add(mainMesh);

        // Roof (simple flat or slightly sloped)
        const roofMesh = new THREE.Mesh(
            new THREE.BoxGeometry(mainWidth + TILE_SIZE * 0.02, TILE_SIZE * 0.05, mainDepth + TILE_SIZE * 0.02), // Smaller overhang
            new THREE.MeshPhongMaterial({ color: 0x202020 }) // Even Darker Grey / Black
        );
        roofMesh.position.y = mainHeight + (TILE_SIZE * 0.05) / 2;
        roofMesh.castShadow = true;
        modelGroup.add(roofMesh);

        // Towers (Optional): Smaller square cuboids at the corners, slightly taller than the main structure
        // Tower size needs to allow the whole model (main + towers) to fit targetTotalWidth/Depth
        const towerSize = Math.min(targetTotalWidth * 0.25, targetTotalDepth * 0.25); // e.g. 25% of target for tower width/depth
        const towerHeight = mainHeight + TILE_SIZE * 0.15; // Adjusted from mainHeight + TILE_SIZE * 0.25
        const towerMaterial = new THREE.MeshPhongMaterial({ color: 0x404040 }); // Dark Grey
        const towerGeometry = new THREE.BoxGeometry(towerSize, towerHeight, towerSize);

        // Position towers at the corners of the *target* footprint, not just the main mesh
        const halfTargetWidth = targetTotalWidth / 2;
        const halfTargetDepth = targetTotalDepth / 2;

        const towerPositions = [
            new THREE.Vector3(halfTargetWidth - towerSize / 2, towerHeight / 2, halfTargetDepth - towerSize / 2),
            new THREE.Vector3(-halfTargetWidth + towerSize / 2, towerHeight / 2, halfTargetDepth - towerSize / 2),
            new THREE.Vector3(halfTargetWidth - towerSize / 2, towerHeight / 2, -halfTargetDepth + towerSize / 2),
            new THREE.Vector3(-halfTargetWidth + towerSize / 2, towerHeight / 2, -halfTargetDepth + towerSize / 2),
        ];

        const flagMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000 }); // Red
        const flagHeight = TILE_SIZE * 0.15; // Adjusted
        const flagRadius = TILE_SIZE * 0.05; // Adjusted
        const flagGeometry = new THREE.ConeGeometry(flagRadius, flagHeight, 4); // Small pyramid flag

        towerPositions.forEach(pos => {
            const towerMesh = new THREE.Mesh(towerGeometry, towerMaterial);
            towerMesh.position.copy(pos);
            towerMesh.castShadow = true;
            towerMesh.receiveShadow = true;
            modelGroup.add(towerMesh);

            // Accents: Red pyramidal flags on any towers
            const flagMesh = new THREE.Mesh(flagGeometry, flagMaterial);
            // Position flag on top of tower, relative to tower's local origin (which is its center)
            flagMesh.position.set(0, towerHeight / 2 + flagHeight / 2, 0); 
            flagMesh.rotation.y = Math.PI / 4;
            towerMesh.add(flagMesh); // Add flag as a child of the tower mesh
        });
        
        // Ensure all children have shadows enabled
        modelGroup.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return modelGroup;
    }
}

export default BarracksFortress;
