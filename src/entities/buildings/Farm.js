import * as THREE from 'three';
import Building from '../Building.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class Farm extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry) {
        super(buildingDataEntry.key, gridX, gridZ, gameMap, buildingDataEntry);
        this.model = this.createModel();
    }

    createModel() {
        const group = new THREE.Group();
        const houseColor = 0xF5F5DC; // Beige
        const roofColor = 0x8B4513;  // Red-Brown (SaddleBrown)

        // Farmhouse: Small, long, low cuboid
        const houseWidth = TILE_SIZE * 1.0; // "long"
        const houseHeight = TILE_SIZE * 0.5; // "low"
        const houseDepth = TILE_SIZE * 0.6;
        const houseGeometry = new THREE.BoxGeometry(houseWidth, houseHeight, houseDepth);
        const houseMaterial = new THREE.MeshStandardMaterial({ color: houseColor });
        const houseMesh = new THREE.Mesh(houseGeometry, houseMaterial);
        houseMesh.castShadow = true;
        houseMesh.receiveShadow = true;
        // houseMesh.position.y = houseHeight / 2; // Handled by group
        group.add(houseMesh);

        // Roof: Simple sloped cuboid roof
        // Using a slightly larger box as a cap. A true sloped roof is more complex.
        // For a simple gabled roof, two angled planes (cuboids) would be better.
        // Let's use a single, slightly wider and deeper cuboid for the roof base.
        const roofBaseWidth = houseWidth * 1.05;
        const roofBaseHeight = TILE_SIZE * 0.15;
        const roofBaseDepth = houseDepth * 1.05;
        const roofBaseGeometry = new THREE.BoxGeometry(roofBaseWidth, roofBaseHeight, roofBaseDepth);
        const roofMaterial = new THREE.MeshStandardMaterial({ color: roofColor });
        const roofBaseMesh = new THREE.Mesh(roofBaseGeometry, roofMaterial);
        roofBaseMesh.position.y = houseHeight / 2 + roofBaseHeight / 2 - TILE_SIZE * 0.02;
        roofBaseMesh.castShadow = true;
        roofBaseMesh.receiveShadow = true;
        group.add(roofBaseMesh);

        // Add two sloped parts for a gabled roof effect
        const roofSlopeHeight = TILE_SIZE * 0.3;
        const roofSlopeGeometry = new THREE.BoxGeometry(roofBaseWidth, roofSlopeHeight, houseDepth * 0.55); // Thinner than base
        
        const roofSlope1 = new THREE.Mesh(roofSlopeGeometry, roofMaterial);
        roofSlope1.position.set(0, roofBaseMesh.position.y + roofBaseHeight/2 + roofSlopeHeight*0.2, houseDepth * 0.25 / 2);
        roofSlope1.rotation.x = Math.PI / 6; // Angle for slope
        roofSlope1.castShadow = true;
        roofSlope1.receiveShadow = true;
        group.add(roofSlope1);

        const roofSlope2 = new THREE.Mesh(roofSlopeGeometry, roofMaterial);
        roofSlope2.position.set(0, roofBaseMesh.position.y + roofBaseHeight/2 + roofSlopeHeight*0.2, -houseDepth * 0.25 / 2);
        roofSlope2.rotation.x = -Math.PI / 6; // Angle for slope (opposite direction)
        roofSlope2.castShadow = true;
        roofSlope2.receiveShadow = true;
        group.add(roofSlope2);

        // Fields are not part of the building model itself, they are a terrain feature or separate entities.

        group.position.y = houseHeight / 2; // Adjust group pivot to be at the base of the farmhouse
        return group;
    }
}

export default Farm;
