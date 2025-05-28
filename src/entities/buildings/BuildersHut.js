import * as THREE from 'three';
import Building from '../Building.js';
import { BUILDING_DATA } from '../../config/buildingData.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class BuildersHut extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry, resourceFlowManager = null) {
        super(buildingDataEntry.key, gridX, gridZ, gameMap, buildingDataEntry, resourceFlowManager);

        this.model = this.createModel();
        if (this.model) {
            this.model.position.set(gridX * TILE_SIZE, 0, gridZ * TILE_SIZE);
            this.model.userData.building = this;
        }
    }

    createModel() {
        const modelGroup = new THREE.Group();

        // Hut: Very small, simple cuboid (color: Brown)
        const hutWidth = TILE_SIZE * 0.5;
        const hutHeight = TILE_SIZE * 0.4;
        const hutDepth = TILE_SIZE * 0.4;
        const hutGeometry = new THREE.BoxGeometry(hutWidth, hutHeight, hutDepth);
        const hutMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // Brown (SaddleBrown)
        const hutMesh = new THREE.Mesh(hutGeometry, hutMaterial);
        hutMesh.position.y = hutHeight / 2;
        modelGroup.add(hutMesh);

        // Roof (simple flat or slightly sloped)
        const roofMesh = new THREE.Mesh(
            new THREE.BoxGeometry(hutWidth + TILE_SIZE * 0.05, TILE_SIZE * 0.075, hutDepth + TILE_SIZE * 0.05),
            new THREE.MeshPhongMaterial({ color: 0x5C3317 }) // Dark Brown
        );
        roofMesh.position.y = hutHeight + (TILE_SIZE * 0.075) / 2;
        modelGroup.add(roofMesh);

        // Materials: Small stack of planks and stones
        // Planks (thin, light brown cuboids)
        const plankMaterial = new THREE.MeshPhongMaterial({ color: 0xDEB887 }); // BurlyWood (Light Brown)
        const plankThickness = TILE_SIZE * 0.025;
        const plankLength = TILE_SIZE * 0.25;
        const plankWidthStacked = TILE_SIZE * 0.1;
        for (let i = 0; i < 3; i++) {
            const plankMesh = new THREE.Mesh(new THREE.BoxGeometry(plankLength, plankThickness, plankWidthStacked), plankMaterial);
            plankMesh.position.set(hutWidth / 2 + TILE_SIZE * 0.075, plankThickness * i + plankThickness / 2, -TILE_SIZE * 0.05);
            modelGroup.add(plankMesh);
        }

        // Stones (grey cubes)
        const stoneMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 }); // Grey
        const stoneSize = TILE_SIZE * 0.075;
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                const stoneMesh = new THREE.Mesh(new THREE.BoxGeometry(stoneSize, stoneSize, stoneSize), stoneMaterial);
                stoneMesh.position.set(hutWidth / 2 + TILE_SIZE * 0.05 + stoneSize * i, stoneSize / 2 + stoneSize * j, TILE_SIZE * 0.15);
                modelGroup.add(stoneMesh);
            }
        }
        
        return modelGroup;
    }
}

export default BuildersHut;
