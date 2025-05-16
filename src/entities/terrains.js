import * as THREE from 'three';

// Helper function to create a mesh (can be moved to a shared utils.js later)
function createMesh(geometry, color, name = '') {
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

const TERRAIN_COLORS = {
    // Grassland
    LAWN_GREEN: 0x7CFC00,
    LIGHT_GREEN: 0x90EE90,
    FOREST_GREEN: 0x228B22, // Also for bushes
    GREY_ROCK: 0x808080,

    // Forest
    DARK_GREEN_FOREST_GROUND: 0x006400, // Also for bushes/undergrowth
    BROWN_FOREST_GROUND: 0xA52A2A,
    SADDLE_BROWN_TRUNK: 0x8B4513,
    SIENNA_TRUNK: 0xA0522D,
    SEA_GREEN_CANOPY: 0x2E8B57,
    GREEN_CANOPY: 0x008000,
    DARK_GREEN_CONIFER: 0x013220,
    OLIVE_UNDERGROWTH: 0x808000,

    // Mountain
    GREY_MOUNTAIN: 0x808080,
    DARK_GREY_MOUNTAIN: 0xA9A9A9,
    WHITE_SNOW: 0xFFFFFF,
    BROWNISH_GREY_SLOPE: 0x5D5D5D,
    DARK_GREY_BOULDER: 0x696969,

    // Water
    BLUE_WATER: 0x0000FF,
    LIGHT_BLUE_WATER: 0xADD8E6,
    TURQUOISE_WATER: 0x40E0D0,
    DARK_BLUE_WATER_DEPTH: 0x00008B,
    WHITE_WAVE_CREST: 0xFFFFFF,

    // Desert
    SANDY_YELLOW_DUNE: 0xF4A460,
    LIGHT_BROWN_DUNE: 0xD2B48C,
    ORANGE_TAN_DUNE: 0xE4A672,
    BEIGE_DESERT_FLOOR: 0xF5F5DC,
    GREEN_CACTUS: 0x228B22,
    BROWN_DESERT_ROCK: 0xA52A2A,
};

export function createGrassland(size = { width: 10, depth: 10 }) {
    const group = new THREE.Group();
    group.name = 'Grassland';

    const groundGeom = new THREE.PlaneGeometry(size.width, size.depth, 10, 10);
    const groundMesh = createMesh(groundGeom, TERRAIN_COLORS.LAWN_GREEN, 'GroundPlane');
    groundMesh.rotation.x = -Math.PI / 2;
    group.add(groundMesh);

    // Gentle Hills (optional example)
    const numHills = Math.floor(Math.random() * 3) + 1; // 1 to 3 hills
    for (let i = 0; i < numHills; i++) {
        const hillRadius = Math.random() * (size.width / 8) + (size.width / 10);
        const hillHeight = Math.random() * 0.5 + 0.2;
        const hillGeom = new THREE.SphereGeometry(hillRadius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const hillMesh = createMesh(hillGeom, TERRAIN_COLORS.LIGHT_GREEN, `Hill_${i}`);
        hillMesh.scale.y = hillHeight / hillRadius; // Squash it
        hillMesh.position.set(
            (Math.random() - 0.5) * size.width * 0.7,
            0, // Base of the hill is on the ground plane
            (Math.random() - 0.5) * size.depth * 0.7
        );
        group.add(hillMesh);
    }
    return group;
}

export function createForest(size = { width: 10, depth: 10 }, density = 0.5) {
    const group = new THREE.Group();
    group.name = 'Forest';

    const groundGeom = new THREE.PlaneGeometry(size.width, size.depth);
    const groundMesh = createMesh(groundGeom, TERRAIN_COLORS.DARK_GREEN_FOREST_GROUND, 'GroundPlane');
    groundMesh.rotation.x = -Math.PI / 2;
    group.add(groundMesh);

    const treeArea = size.width * size.depth;
    const numTrees = Math.floor(treeArea * density * 0.1); // Adjust density factor

    for (let i = 0; i < numTrees; i++) {
        const tree = new THREE.Group();
        const trunkHeight = Math.random() * 2 + 1.5; // 1.5m to 3.5m
        const trunkRadius = Math.random() * 0.1 + 0.05; // 0.05m to 0.15m
        const trunkGeom = new THREE.CylinderGeometry(trunkRadius, trunkRadius, trunkHeight, 8);
        const trunkMesh = createMesh(trunkGeom, TERRAIN_COLORS.SADDLE_BROWN_TRUNK, 'TreeTrunk');
        trunkMesh.position.y = trunkHeight / 2;
        tree.add(trunkMesh);

        const canopyType = Math.random();
        if (canopyType < 0.6) { // Deciduous
            const canopyRadius = Math.random() * 0.8 + 0.5;
            const canopyGeom = new THREE.SphereGeometry(canopyRadius, 8, 6);
            const canopyMesh = createMesh(canopyGeom, TERRAIN_COLORS.SEA_GREEN_CANOPY, 'TreeCanopy');
            canopyMesh.position.y = trunkHeight + canopyRadius * 0.7;
            tree.add(canopyMesh);
        } else { // Coniferous
            const coneHeight = Math.random() * 1.5 + 1;
            const coneRadius = Math.random() * 0.5 + 0.3;
            const coneGeom = new THREE.ConeGeometry(coneRadius, coneHeight, 8);
            const coneMesh = createMesh(coneGeom, TERRAIN_COLORS.DARK_GREEN_CONIFER, 'TreeCanopy');
            coneMesh.position.y = trunkHeight + coneHeight / 2;
            tree.add(coneMesh);
        }
        tree.position.set(
            (Math.random() - 0.5) * size.width * 0.9,
            0,
            (Math.random() - 0.5) * size.depth * 0.9
        );
        group.add(tree);
    }
    return group;
}

export function createMountain(size = { width: 5, depth: 5, height: 4 }) {
    const group = new THREE.Group();
    group.name = 'Mountain';

    // Main peak
    const peakGeom = new THREE.ConeGeometry(size.width / 2, size.height, 12);
    const peakMesh = createMesh(peakGeom, TERRAIN_COLORS.GREY_MOUNTAIN, 'MountainPeak');
    peakMesh.position.y = size.height / 2;
    group.add(peakMesh);

    // Optional snow cap
    if (size.height > 3) {
        const snowCapHeight = size.height * 0.3;
        const snowCapRadius = (size.width / 2) * (1 - (snowCapHeight / size.height) * 0.8); // Tapered
        const snowCapGeom = new THREE.ConeGeometry(snowCapRadius, snowCapHeight, 8);
        const snowCapMesh = createMesh(snowCapGeom, TERRAIN_COLORS.WHITE_SNOW, 'SnowCap');
        snowCapMesh.position.y = size.height - snowCapHeight / 2;
        peakMesh.add(snowCapMesh); // Add to peak so it's positioned relative to peak top
    }

    // Boulders (optional example)
    const numBoulders = Math.floor(Math.random() * 5) + 2;
    for (let i = 0; i < numBoulders; i++) {
        const boulderSize = Math.random() * 0.5 + 0.2;
        const boulderGeom = new THREE.BoxGeometry(boulderSize, boulderSize, boulderSize);
        const boulderMesh = createMesh(boulderGeom, TERRAIN_COLORS.DARK_GREY_BOULDER, `Boulder_${i}`);
        boulderMesh.position.set(
            (Math.random() - 0.5) * size.width * 0.6,
            boulderSize / 2,
            (Math.random() - 0.5) * size.depth * 0.6
        );
        boulderMesh.rotation.set(Math.random(), Math.random(), Math.random());
        group.add(boulderMesh);
    }
    return group;
}

export function createWater(size = { width: 10, depth: 10 }, type = 'lake') {
    const group = new THREE.Group();
    group.name = `Water_${type}`;

    let waterGeom;
    if (type === 'river') {
        // Simple elongated plane for river
        waterGeom = new THREE.PlaneGeometry(size.width / 4, size.depth * 1.5, 5, 20); // Narrower, longer
    } else { // lake or ocean
        waterGeom = new THREE.PlaneGeometry(size.width, size.depth, 20, 20);
    }
    
    const waterMaterial = new THREE.MeshStandardMaterial({
        color: TERRAIN_COLORS.LIGHT_BLUE_WATER,
        transparent: true,
        opacity: 0.75
    });
    const waterMesh = new THREE.Mesh(waterGeom, waterMaterial);
    waterMesh.name = 'WaterSurface';
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.receiveShadow = true; // Water can receive shadows but usually doesn't cast much
    waterMesh.castShadow = false;
    group.add(waterMesh);

    // Optional: Implied depth with a darker plane underneath
    const depthPlaneGeom = new THREE.PlaneGeometry(size.width, size.depth);
    const depthPlaneMesh = createMesh(depthPlaneGeom, TERRAIN_COLORS.DARK_BLUE_WATER_DEPTH, 'WaterDepth');
    depthPlaneMesh.rotation.x = -Math.PI / 2;
    depthPlaneMesh.position.y = -0.2; // Slightly below the surface
    group.add(depthPlaneMesh);

    return group;
}

export function createDesert(size = { width: 10, depth: 10 }) {
    const group = new THREE.Group();
    group.name = 'Desert';

    const groundGeom = new THREE.PlaneGeometry(size.width, size.depth, 20, 20);
    // Make it undulating by manipulating vertices
    const positions = groundGeom.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i);
        const x = positions.getX(i);
        // Simple sine wave for dunes
        positions.setZ(i, Math.sin(x * 0.5 + y * 0.3) * 0.3 + Math.sin(x * 0.2 - y*0.7) * 0.2);
    }
    groundGeom.computeVertexNormals(); // Recalculate normals for lighting

    const groundMesh = createMesh(groundGeom, TERRAIN_COLORS.SANDY_YELLOW_DUNE, 'DesertDunes');
    groundMesh.rotation.x = -Math.PI / 2;
    group.add(groundMesh);

    // Optional Cacti
    const numCacti = Math.floor(Math.random() * 3); // 0 to 2 cacti
    for (let i = 0; i < numCacti; i++) {
        const cactus = new THREE.Group();
        cactus.name = `Cactus_${i}`;
        const bodyHeight = Math.random() * 0.8 + 0.5;
        const bodyRadius = 0.05;
        const bodyGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyHeight, 6);
        const bodyMesh = createMesh(bodyGeom, TERRAIN_COLORS.GREEN_CACTUS, 'CactusBody');
        bodyMesh.position.y = bodyHeight / 2;
        cactus.add(bodyMesh);

        const numArms = Math.floor(Math.random() * 3); // 0 to 2 arms
        for (let j = 0; j < numArms; j++) {
            const armLength = Math.random() * 0.3 + 0.2;
            const armGeom = new THREE.CylinderGeometry(bodyRadius * 0.8, bodyRadius * 0.7, armLength, 6);
            const armMesh = createMesh(armGeom, TERRAIN_COLORS.GREEN_CACTUS, `CactusArm_${j}`);
            armMesh.position.x = (j % 2 === 0 ? 1 : -1) * bodyRadius * 0.5;
            armMesh.position.y = bodyHeight * (0.3 + Math.random() * 0.4);
            armMesh.rotation.z = (j % 2 === 0 ? -1 : 1) * (Math.PI / 4 + (Math.random() - 0.5) * 0.3);
            armMesh.position.x += (j % 2 === 0 ? 1 : -1) * armLength * 0.3 * Math.sin(armMesh.rotation.z);
            armMesh.position.y += armLength * 0.5 * Math.cos(armMesh.rotation.z);
            bodyMesh.add(armMesh);
        }
        cactus.position.set(
            (Math.random() - 0.5) * size.width * 0.8,
            0, // Base of cactus on the ground
            (Math.random() - 0.5) * size.depth * 0.8
        );
        group.add(cactus);
    }
    return group;
}

// Example of how you might want to export all terrain creation functions
export const TERRAIN_GENERATORS = {
    Grassland: createGrassland,
    Forest: createForest,
    Mountain: createMountain,
    Water: createWater,
    Desert: createDesert,
};
