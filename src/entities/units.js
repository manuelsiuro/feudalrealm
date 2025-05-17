import * as THREE from 'three';
import * as Resources from './resources.js'; // For tools
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TILE_SIZE } from '../core/MapManager.js'; // Import TILE_SIZE
import resourceManager from '../core/resourceManager.js'; // Import resourceManager

export const SERF_ACTION_STATES = { // Added export keyword
    IDLE: 'IDLE',
    MOVING_TO_TARGET: 'MOVING_TO_TARGET',
    PERFORMING_TASK: 'PERFORMING_TASK',
    RETURNING_TO_DROPOFF: 'RETURNING_TO_DROPOFF',
    WORKING_AT_BUILDING: 'WORKING_AT_BUILDING' // Added new state
};

const MAX_SERF_INVENTORY_CAPACITY = 10; // Max units of a resource a serf can carry
const DEFAULT_DROPOFF_POINT = { x: 15, y: 15 }; // Example fixed drop-off point

// Helper function to create a mesh
function createMesh(geometry, color, name = '') {
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    return mesh;
}

// Color definitions (can be shared from a common utils.js later)
// Export COLORS so it can be imported by other modules
export const COLORS = {
    LIGHT_BROWN: 0xCD853F, // For general use, some serf bodies, tool handles
    BEIGE: 0xF5F5DC,       // For general use, some serf bodies
    LIGHT_GREY: 0xD3D3D3,   // For general use, some serf bodies
    PEACH: 0xFFDAB9,       // Skin tone
    TAN: 0xD2B48C,         // Alternative skin tone
    DARK_GREY: 0xA9A9A9,     // For tools, stone, some attire
    GREEN: 0x008000,       // For Forester items/accents
    DARK_GREEN: 0x006400,    // For Forester items/accents
    YELLOW: 0xFFFF00,       // For Miner helmet, Goldsmith items
    LIGHT_BLUE: 0xADD8E6,    // For Fisherman accents
    WHITE: 0xFFFFFF,       // For Miller/Baker attire
    OFF_WHITE: 0xFAF0E6,    // For Miller/Baker attire
    MAROON: 0x800000,      // For Butcher apron
    BLACK: 0x000000,       // For Smelter worker, Blacksmith apron
    MEDIUM_BROWN: 0x8B4513,  // For tool handles, wooden items (bucket, shield)
    DARK_METALLIC_GREY: 0x696969, // For tool heads, armor elements
    GREY: 0x808080,        // For tool heads, stone
    RED: 0xFF0000,         // For Butcher apron (alternative), player color
    BLUE: 0x0000FF,        // Player color
    // Player Faction Colors (examples, can be passed dynamically)
    PLAYER_BLUE: 0x0000FF,
    PLAYER_RED: 0xFF0000,
    PLAYER_GREEN: 0x00FF00,
    PLAYER_YELLOW: 0xFFFF00, // Also used for Miner helmet
    PLAYER_FACTION_DEFAULT: 0x4682B4, // Steel Blue as a default if not specified
};

const BASE_SERF_BODY_COLOR = COLORS.BEIGE; // Neutral clothing
const BASE_SERF_HEAD_COLOR = COLORS.PEACH; // Skin tone

// --- Base Serf Model ---
function createBaseSerf(bodyColor = BASE_SERF_BODY_COLOR, headColor = BASE_SERF_HEAD_COLOR) {
    const serfGroup = new THREE.Group();
    // Dimensions from units.md: medium-height. Let's define standard sizes.
    const bodyHeight = 0.6; 
    const bodyRadius = 0.18; 
    const headRadius = 0.1;  

    // Body: Upright, medium-height, slightly rounded cuboid or a simple cylinder.
    // Using a cylinder as it's simpler and often looks better than a blocky cuboid for characters.
    const bodyGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyHeight, 8);
    const bodyMesh = createMesh(bodyGeom, bodyColor, 'SerfBody');
    // Position body so its base is at y=0 for the serfGroup
    bodyMesh.position.y = bodyHeight / 2;
    serfGroup.add(bodyMesh);

    // Head: Sphere or a slightly rounded cube, placed on top of the body.
    const headGeom = new THREE.SphereGeometry(headRadius, 8, 6);
    const headMesh = createMesh(headGeom, headColor, 'SerfHead');
    // Position head on top of the body
    headMesh.position.y = bodyHeight + headRadius * 0.9; // Place it just on top
    serfGroup.add(headMesh);
    
    // The serfGroup's origin will be at the base of the feet.
    return serfGroup;
}

// --- Serf Profession Creation Functions ---

export function createTransporter() {
    const serf = createBaseSerf();
    serf.name = 'Transporter';
    // No unique attire or tool, but could carry a generic resource.
    // This will be handled by game logic (attaching resource model to serf).
    return serf;
}

export function createBuilder() {
    const serf = createBaseSerf();
    serf.name = 'Builder';
    
    // Attire (Optional): A slightly darker brown or grey cuboid "apron"
    const apronWidth = 0.25;
    const apronHeight = 0.2;
    const apronDepth = 0.02;
    const apronGeom = new THREE.BoxGeometry(apronWidth, apronHeight, apronDepth);
    const apronMesh = createMesh(apronGeom, COLORS.DARK_GREY, 'Apron');
    // Position apron on the front of the body
    // Body's base is at y=0, center is at bodyHeight/2. Apron center y = bodyHeight/2 - apronHeight/4 approx.
    apronMesh.position.set(0, (0.6/2) - apronHeight/3, 0.18/2 + apronDepth/2); // bodyRadius + apronDepth/2
    serf.getObjectByName('SerfBody').add(apronMesh);


    const hammer = Resources.createHammer();
    hammer.scale.set(0.45, 0.45, 0.45);
    // Position hammer in a "carrying" pose
    hammer.position.set(0.12, 0.3, 0.1); 
    hammer.rotation.set(Math.PI / 6, -Math.PI / 4, Math.PI / 3);
    serf.add(hammer);
    return serf;
}

export function createWoodcutter() {
    const serf = createBaseSerf();
    serf.name = 'Woodcutter';
    const axe = Resources.createAxe();
    axe.scale.set(0.45, 0.45, 0.45);
    axe.position.set(0.12, 0.3, 0.1);
    axe.rotation.set(Math.PI / 2, Math.PI / 6, -Math.PI / 4);
    serf.add(axe);
    return serf;
}

export function createForester() {
    // Attire (Optional): A dark green band or patch. Let's use a green body.
    const serf = createBaseSerf(COLORS.DARK_GREEN); 
    serf.name = 'Forester';
    
    // Item: Carries a small green cone (sapling)
    const saplingGeom = new THREE.ConeGeometry(0.04, 0.12, 6);
    const saplingMesh = createMesh(saplingGeom, COLORS.GREEN, 'Sapling');
    saplingMesh.position.set(0.1, 0.25, 0.05); // Held in "hand"
    saplingMesh.rotation.x = Math.PI / 6;
    serf.add(saplingMesh);
    return serf;
}

export function createStonemason() {
    const serf = createBaseSerf();
    serf.name = 'Stonemason';
    const pickaxe = Resources.createPickaxe();
    pickaxe.scale.set(0.40, 0.40, 0.40);
    pickaxe.position.set(0.12, 0.3, 0.05);
    pickaxe.rotation.set(Math.PI / 2, Math.PI / 3, -Math.PI / 3);
    serf.add(pickaxe);
    return serf;
}

export function createMiner() {
    const serf = createBaseSerf();
    serf.name = 'Miner';
    const pickaxe = Resources.createPickaxe();
    pickaxe.scale.set(0.40, 0.40, 0.40);
    pickaxe.position.set(0.12, 0.3, 0.05);
    pickaxe.rotation.set(Math.PI / 2, Math.PI / 3, -Math.PI / 3);
    serf.add(pickaxe);

    // Attire: Small, dark grey or yellow hemisphere or very short cylinder on top of the head (helmet).
    const helmetRadius = 0.1; // Head radius
    const helmetHeight = 0.05; // Short cylinder
    // Using a short cylinder for the helmet base
    const helmetBaseGeom = new THREE.CylinderGeometry(helmetRadius * 0.9, helmetRadius * 0.8, helmetHeight, 8);
    const helmetBaseMesh = createMesh(helmetBaseGeom, COLORS.YELLOW, 'HelmetBase');
    
    // Optional: Small lamp on helmet (tiny cylinder)
    const lampRadius = 0.02;
    const lampLength = 0.04;
    const lampGeom = new THREE.CylinderGeometry(lampRadius, lampRadius, lampLength, 6);
    const lampMesh = createMesh(lampGeom, COLORS.DARK_GREY, 'HelmetLamp');
    lampMesh.position.set(0, helmetHeight / 2, helmetRadius * 0.8); // Front of helmet
    lampMesh.rotation.x = Math.PI / 2.5;
    helmetBaseMesh.add(lampMesh);

    const head = serf.getObjectByName('SerfHead');
    if (head) {
        helmetBaseMesh.position.copy(head.position);
        helmetBaseMesh.position.y += helmetRadius * 0.3 + helmetHeight / 2; // Adjust to sit on top
    } else { 
        helmetBaseMesh.position.y = 0.6 + 0.1 * 0.9 + helmetRadius * 0.3 + helmetHeight / 2; // Fallback based on createBaseSerf
    }
    serf.add(helmetBaseMesh); 
    return serf;
}

export function createFarmer() {
    const serf = createBaseSerf();
    serf.name = 'Farmer';
    const scythe = Resources.createScythe();
    scythe.scale.set(0.45, 0.45, 0.45);
    scythe.position.set(0.12, 0.25, 0); 
    scythe.rotation.set(0, -Math.PI / 4, -Math.PI / 2.5);
    serf.add(scythe);

    // Optional: Wide-brimmed hat (flat, wide brown cylinder or very shallow cone on the head).
    const hatOuterRadius = 0.15;
    const hatInnerRadius = 0.08; // For the crown part
    const hatHeight = 0.03; // Brim thickness
    const crownHeight = 0.06;

    const brimGeom = new THREE.CylinderGeometry(hatOuterRadius, hatOuterRadius, hatHeight, 12);
    const brimMesh = createMesh(brimGeom, COLORS.MEDIUM_BROWN, 'FarmerHatBrim');
    
    const crownGeom = new THREE.CylinderGeometry(hatInnerRadius, hatInnerRadius * 0.9, crownHeight, 12);
    const crownMesh = createMesh(crownGeom, COLORS.MEDIUM_BROWN, 'FarmerHatCrown');
    crownMesh.position.y = hatHeight/2 + crownHeight/2;
    brimMesh.add(crownMesh);

    const head = serf.getObjectByName('SerfHead');
    if (head) {
        brimMesh.position.copy(head.position);
        brimMesh.position.y += 0.1 * 0.8 + hatHeight/2; // Adjust to sit on head
    } else {
         brimMesh.position.y = 0.6 + 0.1*0.9 + 0.1 * 0.8 + hatHeight/2; // Fallback
    }
    serf.add(brimMesh);
    return serf;
}

export function createFisherman() {
    // Attire (Optional): A light blue band or patch. Let's use a light blue body.
    const serf = createBaseSerf(COLORS.LIGHT_BLUE); 
    serf.name = 'Fisherman';
    const rod = Resources.createFishingRod();
    rod.scale.set(0.45, 0.45, 0.45);
    rod.position.set(0.1, 0.2, 0.15); 
    rod.rotation.set(Math.PI / 3, -Math.PI/3, -Math.PI / 2.2);
    serf.add(rod);
    return serf;
}

export function createMiller() {
    // Attire: Body colored white or off-white (flour dust).
    const serf = createBaseSerf(COLORS.OFF_WHITE); 
    serf.name = 'Miller';
    
    // Optional: Sack of Flour
    const flourSack = Resources.createFlourSack();
    flourSack.scale.set(0.25, 0.25, 0.25);
    flourSack.position.set(0.12, 0.1, 0); // Carried
    serf.add(flourSack);
    return serf;
}

export function createBaker() {
    const serf = createBaseSerf();
    serf.name = 'Baker';

    // Attire: A white, tall, cylindrical "chef's hat" on the head.
    const hatBaseRadius = 0.07;
    const hatTopRadius = 0.09; // Slightly wider at top
    const hatHeight = 0.12;
    const chefHatGeom = new THREE.CylinderGeometry(hatBaseRadius, hatTopRadius, hatHeight, 12);
    const chefHatMesh = createMesh(chefHatGeom, COLORS.WHITE, 'ChefsHat');
    
    // Add a sphere on top for the puffy part
    const puffRadius = hatTopRadius * 1.1;
    const puffGeom = new THREE.SphereGeometry(puffRadius, 10, 8);
    const puffMesh = createMesh(puffGeom, COLORS.WHITE, 'ChefsHatPuff');
    puffMesh.position.y = hatHeight / 2 - puffRadius * 0.2; // Position puff to merge with cylinder top
    chefHatMesh.add(puffMesh);

    const head = serf.getObjectByName('SerfHead');
    if (head) {
        chefHatMesh.position.copy(head.position);
        chefHatMesh.position.y += 0.1 * 0.8 + hatHeight / 2; // Adjust to sit on head
    } else {
         chefHatMesh.position.y = 0.6 + 0.1*0.9 + 0.1 * 0.8 + hatHeight / 2; // Fallback
    }
    serf.add(chefHatMesh);

    // White apron (flat cuboid on front of body)
    const apronWidth = 0.25;
    const apronHeight = 0.25; // Slightly longer
    const apronDepth = 0.01;
    const apronGeom = new THREE.BoxGeometry(apronWidth, apronHeight, apronDepth);
    const apronMesh = createMesh(apronGeom, COLORS.WHITE, 'Apron');
    apronMesh.position.set(0, (0.6/2) - apronHeight/2.5, 0.18/2 + apronDepth/2);
    serf.getObjectByName('SerfBody').add(apronMesh);
    
    // Optional: Bread Loaf
    // const bread = Resources.createBreadLoaf();
    // bread.scale.set(0.3, 0.3, 0.3);
    // bread.position.set(-0.1, 0.15, 0.05);
    // serf.add(bread);
    return serf;
}

export function createPigFarmer() {
    const serf = createBaseSerf();
    serf.name = 'PigFarmer';
    
    // Item: Carries a small wooden bucket
    const bucketRadiusTop = 0.05;
    const bucketRadiusBottom = 0.04;
    const bucketHeight = 0.07;
    const bucketGeom = new THREE.CylinderGeometry(bucketRadiusTop, bucketRadiusBottom, bucketHeight, 8);
    const bucketMesh = createMesh(bucketGeom, COLORS.MEDIUM_BROWN, 'Bucket');
    bucketMesh.position.set(0.12, 0.1, 0); // Held in "hand"
    
    // Tiny arched handle (simple thin torus segment or bent cylinder)
    // For simplicity, a small cylinder across the top
    const handleGeom = new THREE.CylinderGeometry(0.005, 0.005, bucketRadiusTop*2.2, 6);
    const handleMesh = createMesh(handleGeom, COLORS.DARK_GREY, 'BucketHandle');
    handleMesh.rotation.z = Math.PI / 2;
    handleMesh.position.y = bucketHeight/2 - 0.005;
    bucketMesh.add(handleMesh);
    serf.add(bucketMesh);

    // Attire (Optional): Muddy brown patches (small flat cuboids) on the lower part of the body.
    const patchGeom = new THREE.BoxGeometry(0.05, 0.08, 0.01);
    const patchMaterial = new THREE.MeshStandardMaterial({color: COLORS.MEDIUM_BROWN});
    const patch1 = new THREE.Mesh(patchGeom, patchMaterial);
    patch1.position.set(0.05, 0.1, 0.18/2 + 0.005); // On leg area
    patch1.rotation.y = Math.PI/6;
    serf.getObjectByName('SerfBody').add(patch1);
    const patch2 = new THREE.Mesh(patchGeom, patchMaterial);
    patch2.position.set(-0.06, 0.15, 0.18/2 + 0.005);
    patch2.rotation.y = -Math.PI/8;
    serf.getObjectByName('SerfBody').add(patch2);

    return serf;
}

export function createButcher() {
    const serf = createBaseSerf();
    serf.name = 'Butcher';

    // Attire: A dark red or maroon apron
    const apronWidth = 0.26;
    const apronHeight = 0.28;
    const apronDepth = 0.015;
    const apronGeom = new THREE.BoxGeometry(apronWidth, apronHeight, apronDepth);
    const apronMesh = createMesh(apronGeom, COLORS.MAROON, 'Apron');
    apronMesh.position.set(0, (0.6/2) - apronHeight/2.5, 0.18/2 + apronDepth/2);
    serf.getObjectByName('SerfBody').add(apronMesh);

    // Tool (Optional): Carries a cleaver
    // Cleaver: small grey flat cuboid blade with a short brown handle
    const cleaverGroup = new THREE.Group();
    const bladeLength = 0.1;
    const bladeHeight = 0.05;
    const bladeThick = 0.008;
    const cleaverBladeGeom = new THREE.BoxGeometry(bladeLength, bladeHeight, bladeThick);
    const cleaverBladeMesh = createMesh(cleaverBladeGeom, COLORS.GREY, 'CleaverBlade');
    cleaverGroup.add(cleaverBladeMesh);

    const cleaverHandleLength = 0.07;
    const cleaverHandleRadius = 0.01;
    const cleaverHandleGeom = new THREE.CylinderGeometry(cleaverHandleRadius, cleaverHandleRadius, cleaverHandleLength, 6);
    const cleaverHandleMesh = createMesh(cleaverHandleGeom, COLORS.MEDIUM_BROWN, 'CleaverHandle');
    cleaverHandleMesh.position.x = -bladeLength/2 - cleaverHandleLength/2 + 0.01; // Attach to end of blade
    cleaverHandleMesh.rotation.z = Math.PI/2; // Align with blade
    cleaverBladeMesh.add(cleaverHandleMesh);
    
    cleaverGroup.scale.set(1.3,1.3,1.3);
    cleaverGroup.position.set(0.1, 0.25, 0.05);
    cleaverGroup.rotation.set(0, -Math.PI/3, Math.PI/2.5);
    serf.add(cleaverGroup);

    return serf;
}

export function createSawmillWorker() {
    const serf = createBaseSerf();
    serf.name = 'SawmillWorker';

    // Attire: Body might have a darker brown apron.
    const apronWidth = 0.25;
    const apronHeight = 0.25;
    const apronDepth = 0.015;
    const apronGeom = new THREE.BoxGeometry(apronWidth, apronHeight, apronDepth);
    const apronMesh = createMesh(apronGeom, COLORS.MEDIUM_BROWN, 'Apron');
    apronMesh.position.set(0, (0.6/2) - apronHeight/2.5, 0.18/2 + apronDepth/2);
    serf.getObjectByName('SerfBody').add(apronMesh);
    
    // Item (Optional): Often seen carrying Planks
    const plank = Resources.createPlank();
    plank.scale.set(0.35, 0.35, 0.35);
    plank.position.set(0.1, 0.15, -0.05); // Carried on shoulder/back
    plank.rotation.set(Math.PI/6, Math.PI/3, -Math.PI/5);
    serf.add(plank);
    return serf;
}

export function createSmelterWorker() {
    // Attire: Body colored dark grey or black (soot).
    const serf = createBaseSerf(COLORS.DARK_GREY); 
    serf.name = 'SmelterWorker';

    // A thick, dark grey apron.
    const apronWidth = 0.27;
    const apronHeight = 0.3;
    const apronDepth = 0.02;
    const apronGeom = new THREE.BoxGeometry(apronWidth, apronHeight, apronDepth);
    const apronMesh = createMesh(apronGeom, COLORS.BLACK, 'Apron'); // Darker apron
    apronMesh.position.set(0, (0.6/2) - apronHeight/2.5, 0.18/2 + apronDepth/2);
    serf.getObjectByName('SerfBody').add(apronMesh);

    // Tool (Optional): Carries a long poker (thin dark grey cylinder).
    const pokerLength = 0.5;
    const pokerRadius = 0.01;
    const pokerGeom = new THREE.CylinderGeometry(pokerRadius, pokerRadius, pokerLength, 6);
    const pokerMesh = createMesh(pokerGeom, COLORS.DARK_METALLIC_GREY, 'Poker');
    pokerMesh.position.set(0.08, 0.2, 0.05);
    pokerMesh.rotation.set(Math.PI/2.2, Math.PI/5, -Math.PI/3);
    serf.add(pokerMesh);
    return serf;
}

export function createGoldsmith() {
    const serf = createBaseSerf();
    serf.name = 'Goldsmith';

    // Attire: A small, yellow magnifying glass shape held near the face or a yellow patch on the chest.
    // Let's do a yellow patch.
    const patchGeom = new THREE.BoxGeometry(0.06, 0.06, 0.01);
    const patchMesh = createMesh(patchGeom, COLORS.YELLOW, 'ChestPatch');
    patchMesh.position.set(0.05, 0.6/2 + 0.05, 0.18/2 + 0.005); // Upper chest
    serf.getObjectByName('SerfBody').add(patchMesh);

    // Item (Optional): May be seen carrying a Gold Bar
    const goldBar = Resources.createGoldBar();
    goldBar.scale.set(0.3, 0.3, 0.3);
    goldBar.position.set(0.1, 0.15, 0);
    serf.add(goldBar);
    return serf;
}

export function createToolmaker() {
    const serf = createBaseSerf();
    serf.name = 'Toolmaker';

    // Attire: A grey or dark brown leather-like apron.
    const apronWidth = 0.25;
    const apronHeight = 0.28;
    const apronDepth = 0.015;
    const apronGeom = new THREE.BoxGeometry(apronWidth, apronHeight, apronDepth);
    const apronMesh = createMesh(apronGeom, COLORS.MEDIUM_BROWN, 'Apron'); // Leather color
    apronMesh.position.set(0, (0.6/2) - apronHeight/2.5, 0.18/2 + apronDepth/2);
    serf.getObjectByName('SerfBody').add(apronMesh);

    // Item: Carries a variety of tools or a generic "toolbox" (small brown cuboid).
    const toolboxWidth = 0.12;
    const toolboxHeight = 0.08;
    const toolboxDepth = 0.06;
    const toolboxGeom = new THREE.BoxGeometry(toolboxWidth, toolboxHeight, toolboxDepth);
    const toolboxMesh = createMesh(toolboxGeom, COLORS.MEDIUM_BROWN, 'Toolbox');
    toolboxMesh.position.set(0.1, 0.1, 0); // Held in "hand"
    
    // Tiny handle for toolbox
    const handleGeom = new THREE.CylinderGeometry(0.008, 0.008, toolboxWidth * 0.7, 4);
    const handleMesh = createMesh(handleGeom, COLORS.DARK_GREY, 'ToolboxHandle');
    handleMesh.rotation.z = Math.PI/2;
    handleMesh.position.y = toolboxHeight/2;
    toolboxMesh.add(handleMesh);
    serf.add(toolboxMesh);
    return serf;
}

export function createBlacksmith() {
    // Attire: Body might be slightly bulkier (represented by a slightly wider cylinder/cuboid).
    // For simplicity, use standard body but with dark apron.
    const serf = createBaseSerf(COLORS.DARK_GREY); // Body color implies soot/work
    serf.name = 'Blacksmith';

    // A very dark grey or black apron.
    const apronWidth = 0.28; // Slightly wider
    const apronHeight = 0.3;
    const apronDepth = 0.02;
    const apronGeom = new THREE.BoxGeometry(apronWidth, apronHeight, apronDepth);
    const apronMesh = createMesh(apronGeom, COLORS.BLACK, 'Apron');
    apronMesh.position.set(0, (0.6/2) - apronHeight/2.5, 0.18/2 + apronDepth/2);
    serf.getObjectByName('SerfBody').add(apronMesh);

    // Tool: Carries a Hammer (larger than builder's hammer).
    const hammer = Resources.createHammer();
    hammer.scale.set(0.55, 0.55, 0.55); // Larger
    hammer.position.set(0.13, 0.3, 0.1);
    hammer.rotation.set(Math.PI / 6, -Math.PI / 4, Math.PI / 3);
    serf.add(hammer);
    return serf;
}

export function createGeologist() {
    const serf = createBaseSerf();
    serf.name = 'Geologist';

    // Attire: Wears a wide-brimmed hat (flat brown cylinder).
    const hatOuterRadius = 0.16;
    const hatInnerRadius = 0.08; 
    const hatHeight = 0.03; 
    const crownHeight = 0.05;

    const brimGeom = new THREE.CylinderGeometry(hatOuterRadius, hatOuterRadius, hatHeight, 10);
    const brimMesh = createMesh(brimGeom, COLORS.MEDIUM_BROWN, 'GeologistHatBrim');
    
    const crownGeom = new THREE.CylinderGeometry(hatInnerRadius, hatInnerRadius * 0.95, crownHeight, 10);
    const crownMesh = createMesh(crownGeom, COLORS.MEDIUM_BROWN, 'GeologistHatCrown');
    crownMesh.position.y = hatHeight/2 + crownHeight/2;
    brimMesh.add(crownMesh);

    const head = serf.getObjectByName('SerfHead');
    if (head) {
        brimMesh.position.copy(head.position);
        brimMesh.position.y += 0.1 * 0.8 + hatHeight/2; 
    } else {
         brimMesh.position.y = 0.6 + 0.1*0.9 + 0.1 * 0.8 + hatHeight/2; 
    }
    serf.add(brimMesh);

    // Item: Carries a map scroll (small rolled-up beige cylinder).
    const scrollRadius = 0.025;
    const scrollLength = 0.12;
    const scrollGeom = new THREE.CylinderGeometry(scrollRadius, scrollRadius, scrollLength, 8);
    const scrollMesh = createMesh(scrollGeom, COLORS.BEIGE, 'MapScroll');
    scrollMesh.position.set(0.1, 0.15, 0); // Held in "hand"
    scrollMesh.rotation.z = Math.PI / 6; // Slightly angled
    serf.add(scrollMesh);
    return serf;
}

// --- Military Unit Creation Functions ---
export function createKnight(playerColor = COLORS.PLAYER_FACTION_DEFAULT) {
    // Body: Player's chosen faction color. Head: metallic grey sphere/rounded cube (helmet).
    const knightGroup = createBaseSerf(playerColor, COLORS.DARK_METALLIC_GREY); 
    knightGroup.name = 'Knight';
    
    // Make body slightly more robust if desired (e.g. by scaling body mesh)
    const bodyMesh = knightGroup.getObjectByName('SerfBody');
    if (bodyMesh) {
        bodyMesh.scale.x = 1.1;
        bodyMesh.scale.z = 1.1;
    }
    // Helmet can be slightly larger or more distinct too
    const headMesh = knightGroup.getObjectByName('SerfHead');
    if (headMesh) {
        headMesh.scale.set(1.1, 1.1, 1.1);
        // Optional: Add a crest to the helmet (thin cuboid or cone)
        const crestGeom = new THREE.BoxGeometry(0.02, 0.1, 0.05); // Thin, tall crest
        const crestMesh = createMesh(crestGeom, playerColor, 'HelmetCrest');
        crestMesh.position.y = 0.1 * 1.1 * 0.5; // On top of scaled head
        headMesh.add(crestMesh);
    }


    // Equipment
    const sword = Resources.createSword();
    // Sword hilt can be player color or brown. Let's try player color for hilt.
    const swordHilt = sword.getObjectByName('SwordHilt');
    if (swordHilt) swordHilt.material.color.set(playerColor);
    const swordCrossguard = sword.getObjectByName('SwordCrossguard');
    if (swordCrossguard) swordCrossguard.material.color.set(playerColor);


    sword.scale.set(0.55, 0.55, 0.55);
    sword.position.set(0.15, 0.25, 0.05); 
    sword.rotation.set(Math.PI / 2.2, Math.PI / 7, -Math.PI / 4); // Held ready
    knightGroup.add(sword);

    const shield = Resources.createShield();
    // Shield: wooden brown with player faction emblem (simple colored shape).
    // The emblem is already part of createShield, just need to set its color.
    const shieldEmblem = shield.getObjectByProperty('name', 'ShieldEmblem'); // More robust search
     if (shieldEmblem) {
        shieldEmblem.material.color.set(playerColor);
    } else { // Fallback if name isn't set exactly as expected
        const shieldBody = shield.getObjectByName('ShieldBody');
        if (shieldBody && shieldBody.children.length > 0 && shieldBody.children[0].material) {
             shieldBody.children[0].material.color.set(playerColor); // Assuming emblem is first child of body
        }
    }

    shield.scale.set(0.6, 0.6, 0.6);
    shield.position.set(-0.12, 0.2, 0.12); 
    shield.rotation.set(0, -Math.PI / 3, Math.PI / 12); // Held on arm
    knightGroup.add(shield);
    
    // Rank Indication (Optional): Small chevrons (tiny pyramids or flat triangles)
    // Example: 1 gold pyramid on shoulder for rank 1
    // const rankGeom = new THREE.ConeGeometry(0.02, 0.04, 4); // Pyramid shape
    // const rankMesh = createMesh(rankGeom, COLORS.YELLOW, 'RankChevron');
    // rankMesh.position.set(0.1, 0.6/2 + 0.15, 0); // Shoulder area
    // rankMesh.rotation.x = -Math.PI/4;
    // bodyMesh.add(rankMesh); // Add to body so it moves with it

    return knightGroup;
}

// Ensure all serf professions from units.md are implemented.
// Transporter - Done
// Builder - Done
// Woodcutter - Done
// Forester - Done
// Stonemason - Done
// Miner - Done
// Farmer - Done
// Fisherman - Done
// Miller - Done
// Baker - Done
// Pig Farmer - Done
// Butcher - Done
// Sawmill Worker - Done
// Smelter Worker - Done
// Goldsmith - Done
// Toolmaker - Done
// Blacksmith - Done
// Geologist - Done
// Knight - Done

// Add this export after all create... functions and before the Unit class
export const SERF_MODEL_CREATORS = {
  "Transporter": createTransporter,
  "Builder": createBuilder,
  "Woodcutter": createWoodcutter,
  "Forester": createForester,
  "Stonemason": createStonemason,
  "Miner": createMiner,
  "Farmer": createFarmer,
  "Fisherman": createFisherman,
  "Miller": createMiller,
  "Baker": createBaker,
  "PigFarmer": createPigFarmer, // Ensure key matches case used in Serf constructor or make constructor robust
  "Butcher": createButcher,
  "SawmillWorker": createSawmillWorker, // Ensure key matches case
  "SmelterWorker": createSmelterWorker, // Ensure key matches case
  "Goldsmith": createGoldsmith,
  "Toolmaker": createToolmaker,
  "Blacksmith": createBlacksmith,
  "Geologist": createGeologist,
  "Knight": createKnight // Included for completeness, serfManager can filter if needed
};

export class Unit {
    constructor(id, x, y, unitType, scene, mapManager) {
        this.id = id;
        this.x = x; // Grid X
        this.y = y; // Grid Y
        this.unitType = unitType;
        this.scene = scene;
        this.model = null;
        this.mapManager = mapManager; // Store mapManager
    }

    _loadModel(scene, modelPath = 'src/assets/models/units/serf.glb', scale = 0.03) {
        const loader = new GLTFLoader();
        loader.load(modelPath, (gltf) => {
            this.model = gltf.scene;
            this.model.scale.set(scale, scale, scale);
            this.model.name = `${this.unitType}-${this.id}`;
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            // Initial position based on grid coordinates
            this.updateModelPosition(); 
            scene.add(this.model);
            console.log(`${this.unitType} model loaded and added to scene at grid (${this.x}, ${this.y})`);
        }, undefined, (error) => {
            console.error(`Error loading ${this.unitType} model:`, error);
        });
    }

    updateModelPosition() {
        if (this.model && this.mapManager) {
            this.model.position.set(
                (this.x - (this.mapManager.width - 1) / 2) * TILE_SIZE,
                0, // Assuming Y=0 is ground level for serfs
                (this.y - (this.mapManager.height - 1) / 2) * TILE_SIZE
            );
        }
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.updateModelPosition();
    }

    update(deltaTime) {
        // Base update logic, if any (e.g., animations)
    }
}

export class Serf extends Unit {
    constructor(id, x, y, type, scene, mapManager) {
        super(id, x, y, 'serf', scene, mapManager); // this.model is initially null from Unit constructor
        this.serfType = type;
        this.task = 'idle';
        this.taskDetails = {};
        this.inventory = {};

        this.mapManager = mapManager;
        this.state = SERF_ACTION_STATES.IDLE;
        this.targetNode = null;
        this.taskTimer = 0;
        this.initialTaskAssignedByManager = false;

        this.path = null;
        this.pathIndex = 0;
        this.speed = 0.75; 
        this.maxInventoryCapacity = MAX_SERF_INVENTORY_CAPACITY;
        this.dropOffPoint = DEFAULT_DROPOFF_POINT;

        let modelCreator;
        const serfTypeLower = this.serfType ? String(this.serfType).toLowerCase() : 'idle';

        switch (serfTypeLower) {
            case 'transporter': modelCreator = createTransporter; break;
            case 'builder': modelCreator = createBuilder; break;
            case 'woodcutter': modelCreator = createWoodcutter; break;
            case 'forester': modelCreator = createForester; break;
            case 'stonemason': modelCreator = createStonemason; break;
            case 'miner': modelCreator = createMiner; break;
            case 'farmer': modelCreator = createFarmer; break;
            case 'fisherman': modelCreator = createFisherman; break;
            case 'miller': modelCreator = createMiller; break;
            case 'baker': modelCreator = createBaker; break;
            case 'pigfarmer': modelCreator = createPigFarmer; break; // Corrected case if needed
            case 'butcher': modelCreator = createButcher; break;
            case 'sawmillworker': modelCreator = createSawmillWorker; break; // Corrected case
            case 'smelterworker': modelCreator = createSmelterWorker; break; // Corrected case
            case 'goldsmith': modelCreator = createGoldsmith; break;
            case 'toolmaker': modelCreator = createToolmaker; break;
            case 'blacksmith': modelCreator = createBlacksmith; break;
            case 'geologist': modelCreator = createGeologist; break;
            case 'idle': // Explicitly handle 'idle' type
            default:
                if (serfTypeLower !== 'idle') { // Log warning only if it's an unrecognized type
                    console.warn(`Serf ${this.id}: Unrecognized serfType "${this.serfType}", defaulting to createBaseSerf.`);
                }
                modelCreator = createBaseSerf;
                break;
        }

        if (typeof modelCreator !== 'function') {
            console.error(`CRITICAL: Serf ${this.id} (${this.serfType}): modelCreator is not a function! serfTypeLower: ${serfTypeLower}. Attempting to use createBaseSerf as fallback.`);
            modelCreator = createBaseSerf; 
        }

        try {
            this.model = modelCreator(); 
        } catch (e) {
            console.error(`CRITICAL: Serf ${this.id} (${this.serfType}): Error during model creation by ${modelCreator.name || 'unknown_creator'}:`, e);
            this.model = null; // Ensure model is null if creation threw error
        }

        if (!this.model) {
            console.error(`CRITICAL: Serf ${this.id} (${this.serfType}): this.model is NULL or UNDEFINED after creation attempt by ${modelCreator.name || 'unknown_creator'}! Creating a fallback THREE.Group.`);
            this.model = new THREE.Group(); 
            this.model.name = `serf-${this.id}-${this.serfType}-FALLBACK_MODEL`;
            console.log(`Serf ${this.id} (${this.serfType}): Created a fallback THREE.Group for the model.`);
        } else {
            this.model.name = `serf-${this.id}-${this.serfType}`;
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        }

        this.updateModelPosition(); // updateModelPosition has its own check for this.model

        if (this.scene) {
            if (this.model) {
                 this.scene.add(this.model);
            } else {
                // This case should ideally not be reached if fallback model is created
                console.error(`Serf ${this.id} (${this.serfType}): Scene provided, but model is unexpectedly null/undefined before adding to scene.`);
            }
        } else {
            console.warn(`Serf ${this.id} (${this.serfType}): Scene object not provided during construction. Model will not be added to scene initially.`);
        }

        console.log(`Serf ${this.id} created at (${x},${y}), type: ${type}. Model assigned: ${!!this.model}. Model name: ${this.model ? this.model.name : 'N/A'}`);
    }

    setTask(taskType, details = {}) {
        this.task = taskType;
        this.taskDetails = details; // e.g., { resourceType: 'stone' }
        this.state = SERF_ACTION_STATES.IDLE; // Reset state when a new task is assigned
        this.targetNode = null;
        this.taskTimer = 0;
        this.path = null;
        this.pathIndex = 0;
        console.log(`${this.id} (${this.serfType}) assigned task: ${taskType} with details: ${JSON.stringify(details)}`);
    }

    setDropOffPoint(point) {
        this.dropOffPoint = point;
        console.log(`Serf ${this.id} drop-off point set to: ${JSON.stringify(this.dropOffPoint)}`);
    }

    _findTaskTarget() {
        if (!this.taskDetails || !this.taskDetails.resourceType) {
            console.log(`${this.id} cannot find target: resourceType not specified in taskDetails.`);
            this.task = 'idle';
            this.state = SERF_ACTION_STATES.IDLE;
            return false;
        }

        const resourceTypeToFind = this.taskDetails.resourceType;
        console.log(`${this.id} searching for ${resourceTypeToFind}...`);

        let bestTarget = null;
        let minDistanceSq = Infinity;

        const serfGridX = this.x; // Assuming this.x, this.y are current grid coords
        const serfGridY = this.y;

        for (let r = 0; r < this.mapManager.height; r++) {
            for (let c = 0; c < this.mapManager.width; c++) {
                const tile = this.mapManager.grid[r][c];
                if (tile.resource && tile.resource.type === resourceTypeToFind && tile.resource.amount > 0) {
                    const distSq = (c - serfGridX) * (c - serfGridX) + (r - serfGridY) * (r - serfGridY);
                    if (distSq < minDistanceSq) {
                        minDistanceSq = distSq;
                        bestTarget = tile;
                    }
                }
            }
        }

        if (bestTarget) {
            this.targetNode = bestTarget;
            this.state = SERF_ACTION_STATES.MOVING_TO_TARGET;
            console.log(`${this.id} found ${resourceTypeToFind} at (${this.targetNode.x}, ${this.targetNode.y}). Amount: ${this.targetNode.resource.amount}`);
            // Pathfind to the target node's coordinates
            this.path = this.mapManager.findPath({ x: this.x, y: this.y }, { x: this.targetNode.x, y: this.targetNode.y });
            
            if (this.path && this.path.length > 0) {
                this.pathIndex = 0; // Start at the beginning of the path
                this.state = SERF_ACTION_STATES.MOVING_TO_TARGET;
                console.log(`${this.id} path found. Length: ${this.path.length}. Moving to target.`);
                return true;
            } else {
                console.log(`${this.id} could not find a path to ${resourceTypeToFind} at (${this.targetNode.x}, ${this.targetNode.y}). Going idle.`);
                this.targetNode = null; // Clear target if no path
                this.task = 'idle';
                this.state = SERF_ACTION_STATES.IDLE;
                return false;
            }
        } else {
            console.log(`${this.id} could not find any available ${resourceTypeToFind}. Going idle.`);
            this.task = 'idle';
            this.state = SERF_ACTION_STATES.IDLE;
            return false;
        }
    }

    _moveAlongPath(deltaTime) {
        if (!this.model) {
            console.error(`Serf ${this.id} (${this.serfType}): ABORTING MOVEMENT - this.model is null in _moveAlongPath. State: ${this.state}, Task: ${this.task}`);
            this.state = SERF_ACTION_STATES.IDLE; 
            this.path = null;
            this.task = 'idle'; 
            return true; // Indicate movement "completed" (aborted)
        }

        if (!this.path || this.pathIndex >= this.path.length) {
            // console.log("Path completed or no path to follow.");
            return true; // Reached destination or no path
        }

        const targetWaypoint = this.path[this.pathIndex];
        const targetWorldX = (targetWaypoint.x - (this.mapManager.width - 1) / 2) * TILE_SIZE;
        const targetWorldZ = (targetWaypoint.y - (this.mapManager.height - 1) / 2) * TILE_SIZE;

        const directionX = targetWorldX - this.model.position.x;
        const directionZ = targetWorldZ - this.model.position.z;
        const distanceToWaypoint = Math.sqrt(directionX * directionX + directionZ * directionZ);

        const moveDistance = this.speed * TILE_SIZE * deltaTime; // Corrected: speed is tiles/sec

        if (distanceToWaypoint <= moveDistance) {
            // Arrived at waypoint
            this.model.position.x = targetWorldX;
            this.model.position.z = targetWorldZ;
            this.x = targetWaypoint.x; // Update logical grid position
            this.y = targetWaypoint.y;
            this.pathIndex++;
            // console.log(`${this.id} reached waypoint ${this.pathIndex -1}: (${targetWaypoint.x}, ${targetWaypoint.y})`);

            if (this.pathIndex >= this.path.length) {
                // console.log(`${this.id} reached final destination in path.`);
                return true; // Reached final destination
            }
        } else {
            // Move towards waypoint
            const normDirectionX = directionX / distanceToWaypoint;
            const normDirectionZ = directionZ / distanceToWaypoint;
            this.model.position.x += normDirectionX * moveDistance;
            this.model.position.z += normDirectionZ * moveDistance;

            // Update logical grid position based on model's world position (optional, can be coarse)
            // For simplicity, we only update logical grid position when a waypoint is reached.
            // More precise tracking could be done here if needed.
        }
        return false; // Still moving
    }

    _initiateReturnToDropOff() {
        console.log(`${this.id} inventory full or task complete. Returning to drop-off: ${JSON.stringify(this.dropOffPoint)}.`);
        this.state = SERF_ACTION_STATES.RETURNING_TO_DROPOFF;
        this.path = this.mapManager.findPath({ x: this.x, y: this.y }, this.dropOffPoint);
        this.pathIndex = 0;
        if (!this.path) {
            console.error(`${this.id} cannot find path to drop-off point! Going idle.`);
            this.state = SERF_ACTION_STATES.IDLE;
        } else {
            console.log(`${this.id} path found to drop-off. Length: ${this.path.length}.`);
        }
    }

    update(deltaTime) {
        super.update(deltaTime); // Base unit update

        switch (this.state) {
            case SERF_ACTION_STATES.IDLE:
                if (this.task === 'mine') {
                    this._findTaskTarget();
                } else if (this.task === 'work_at_building' && this.taskDetails.buildingId) {
                    // If tasked to work at a building, find path to it.
                    const building = this.scene.getObjectByProperty('uuid', this.taskDetails.buildingId); // Corrected: use this.scene directly
                    if (building) {
                        const targetGridX = Math.round(building.position.x / TILE_SIZE + (this.mapManager.width - 1) / 2);
                        const targetGridY = Math.round(building.position.z / TILE_SIZE + (this.mapManager.height - 1) / 2);
                        this.targetNode = { x: targetGridX, y: targetGridY }; // Simplified target node for building
                        this.path = this.mapManager.findPath({ x: this.x, y: this.y }, this.targetNode);
                        if (this.path && this.path.length > 0) {
                            this.pathIndex = 0;
                            this.state = SERF_ACTION_STATES.MOVING_TO_TARGET;
                            console.log(`${this.id} path found to building ${this.taskDetails.buildingName}. Moving.`);
                        } else {
                            console.warn(`${this.id} could not find path to building ${this.taskDetails.buildingName}. Going idle.`);
                            this.task = 'idle'; // Revert to idle if no path
                        }
                    } else {
                        console.error(`${this.id} assigned to work at non-existent building ID ${this.taskDetails.buildingId}. Going idle.`);
                        this.task = 'idle';
                    }
                } else if (this.task === 'idle' && Object.keys(this.inventory).length > 0) {
                    this._initiateReturnToDropOff();
                }
                break;

            case SERF_ACTION_STATES.MOVING_TO_TARGET:
                if (this.targetNode && this.path) {
                    const arrived = this._moveAlongPath(deltaTime);
                    if (arrived) {
                        this.setPosition(this.targetNode.x, this.targetNode.y);
                        this.path = null;
                        this.pathIndex = 0;

                        if (this.task === 'mine') {
                            console.log(`${this.id} arrived at ${this.taskDetails.resourceType} at (${this.targetNode.x}, ${this.targetNode.y}).`);
                            this.state = SERF_ACTION_STATES.PERFORMING_TASK;
                            this.taskTimer = 0;
                        } else if (this.task === 'work_at_building') {
                            console.log(`${this.id} arrived at building ${this.taskDetails.buildingName} at (${this.targetNode.x}, ${this.targetNode.y}).`);
                            this.state = SERF_ACTION_STATES.WORKING_AT_BUILDING;
                            // Serf remains at building, actual work/production handled by ConstructionManager
                        } else {
                            // Default behavior if task is not specifically handled after arrival
                            this.state = SERF_ACTION_STATES.IDLE;
                        }
                        this.targetNode = null; // Clear target node after arrival and state change
                    }
                } else {
                    console.log(`${this.id} in MOVING_TO_TARGET but no targetNode or path. Reverting to IDLE.`);
                    this.state = SERF_ACTION_STATES.IDLE;
                    this.path = null;
                    this.pathIndex = 0;
                }
                break;

            case SERF_ACTION_STATES.PERFORMING_TASK: // This state is now primarily for resource gathering like mining
                if (this.task === 'mine' && this.targetNode && this.targetNode.resource && this.targetNode.resource.amount > 0) {
                    this.taskTimer += deltaTime;
                    const miningDuration = 2.0; // Time in seconds to mine 1 unit

                    if (this.taskTimer >= miningDuration) {
                        this.taskTimer -= miningDuration;
                        
                        const minedAmount = 1;
                        const resourceType = this.taskDetails.resourceType;
                        
                        this.targetNode.resource.amount -= minedAmount;
                        this.inventory[resourceType] = (this.inventory[resourceType] || 0) + minedAmount;
                        console.log(`${this.id} mined ${minedAmount} ${resourceType}. Inv: ${this.inventory[resourceType]}. Node rem: ${this.targetNode.resource.amount}`);

                        if (this.inventory[resourceType] >= this.maxInventoryCapacity) {
                            console.log(`${this.id} inventory full for ${resourceType}.`);
                            this._initiateReturnToDropOff();
                            break; 
                        }

                        if (this.targetNode.resource.amount <= 0) {
                            console.log(`Resource ${resourceType} at (${this.targetNode.x}, ${this.targetNode.y}) depleted.`);
                            if (this.mapManager && this.mapManager.removeResourceVisual) {
                                this.mapManager.removeResourceVisual(this.targetNode);
                            }
                            this.targetNode.resource = null; 
                            this.targetNode = null;

                            if (Object.keys(this.inventory).length > 0) {
                                this._initiateReturnToDropOff();
                            } else {
                                this.state = SERF_ACTION_STATES.IDLE; 
                            }
                        }
                    }
                } else if (this.task === 'mine') { // If mining but target is gone or invalid
                    console.log(`${this.id} in PERFORMING_TASK (mine) but targetNode or resource is invalid. Reverting to IDLE.`);
                    this.state = SERF_ACTION_STATES.IDLE;
                    this.targetNode = null;
                }
                break;

            case SERF_ACTION_STATES.WORKING_AT_BUILDING:
                // Serf is at the building. ConstructionManager handles production/food based on serf.job.
                // Serf remains in this state until job is removed or building is destroyed.
                // No specific per-frame action needed here from the serf itself.
                // If serf.job becomes null (e.g., unassigned by SerfManager), it should go IDLE.
                if (!this.job) { // Check if job is still valid
                    console.log(`${this.id} no longer has a job at building. Reverting to IDLE.`);
                    this.state = SERF_ACTION_STATES.IDLE;
                    this.task = 'idle';
                    this.taskDetails = {};
                }
                break;

            case SERF_ACTION_STATES.RETURNING_TO_DROPOFF:
                if (this.path) {
                    const arrivedAtDropOff = this._moveAlongPath(deltaTime);
                    if (arrivedAtDropOff) {
                        console.log(`${this.id} arrived at drop-off point ${JSON.stringify(this.dropOffPoint)}.`);
                        this.setPosition(this.dropOffPoint.x, this.dropOffPoint.y);

                        // Deposit resources
                        let depositedSomething = false;
                        for (const resourceType in this.inventory) {
                            if (this.inventory.hasOwnProperty(resourceType)) {
                                const amount = this.inventory[resourceType];
                                if (amount > 0) {
                                    console.log(`${this.id} depositing ${amount} of ${resourceType}.`);
                                    resourceManager.addResource(resourceType, amount);
                                    depositedSomething = true;
                                }
                            }
                        }
                        
                        this.inventory = {}; // Clear inventory

                        this.path = null;
                        this.pathIndex = 0;
                        
                        // After dropping off, decide what to do next.
                        // If the original task was 'mine' and it was interrupted by full inventory, try to resume.
                        if (this.task === 'mine' && this.taskDetails && this.taskDetails.resourceType) {
                             console.log(`${this.id} dropped off resources, attempting to find more ${this.taskDetails.resourceType}.`);
                             this.state = SERF_ACTION_STATES.IDLE; // Will trigger _findTaskTarget for 'mine'
                        } else {
                            // If no specific task to return to, or task was completed (e.g. resource depleted)
                            console.log(`${this.id} deposited resources and is now IDLE.`);
                            this.task = 'idle'; // Set task to idle if not resuming a specific one
                            this.state = SERF_ACTION_STATES.IDLE;
                        }
                         // resourceManager.addResource already calls _emitChange, so UI should update.
                    }
                } else {
                    console.error(`${this.id} is in RETURNING_TO_DROPOFF state but has no path. Setting to IDLE.`);
                    this.state = SERF_ACTION_STATES.IDLE;
                    // If inventory has items, try to re-initiate return, otherwise it's stuck.
                    if (Object.keys(this.inventory).length > 0) {
                        this._initiateReturnToDropOff(); // Try again
                    }
                }
                break;
            
            default:
                console.warn(`${this.id} is in an unknown state: ${this.state}`);
                this.state = SERF_ACTION_STATES.IDLE;
                break;
        }
    }
}