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
 * Creates a simple sapling model.
 * @param {object} [options] - Options for sapling generation.
 * @param {number} [options.height=0.8] - Height of the trunk.
 * @param {number} [options.radius=0.1] - Radius of the trunk.
 * @param {number} [options.leavesHeight=0.6] - Height of the leaves.
 * @param {number} [options.leavesRadius=0.3] - Radius of the leaves.
 * @returns {THREE.Group} A group containing the sapling model.
 */
export function createSapling(options = {}) {
    const { height = 0.8, radius = 0.1, leavesHeight = 0.6, leavesRadius = 0.3 } = options;
    const sapling = new THREE.Group();

    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(radius * 0.7, radius, height, 5); // Simpler geometry
    const trunkMesh = new THREE.Mesh(trunkGeometry, DEFAULT_TRUNK_MATERIAL);
    trunkMesh.position.y = height / 2;
    trunkMesh.castShadow = true;
    // sapling.receiveShadow = true; // Saplings might not need to receive shadows if small
    sapling.add(trunkMesh);

    // Leaves (simple sphere or small cone)
    const leavesGeometry = new THREE.SphereGeometry(leavesRadius, 5, 4); // Simpler geometry
    const leavesMesh = new THREE.Mesh(leavesGeometry, DEFAULT_LEAVES_MATERIAL);
    leavesMesh.position.y = height + leavesHeight / 2 - 0.05; // Adjust position
    leavesMesh.castShadow = true;
    sapling.add(leavesMesh);
    
    sapling.name = "SaplingResourceNode";
    return sapling;
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

// --- Tool Creation Functions ---

// Helper for tool handles
function createToolHandle(length = 0.4, radius = 0.02, color = 0x8B4513 /* SaddleBrown */) {
    const handleGeom = new THREE.CylinderGeometry(radius, radius, length, 6);
    const handleMesh = new THREE.Mesh(handleGeom, new THREE.MeshStandardMaterial({ color }));
    handleMesh.position.y = length / 2;
    return handleMesh;
}

// Helper for metallic tool heads
function createMetallicHead(geometry, color = 0xA9A9A9 /* DarkGray */) {
    return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.4 }));
}

export function createAxe() {
    const group = new THREE.Group();
    const handle = createToolHandle(0.5, 0.025);
    
    const headGeom = new THREE.BoxGeometry(0.04, 0.12, 0.08); // x: thickness, y: length along handle, z: width of blade edge
    const headMesh = createMetallicHead(headGeom);
    headMesh.position.y = 0.5; // Position at the top of the handle
    headMesh.position.x = 0.02; // Offset to one side
    headMesh.rotation.z = Math.PI / 5; // Angled blade
    
    group.add(handle);
    handle.add(headMesh); // Add head to handle for easier rotation as a unit
    group.name = "Axe";
    return group;
}

export function createPickaxe() {
    const group = new THREE.Group();
    const handle = createToolHandle(0.6, 0.025);

    const headLength = 0.25;
    const headThickness = 0.03;
    // Create two pointed ends for the pickaxe head
    const point1Geom = new THREE.ConeGeometry(headThickness, headLength / 2, 4);
    const point1Mesh = createMetallicHead(point1Geom);
    point1Mesh.rotation.z = Math.PI / 2;
    point1Mesh.position.x = headLength / 4;
    
    const point2Geom = new THREE.ConeGeometry(headThickness, headLength / 2, 4);
    const point2Mesh = createMetallicHead(point2Geom);
    point2Mesh.rotation.z = -Math.PI / 2;
    point2Mesh.position.x = -headLength / 4;

    const headGroup = new THREE.Group();
    headGroup.add(point1Mesh);
    headGroup.add(point2Mesh);
    headGroup.position.y = 0.6; // Top of the handle
    
    group.add(handle);
    handle.add(headGroup);
    group.name = "Pickaxe";
    return group;
}

export function createHammer() {
    const group = new THREE.Group();
    const handle = createToolHandle(0.4, 0.03);

    const headGeom = new THREE.BoxGeometry(0.1, 0.05, 0.05); // length, height, width
    const headMesh = createMetallicHead(headGeom);
    headMesh.position.y = 0.4; // Top of handle
    
    group.add(handle);
    handle.add(headMesh);
    group.name = "Hammer";
    return group;
}

export function createScythe() {
    const group = new THREE.Group();
    const handle = createToolHandle(0.7, 0.02);
    handle.rotation.x = Math.PI / 10; // Slight angle for scythe handle

    const bladeLength = 0.35;
    const bladeWidth = 0.05;
    const bladeGeom = new THREE.BoxGeometry(bladeWidth, 0.01, bladeLength); // Flat blade
    const bladeMesh = createMetallicHead(bladeGeom, 0xC0C0C0 /* Silver */);
    bladeMesh.position.set(bladeWidth/2, 0.65, bladeLength/2 - 0.02);
    bladeMesh.rotation.y = -Math.PI / 3; // Angled blade
    
    group.add(handle);
    handle.add(bladeMesh);
    group.name = "Scythe";
    return group;
}

export function createFishingRod() {
    const group = new THREE.Group();
    const rodLength = 0.8;
    const rodRadius = 0.01;
    const rodGeom = new THREE.CylinderGeometry(rodRadius, rodRadius * 0.7, rodLength, 6);
    const rodMesh = new THREE.Mesh(rodGeom, new THREE.MeshStandardMaterial({ color: 0x8B4513 })); // Brown
    rodMesh.position.y = rodLength / 2;
    group.add(rodMesh);
    group.name = "FishingRod";
    // Line and hook could be added later if needed
    return group;
}

export function createFlourSack() {
    const group = new THREE.Group();
    const sackGeom = new THREE.SphereGeometry(0.15, 8, 6); // Approximate shape
    // Deform for a more "sack-like" appearance
    const posAttr = sackGeom.getAttribute('position');
    for (let i = 0; i < posAttr.count; i++) {
        const y = posAttr.getY(i);
        if (y > 0.1) posAttr.setY(i, y * 0.8); // Pinch top
        posAttr.setX(i, posAttr.getX(i) * (1 + (Math.random()-0.5)*0.1));
        posAttr.setZ(i, posAttr.getZ(i) * (1 + (Math.random()-0.5)*0.1));
    }
    sackGeom.computeVertexNormals();
    const sackMesh = new THREE.Mesh(sackGeom, new THREE.MeshStandardMaterial({ color: 0xF5DEB3 /* Wheat */ }));
    sackMesh.scale.y = 1.2; // Make it taller
    sackMesh.position.y = 0.15 * 1.2 / 2;
    group.add(sackMesh);
    group.name = "FlourSack";
    return group;
}

export function createPlank() {
    const group = new THREE.Group();
    const plankGeom = new THREE.BoxGeometry(0.1, 0.03, 0.6); // width, thickness, length
    const plankMesh = new THREE.Mesh(plankGeom, DEFAULT_TRUNK_MATERIAL); // Use trunk material
    plankMesh.position.y = 0.015;
    group.add(plankMesh);
    group.name = "Plank";
    return group;
}

export function createGoldBar() {
    const group = new THREE.Group();
    // Trapezoidal prism shape for a gold bar
    const shape = new THREE.Shape();
    const w1 = 0.08, h = 0.04, w2 = 0.06; // bottom width, height, top width
    shape.moveTo(-w1/2, -h/2);
    shape.lineTo(w1/2, -h/2);
    shape.lineTo(w2/2, h/2);
    shape.lineTo(-w2/2, h/2);
    shape.closePath();
    const extrudeSettings = { depth: 0.03, bevelEnabled: false };
    const barGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const barMesh = new THREE.Mesh(barGeom, GOLD_SPECK_MATERIAL); // Use gold material
    barMesh.rotation.x = -Math.PI/2; // Lay flat
    barMesh.position.y = 0.015; // Depth/2
    group.add(barMesh);
    group.name = "GoldBar";
    return group;
}

export function createSword() {
    const group = new THREE.Group();
    const handle = createToolHandle(0.15, 0.015, 0x5C4033 /* Dark Brown */);
    handle.name = "SwordHilt";

    const crossguardWidth = 0.08;
    const crossguardGeom = new THREE.BoxGeometry(crossguardWidth, 0.02, 0.02);
    const crossguardMesh = createMetallicHead(crossguardGeom);
    crossguardMesh.position.y = 0.15; // Top of handle
    crossguardMesh.name = "SwordCrossguard";
    handle.add(crossguardMesh);

    const bladeLength = 0.5;
    const bladeWidth = 0.04;
    const bladeGeom = new THREE.BoxGeometry(bladeWidth, bladeLength, 0.01); // Flat blade
    const bladeMesh = createMetallicHead(bladeGeom, 0xD3D3D3 /* LightGray */);
    bladeMesh.position.y = 0.15 + bladeLength / 2;
    bladeMesh.name = "SwordBlade";
    handle.add(bladeMesh);
    
    group.add(handle);
    group.name = "Sword";
    return group;
}

export function createShield() {
    const group = new THREE.Group();
    const shieldRadius = 0.25;
    const shieldThickness = 0.03;
    // Slightly curved shield body
    const shieldGeom = new THREE.SphereGeometry(shieldRadius * 2, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.3);
    const shieldBody = new THREE.Mesh(shieldGeom, DEFAULT_TRUNK_MATERIAL); // Wooden shield
    shieldBody.scale.z = 0.2; // Flatten the sphere segment
    shieldBody.rotation.x = Math.PI/2;
    shieldBody.name = "ShieldBody";
    
    // Emblem (simple circle)
    const emblemGeom = new THREE.CircleGeometry(shieldRadius * 0.4, 8);
    const emblemMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, side: THREE.DoubleSide }); // Red emblem
    const emblemMesh = new THREE.Mesh(emblemGeom, emblemMaterial);
    emblemMesh.position.z = shieldThickness * 0.5 + 0.001; // On the front surface
    emblemMesh.name = "ShieldEmblem";

    shieldBody.add(emblemMesh);
    group.add(shieldBody);
    group.name = "Shield";
    return group;
}

export const RESOURCE_GENERATORS = {
    wood: createTree,
    stone: createRock,
    gold_ore: createGoldVein,
    fertile_land: createFertileLandMarker,
    sapling: createSapling, // Added sapling generator
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
