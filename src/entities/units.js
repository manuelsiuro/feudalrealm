import * as THREE from 'three';
import * as Resources from './resources.js'; // For tools

// Helper function to create a mesh
function createMesh(geometry, color, name = '') {
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    return mesh;
}

// Color definitions (can be shared from a common utils.js later)
const COLORS = {
    LIGHT_BROWN: 0xCD853F,
    BEIGE: 0xF5F5DC,
    LIGHT_GREY: 0xD3D3D3,
    PEACH: 0xFFDAB9, // Skin tone
    TAN: 0xD2B48C,    // Skin tone
    DARK_GREY: 0xA9A9A9,
    GREEN: 0x008000,
    DARK_GREEN: 0x006400,
    YELLOW: 0xFFFF00,
    LIGHT_BLUE: 0xADD8E6,
    WHITE: 0xFFFFFF,
    OFF_WHITE: 0xFAF0E6,
    MAROON: 0x800000, // For Butcher apron
    BLACK: 0x000000,
    MEDIUM_BROWN: 0x8B4513, // For tool handles
    DARK_METALLIC_GREY: 0x696969, // For tool heads
    GREY: 0x808080, // For tool heads
    // Player Faction Colors (examples)
    PLAYER_BLUE: 0x0000FF,
    PLAYER_RED: 0xFF0000,
    PLAYER_GREEN: 0x00FF00,
    PLAYER_YELLOW: 0xFFFF00,
};

const BASE_SERF_BODY_COLOR = COLORS.BEIGE;
const BASE_SERF_HEAD_COLOR = COLORS.PEACH;

// --- Base Serf Model ---
function createBaseSerf(bodyColor = BASE_SERF_BODY_COLOR, headColor = BASE_SERF_HEAD_COLOR) {
    const serfGroup = new THREE.Group();
    const bodyHeight = 0.75; // Increased for better raycasting
    const bodyRadius = 0.2;  // Increased for better raycasting
    const headRadius = 0.12; // Slightly increase head too

    // Body (upright, medium-height, slightly rounded cuboid or simple cylinder)
    const bodyGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius * 0.9, bodyHeight, 8);
    const bodyMesh = createMesh(bodyGeom, bodyColor, 'SerfBody');
    serfGroup.add(bodyMesh);

    // Head (sphere or slightly rounded cube)
    const headGeom = new THREE.SphereGeometry(headRadius, 8, 6);
    const headMesh = createMesh(headGeom, headColor, 'SerfHead');
    headMesh.position.y = bodyHeight / 2 + headRadius * 0.8; 
    serfGroup.add(headMesh);
    
    serfGroup.position.y = bodyHeight / 2; 
    return serfGroup;
}

// --- Serf Profession Creation Functions ---
// These will call createBaseSerf and add distinguishing features.

export function createTransporter() {
    const serf = createBaseSerf();
    serf.name = 'Transporter';
    return serf;
}

export function createBuilder() {
    const serf = createBaseSerf();
    serf.name = 'Builder';
    const hammer = Resources.createHammer();
    hammer.scale.set(0.5, 0.5, 0.5);
    hammer.position.set(0.15, 0.2, 0);
    hammer.rotation.z = -Math.PI / 4;
    serf.add(hammer);
    return serf;
}

export function createWoodcutter() {
    const serf = createBaseSerf();
    serf.name = 'Woodcutter';
    const axe = Resources.createAxe();
    axe.scale.set(0.5, 0.5, 0.5);
    axe.position.set(0.15, 0.2, 0.05);
    axe.rotation.z = -Math.PI / 3;
    axe.rotation.y = Math.PI / 2;
    serf.add(axe);
    return serf;
}

export function createForester() {
    const serf = createBaseSerf(COLORS.DARK_GREEN); // Attire color
    serf.name = 'Forester';
    // Item: Carries a small green cone (sapling)
    const saplingGeom = new THREE.ConeGeometry(0.05, 0.15, 6);
    const saplingMesh = createMesh(saplingGeom, COLORS.GREEN, 'Sapling');
    saplingMesh.position.set(0.15, 0.15, 0);
    saplingMesh.rotation.x = Math.PI / 6;
    serf.add(saplingMesh);
    return serf;
}

export function createStonemason() {
    const serf = createBaseSerf();
    serf.name = 'Stonemason';
    const pickaxe = Resources.createPickaxe();
    pickaxe.scale.set(0.45, 0.45, 0.45);
    pickaxe.position.set(0.15, 0.2, 0);
    pickaxe.rotation.z = -Math.PI / 3;
    serf.add(pickaxe);
    return serf;
}

export function createMiner() {
    const serf = createBaseSerf();
    serf.name = 'Miner';
    const pickaxe = Resources.createPickaxe();
    pickaxe.scale.set(0.45, 0.45, 0.45);
    pickaxe.position.set(0.15, 0.2, 0.02);
    pickaxe.rotation.z = -Math.PI / 3;
    serf.add(pickaxe);

    // Attire: Small helmet
    const helmetGeom = new THREE.SphereGeometry(0.12, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2); // Hemisphere
    const helmetMesh = createMesh(helmetGeom, COLORS.YELLOW, 'Helmet');
    // Position on top of head (head is child of serf, serf is group)
    const head = serf.children.find(c => c.name === 'SerfHead');
    if (head) {
        helmetMesh.position.y = head.position.y + 0.05;
    } else { // Fallback if head not found directly
        helmetMesh.position.y = 0.3 + 0.05;
    }
    serf.add(helmetMesh); // Add to serf group, not head, to avoid double transform issues if head moves
    return serf;
}

export function createFarmer() {
    const serf = createBaseSerf();
    serf.name = 'Farmer';
    const scythe = Resources.createScythe();
    scythe.scale.set(0.5, 0.5, 0.5);
    scythe.position.set(0.15, 0.15, 0);
    scythe.rotation.z = -Math.PI / 2.5;
    serf.add(scythe);

    // Optional: Wide-brimmed hat
    const hatRadius = 0.18;
    const hatHeight = 0.05;
    const hatGeom = new THREE.CylinderGeometry(hatRadius, hatRadius, hatHeight, 12);
    const hatMesh = createMesh(hatGeom, COLORS.MEDIUM_BROWN, 'FarmerHat');
    const head = serf.children.find(c => c.name === 'SerfHead');
    if (head) {
        hatMesh.position.y = head.position.y + 0.08;
    } else {
         hatMesh.position.y = 0.3 + 0.08;
    }
    serf.add(hatMesh);
    return serf;
}

export function createFisherman() {
    const serf = createBaseSerf(COLORS.LIGHT_BLUE); // Attire color
    serf.name = 'Fisherman';
    const rod = Resources.createFishingRod();
    rod.scale.set(0.4, 0.4, 0.4);
    rod.position.set(0.1, 0.1, 0.1);
    rod.rotation.z = -Math.PI / 2;
    rod.rotation.x = Math.PI / 4;
    serf.add(rod);
    return serf;
}

export function createMiller() {
    const serf = createBaseSerf(COLORS.OFF_WHITE); // Flour dust
    serf.name = 'Miller';
    // Optional: Sack of Flour
    const flourSack = Resources.createFlourSack();
    flourSack.scale.set(0.3, 0.3, 0.3);
    flourSack.position.set(0.15, 0.05, 0);
    serf.add(flourSack);
    return serf;
}

export function createBaker() {
    const serf = createBaseSerf();
    serf.name = 'Baker';
    // Attire: White chef's hat
    const hatHeight = 0.15;
    const hatRadius = 0.08;
    const hatGeom = new THREE.CylinderGeometry(hatRadius, hatRadius * 0.7, hatHeight, 12);
    const hatMesh = createMesh(hatGeom, COLORS.WHITE, 'ChefsHat');
    const head = serf.children.find(c => c.name === 'SerfHead');
     if (head) {
        hatMesh.position.y = head.position.y + hatHeight/2 + 0.02;
    } else {
         hatMesh.position.y = 0.3 + hatHeight/2 + 0.02;
    }
    serf.add(hatMesh);

    // White apron (flat cuboid)
    const apronGeom = new THREE.BoxGeometry(0.25, 0.3, 0.01);
    const apronMesh = createMesh(apronGeom, COLORS.WHITE, 'Apron');
    apronMesh.position.set(0, -0.05, 0.08); // Front of body
    serf.add(apronMesh);
    return serf;
}

export function createPigFarmer() {
    const serf = createBaseSerf();
    serf.name = 'Pig Farmer';
    // Item: Small wooden bucket
    const bucketRadius = 0.06;
    const bucketHeight = 0.08;
    const bucketGeom = new THREE.CylinderGeometry(bucketRadius, bucketRadius * 0.8, bucketHeight, 8);
    const bucketMesh = createMesh(bucketGeom, COLORS.MEDIUM_BROWN, 'Bucket');
    bucketMesh.position.set(0.15, 0.05, 0);
    serf.add(bucketMesh);
    return serf;
}

export function createButcher() {
    const serf = createBaseSerf();
    serf.name = 'Butcher';
    // Attire: Dark red/maroon apron
    const apronGeom = new THREE.BoxGeometry(0.25, 0.3, 0.01);
    const apronMesh = createMesh(apronGeom, COLORS.MAROON, 'Apron');
    apronMesh.position.set(0, -0.05, 0.08);
    serf.add(apronMesh);
    // Optional: Cleaver
    // const cleaver = Resources.createTool('cleaver'); // Assuming a generic tool creator
    // serf.add(cleaver);
    return serf;
}

export function createSawmillWorker() {
    const serf = createBaseSerf();
    serf.name = 'SawmillWorker';
    // Optional: Carrying Planks
    const plank = Resources.createPlank();
    plank.scale.set(0.4, 0.4, 0.4);
    plank.position.set(0.1, 0.1, -0.1);
    plank.rotation.y = Math.PI / 6;
    serf.add(plank);
    return serf;
}

export function createSmelterWorker() {
    const serf = createBaseSerf(COLORS.DARK_GREY); // Soot color
    serf.name = 'SmelterWorker';
    // Optional: Thick dark grey apron
    const apronGeom = new THREE.BoxGeometry(0.26, 0.32, 0.02);
    const apronMesh = createMesh(apronGeom, COLORS.DARK_METALLIC_GREY, 'Apron');
    apronMesh.position.set(0, -0.05, 0.08);
    serf.add(apronMesh);
    return serf;
}

export function createGoldsmith() {
    const serf = createBaseSerf();
    serf.name = 'Goldsmith';
    // Item: Magnifying glass (yellow sphere + cylinder handle)
    const lensRadius = 0.05;
    const handleLength = 0.08;
    const lensGeom = new THREE.SphereGeometry(lensRadius, 8, 6);
    const lensMesh = createMesh(lensGeom, COLORS.YELLOW, 'MagnifyingLens');
    lensMesh.position.set(0.1, 0.25, 0.1);
    
    const handleGeom = new THREE.CylinderGeometry(0.01, 0.01, handleLength, 6);
    const handleMesh = createMesh(handleGeom, COLORS.YELLOW, 'MagnifyingHandle');
    handleMesh.position.x = -lensRadius - handleLength/2 + 0.01;
    handleMesh.rotation.z = Math.PI / 2;
    lensMesh.add(handleMesh);
    serf.add(lensMesh);
    return serf;
}

export function createToolmaker() {
    const serf = createBaseSerf();
    serf.name = 'Toolmaker';
    // Attire: Grey/dark brown leather-like apron
    const apronGeom = new THREE.BoxGeometry(0.25, 0.3, 0.01);
    const apronMesh = createMesh(apronGeom, COLORS.MEDIUM_BROWN, 'Apron'); // Changed from DARK_BROWN
    apronMesh.position.set(0, -0.05, 0.08);
    serf.add(apronMesh);
    // Item: Generic toolbox (small brown cuboid)
    const toolboxGeom = new THREE.BoxGeometry(0.15, 0.1, 0.08);
    const toolboxMesh = createMesh(toolboxGeom, COLORS.MEDIUM_BROWN, 'Toolbox');
    toolboxMesh.position.set(0.15, 0.05, 0);
    serf.add(toolboxMesh);
    return serf;
}

export function createBlacksmith() {
    const serf = createBaseSerf(COLORS.DARK_GREY); // Slightly bulkier/darker
    serf.name = 'Blacksmith';
    // Attire: Very dark grey/black apron
    const apronGeom = new THREE.BoxGeometry(0.28, 0.33, 0.02); // Slightly larger apron
    const apronMesh = createMesh(apronGeom, COLORS.BLACK, 'Apron');
    apronMesh.position.set(0, -0.05, 0.08);
    serf.add(apronMesh);
    // Tool: Hammer
    const hammer = Resources.createHammer();
    hammer.scale.set(0.6, 0.6, 0.6); // Larger hammer
    hammer.position.set(0.15, 0.2, 0);
    hammer.rotation.z = -Math.PI / 4;
    serf.add(hammer);
    return serf;
}

export function createGeologist() {
    const serf = createBaseSerf();
    serf.name = 'Geologist';
    // Attire: Wide-brimmed hat
    const hatRadius = 0.18;
    const hatHeight = 0.05;
    const hatGeom = new THREE.CylinderGeometry(hatRadius, hatRadius, hatHeight, 12);
    const hatMesh = createMesh(hatGeom, COLORS.MEDIUM_BROWN, 'GeologistHat');
     const head = serf.children.find(c => c.name === 'SerfHead');
    if (head) {
        hatMesh.position.y = head.position.y + 0.08;
    } else {
         hatMesh.position.y = 0.3 + 0.08;
    }
    serf.add(hatMesh);
    // Item: Map scroll
    const scrollRadius = 0.03;
    const scrollLength = 0.15;
    const scrollGeom = new THREE.CylinderGeometry(scrollRadius, scrollRadius, scrollLength, 8);
    const scrollMesh = createMesh(scrollGeom, COLORS.BEIGE, 'MapScroll');
    scrollMesh.position.set(0.15, 0.1, 0);
    scrollMesh.rotation.z = Math.PI / 3;
    serf.add(scrollMesh);
    return serf;
}

// --- Military Unit Creation Functions ---
export function createKnight(playerColor = COLORS.PLAYER_BLUE) {
    const knightGroup = createBaseSerf(playerColor, COLORS.DARK_METALLIC_GREY); // Armored body, helmeted head
    knightGroup.name = 'Knight';

    // Equipment
    const sword = Resources.createSword();
    sword.scale.set(0.6, 0.6, 0.6);
    sword.position.set(0.2, 0.1, 0.05); // Approximate holding position
    sword.rotation.set(Math.PI / 2, Math.PI / 6, 0);
    knightGroup.add(sword);

    const shield = Resources.createShield();
    shield.scale.set(0.7, 0.7, 0.7);
    shield.position.set(-0.15, 0.05, 0.1); // Approximate holding position
    shield.rotation.y = -Math.PI / 3;
    
    // Update shield emblem color if needed (assuming shield body is first child of shield group)
    if (shield.children.length > 0 && shield.children[0].children.length > 0) {
        const emblem = shield.children[0].children[0]; // ShieldBody -> ShieldEmblem
        if (emblem && emblem.material) {
            emblem.material.color.set(playerColor);
        }
    }
    knightGroup.add(shield);

    // Optional Rank Indication (e.g., small chevrons - simplified for now)
    // This could be a small colored box on the shoulder
    // const rankIndicatorGeom = new THREE.BoxGeometry(0.05, 0.1, 0.02);
    // const rankIndicatorMesh = createMesh(rankIndicatorGeom, COLORS.WHITE, 'RankIndicator');
    // rankIndicatorMesh.position.set(0.1, 0.2, 0.1); // Shoulder area
    // knightGroup.add(rankIndicatorMesh);

    return knightGroup;
}

// TODO: Add all other serf professions based on units.md
// (Woodcutter, Forester, Stonemason, Miner, Farmer, Fisherman, Miller, Baker, Pig Farmer, Butcher, Sawmill Worker, Smelter Worker, Goldsmith, Toolmaker, Blacksmith, Geologist)
