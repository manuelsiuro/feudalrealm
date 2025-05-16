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
    MEDIUM_BROWN: 0x8B4513, // A common brown for Wood Log body
    LIGHT_BROWN_WOOD_END: 0xCDAA7D, // Lighter brown for cut wood ends (e.g., BurlyWood)
    LIGHT_GREY_STONE: 0xD3D3D3,    // For Stone Block
    MEDIUM_GREY: 0xBEBEBE,
    BEIGE_GRAIN_SACK: 0xF5F5DC,    // For Grain Sack
    GOLDEN_YELLOW_GRAIN_ALT: 0xFFDF00, // Alternative for Grain, or for Gold Ore distinction
    SILVERY_BLUE_FISH: 0xB0C4DE,   // For Fish
    RUSTY_RED_BROWN_IRON_ORE: 0x8B4513, // For Iron Ore (can be same as Medium Brown, shape will differ)
    DULL_BLACK_COAL_ORE: 0x2F4F4F,    // Dark Slate Gray for Coal Ore
    DULL_YELLOW_GOLD_ORE: 0xDAA520,   // Goldenrod for Gold Ore
    LIGHT_BROWN_PLANK: 0xCD853F,    // For Planks (can be same as wood ends)
    OFF_WHITE_FLOUR_SACK: 0xFAF0E6,  // Linen for Flour Sack
    GOLDEN_BROWN_BREAD: 0x964B00,   // A standard brown for Bread
    PINKISH_RED_MEAT: 0xFF69B4,     // HotPink for Meat, adjust if too bright
    DARK_METALLIC_GREY_IRON_BAR: 0x696969, // DimGray for Iron Bar & tool heads
    BRIGHT_SHINY_YELLOW_GOLD_BAR: 0xFFD700, // Gold for Gold Bar
    GREY_TOOL_BLADE: 0x808080,       // General grey for tool blades (scythe)
    BROWN_TOOL_HANDLE: 0x8B4513,   // Medium brown for tool handles
    BLACK_SWORD_HILT: 0x1A1A1A,     // Darker black for sword hilt/guard
    WOODEN_BROWN_SHIELD: 0x8B4513, // Brown for shield body
    PINK_PIG: 0xFFC0CB,
    DARK_PINK_PIG_ACCENT: 0xFFB6C1, // LightPink for pig snout/ears if main is too light
};

// --- Raw Material Creation Functions ---

export function createWoodLog() {
    const group = new THREE.Group();
    group.name = 'WoodLog';
    const logLength = 0.8;
    const logRadius = 0.15;

    const bodyGeometry = new THREE.CylinderGeometry(logRadius, logRadius, logLength, 8);
    const bodyMesh = createMesh(bodyGeometry, COLORS.MEDIUM_BROWN, 'LogBody');
    group.add(bodyMesh);

    const endGeometry = new THREE.CircleGeometry(logRadius, 8);
    const endMaterial = new THREE.MeshStandardMaterial({ color: COLORS.LIGHT_BROWN_WOOD_END, side: THREE.DoubleSide });
    
    const end1 = new THREE.Mesh(endGeometry, endMaterial);
    end1.position.y = -logLength / 2;
    end1.rotation.x = -Math.PI / 2;
    bodyMesh.add(end1); 

    const end2 = new THREE.Mesh(endGeometry, endMaterial);
    end2.position.y = logLength / 2;
    end2.rotation.x = Math.PI / 2;
    bodyMesh.add(end2);
    
    return group;
}

export function createStoneBlock() {
    const stoneSize = 0.3;
    const geometry = new THREE.BoxGeometry(stoneSize, stoneSize * 0.9, stoneSize * 1.1); 
    const stone = createMesh(geometry, COLORS.LIGHT_GREY_STONE, 'StoneBlock');
    return stone;
}

export function createGrainSack() {
    const group = new THREE.Group();
    group.name = 'GrainSack';
    const sackHeight = 0.4;
    const sackRadius = 0.15;
    const sackColor = COLORS.BEIGE_GRAIN_SACK; 

    const bodyGeom = new THREE.CylinderGeometry(sackRadius, sackRadius * 0.8, sackHeight * 0.75, 8); 
    const bodyMesh = createMesh(bodyGeom, sackColor, 'SackBody');
    bodyMesh.position.y = (sackHeight * 0.75) / 2;
    group.add(bodyMesh);

    const topGeom = new THREE.CylinderGeometry(sackRadius * 0.5, sackRadius * 0.6, sackHeight * 0.25, 6); 
    const topMesh = createMesh(topGeom, sackColor, 'SackTop');
    topMesh.position.y = (sackHeight * 0.75) + (sackHeight * 0.25) / 2;
    group.add(topMesh);
    
    group.position.y = - (sackHeight * 0.75) / 2; 

    return group;
}

export function createFish() {
    const fishLength = 0.4; 
    const fishWidth = 0.15; 
    const fishThickness = 0.08; 

    const geometry = new THREE.SphereGeometry(fishLength / 2, 8, 6);
    geometry.scale(1, fishThickness / (fishLength/2), fishWidth / (fishLength/2) ); 
    const fish = createMesh(geometry, COLORS.SILVERY_BLUE_FISH, 'Fish');
    return fish;
}

export function createIronOreLump() {
    const oreSize = 0.25;
    const geometry = new THREE.BoxGeometry(oreSize, oreSize * 0.9, oreSize * 1.1);
    const ore = createMesh(geometry, COLORS.RUSTY_RED_BROWN_IRON_ORE, 'IronOre');
    ore.rotation.set(Math.random() * 0.3, Math.random() * 0.3, Math.random() * 0.3); 
    return ore;
}

export function createCoalOreLump() {
    const oreSize = 0.25;
    const geometry = new THREE.SphereGeometry(oreSize / 1.8, 5, 4); 
    const ore = createMesh(geometry, COLORS.DULL_BLACK_COAL_ORE, 'CoalOre');
    return ore;
}

export function createGoldOreLump() {
    const oreSize = 0.22;
    const geometry = new THREE.IcosahedronGeometry(oreSize / 1.5, 0); 
    const ore = createMesh(geometry, COLORS.DULL_YELLOW_GOLD_ORE, 'GoldOre');
    return ore;
}

// --- Processed Goods Creation Functions ---

export function createPlank() {
    const plankWidth = 0.6; 
    const plankHeight = 0.05; 
    const plankDepth = 0.2; 
    const geometry = new THREE.BoxGeometry(plankWidth, plankHeight, plankDepth);
    const plank = createMesh(geometry, COLORS.LIGHT_BROWN_PLANK, 'Plank');
    return plank;
}

export function createFlourSack() {
    const group = new THREE.Group();
    group.name = 'FlourSack';
    const sackHeight = 0.38; 
    const sackRadius = 0.14;
    const sackColor = COLORS.OFF_WHITE_FLOUR_SACK;

    const bodyGeom = new THREE.CylinderGeometry(sackRadius, sackRadius * 0.8, sackHeight * 0.75, 8);
    const bodyMesh = createMesh(bodyGeom, sackColor, 'SackBody');
    bodyMesh.position.y = (sackHeight * 0.75) / 2;
    group.add(bodyMesh);

    const topGeom = new THREE.CylinderGeometry(sackRadius * 0.5, sackRadius * 0.6, sackHeight * 0.25, 6);
    const topMesh = createMesh(topGeom, sackColor, 'SackTop');
    topMesh.position.y = (sackHeight * 0.75) + (sackHeight * 0.25) / 2;
    group.add(topMesh);
    
    group.position.y = - (sackHeight * 0.75) / 2; 
    return group;
}

export function createBreadLoaf() {
    const loafLength = 0.35; 
    const loafHeight = 0.15; 
    const loafWidth = 0.18;  
    const geometry = new THREE.BoxGeometry(loafLength, loafHeight, loafWidth);
    const bread = createMesh(geometry, COLORS.GOLDEN_BROWN_BREAD, 'BreadLoaf');
    return bread;
}

export function createMeatPiece() {
    const meatSizeBase = 0.25;
    const geometry = new THREE.BoxGeometry(meatSizeBase * 1.2, meatSizeBase * 0.7, meatSizeBase * 0.9);
    const meat = createMesh(geometry, COLORS.PINKISH_RED_MEAT, 'MeatPiece');
    meat.rotation.set(0.1, Math.random() * 0.4, 0.05); 
    return meat;
}

export function createIronBar() {
    const barLength = 0.45; 
    const barHeight = 0.07; 
    const barWidth = 0.09;  
    const geometry = new THREE.BoxGeometry(barLength, barHeight, barWidth);
    const ironBar = createMesh(geometry, COLORS.DARK_METALLIC_GREY_IRON_BAR, 'IronBar');
    return ironBar;
}

export function createGoldBar() {
    const barLength = 0.4;  
    const barHeight = 0.06; 
    const barWidth = 0.08;  
    const geometry = new THREE.BoxGeometry(barLength, barHeight, barWidth);
    const goldBar = createMesh(geometry, COLORS.BRIGHT_SHINY_YELLOW_GOLD_BAR, 'GoldBar');
    return goldBar;
}

// --- Tool Creation Functions ---

export function createAxe() {
    const toolGroup = new THREE.Group();
    toolGroup.name = 'Axe';
    const handleLength = 0.55;
    const handleRadius = 0.025;
    const headWidth = 0.12; 
    const headHeight = 0.18; 
    const headBodyDepth = 0.05; 
    const bladeEdgeDepth = 0.02; 

    const handleGeom = new THREE.CylinderGeometry(handleRadius, handleRadius * 0.8, handleLength, 8);
    const handleMesh = createMesh(handleGeom, COLORS.BROWN_TOOL_HANDLE, 'Handle');
    toolGroup.add(handleMesh);

    const headBodyGeom = new THREE.BoxGeometry(headBodyDepth, headHeight * 0.4, headBodyDepth);
    const headBodyMesh = createMesh(headBodyGeom, COLORS.DARK_METALLIC_GREY_IRON_BAR, 'AxeHeadBody');
    headBodyMesh.position.y = handleLength / 2 - (headHeight * 0.4) / 2; 
    toolGroup.add(headBodyMesh);

    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(-headWidth / 2, 0);
    bladeShape.lineTo(headWidth / 2, 0);
    bladeShape.lineTo(headWidth / 2 * 0.7, headHeight);
    bladeShape.lineTo(-headWidth / 2 * 0.7, headHeight);
    bladeShape.closePath();
    const extrudeSettings = { depth: bladeEdgeDepth, bevelEnabled: false };
    const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
    const bladeMesh = createMesh(bladeGeom, COLORS.DARK_METALLIC_GREY_IRON_BAR, 'AxeBlade');
    bladeMesh.position.set(0, headHeight*0.2 , -bladeEdgeDepth/2); 
    bladeMesh.rotation.x = Math.PI/2; 
    headBodyMesh.add(bladeMesh);
    
    return toolGroup;
}

export function createPickaxe() {
    const toolGroup = new THREE.Group();
    toolGroup.name = 'Pickaxe';
    const handleLength = 0.65;
    const handleRadius = 0.025;
    const headLength = 0.3; 
    const headThickness = 0.04;
    const pointLength = headLength * 0.3;

    const handleGeom = new THREE.CylinderGeometry(handleRadius, handleRadius, handleLength, 8);
    const handleMesh = createMesh(handleGeom, COLORS.BROWN_TOOL_HANDLE, 'Handle');
    toolGroup.add(handleMesh);

    const headBodyLength = headLength - 2 * pointLength; 
    const headBodyGeom = new THREE.BoxGeometry(headBodyLength, headThickness * 1.2, headThickness * 1.2);
    const headBodyMesh = createMesh(headBodyGeom, COLORS.DARK_METALLIC_GREY_IRON_BAR, 'PickaxeHeadBody');
    headBodyMesh.rotation.z = Math.PI / 2; 
    headBodyMesh.position.y = handleLength / 2 - headThickness; 
    toolGroup.add(headBodyMesh);

    const pointGeom = new THREE.ConeGeometry(headThickness * 0.6, pointLength, 6);

    const point1 = createMesh(pointGeom, COLORS.DARK_METALLIC_GREY_IRON_BAR, 'Point1');
    point1.position.x = headBodyLength / 2 + pointLength / 2; 
    point1.rotation.z = -Math.PI / 2; 
    headBodyMesh.add(point1);

    const point2 = createMesh(pointGeom, COLORS.DARK_METALLIC_GREY_IRON_BAR, 'Point2');
    point2.position.x = -headBodyLength / 2 - pointLength / 2; 
    point2.rotation.z = Math.PI / 2; 
    headBodyMesh.add(point2);
    
    return toolGroup;
}

export function createScythe() {
    const toolGroup = new THREE.Group();
    toolGroup.name = 'Scythe';
    const handleLength = 0.75;
    const handleRadius = 0.02;
    const bladeLength = 0.35;
    const bladeWidth = 0.07; 
    const bladeThickness = 0.01;

    const handleGeom = new THREE.CylinderGeometry(handleRadius, handleRadius, handleLength, 8);
    const handleMesh = createMesh(handleGeom, COLORS.BROWN_TOOL_HANDLE, 'Handle');
    toolGroup.add(handleMesh);

    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.quadraticCurveTo(bladeLength * 0.5, bladeWidth * 0.5, bladeLength, bladeWidth * 0.2);
    bladeShape.lineTo(bladeLength * 0.9, 0);
    bladeShape.quadraticCurveTo(bladeLength * 0.4, -bladeWidth * 0.1, 0, 0);
    const extrudeSettings = { depth: bladeThickness, bevelEnabled: false };
    const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
    const bladeMesh = createMesh(bladeGeom, COLORS.GREY_TOOL_BLADE, 'ScytheBlade');
    
    bladeMesh.position.y = handleLength / 2 - bladeLength * 0.1; 
    bladeMesh.position.x = bladeThickness / 2; 
    bladeMesh.rotation.x = Math.PI / 2; 
    bladeMesh.rotation.y = -Math.PI / 12; 

    toolGroup.add(bladeMesh);
    
    return toolGroup;
}

export function createHammer() {
    const toolGroup = new THREE.Group();
    toolGroup.name = 'Hammer';
    const handleLength = 0.45;
    const handleRadius = 0.03;
    const headWidth = 0.07; 
    const headHeight = 0.1; 
    const headDepth = 0.07; 

    const handleGeom = new THREE.CylinderGeometry(handleRadius, handleRadius * 0.9, handleLength, 8);
    const handleMesh = createMesh(handleGeom, COLORS.BROWN_TOOL_HANDLE, 'Handle');
    toolGroup.add(handleMesh);

    const headGeom = new THREE.BoxGeometry(headHeight, headWidth, headDepth); 
    const headMesh = createMesh(headGeom, COLORS.DARK_METALLIC_GREY_IRON_BAR, 'HammerHead');
    headMesh.position.y = handleLength / 2; 
    headMesh.rotation.z = Math.PI / 2; 
    toolGroup.add(headMesh);
    
    return toolGroup;
}

export function createFishingRod() {
    const toolGroup = new THREE.Group(); 
    toolGroup.name = 'FishingRod';
    const rodLength = 0.9;
    const rodRadiusStart = 0.018;
    const rodRadiusEnd = 0.008; 
    
    const geometry = new THREE.CylinderGeometry(rodRadiusEnd, rodRadiusStart, rodLength, 6);
    const rod = createMesh(geometry, COLORS.BROWN_TOOL_HANDLE, 'Rod');
    toolGroup.add(rod);

    const tipSize = rodRadiusEnd * 2;
    const tipGeom = new THREE.SphereGeometry(tipSize, 6, 4);
    const tipMesh = createMesh(tipGeom, COLORS.SILVERY_BLUE_FISH, 'RodTip');
    tipMesh.position.y = rodLength / 2; 
    rod.add(tipMesh);
    
    return toolGroup;
}

// --- Military Goods Creation Functions ---

export function createSword() {
    const swordGroup = new THREE.Group();
    swordGroup.name = 'Sword';
    const bladeLength = 0.65;
    const bladeWidth = 0.05; 
    const bladeThickness = 0.01;
    const hiltLength = 0.14;
    const hiltRadius = 0.018;
    const crossguardLength = 0.1; 
    const crossguardWidth = 0.02;
    const crossguardThickness = 0.02;
    const pommelRadius = hiltRadius * 1.3;

    const bladeGeom = new THREE.BoxGeometry(bladeThickness, bladeLength, bladeWidth);
    const bladeMesh = createMesh(bladeGeom, COLORS.GREY_TOOL_BLADE, 'SwordBlade');
    bladeMesh.position.y = hiltLength / 2 + bladeLength / 2; 
    swordGroup.add(bladeMesh);

    const hiltGeom = new THREE.CylinderGeometry(hiltRadius, hiltRadius, hiltLength, 8);
    const hiltMesh = createMesh(hiltGeom, COLORS.BLACK_SWORD_HILT, 'SwordHilt');
    swordGroup.add(hiltMesh);

    const crossguardGeom = new THREE.BoxGeometry(crossguardThickness, crossguardWidth, crossguardLength);
    const crossguardMesh = createMesh(crossguardGeom, COLORS.BLACK_SWORD_HILT, 'SwordCrossguard');
    crossguardMesh.position.y = hiltLength / 2; 
    swordGroup.add(crossguardMesh);

    const pommelGeom = new THREE.SphereGeometry(pommelRadius, 6, 4);
    const pommelMesh = createMesh(pommelGeom, COLORS.DARK_METALLIC_GREY_IRON_BAR, 'SwordPommel');
    pommelMesh.position.y = -hiltLength / 2 - pommelRadius / 2; 
    swordGroup.add(pommelMesh);
    
    return swordGroup;
}

export function createShield() {
    const shieldGroup = new THREE.Group(); 
    shieldGroup.name = 'Shield';
    const shieldDepth = 0.05; 

    const shieldSize = 0.5; 
    const shieldGeom = new THREE.BoxGeometry(shieldSize, shieldSize, shieldDepth);
    const shieldMesh = createMesh(shieldGeom, COLORS.WOODEN_BROWN_SHIELD, 'ShieldBody');
    shieldGroup.add(shieldMesh);
    
    const dotRadius = shieldSize * 0.15;
    const dotGeom = new THREE.CircleGeometry(dotRadius, 12);
    const dotMesh = createMesh(dotGeom, COLORS.MEDIUM_GREY, 'ShieldEmblem'); 
    dotMesh.position.z = shieldDepth / 2 + 0.001; 
    shieldMesh.add(dotMesh);

    return shieldGroup;
}

// --- Live Animal Resource ---
export function createPig() {
    const pigGroup = new THREE.Group();
    pigGroup.name = 'Pig';
    const bodyLength = 0.35;
    const bodyWidth = 0.18;
    const bodyHeight = 0.20;
    const legHeight = 0.07;
    const legRadius = 0.025;

    const bodyGeom = new THREE.BoxGeometry(bodyLength, bodyHeight, bodyWidth);
    const bodyMesh = createMesh(bodyGeom, COLORS.PINK_PIG, 'PigBody');
    pigGroup.add(bodyMesh);

    const legPositions = [
        { x: bodyLength / 2 * 0.65, z: bodyWidth / 2 * 0.65 },
        { x: -bodyLength / 2 * 0.65, z: bodyWidth / 2 * 0.65 },
        { x: bodyLength / 2 * 0.65, z: -bodyWidth / 2 * 0.65 },
        { x: -bodyLength / 2 * 0.65, z: -bodyWidth / 2 * 0.65 },
    ];
    const legGeom = new THREE.CylinderGeometry(legRadius, legRadius * 0.7, legHeight, 6);
    legPositions.forEach((pos, i) => {
        const leg = createMesh(legGeom, COLORS.PINK_PIG, `Leg_${i}`);
        leg.position.set(pos.x, -bodyHeight / 2 - legHeight / 2 + 0.01, pos.z);
        pigGroup.add(leg);
    });

    const snoutRadius = bodyWidth * 0.25;
    const snoutLength = snoutRadius * 1.3;
    const snoutGeom = new THREE.CylinderGeometry(snoutRadius, snoutRadius*0.8, snoutLength, 8);
    const snoutMesh = createMesh(snoutGeom, COLORS.DARK_PINK_PIG_ACCENT, 'Snout'); 
    snoutMesh.position.set(bodyLength / 2 + snoutLength / 2, 0, 0);
    snoutMesh.rotation.z = Math.PI / 2; 
    bodyMesh.add(snoutMesh); 

    const earBase = bodyWidth * 0.18;
    const earHeight = bodyWidth * 0.22;
    const earGeom = new THREE.ConeGeometry(earBase, earHeight, 3); 

    const ear1 = createMesh(earGeom, COLORS.DARK_PINK_PIG_ACCENT, 'Ear1');
    ear1.position.set(bodyLength / 2 * 0.5, bodyHeight / 2, bodyWidth / 2 * 0.4);
    ear1.rotation.set(-Math.PI / 4, 0, -Math.PI / 7);
    bodyMesh.add(ear1);

    const ear2 = createMesh(earGeom, COLORS.DARK_PINK_PIG_ACCENT, 'Ear2');
    ear2.position.set(bodyLength / 2 * 0.5, bodyHeight / 2, -bodyWidth / 2 * 0.4);
    ear2.rotation.set(-Math.PI / 4, 0, Math.PI / 7);
    bodyMesh.add(ear2);
    
    pigGroup.position.y = legHeight + bodyHeight/2 - (bodyHeight/2 + legHeight/2 - 0.01) ; 
    return pigGroup;
}
