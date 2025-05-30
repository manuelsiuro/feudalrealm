import * as THREE from 'three';
import Building from '../Building.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class ForestersHut extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry, resourceFlowManager = null) {
        super(buildingDataEntry.key, gridX, gridZ, gameMap, buildingDataEntry, resourceFlowManager);
        // Model will be created when construction starts or if building is pre-constructed
    }

    createModel() {
        const modelGroup = new THREE.Group(); // Use a group to hold all parts
        modelGroup.name = 'ForestersHutModel';

        // From buildings.md: Key Colors: Brown, Dark Green, Green.
        const brown = 0xA52A2A; // Brown
        const darkGreen = 0x006400; // DarkGreen
        const green = 0x00FF00; // Green

        // Hut: Small, low cuboid (color: Brown).
        const hutWidth = TILE_SIZE * 0.65;
        const hutHeight = TILE_SIZE * 0.5;
        const hutDepth = TILE_SIZE * 0.6;
        const hutGeometry = new THREE.BoxGeometry(hutWidth, hutHeight, hutDepth);
        const hutMaterial = new THREE.MeshStandardMaterial({ color: brown });
        const hutMesh = new THREE.Mesh(hutGeometry, hutMaterial);
        hutMesh.position.y = hutHeight / 2; // Position base at y=0
        modelGroup.add(hutMesh); // Add to group

        // Roof: A simple pyramid roof (color: Dark Green).
        // Make roof slightly larger than hut base for overhang
        const roofRadius = Math.max(hutWidth, hutDepth) * 0.5 * 1.1; 
        const roofHeight = TILE_SIZE * 0.4;
        const roofGeometry = new THREE.ConeGeometry(roofRadius, roofHeight, 4); // Pyramid shape
        const roofMaterial = new THREE.MeshStandardMaterial({ color: darkGreen });
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        // Position on top of the hut body
        roofMesh.position.y = hutHeight + roofHeight / 2; 
        roofMesh.rotation.y = Math.PI / 4; // Align pyramid faces
        modelGroup.add(roofMesh); // Add to group
        
        // Sapling: A tiny green cone next to the hut.
        const saplingRadius = TILE_SIZE * 0.08;
        const saplingHeight = TILE_SIZE * 0.25;
        const saplingGeometry = new THREE.ConeGeometry(saplingRadius, saplingHeight, 8);
        const saplingMaterial = new THREE.MeshStandardMaterial({ color: green });
        const saplingMesh = new THREE.Mesh(saplingGeometry, saplingMaterial);
        // Position next to the hut, base at y=0
        saplingMesh.position.set(hutWidth * 0.5 + saplingRadius * 1.5, saplingHeight / 2, 0);
        modelGroup.add(saplingMesh); // Add to group
        
        return modelGroup; // Return the group
    }
}

export default ForestersHut;
