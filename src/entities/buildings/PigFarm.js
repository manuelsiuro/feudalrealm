import * as THREE from 'three';
import Building from '../Building.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class PigFarm extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry) {
        super(buildingDataEntry.key, gridX, gridZ, gameMap, buildingDataEntry);
        this.model = this.createModel();
    }

    createModel() {
        const group = new THREE.Group();
        const styColor = 0xD2B48C; // Light Brown (Tan)
        const fenceColor = 0x654321; // Dark Brown
        const pigColor = 0xFFC0CB; // Pink

        // Sty: Long, low cuboid building
        const styWidth = TILE_SIZE * 1.2;
        const styHeight = TILE_SIZE * 0.5;
        const styDepth = TILE_SIZE * 0.6;
        const styGeometry = new THREE.BoxGeometry(styWidth, styHeight, styDepth);
        const styMaterial = new THREE.MeshStandardMaterial({ color: styColor });
        const styMesh = new THREE.Mesh(styGeometry, styMaterial);
        styMesh.castShadow = true;
        styMesh.receiveShadow = true;
        // styMesh.position.y = styHeight / 2; // Will be handled by group
        group.add(styMesh);

        // Pen: Adjacent area enclosed by thin vertical cuboids (fence posts)
        const penWidth = TILE_SIZE * 1.0;
        const penDepth = TILE_SIZE * 1.0;
        const fenceHeight = TILE_SIZE * 0.4;
        const postSize = TILE_SIZE * 0.05;
        const fenceMaterial = new THREE.MeshStandardMaterial({ color: fenceColor });

        const penGroup = new THREE.Group();
        // Position pen next to the sty (e.g., in front of it)
        penGroup.position.set(0, 0, styDepth / 2 + penDepth / 2 + TILE_SIZE * 0.05);

        const posts = [];
        const numPostsX = 5;
        const numPostsZ = 5;

        // Create posts along X edges (front and back of pen)
        for (let i = 0; i < numPostsX; i++) {
            const x = -penWidth / 2 + i * (penWidth / (numPostsX - 1));
            posts.push({ x: x, y: 0, z: -penDepth / 2 });
            posts.push({ x: x, y: 0, z: penDepth / 2 });
        }
        // Create posts along Z edges (sides of pen), excluding corners already covered
        for (let i = 1; i < numPostsZ - 1; i++) {
            const z = -penDepth / 2 + i * (penDepth / (numPostsZ - 1));
            posts.push({ x: -penWidth / 2, y: 0, z: z });
            posts.push({ x: penWidth / 2, y: 0, z: z });
        }

        posts.forEach(pos => {
            const postGeometry = new THREE.BoxGeometry(postSize, fenceHeight, postSize);
            const post = new THREE.Mesh(postGeometry, fenceMaterial);
            post.position.set(pos.x, fenceHeight / 2, pos.z); // Position post relative to penGroup center, base at y=0
            post.castShadow = true;
            penGroup.add(post);
        });
        group.add(penGroup);

        // Pigs (Optional): Tiny pinkish spheres or rounded cuboids within the pen
        const pigRadius = TILE_SIZE * 0.1;
        const pigGeometry = new THREE.SphereGeometry(pigRadius, 8, 6);
        const pigMaterial = new THREE.MeshStandardMaterial({ color: pigColor });

        for (let i = 0; i < 2; i++) { // Add 2 pigs
            const pig = new THREE.Mesh(pigGeometry, pigMaterial);
            pig.position.set(
                (Math.random() - 0.5) * penWidth * 0.6, // Randomly within pen x
                pigRadius,                             // On the ground of the pen
                (Math.random() - 0.5) * penDepth * 0.6  // Randomly within pen z
            );
            pig.castShadow = true;
            penGroup.add(pig); // Add pigs to the penGroup
        }

        group.position.y = styHeight / 2; // Adjust group pivot to be at the base of the sty
        return group;
    }
}

export default PigFarm;
