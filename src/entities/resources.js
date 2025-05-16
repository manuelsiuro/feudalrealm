import * as THREE from 'three';

const DEFAULT_LEAVES_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8, metalness: 0.1 }); // ForestGreen
const DEFAULT_TRUNK_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9, metalness: 0.1 }); // SaddleBrown
const DEFAULT_ROCK_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.7, metalness: 0.2 });    // DimGray
const GOLD_SPECK_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0x332200, roughness: 0.4, metalness: 0.8 }); // Gold

/**
 * Creates a simple tree model.
 * @param {object} [options] - Options for tree generation.
 * @param {number} [options.height=2] - Height of the trunk.
 * @param {number} [options.radius=0.2] - Radius of the trunk.
 * @param {number} [options.leavesHeight=1.5] - Height of the leaves cone.
 * @param {number} [options.leavesRadius=0.8] - Radius of the leaves cone.
 * @returns {THREE.Group} A group containing the tree model.
 */
export function createTree(options = {}) {
    const { height = 2, radius = 0.2, leavesHeight = 1.5, leavesRadius = 0.8 } = options;
    const tree = new THREE.Group();

    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(radius * 0.7, radius, height, 8);
    const trunkMesh = new THREE.Mesh(trunkGeometry, DEFAULT_TRUNK_MATERIAL);
    trunkMesh.position.y = height / 2;
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    tree.add(trunkMesh);

    // Leaves (simple cone)
    const leavesGeometry = new THREE.ConeGeometry(leavesRadius, leavesHeight, 8);
    const leavesMesh = new THREE.Mesh(leavesGeometry, DEFAULT_LEAVES_MATERIAL);
    leavesMesh.position.y = height + leavesHeight / 2 - 0.1; // Slightly overlap with trunk
    leavesMesh.castShadow = true;
    leavesMesh.receiveShadow = true;
    tree.add(leavesMesh);
    
    tree.name = "TreeResourceNode";
    return tree;
}

/**
 * Creates a simple rock model.
 * @param {object} [options] - Options for rock generation.
 * @param {number} [options.size=0.5] - Approximate size of the rock.
 * @returns {THREE.Mesh} A mesh representing the rock.
 */
export function createRock(options = {}) {
    const { size = 0.5 } = options;
    // Irregular shape using IcosahedronGeometry with some distortion
    const rockGeometry = new THREE.IcosahedronGeometry(size, 0); // Low detail for faceted look
    
    // Slightly deform vertices for irregularity
    const positionAttribute = rockGeometry.getAttribute('position');
    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);
        positionAttribute.setXYZ(
            i,
            x * (1 + (Math.random() - 0.5) * 0.4),
            y * (1 + (Math.random() - 0.5) * 0.4),
            z * (1 + (Math.random() - 0.5) * 0.4)
        );
    }
    rockGeometry.computeVertexNormals(); // Recalculate normals after deformation

    const rockMesh = new THREE.Mesh(rockGeometry, DEFAULT_ROCK_MATERIAL);
    rockMesh.castShadow = true;
    rockMesh.receiveShadow = true;
    rockMesh.position.y = size * 0.5; // Position base at y=0
    rockMesh.name = "RockResourceNode";
    return rockMesh;
}

/**
 * Creates a gold vein model (rock with gold specks).
 * @param {object} [options] - Options for gold vein generation.
 * @param {number} [options.size=0.6] - Approximate size of the rock.
 * @param {number} [options.speckCount=5] - Number of gold specks.
 * @returns {THREE.Group} A group containing the gold vein model.
 */
export function createGoldVein(options = {}) {
    const { size = 0.6, speckCount = 5 } = options;
    const goldVein = new THREE.Group();

    // Base rock
    const baseRock = createRock({ size: size });
    goldVein.add(baseRock);

    // Gold specks
    const speckGeometry = new THREE.SphereGeometry(size * 0.05, 6, 6);
    for (let i = 0; i < speckCount; i++) {
        const speck = new THREE.Mesh(speckGeometry, GOLD_SPECK_MATERIAL);
        // Place specks randomly on the surface of an approximate sphere
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        const r = size * 0.5 * (0.8 + Math.random() * 0.2); // Slightly inside or on surface

        speck.position.set(
            r * Math.sin(theta) * Math.cos(phi),
            r * Math.sin(theta) * Math.sin(phi) + size * 0.5, // Adjust Y to be relative to rock base
            r * Math.cos(theta)
        );
        speck.castShadow = true; // Small specks might not need to cast shadows
        goldVein.add(speck);
    }
    goldVein.name = "GoldVeinResourceNode";
    return goldVein;
}

/**
 * Creates a subtle marker for fertile land.
 * Could be a decal or a very flat, slightly different colored plane.
 * For now, a very thin, slightly darker green disc.
 * @param {object} [options] - Options for the marker.
 * @param {number} [options.radius=1] - Radius of the marker disc.
 * @returns {THREE.Mesh} A mesh representing the fertile land marker.
 */
export function createFertileLandMarker(options = {}) {
    const { radius = 1 } = options;
    const markerGeometry = new THREE.CircleGeometry(radius, 16);
    const markerMaterial = new THREE.MeshStandardMaterial({
        color: 0x2E8B57, // SeaGreen, slightly different from grassland
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
    });
    const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
    markerMesh.rotation.x = -Math.PI / 2; // Lay flat
    markerMesh.position.y = 0.05; // Slightly above ground to avoid z-fighting
    markerMesh.receiveShadow = true; // Should receive shadows, but not cast much
    markerMesh.name = "FertileLandMarker";
    return markerMesh;
}


export const RESOURCE_GENERATORS = {
    wood: createTree,
    stone: createRock,
    gold_ore: createGoldVein,
    fertile_land: createFertileLandMarker,
    // fish: createFishSchool // Placeholder for later
};

// Example usage (for testing in a previewer if needed):
export function createAllResourceExamples(spacing = 5) {
    const group = new THREE.Group();
    let i = 0;

    const tree = createTree({ height: 3, leavesRadius: 1.2 });
    tree.position.x = i++ * spacing;
    group.add(tree);

    const rock = createRock({ size: 1 });
    rock.position.x = i++ * spacing;
    group.add(rock);

    const goldVein = createGoldVein({ size: 1, speckCount: 10 });
    goldVein.position.x = i++ * spacing;
    group.add(goldVein);
    
    const fertileMarker = createFertileLandMarker({ radius: 1.5 });
    fertileMarker.position.x = i++ * spacing;
    group.add(fertileMarker);

    return group;
}
