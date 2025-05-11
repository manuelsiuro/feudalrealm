import * as THREE from 'three';

// Helper function to create a mesh (copied from buildings.js for now, consider moving to a shared utils.js)
function createMesh(geometry, color, name = '') {
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    return mesh;
}

// Color definitions (subset relevant to resources, can be expanded or shared)
const COLORS = {
    MEDIUM_BROWN: 0x8B4513, // A common brown
    LIGHT_BROWN: 0xCD853F, // Lighter brown for cut wood ends
    LIGHT_GREY: 0xD3D3D3,
    MEDIUM_GREY: 0xBEBEBE,
    BEIGE: 0xF5F5DC,
    GOLDEN_YELLOW: 0xFFDF00,
    SILVERY_BLUE: 0xB0C4DE,
    RUSTY_RED_BROWN: 0x8B4513, // Same as medium brown, can differentiate with shape
    DULL_BLACK: 0x2F4F4F, // Dark Slate Gray as dull black
    DULL_YELLOW: 0xDAA520, // Goldenrod as dull yellow
    OFF_WHITE: 0xFAF0E6, // Linen as off-white
    GOLDEN_BROWN: 0x964B00, // A standard brown for bread
    PINKISH_RED: 0xFF69B4, // HotPink for meat, adjust if too bright
    DARK_METALLIC_GREY: 0x696969, // DimGray
    BRIGHT_SHINY_YELLOW: 0xFFD700, // Gold
    GREY: 0x808080, // General grey for tools
    PINK: 0xFFC0CB,
};

// --- Raw Material Creation Functions ---

export function createWoodLog() {
    const group = new THREE.Group();
    group.name = 'WoodLog';
    const logLength = 0.8;
    const logRadius = 0.15;

    const bodyGeometry = new THREE.CylinderGeometry(logRadius, logRadius, logLength, 8);
    const bodyMesh = createMesh(bodyGeometry, COLORS.MEDIUM_BROWN, 'LogBody');
    bodyMesh.rotation.z = Math.PI / 2; // Lay flat along X axis by default
    group.add(bodyMesh);

    // Optional: Lighter ends for cut wood appearance
    const endGeometry = new THREE.CircleGeometry(logRadius, 8);
    const endMaterial = new THREE.MeshStandardMaterial({ color: COLORS.LIGHT_BROWN, side: THREE.DoubleSide });
    
    const end1 = new THREE.Mesh(endGeometry, endMaterial);
    end1.position.y = -logLength / 2; // Position along the cylinder's local Y (length) axis
    end1.rotation.x = -Math.PI / 2;   // Rotate to face outwards along negative Y
    bodyMesh.add(end1); 

    const end2 = new THREE.Mesh(endGeometry, endMaterial);
    end2.position.y = logLength / 2;  // Position along the cylinder's local Y (length) axis
    end2.rotation.x = Math.PI / 2;    // Rotate to face outwards along positive Y
    bodyMesh.add(end2);

    return group;
}

export function createStoneBlock() {
    const stoneSize = 0.3;
    const geometry = new THREE.BoxGeometry(stoneSize, stoneSize, stoneSize * 1.1); // Slightly irregular cube
    const stone = createMesh(geometry, COLORS.LIGHT_GREY, 'StoneBlock');
    // Add slight random rotation to make piles look more natural if needed later
    // stone.rotation.set(Math.random() * 0.1, Math.random() * 0.1, Math.random() * 0.1);
    return stone;
}

export function createGrainSack() {
    const group = new THREE.Group();
    group.name = 'GrainSack';
    const sackHeight = 0.4;
    const sackRadius = 0.15;

    // Main sack body (squat cylinder)
    const bodyGeom = new THREE.CylinderGeometry(sackRadius, sackRadius * 0.9, sackHeight * 0.8, 8);
    const bodyMesh = createMesh(bodyGeom, COLORS.BEIGE, 'SackBody');
    bodyMesh.position.y = (sackHeight * 0.8) / 2;
    group.add(bodyMesh);

    // Cinched top (smaller cylinder or sphere)
    const topGeom = new THREE.CylinderGeometry(sackRadius * 0.5, sackRadius * 0.6, sackHeight * 0.2, 6);
    const topMesh = createMesh(topGeom, COLORS.BEIGE, 'SackTop');
    topMesh.position.y = sackHeight * 0.8 + (sackHeight * 0.2) / 2;
    group.add(topMesh);
    
    // Position group origin at the base
    group.position.y = -sackHeight/2 + (sackHeight * 0.8) / 2;


    return group;
}

export function createFish() {
    const fishLength = 0.5;
    const fishWidth = 0.2;
    const fishThickness = 0.1;

    // Simple elongated, flattened ovoid (using a scaled sphere)
    const geometry = new THREE.SphereGeometry(fishLength / 2, 8, 6);
    geometry.scale(1, fishThickness / (fishLength/2) , fishWidth / (fishLength/2) ); // Scale to be ovoid
    const fish = createMesh(geometry, COLORS.SILVERY_BLUE, 'Fish');
    fish.rotation.z = Math.PI / 12; // Slight tilt
    return fish;
}

export function createIronOreLump() {
    const oreSize = 0.25;
    // Rough-edged small cube (Box with slight random scaling on faces could work, or just a cube)
    const geometry = new THREE.BoxGeometry(oreSize, oreSize * 0.9, oreSize * 1.1);
    const ore = createMesh(geometry, COLORS.RUSTY_RED_BROWN, 'IronOre');
    ore.rotation.set(Math.random() * 0.2, Math.random() * 0.2, Math.random() * 0.2);
    return ore;
}

export function createCoalOreLump() {
    const oreSize = 0.25;
    const geometry = new THREE.SphereGeometry(oreSize / 1.8, 5, 4); // Lumpy sphere
    const ore = createMesh(geometry, COLORS.DULL_BLACK, 'CoalOre');
    return ore;
}

export function createGoldOreLump() {
    const oreSize = 0.22; // Slightly smaller
    // Jagged edges: could use Dodecahedron or Icosahedron for more facets
    const geometry = new THREE.IcosahedronGeometry(oreSize / 1.5, 0); // 0 detail for jagged look
    const ore = createMesh(geometry, COLORS.DULL_YELLOW, 'GoldOre');
    // Could add tiny flecks later if needed by adding small sphere children with different material
    return ore;
}

// --- Processed Goods Creation Functions ---

export function createPlank() {
    const plankWidth = 0.6;
    const plankHeight = 0.05;
    const plankDepth = 0.2;
    const geometry = new THREE.BoxGeometry(plankWidth, plankHeight, plankDepth);
    const plank = createMesh(geometry, COLORS.LIGHT_BROWN, 'Plank');
    return plank;
}

export function createFlourSack() {
    const group = new THREE.Group();
    group.name = 'FlourSack';
    const sackHeight = 0.35; // Slightly different from grain for distinction
    const sackRadius = 0.14;

    const bodyGeom = new THREE.CylinderGeometry(sackRadius, sackRadius * 0.85, sackHeight * 0.8, 8);
    const bodyMesh = createMesh(bodyGeom, COLORS.OFF_WHITE, 'SackBody');
    bodyMesh.position.y = (sackHeight * 0.8) / 2;
    group.add(bodyMesh);

    const topGeom = new THREE.CylinderGeometry(sackRadius * 0.45, sackRadius * 0.55, sackHeight * 0.2, 6);
    const topMesh = createMesh(topGeom, COLORS.OFF_WHITE, 'SackTop');
    topMesh.position.y = sackHeight * 0.8 + (sackHeight * 0.2) / 2;
    group.add(topMesh);
    
    group.position.y = -sackHeight/2 + (sackHeight * 0.8) / 2;
    return group;
}

export function createBreadLoaf() {
    const loafLength = 0.4;
    const loafWidth = 0.2;
    const loafHeight = 0.18;
    // Elongated rounded cuboid (Box with rounded edges if possible, or just a box)
    // For simplicity, using a BoxGeometry
    const geometry = new THREE.BoxGeometry(loafLength, loafHeight, loafWidth);
    const bread = createMesh(geometry, COLORS.GOLDEN_BROWN, 'BreadLoaf');
    return bread;
}

export function createMeatPiece() {
    const meatSize = 0.3;
    // Irregular cuboid or thick, curved ovoid
    // Using a slightly scaled box for simplicity
    const geometry = new THREE.BoxGeometry(meatSize * 1.2, meatSize * 0.8, meatSize * 0.9);
    const meat = createMesh(geometry, COLORS.PINKISH_RED, 'MeatPiece');
    meat.rotation.set(0.1, 0.2, 0.05); // Slight irregularity
    return meat;
}

export function createIronBar() {
    const barLength = 0.5;
    const barWidth = 0.1;
    const barHeight = 0.08;
    const geometry = new THREE.BoxGeometry(barLength, barHeight, barWidth);
    const ironBar = createMesh(geometry, COLORS.DARK_METALLIC_GREY, 'IronBar');
    return ironBar;
}

export function createGoldBar() {
    const barLength = 0.4; // Slightly smaller than iron
    const barWidth = 0.08;
    const barHeight = 0.07;
    // Could have slightly trapezoidal sides for classic ingot, but box is simpler
    const geometry = new THREE.BoxGeometry(barLength, barHeight, barWidth);
    const goldBar = createMesh(geometry, COLORS.BRIGHT_SHINY_YELLOW, 'GoldBar');
    return goldBar;
}

// --- Tool Creation Functions ---

export function createAxe() {
    const toolGroup = new THREE.Group();
    toolGroup.name = 'Axe';
    const handleLength = 0.6;
    const handleRadius = 0.03;
    const headWidth = 0.15;
    const headHeight = 0.2;
    const headDepth = 0.04;

    // Handle
    const handleGeom = new THREE.CylinderGeometry(handleRadius, handleRadius * 0.8, handleLength, 8);
    const handleMesh = createMesh(handleGeom, COLORS.MEDIUM_BROWN, 'Handle');
    toolGroup.add(handleMesh);

    // Head (flat cuboid blade + wider body)
    const headBodyGeom = new THREE.BoxGeometry(headDepth * 1.5, headHeight * 0.5, headDepth * 1.5);
    const headBodyMesh = createMesh(headBodyGeom, COLORS.DARK_METALLIC_GREY, 'AxeHeadBody');
    headBodyMesh.position.y = handleLength / 2 - headHeight * 0.25;
    toolGroup.add(headBodyMesh);

    const bladeGeom = new THREE.BoxGeometry(headWidth, headHeight, headDepth);
    const bladeMesh = createMesh(bladeGeom, COLORS.DARK_METALLIC_GREY, 'AxeBlade');
    bladeMesh.position.y = handleLength / 2;
    bladeMesh.position.x = headWidth/2 - headDepth; // Offset to one side
    bladeMesh.rotation.z = Math.PI / 12; // Slight angle
    headBodyMesh.add(bladeMesh); // Attach blade to head body

    toolGroup.rotation.x = -Math.PI / 3; // Angle for carrying/display
    return toolGroup;
}

export function createPickaxe() {
    const toolGroup = new THREE.Group();
    toolGroup.name = 'Pickaxe';
    const handleLength = 0.7;
    const handleRadius = 0.03;
    const headLength = 0.35;
    const headThickness = 0.05;

    // Handle
    const handleGeom = new THREE.CylinderGeometry(handleRadius, handleRadius, handleLength, 8);
    const handleMesh = createMesh(handleGeom, COLORS.MEDIUM_BROWN, 'Handle');
    toolGroup.add(handleMesh);

    // Head (cuboid with pointed ends - use cones for points)
    const headBodyLength = headLength * 0.6;
    const headBodyGeom = new THREE.BoxGeometry(headBodyLength, headThickness * 1.5, headThickness * 1.5);
    const headBodyMesh = createMesh(headBodyGeom, COLORS.DARK_METALLIC_GREY, 'PickaxeHeadBody');
    headBodyMesh.rotation.z = Math.PI / 2; // Perpendicular to handle
    headBodyMesh.position.y = handleLength / 2 - headThickness;
    toolGroup.add(headBodyMesh);

    const pointLength = headLength * 0.2;
    const pointRadius = headThickness * 0.7;
    const pointGeom = new THREE.ConeGeometry(pointRadius, pointLength, 6);

    const point1 = createMesh(pointGeom, COLORS.DARK_METALLIC_GREY, 'Point1');
    point1.position.x = headBodyLength / 2 + pointLength / 2;
    point1.rotation.z = -Math.PI / 2;
    headBodyMesh.add(point1);

    const point2 = createMesh(pointGeom, COLORS.DARK_METALLIC_GREY, 'Point2');
    point2.position.x = -headBodyLength / 2 - pointLength / 2;
    point2.rotation.z = Math.PI / 2;
    headBodyMesh.add(point2);
    
    toolGroup.rotation.x = -Math.PI / 3;
    return toolGroup;
}

export function createScythe() {
    const toolGroup = new THREE.Group();
    toolGroup.name = 'Scythe';
    const handleLength = 0.8;
    const handleRadius = 0.025;
    const bladeLength = 0.4;
    const bladeWidth = 0.08;
    const bladeThickness = 0.01;

    // Handle
    const handleGeom = new THREE.CylinderGeometry(handleRadius, handleRadius, handleLength, 8);
    const handleMesh = createMesh(handleGeom, COLORS.MEDIUM_BROWN, 'Handle');
    toolGroup.add(handleMesh);

    // Blade (thin, curved, flat grey cuboid - approximate curve with angled straight segment)
    const bladeGeom = new THREE.BoxGeometry(bladeLength, bladeThickness, bladeWidth);
    const bladeMesh = createMesh(bladeGeom, COLORS.GREY, 'ScytheBlade');
    bladeMesh.position.y = handleLength / 2 - bladeLength * 0.3;
    bladeMesh.position.x = bladeLength / 2 * 0.8;
    bladeMesh.rotation.z = -Math.PI / 3; // Angle of blade
    toolGroup.add(bladeMesh);
    
    toolGroup.rotation.x = -Math.PI / 3;
    return toolGroup;
}

export function createHammer() {
    const toolGroup = new THREE.Group();
    toolGroup.name = 'Hammer';
    const handleLength = 0.5;
    const handleRadius = 0.03;
    const headWidth = 0.08;
    const headHeight = 0.12;
    const headDepth = 0.08;

    // Handle
    const handleGeom = new THREE.CylinderGeometry(handleRadius, handleRadius * 0.9, handleLength, 8);
    const handleMesh = createMesh(handleGeom, COLORS.MEDIUM_BROWN, 'Handle');
    toolGroup.add(handleMesh);

    // Head
    const headGeom = new THREE.BoxGeometry(headWidth, headHeight, headDepth);
    const headMesh = createMesh(headGeom, COLORS.GREY, 'HammerHead');
    headMesh.position.y = handleLength / 2 - headHeight / 4;
    headMesh.rotation.z = Math.PI / 2; // Perpendicular
    toolGroup.add(headMesh);
    
    toolGroup.rotation.x = -Math.PI / 3;
    return toolGroup;
}

export function createFishingRod() {
    const rodLength = 1.0;
    const rodRadius = 0.015;
    const geometry = new THREE.CylinderGeometry(rodRadius, rodRadius * 0.5, rodLength, 6); // Tapered
    const rod = createMesh(geometry, COLORS.MEDIUM_BROWN, 'FishingRod');
    // Optional: tiny blue sphere at tip (line guide/float)
    const tipGeom = new THREE.SphereGeometry(rodRadius * 1.5, 6, 4);
    const tipMesh = createMesh(tipGeom, COLORS.SILVERY_BLUE, 'RodTip');
    tipMesh.position.y = rodLength / 2;
    rod.add(tipMesh);
    
    rod.rotation.x = -Math.PI / 2.5; // Angled for display
    return rod;
}

// --- Military Goods Creation Functions ---

export function createSword() {
    const swordGroup = new THREE.Group();
    swordGroup.name = 'Sword';
    const bladeLength = 0.7;
    const bladeWidth = 0.06;
    const bladeThickness = 0.015;
    const hiltLength = 0.15;
    const hiltRadius = 0.02;
    const crossguardLength = 0.12;
    const crossguardThickness = 0.025;

    // Blade
    const bladeGeom = new THREE.BoxGeometry(bladeThickness, bladeLength, bladeWidth); // x is thickness for upright sword
    const bladeMesh = createMesh(bladeGeom, COLORS.GREY, 'SwordBlade');
    bladeMesh.position.y = hiltLength / 2 + bladeLength / 2;
    swordGroup.add(bladeMesh);

    // Hilt
    const hiltGeom = new THREE.CylinderGeometry(hiltRadius, hiltRadius, hiltLength, 8);
    const hiltMesh = createMesh(hiltGeom, COLORS.MEDIUM_BROWN, 'SwordHilt');
    swordGroup.add(hiltMesh);

    // Crossguard
    const crossguardGeom = new THREE.BoxGeometry(crossguardThickness, crossguardThickness, crossguardLength); // z is length
    const crossguardMesh = createMesh(crossguardGeom, COLORS.DARK_METALLIC_GREY, 'SwordCrossguard');
    crossguardMesh.position.y = hiltLength / 2 + crossguardThickness / 2;
    swordGroup.add(crossguardMesh);

    // Pommel (optional tiny sphere)
    const pommelRadius = hiltRadius * 1.2;
    const pommelGeom = new THREE.SphereGeometry(pommelRadius, 6, 4);
    const pommelMesh = createMesh(pommelGeom, COLORS.DARK_METALLIC_GREY, 'SwordPommel');
    pommelMesh.position.y = -hiltLength / 2 - pommelRadius / 2;
    swordGroup.add(pommelMesh);
    
    // swordGroup.rotation.z = Math.PI / 4; // Angle for display
    return swordGroup;
}

export function createShield() {
    const shieldGroup = new THREE.Group(); // Group for potential details later
    shieldGroup.name = 'Shield';
    const shieldRadius = 0.3;
    const shieldThickness = 0.05;

    // Simplest: flat circular plate
    // const shieldGeom = new THREE.CylinderGeometry(shieldRadius, shieldRadius, shieldThickness, 16);
    // For a square shield as per description "flat, square or circular thin cuboid"
    const shieldSize = shieldRadius * 2 * 0.8; // Make square slightly smaller than circle radius
    const shieldGeom = new THREE.BoxGeometry(shieldSize, shieldSize, shieldThickness);
    const shieldMesh = createMesh(shieldGeom, COLORS.MEDIUM_BROWN, 'ShieldBody'); // Wooden Brown
    
    // Optional: Player color dot in the center
    const dotRadius = shieldRadius * 0.2;
    const dotGeom = new THREE.CircleGeometry(dotRadius, 12);
    // Defaulting to a neutral color, player color would be set dynamically
    const dotMesh = createMesh(dotGeom, COLORS.GREY, 'ShieldEmblem'); 
    dotMesh.position.z = shieldThickness / 2 + 0.001; // Slightly in front
    shieldMesh.add(dotMesh);

    shieldGroup.add(shieldMesh);
    // shieldGroup.rotation.x = -Math.PI / 6; // Angle for display
    return shieldGroup;
}

// --- Live Animal Resource ---
export function createPig() {
    const pigGroup = new THREE.Group();
    pigGroup.name = 'Pig';
    const bodyLength = 0.4;
    const bodyWidth = 0.2;
    const bodyHeight = 0.22;
    const legHeight = 0.08;
    const legRadius = 0.03;

    // Body (oblong, rounded cuboid or ovoid) - using Box for simplicity
    const bodyGeom = new THREE.BoxGeometry(bodyLength, bodyHeight, bodyWidth);
    const bodyMesh = createMesh(bodyGeom, COLORS.PINK, 'PigBody');
    pigGroup.add(bodyMesh);

    // Legs (four very short, stubby pink cylinders)
    const legPositions = [
        { x: bodyLength / 2 * 0.7, z: bodyWidth / 2 * 0.7 },
        { x: -bodyLength / 2 * 0.7, z: bodyWidth / 2 * 0.7 },
        { x: bodyLength / 2 * 0.7, z: -bodyWidth / 2 * 0.7 },
        { x: -bodyLength / 2 * 0.7, z: -bodyWidth / 2 * 0.7 },
    ];
    const legGeom = new THREE.CylinderGeometry(legRadius, legRadius * 0.8, legHeight, 6);
    legPositions.forEach((pos, i) => {
        const leg = createMesh(legGeom, COLORS.PINK, `Leg_${i}`);
        leg.position.set(pos.x, -bodyHeight / 2 - legHeight / 2 + 0.01, pos.z);
        pigGroup.add(leg);
    });

    // Snout (tiny pink sphere or very short cylinder)
    const snoutRadius = bodyWidth * 0.2;
    const snoutGeom = new THREE.CylinderGeometry(snoutRadius, snoutRadius*0.8, snoutRadius*1.2, 8);
    const snoutMesh = createMesh(snoutGeom, COLORS.PINKISH_RED, 'Snout'); // Slightly darker pink
    snoutMesh.position.set(bodyLength / 2 + snoutRadius*0.5, 0, 0);
    snoutMesh.rotation.z = Math.PI / 2;
    pigGroup.add(snoutMesh);

    // Ears (tiny pink triangles - use thin cones or wedges)
    const earRadius = bodyWidth * 0.15;
    const earHeight = bodyWidth * 0.2;
    const earGeom = new THREE.ConeGeometry(earRadius, earHeight, 3); // Triangle base cone

    const ear1 = createMesh(earGeom, COLORS.PINK, 'Ear1');
    ear1.position.set(bodyLength / 2 * 0.6, bodyHeight / 2, bodyWidth / 2 * 0.5);
    ear1.rotation.x = -Math.PI / 4;
    ear1.rotation.z = -Math.PI / 6;
    pigGroup.add(ear1);

    const ear2 = createMesh(earGeom, COLORS.PINK, 'Ear2');
    ear2.position.set(bodyLength / 2 * 0.6, bodyHeight / 2, -bodyWidth / 2 * 0.5);
    ear2.rotation.x = -Math.PI / 4;
    ear2.rotation.z = -Math.PI / 6;
    pigGroup.add(ear2);
    
    pigGroup.position.y = legHeight + bodyHeight/2; // Stand on ground
    return pigGroup;
}
