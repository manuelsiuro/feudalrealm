import * as THREE from 'three';
import Building from '../Building.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class Bakery extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry) {
        super(buildingDataEntry.key, gridX, gridZ, gameMap, buildingDataEntry);
        this.model = this.createModel();
    }

    createModel() {
        const group = new THREE.Group();

        const buildingColor = 0xD2691E; // Terracotta (Chocolate)
        const roofColor = 0x654321;     // Dark Brown
        const chimneyColor = 0x36454F;  // Dark Grey (Charcoal)
        const emberColor = 0xFF0000;    // Red

        // Main Building: Medium cuboid
        const mainWidth = TILE_SIZE * 0.9;
        const mainHeight = TILE_SIZE * 0.8;
        const mainDepth = TILE_SIZE * 0.7;
        const mainGeometry = new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth);
        const mainMaterial = new THREE.MeshStandardMaterial({ color: buildingColor });
        const mainMesh = new THREE.Mesh(mainGeometry, mainMaterial);
        group.add(mainMesh);

        // Roof: Simple sloped cuboid roof (Dark Brown)
        // A slightly larger flat cuboid to represent a simple roof cap
        const roofWidth = mainWidth * 1.05;
        const roofHeight = TILE_SIZE * 0.2;
        const roofDepth = mainDepth * 1.05;
        const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
        const roofMaterial = new THREE.MeshStandardMaterial({ color: roofColor });
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        roofMesh.position.y = mainHeight / 2 + roofHeight / 2 - TILE_SIZE * 0.02; // Position on top of the main building
        group.add(roofMesh);

        // Chimney: Taller, thin square cuboid (Dark Grey or Black)
        const chimneySize = TILE_SIZE * 0.15;
        const chimneyHeightAbsolute = TILE_SIZE * 0.7; // Absolute height for chimney
        const chimneyGeometry = new THREE.BoxGeometry(chimneySize, chimneyHeightAbsolute, chimneySize);
        const chimneyMaterial = new THREE.MeshStandardMaterial({ color: chimneyColor });
        const chimneyMesh = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
        // Position chimney at the back-right relative to building center, standing on the ground, rising through roof
        chimneyMesh.position.set(
            mainWidth / 2 - chimneySize, // To the side (e.g., right)
            chimneyHeightAbsolute / 2 - mainHeight/2,  // Base of chimney starts from building's base height
            -mainDepth / 2 + chimneySize / 2 // To the rear
        );
        group.add(chimneyMesh);

        // Embers: Tiny red cube on top of chimney
        const emberSize = TILE_SIZE * 0.05;
        const emberGeometry = new THREE.BoxGeometry(emberSize, emberSize, emberSize);
        const emberMaterial = new THREE.MeshStandardMaterial({ color: emberColor, emissive: emberColor });
        const emberMesh = new THREE.Mesh(emberGeometry, emberMaterial);
        // Position embers on top of the chimney (relative to chimney's center)
        emberMesh.position.y = chimneyHeightAbsolute / 2 + emberSize / 2;
        chimneyMesh.add(emberMesh); // Add embers as a child of the chimney

        group.position.y = mainHeight / 2; // Adjust group pivot to be at the base of the main building
        return group;
    }
}

export default Bakery;
