import * as THREE from 'three';
import Building from '../Building.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class Quarry extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry, resourceFlowManager = null) {
        super(buildingDataEntry.key, gridX, gridZ, gameMap, buildingDataEntry, resourceFlowManager);
        this.model = this.createModel();
    }

    createModel() {
        const modelGroup = new THREE.Group();
        modelGroup.name = 'QuarryModel';

        // From buildings.md: Key Colors: Grey, Light Grey.
        const grey = 0x808080; // Grey
        const lightGrey = 0xD3D3D3; // LightGrey

        // Structure: A small, open-fronted cuboid shelter (color: Grey).
        const shelterWidth = TILE_SIZE * 0.8;
        const shelterHeight = TILE_SIZE * 0.7;
        const shelterDepth = TILE_SIZE * 0.5;
        const shelterGeometry = new THREE.BoxGeometry(shelterWidth, shelterHeight, shelterDepth);
        const shelterMaterial = new THREE.MeshStandardMaterial({ color: grey });
        const shelterMesh = new THREE.Mesh(shelterGeometry, shelterMaterial);
        // shelterMesh.castShadow = true;
        // shelterMesh.receiveShadow = true;
        // Position shelter slightly back to make space for terrain and stones
        shelterMesh.position.z = TILE_SIZE * 0.1;
        shelterMesh.position.y = shelterHeight / 2; // Corrected Y position
        modelGroup.add(shelterMesh);

        // Represent a patch of rough terrain (several jagged light grey cuboids)
        // These will be positioned as if the shelter is built against them.
        const terrainPiece1Geometry = new THREE.BoxGeometry(TILE_SIZE * 0.3, TILE_SIZE * 0.4, TILE_SIZE * 0.3);
        const terrainMaterial = new THREE.MeshStandardMaterial({ color: lightGrey });
        const terrainPiece1 = new THREE.Mesh(terrainPiece1Geometry, terrainMaterial);
        terrainPiece1.position.set(-shelterWidth * 0.2, (TILE_SIZE * 0.4) / 2, shelterDepth * 0.5 + TILE_SIZE * 0.05); // Corrected Y position
        terrainPiece1.rotation.y = Math.PI / 7;
        terrainPiece1.rotation.x = Math.PI / 11;
        // terrainPiece1.castShadow = true;
        // terrainPiece1.receiveShadow = true;
        modelGroup.add(terrainPiece1);

        const terrainPiece2Geometry = new THREE.BoxGeometry(TILE_SIZE * 0.25, TILE_SIZE * 0.5, TILE_SIZE * 0.25);
        const terrainPiece2 = new THREE.Mesh(terrainPiece2Geometry, terrainMaterial);
        terrainPiece2.position.set(shelterWidth * 0.15, (TILE_SIZE * 0.5) / 2, shelterDepth * 0.5 + TILE_SIZE * 0.1); // Corrected Y position
        terrainPiece2.rotation.y = -Math.PI / 5;
        terrainPiece2.rotation.z = Math.PI / 13;
        // terrainPiece2.castShadow = true;
        // terrainPiece2.receiveShadow = true;
        modelGroup.add(terrainPiece2);
        
        // Output: A few loose medium-sized cubes (stone blocks) outside (color: Light Grey)
        const stoneSize = TILE_SIZE * 0.18;
        const stoneGeometry = new THREE.BoxGeometry(stoneSize, stoneSize, stoneSize);
        const stoneMaterial = new THREE.MeshStandardMaterial({ color: lightGrey });
        
        const stone1 = new THREE.Mesh(stoneGeometry, stoneMaterial);
        // Position in front of the shelter opening
        stone1.position.set(shelterWidth * 0.2, stoneSize / 2, -shelterDepth * 0.5 - TILE_SIZE * 0.05); // Corrected Y position
        // stone1.castShadow = true;
        // stone1.receiveShadow = true;
        modelGroup.add(stone1);

        const stone2 = new THREE.Mesh(stoneGeometry, stoneMaterial);
        stone2.position.set(-shelterWidth * 0.1, stoneSize / 2, -shelterDepth * 0.5 - TILE_SIZE * 0.1); // Corrected Y position
        stone2.rotation.y = Math.PI / 6;
        // stone2.castShadow = true;
        // stone2.receiveShadow = true;
        modelGroup.add(stone2);

        return modelGroup;
    }
}

export default Quarry;
