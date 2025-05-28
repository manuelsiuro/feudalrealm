import * as THREE from 'three';
import Building from '../Building.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class GeologistsHut extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry, resourceFlowManager = null) {
        super(buildingDataEntry.key, gridX, gridZ, gameMap, buildingDataEntry, resourceFlowManager);
        this.model = this.createModel();
    }

    createModel() {
        const group = new THREE.Group();

        // Hut: Very small cuboid (Dark Brown)
        const hutWidth = TILE_SIZE * 0.6;
        const hutHeight = TILE_SIZE * 0.5;
        const hutDepth = TILE_SIZE * 0.6;
        const hutGeometry = new THREE.BoxGeometry(hutWidth, hutHeight, hutDepth);
        const hutMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 }); // Dark Brown
        const hutMesh = new THREE.Mesh(hutGeometry, hutMaterial);
        hutMesh.position.y = hutHeight / 2; // Position base at y=0 of the group
        group.add(hutMesh);

        // Roof: Flat roof (using the top of the hut cuboid)

        // Marker: Small, bright yellow cone on top
        const markerRadius = TILE_SIZE * 0.1;
        const markerHeight = TILE_SIZE * 0.3;
        const markerGeometry = new THREE.ConeGeometry(markerRadius, markerHeight, 4); // Cone as marker
        const markerMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00 }); // Yellow
        const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
        markerMesh.position.y = hutHeight + markerHeight / 2; // Position on top of the hut
        group.add(markerMesh);
        
        return group;
    }
}

export default GeologistsHut;
