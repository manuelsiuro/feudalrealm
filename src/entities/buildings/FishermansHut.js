import * as THREE from 'three';
import Building from '../Building.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class FishermansHut extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry) {
        super(buildingDataEntry.key, gridX, gridZ, gameMap, buildingDataEntry);
        this.model = this.createModel();
    }

    createModel() {
        // From buildings.md: Key Colors: Light Blue, Dark Blue, Brown.
        // Hut: Small cuboid (color: Light Blue).
        const hutWidth = TILE_SIZE * 0.7;
        const hutHeight = TILE_SIZE * 0.6;
        const hutDepth = TILE_SIZE * 0.7;
        const geometry = new THREE.BoxGeometry(hutWidth, hutHeight, hutDepth);
        const material = new THREE.MeshStandardMaterial({ color: 0xADD8E6 }); // LightBlue
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Roof: A simple pyramidal roof (color: Dark Blue).
        const roofGeometry = new THREE.ConeGeometry(hutWidth * 0.8, TILE_SIZE * 0.4, 4); // Pyramid
        const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x00008B }); // DarkBlue
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        roofMesh.position.y = hutHeight * 0.5 + (TILE_SIZE * 0.4) / 2;
        roofMesh.rotation.y = Math.PI / 4;
        mesh.add(roofMesh);

        // Optional Pier: Thin, flat cuboid (color: Brown)
        const pierWidth = TILE_SIZE * 0.3;
        const pierHeight = TILE_SIZE * 0.1;
        const pierDepth = TILE_SIZE * 0.8; // Extends outwards
        const pierGeometry = new THREE.BoxGeometry(pierWidth, pierHeight, pierDepth);
        const pierMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // SaddleBrown
        const pierMesh = new THREE.Mesh(pierGeometry, pierMaterial);
        // Position it to extend from one side of the hut
        pierMesh.position.set(0, -hutHeight * 0.5 + pierHeight * 0.5, hutDepth * 0.5 + pierDepth * 0.5);
        mesh.add(pierMesh);

        return mesh;
    }
}

export default FishermansHut;
