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

        // Main Structure: A large, wide, medium-height cuboid (color: Dark Grey or Black)
        const mainWidth = TILE_SIZE * 1.75;
        const mainHeight = TILE_SIZE * 1.0;
        const mainDepth = TILE_SIZE * 1.25;
        const mainMaterial = new THREE.MeshPhongMaterial({ color: 0x303030 }); // Very Dark Grey / Blackish
        const mainGeometry = new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth);
        const mainMesh = new THREE.Mesh(mainGeometry, mainMaterial);
        mainMesh.position.y = mainHeight / 2;
        modelGroup.add(mainMesh);

        // Roof (simple flat or slightly sloped)
        const roofMesh = new THREE.Mesh(
            new THREE.BoxGeometry(mainWidth + TILE_SIZE * 0.05, TILE_SIZE * 0.1, mainDepth + TILE_SIZE * 0.05),
            new THREE.MeshPhongMaterial({ color: 0x202020 }) // Even Darker Grey / Black
        );
        roofMesh.position.y = mainHeight + (TILE_SIZE * 0.1) / 2;
        modelGroup.add(roofMesh);

        // Towers (Optional): Smaller square cuboids at the corners, slightly taller than the main structure
        const towerSize = TILE_SIZE * 0.4;
        const towerHeight = mainHeight + TILE_SIZE * 0.25;
        const towerMaterial = new THREE.MeshPhongMaterial({ color: 0x404040 }); // Dark Grey
        const towerGeometry = new THREE.BoxGeometry(towerSize, towerHeight, towerSize);

        const towerPositions = [
            new THREE.Vector3(mainWidth / 2 - towerSize / 2, towerHeight / 2, mainDepth / 2 - towerSize / 2),
            new THREE.Vector3(-mainWidth / 2 + towerSize / 2, towerHeight / 2, mainDepth / 2 - towerSize / 2),
            new THREE.Vector3(mainWidth / 2 - towerSize / 2, towerHeight / 2, -mainDepth / 2 + towerSize / 2),
            new THREE.Vector3(-mainWidth / 2 + towerSize / 2, towerHeight / 2, -mainDepth / 2 + towerSize / 2),
        ];

        const flagMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000 }); // Red
        const flagGeometry = new THREE.ConeGeometry(TILE_SIZE * 0.075, TILE_SIZE * 0.2, 4); // Small pyramid flag

        towerPositions.forEach(pos => {
            const towerMesh = new THREE.Mesh(towerGeometry, towerMaterial);
            towerMesh.position.copy(pos);
            modelGroup.add(towerMesh);

            // Accents: Red pyramidal flags on any towers
            const flagMesh = new THREE.Mesh(flagGeometry, flagMaterial);
            flagMesh.position.set(pos.x, towerHeight + (TILE_SIZE * 0.2) / 2, pos.z); // Position flag on top of tower
            flagMesh.rotation.y = Math.PI / 4;
            modelGroup.add(flagMesh);
        });
        
        return modelGroup;
    }
}

export default BarracksFortress;
