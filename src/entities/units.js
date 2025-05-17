import * as THREE from 'three';
import * as Resources from './resources.js'; // For tools
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TILE_SIZE } from '../core/MapManager.js'; // Import TILE_SIZE
import resourceManager from '../core/resourceManager.js'; // Import resourceManager

export const SERF_ACTION_STATES = { // Added export keyword
    IDLE: 'IDLE',
    MOVING_TO_TARGET: 'MOVING_TO_TARGET', // Generic movement to a point/static target
    PERFORMING_TASK: 'PERFORMING_TASK', // Generic task at a location (e.g., old mining)
    RETURNING_TO_DROPOFF: 'RETURNING_TO_DROPOFF', // Returning to global dropoff
    WORKING_AT_BUILDING: 'WORKING_AT_BUILDING', // For serfs whose work is *inside* or directly tied to building without map interaction (e.g. blacksmith)

    // New states for Transporters
    MOVING_TO_PICKUP_LOCATION: 'MOVING_TO_PICKUP_LOCATION',
    PICKING_UP_RESOURCE: 'PICKING_UP_RESOURCE',
    MOVING_TO_RESOURCE_DROPOFF: 'MOVING_TO_RESOURCE_DROPOFF', // Note: Renamed from MOVING_TO_DROPOFF_LOCATION for clarity
    DROPPING_OFF_RESOURCE: 'DROPPING_OFF_RESOURCE',

    // New states for resource gatherers (e.g., Woodcutter)
    SEARCHING_FOR_RESOURCE_ON_MAP: 'SEARCHING_FOR_RESOURCE_ON_MAP',
    MOVING_TO_RESOURCE_NODE: 'MOVING_TO_RESOURCE_NODE', // Moving to a tree, stone deposit etc.
    GATHERING_RESOURCE_FROM_NODE: 'GATHERING_RESOURCE_FROM_NODE', // Actively gathering from the map node
    MOVING_TO_DEPOSIT_BUILDING: 'MOVING_TO_DEPOSIT_BUILDING', // Returning to their assigned building (e.g., Woodcutter's Hut)
    DEPOSITING_RESOURCE_IN_BUILDING: 'DEPOSITING_RESOURCE_IN_BUILDING', // Depositing into local building inventory
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
        this.taskDetails = details; // e.g., { resourceType: 'stone', buildingId: 'hut_uuid' }
        this.state = SERF_ACTION_STATES.IDLE; // Reset state when a new task is assigned
        this.targetNode = null; // Target map tile or building
        this.targetResourceNode = null; // Specific resource node on map
        this.assignedBuilding = null; // Reference to assigned building instance, if applicable
        this.taskTimer = 0;
        this.path = null;
        this.pathIndex = 0;
        console.log(`${this.id} (${this.serfType}) assigned task: ${taskType} with details: ${JSON.stringify(details)}`);

        if (details.buildingId) {
            const buildingModel = this.scene.getObjectByProperty('uuid', details.buildingId);
            if (buildingModel && buildingModel.userData && buildingModel.userData.buildingInstance) {
                this.assignedBuilding = buildingModel.userData.buildingInstance;
                console.log(`${this.id} (${this.serfType}) associated with building: ${this.assignedBuilding.info.name}`);
            } else {
                console.warn(`${this.id} (${this.serfType}) could not find or associate with buildingId: ${details.buildingId}`);
            }
        }
    }

    setDropOffPoint(point) {
        this.dropOffPoint = point;
        console.log(`Serf ${this.id} drop-off point set to: ${JSON.stringify(this.dropOffPoint)}`);
    }

    _findTaskTarget() { // This will be for finding resource nodes on the map
        if (!this.taskDetails || !this.taskDetails.resourceType) {
            console.log(`${this.id} (${this.serfType}) cannot find resource target: resourceType not specified in taskDetails.`);
            this.state = SERF_ACTION_STATES.IDLE; // Go idle if no resource type to search for
            return false;
        }

        const resourceTypeToFind = this.taskDetails.resourceType;
        console.log(`${this.id} (${this.serfType}) searching for ${resourceTypeToFind} on map...`);

        let bestTarget = null;
        let minDistanceSq = Infinity;

        const serfGridX = this.x;
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
            this.targetResourceNode = bestTarget; // Store as the specific resource node
            // Pathfind to the target resource node's coordinates
            this.path = this.mapManager.findPath({ x: this.x, y: this.y }, { x: this.targetResourceNode.x, y: this.targetResourceNode.y });
            
            if (this.path && this.path.length > 0) {
                this.pathIndex = 0;
                this.state = SERF_ACTION_STATES.MOVING_TO_RESOURCE_NODE;
                console.log(`${this.id} (${this.serfType}) path found to ${resourceTypeToFind} at (${this.targetResourceNode.x}, ${this.targetResourceNode.y}). Moving.`);
                return true;
            } else {
                console.log(`${this.id} (${this.serfType}) could not find a path to ${resourceTypeToFind} at (${this.targetResourceNode.x}, ${this.targetResourceNode.y}). Going idle.`);
                this.targetResourceNode = null;
                this.state = SERF_ACTION_STATES.IDLE;
                return false;
            }
        } else {
            console.log(`${this.id} (${this.serfType}) could not find any available ${resourceTypeToFind} on map. Going idle.`);
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
                if (this.task === 'gather_resource_for_building' && this.assignedBuilding) {
                    const resourceToDeposit = this.taskDetails.resourceType;
                    const amountCarrying = this.inventory[resourceToDeposit] || 0;
                    let totalInventoryAmount = Object.values(this.inventory).reduce((sum, val) => sum + val, 0);

                    if (amountCarrying > 0) {
                        // Serf has the specific resource to deposit. Prioritize depositing.
                        console.log(`${this.id} (${this.serfType}) is IDLE, carrying ${amountCarrying} ${resourceToDeposit}. Preparing to move to deposit at ${this.assignedBuilding.info.name}.`);
                        
                        // Ensure assignedBuilding and its entry point are valid
                        if (!this.assignedBuilding.getEntryPointGridPosition) {
                            console.error(`${this.id} (${this.serfType}) IDLE: assignedBuilding ${this.assignedBuilding.info.name} is missing getEntryPointGridPosition. Staying IDLE.`);
                            break; 
                        }
                        const buildingEntryPoint = this.assignedBuilding.getEntryPointGridPosition();
                        
                        this.targetNode = { 
                            x: buildingEntryPoint.x, 
                            y: buildingEntryPoint.z, // mapManager uses y for grid's Z
                            buildingId: this.assignedBuilding.model.uuid, 
                            type: 'deposit_at_assigned_building' 
                        };
                        this.path = this.mapManager.findPath({ x: this.x, y: this.y }, { x: buildingEntryPoint.x, y: buildingEntryPoint.z });
                        
                        if (this.path && this.path.length > 0) {
                            this.state = SERF_ACTION_STATES.MOVING_TO_DEPOSIT_BUILDING;
                            this.pathIndex = 0; // Reset pathIndex
                        } else {
                            console.error(`${this.id} (${this.serfType}) IDLE: could not find path to deposit building ${this.assignedBuilding.info.name} at (${buildingEntryPoint.x},${buildingEntryPoint.z}) from (${this.x},${this.y}). Staying IDLE.`);
                            // Serf remains IDLE, will retry next update tick.
                        }
                    } else if (totalInventoryAmount < this.maxInventoryCapacity) {
                        // Serf is empty of the specific resource (or generally empty) and has overall capacity. Search for more.
                        console.log(`${this.id} (${this.serfType}) is IDLE at ${this.assignedBuilding.info.name}, empty of ${resourceToDeposit} and has capacity. Starting SEARCHING_FOR_RESOURCE_ON_MAP for ${resourceToDeposit}`);
                        this.state = SERF_ACTION_STATES.SEARCHING_FOR_RESOURCE_ON_MAP;
                    } else {
                        // Serf is IDLE, empty of specific resource, but general inventory is full OR
                        // serf has other items and no capacity for new ones.
                        console.log(`${this.id} (${this.serfType}) is IDLE at ${this.assignedBuilding.info.name}. Inventory full or no specific resource to deposit. Waiting.`);
                        // Stays IDLE, effectively waiting.
                    }
                } else if (this.task === 'work_at_building' && this.taskDetails.buildingId) {
                    const buildingModel = this.scene.getObjectByProperty('uuid', this.taskDetails.buildingId); // Renamed to buildingModel for clarity
                    if (buildingModel) {
                        let targetGridX, targetGridY; // targetGridY is the map's Z coordinate

                        if (buildingModel.userData && buildingModel.userData.buildingInstance) {
                            const buildingInstance = buildingModel.userData.buildingInstance;
                            const entryPointGrid = buildingInstance.getEntryPointGridPosition();
                            targetGridX = entryPointGrid.x;
                            targetGridY = entryPointGrid.z; // buildingInstance.getEntryPointGridPosition() returns .z for depth
                            console.log(`${this.id} (${this.serfType}) target for ${this.taskDetails.buildingName}: entry point (${targetGridX}, ${targetGridY}) from buildingInstance.`);
                        } else {
                            // Fallback: use building model origin if instance not found (should not happen for correctly set up buildings)
                            targetGridX = Math.round(buildingModel.position.x / TILE_SIZE + (this.mapManager.width - 1) / 2);
                            targetGridY = Math.round(buildingModel.position.z / TILE_SIZE + (this.mapManager.height - 1) / 2);
                            console.warn(`${this.id} (${this.serfType}) could not get buildingInstance for ${this.taskDetails.buildingName}. Using model origin (${targetGridX}, ${targetGridY}) as target.`);
                        }

                        // Check if already at the building's entry point
                        // this.y is the serf's grid Z coordinate
                        if (this.x === targetGridX && this.y === targetGridY) {
                            console.log(`${this.id} (${this.serfType}) is IDLE and already at ${this.taskDetails.buildingName}'s target/entry point. Transitioning to WORKING_AT_BUILDING.`);
                            this.state = SERF_ACTION_STATES.WORKING_AT_BUILDING;
                            this.taskTimer = 0;
                        } else {
                            this.targetNode = { x: targetGridX, y: targetGridY, buildingId: this.taskDetails.buildingId, buildingName: this.taskDetails.buildingName };
                            // Pathfind to targetGridX, targetGridY (where targetGridY is the map's Z coordinate, used as 'y' in findPath)
                            this.path = this.mapManager.findPath({ x: this.x, y: this.y }, { x: targetGridX, y: targetGridY });
                            if (this.path && this.path.length > 0) {
                                this.pathIndex = 0;
                                this.state = SERF_ACTION_STATES.MOVING_TO_TARGET;
                                console.log(`${this.id} (${this.serfType}) path found to building ${this.taskDetails.buildingName} entry point (${targetGridX}, ${targetGridY}). Moving.`);
                            } else {
                                console.warn(`${this.id} (${this.serfType}) could not find path to building ${this.taskDetails.buildingName} entry point (${targetGridX}, ${targetGridY}). Serf at (${this.x},${this.y}). Going idle.`);
                                this.task = 'idle'; // Go idle if no path
                            }
                        }
                    } else {
                        console.error(`${this.id} (${this.serfType}) assigned to work at non-existent building ID ${this.taskDetails.buildingId}. Going idle.`);
                        this.task = 'idle';
                    }
                } else if (this.task === 'transport_resource' && this.taskDetails.sourceBuildingId) {
                    // ... (existing Transporter IDLE logic)
                } else if (this.task === 'mine') { // Keep old mine task for now if needed, or phase out
                    this._findTaskTarget(); // This uses targetResourceNode now
                }
                // ... (other IDLE conditions)
                break;

            case SERF_ACTION_STATES.SEARCHING_FOR_RESOURCE_ON_MAP: // New state for Woodcutter
                if (this.task === 'gather_resource_for_building') {
                    this._findTaskTarget(); // This will search for this.taskDetails.resourceType (e.g., WOOD)
                                        // and transition to MOVING_TO_RESOURCE_NODE or IDLE.
                } else {
                    this.state = SERF_ACTION_STATES.IDLE; // Not a gathering task
                }
                break;

            case SERF_ACTION_STATES.MOVING_TO_RESOURCE_NODE: // New state for Woodcutter
                if (this.targetResourceNode && this.path) {
                    const arrived = this._moveAlongPath(deltaTime);
                    if (arrived) {
                        this.setPosition(this.targetResourceNode.x, this.targetResourceNode.y);
                        this.path = null;
                        this.pathIndex = 0;
                        console.log(`${this.id} (${this.serfType}) arrived at resource node ${this.taskDetails.resourceType} at (${this.targetResourceNode.x}, ${this.targetResourceNode.y}).`);
                        this.state = SERF_ACTION_STATES.GATHERING_RESOURCE_FROM_NODE;
                        this.taskTimer = 0; // Reset timer for gathering duration
                    }
                } else {
                    console.log(`${this.id} (${this.serfType}) in MOVING_TO_RESOURCE_NODE but no targetResourceNode or path. Reverting to IDLE.`);
                    this.state = SERF_ACTION_STATES.IDLE;
                    this.targetResourceNode = null;
                }
                break;

            case SERF_ACTION_STATES.GATHERING_RESOURCE_FROM_NODE: // New state for Woodcutter
                if (this.task === 'gather_resource_for_building' && this.targetResourceNode && this.targetResourceNode.resource && this.targetResourceNode.resource.amount > 0) {
                    this.taskTimer += deltaTime;
                    const gatheringDuration = 2.0; // Time in seconds to gather 1 unit (e.g., wood)

                    if (this.taskTimer >= gatheringDuration) {
                        this.taskTimer -= gatheringDuration;
                        
                        const gatheredAmount = 1; // Gather 1 unit per cycle
                        const resourceType = this.taskDetails.resourceType;
                        
                        // Check if map still has resource
                        if (this.targetResourceNode.resource.amount >= gatheredAmount) {
                            this.targetResourceNode.resource.amount -= gatheredAmount; // Deplete from map
                            this.inventory[resourceType] = (this.inventory[resourceType] || 0) + gatheredAmount;
                            console.log(`${this.id} (${this.serfType}) gathered ${gatheredAmount} ${resourceType}. Inventory: ${this.inventory[resourceType]}. Resource left at node: ${this.targetResourceNode.resource.amount}`);

                            let currentInventoryAmount = Object.values(this.inventory).reduce((sum, val) => sum + val, 0);
                            if (currentInventoryAmount >= this.maxInventoryCapacity || this.targetResourceNode.resource.amount === 0) {
                                console.log(`${this.id} (${this.serfType}) inventory full or resource node depleted. Returning to deposit at ${this.assignedBuilding.info.name}.`);
                                this.state = SERF_ACTION_STATES.MOVING_TO_DEPOSIT_BUILDING;
                                this.targetResourceNode = null; // Clear resource node target
                                // Pathfind to assigned building
                                const buildingModel = this.scene.getObjectByProperty('uuid', this.assignedBuilding.model.uuid);
                                if (buildingModel) {
                                    const targetGridX = Math.round(buildingModel.position.x / TILE_SIZE + (this.mapManager.width - 1) / 2);
                                    const targetGridY = Math.round(buildingModel.position.z / TILE_SIZE + (this.mapManager.height - 1) / 2);
                                    this.targetNode = { x: targetGridX, y: targetGridY, buildingId: this.assignedBuilding.model.uuid, type: 'deposit_at_assigned_building' };
                                    this.path = this.mapManager.findPath({ x: this.x, y: this.y }, {x: targetGridX, y: targetGridY});
                                    if (!this.path || this.path.length === 0) {
                                        console.error(`${this.id} (${this.serfType}) could not find path to deposit building ${this.assignedBuilding.info.name}! Going IDLE.`);
                                        this.state = SERF_ACTION_STATES.IDLE;
                                    }
                                } else {
                                     console.error(`${this.id} (${this.serfType}) could not find assigned building model for deposit! Going IDLE.`);
                                     this.state = SERF_ACTION_STATES.IDLE;
                                }
                            }
                        } else {
                            console.log(`${this.id} (${this.serfType}) resource node ${this.taskDetails.resourceType} depleted by another. Searching again.`);
                            this.state = SERF_ACTION_STATES.SEARCHING_FOR_RESOURCE_ON_MAP;
                            this.targetResourceNode = null;
                        }
                    }
                } else { // Target depleted, or wrong task
                    console.log(`${this.id} (${this.serfType}) target resource node invalid or task changed. Deciding next action.`);
                    let currentInventoryAmount = Object.values(this.inventory).reduce((sum, val) => sum + val, 0);
                    if (currentInventoryAmount > 0 && this.assignedBuilding) {
                        this.state = SERF_ACTION_STATES.MOVING_TO_DEPOSIT_BUILDING; // Return to deposit what was gathered
                         const buildingModel = this.scene.getObjectByProperty('uuid', this.assignedBuilding.model.uuid);
                        if (buildingModel) {
                            const targetGridX = Math.round(buildingModel.position.x / TILE_SIZE + (this.mapManager.width - 1) / 2);
                            const targetGridY = Math.round(buildingModel.position.z / TILE_SIZE + (this.mapManager.height - 1) / 2);
                            this.targetNode = { x: targetGridX, y: targetGridY, buildingId: this.assignedBuilding.model.uuid, type: 'deposit_at_assigned_building' };
                            this.path = this.mapManager.findPath({ x: this.x, y: this.y }, {x: targetGridX, y: targetGridY});
                             if (!this.path || this.path.length === 0) {
                                console.error(`${this.id} (${this.serfType}) could not find path to deposit building ${this.assignedBuilding.info.name} (fallback)! Going IDLE.`);
                                this.state = SERF_ACTION_STATES.IDLE;
                            }
                        } else {
                             console.error(`${this.id} (${this.serfType}) could not find assigned building model for deposit (fallback)! Going IDLE.`);
                             this.state = SERF_ACTION_STATES.IDLE;
                        }
                    } else if (this.task === 'gather_resource_for_building') {
                        this.state = SERF_ACTION_STATES.SEARCHING_FOR_RESOURCE_ON_MAP; // Search again
                    } else {
                        this.state = SERF_ACTION_STATES.IDLE;
                    }
                    this.targetResourceNode = null;
                }
                break;

            case SERF_ACTION_STATES.MOVING_TO_DEPOSIT_BUILDING: // New state for Woodcutter
                if (this.targetNode && this.path && this.targetNode.type === 'deposit_at_assigned_building') {
                    const arrived = this._moveAlongPath(deltaTime);
                    if (arrived) {
                        this.setPosition(this.targetNode.x, this.targetNode.y);
                        this.path = null;
                        this.pathIndex = 0;
                        console.log(`${this.id} (${this.serfType}) arrived at assigned building ${this.assignedBuilding.info.name} to deposit.`);
                        this.state = SERF_ACTION_STATES.DEPOSITING_RESOURCE_IN_BUILDING;
                        this.targetNode = null;
                    }
                } else {
                    console.warn(`${this.id} (${this.serfType}) in MOVING_TO_DEPOSIT_BUILDING but no targetNode, path, or wrong type. Reverting to IDLE.`);
                    this.state = SERF_ACTION_STATES.IDLE;
                    this.task = 'idle'; // Reset task if something went wrong
                }
                break;

            case SERF_ACTION_STATES.DEPOSITING_RESOURCE_IN_BUILDING: // New state for Woodcutter
                if (this.task === 'gather_resource_for_building' && this.assignedBuilding) {
                    const resourceType = this.taskDetails.resourceType;
                    const amountInInventory = this.inventory[resourceType] || 0;

                    if (amountInInventory > 0) {
                        const amountAdded = this.assignedBuilding.addResource(resourceType, amountInInventory);
                        if (amountAdded > 0) {
                            this.inventory[resourceType] -= amountAdded;
                            if (this.inventory[resourceType] <= 0) {
                                delete this.inventory[resourceType];
                            }
                            console.log(`${this.id} (${this.serfType}) deposited ${amountAdded} ${resourceType} at ${this.assignedBuilding.info.name}. Remaining in inventory: ${this.inventory[resourceType] || 0}`);
                        } else {
                            console.log(`${this.id} (${this.serfType}) failed to deposit ${resourceType} at ${this.assignedBuilding.info.name} (hut full or error). Will try again or go idle if hut remains full.`);
                            // If hut is full, serf should wait or be reassigned by SerfManager. For now, it will go IDLE and try to search again if capacity.
                        }
                    } else {
                        console.log(`${this.id} (${this.serfType}) arrived at ${this.assignedBuilding.info.name} to deposit, but no ${resourceType} in inventory.`);
                    }
                    
                    // After deposit attempt, go IDLE. SerfManager or IDLE state will decide next action.
                    this.state = SERF_ACTION_STATES.IDLE; 
                    // Do not clear taskDetails, as it contains resourceType and buildingId needed for next cycle.
                    // Task remains 'gather_resource_for_building'.
                } else {
                    console.warn(`${this.id} (${this.serfType}) in DEPOSITING_RESOURCE_IN_BUILDING but task/assignedBuilding invalid. Going IDLE.`);
                    this.state = SERF_ACTION_STATES.IDLE;
                    this.task = 'idle';
                }
                break;

            case SERF_ACTION_STATES.MOVING_TO_TARGET: // Generic movement (e.g., initial move to a worksite building)
                if (this.targetNode && this.path) {
                    const arrived = this._moveAlongPath(deltaTime);
                    if (arrived) {
                        this.setPosition(this.targetNode.x, this.targetNode.y);
                        this.path = null;
                        this.pathIndex = 0;

                        if (this.task === 'work_at_building' && this.targetNode.buildingId) { // Arrived at a building for 'work_at_building'
                            console.log(`${this.id} (${this.serfType}) arrived at building ${this.taskDetails.buildingName || this.targetNode.buildingId} for 'work_at_building'.`);
                            this.state = SERF_ACTION_STATES.WORKING_AT_BUILDING;
                            this.taskTimer = 0; // Reset timer for work cycle
                        } else if (this.task === 'mine') { // Arrived at a resource node for 'mine' task
                             console.log(`${this.id} (${this.serfType}) arrived at ${this.taskDetails.resourceType} at (${this.targetNode.x}, ${this.targetNode.y}) for 'mine' task.`);
                             this.state = SERF_ACTION_STATES.PERFORMING_TASK; // Old mining task state
                             this.taskTimer = 0;
                        } else {
                            // Default behavior if task is not specifically handled after arrival at a generic target
                            console.log(`${this.id} (${this.serfType}) arrived at generic target. Going IDLE.`);
                            this.state = SERF_ACTION_STATES.IDLE;
                        }
                        this.targetNode = null; // Clear generic target node
                    }
                } else {
                    console.log(`${this.id} (${this.serfType}) in MOVING_TO_TARGET but no targetNode or path. Reverting to IDLE.`);
                    this.state = SERF_ACTION_STATES.IDLE;
                    this.path = null;
                    this.pathIndex = 0;
                }
                break;
            
            case SERF_ACTION_STATES.WORKING_AT_BUILDING: // For professions that work *at* the building (e.g. Blacksmith)
                // This state is for serfs whose production logic is tied directly to the building,
                // not for gatherers like Woodcutters who now use the new gather_resource_for_building flow.
                // The existing logic for this state (producing resources directly into building inventory based on building.info)
                // can remain for other professions if needed.
                // If a Woodcutter somehow ends up here, it should probably go IDLE.
                if (this.serfType === 'Woodcutter' && this.task === 'work_at_building') {
                     console.warn(`Woodcutter ${this.id} in deprecated WORKING_AT_BUILDING state. Transitioning to IDLE to be reassigned.`);
                     this.task = 'idle'; // Clear task to allow SerfManager to re-evaluate
                     this.state = SERF_ACTION_STATES.IDLE;
                     break;
                }

                // Existing logic for other professions:
                if (this.task === 'work_at_building' && this.taskDetails.buildingId) {
                    const buildingModel = this.scene.getObjectByProperty('uuid', this.taskDetails.buildingId);
                    if (buildingModel && buildingModel.userData && buildingModel.userData.buildingInstance) {
                        const buildingInstance = buildingModel.userData.buildingInstance;
                        if (buildingInstance.info &&
                            buildingInstance.info.jobProfession === this.serfType &&
                            buildingInstance.info.producesResource && // Building itself produces
                            buildingInstance.info.productionIntervalMs) {

                            this.taskTimer += deltaTime;
                            const productionIntervalSeconds = buildingInstance.info.productionIntervalMs / 1000;

                            if (this.taskTimer >= productionIntervalSeconds) {
                                this.taskTimer -= productionIntervalSeconds;
                                const resourceProduced = buildingInstance.info.producesResource;
                                const amountProduced = 1; 
                                const amountAdded = buildingInstance.addResource(resourceProduced, amountProduced);
                                if (amountAdded > 0) {
                                    console.log(`${this.id} (${this.serfType}) [direct production] deposited ${amountAdded} ${resourceProduced} at ${buildingInstance.info.name}.`);
                                } else {
                                    console.log(`${this.id} (${this.serfType}) [direct production] failed to deposit ${resourceProduced} at ${buildingInstance.info.name} (full).`);
                                }
                                // Serf remains working unless building is full and logic dictates otherwise
                                // For now, they just keep trying or wait.
                                // If building is full, they might go IDLE to be reassigned or wait.
                                if (buildingInstance.getStock(resourceProduced) >= buildingInstance.maxStock) {
                                    console.log(`${this.id} (${this.serfType}) [direct production] ${buildingInstance.info.name} is full of ${resourceProduced}. Going IDLE.`);
                                    this.task = 'idle';
                                    this.state = SERF_ACTION_STATES.IDLE;
                                }
                            }
                        } else {
                            // console.log(`${this.id} (${this.serfType}) at ${buildingInstance.info.name}, but not configured for direct production or profession mismatch. Going IDLE.`);
                            this.task = 'idle';
                            this.state = SERF_ACTION_STATES.IDLE;
                        }
                    } else {
                        // console.error(`${this.id} (${this.serfType}) in WORKING_AT_BUILDING, but building ${this.taskDetails.buildingId} not found/no instance. Going IDLE.`);
                        this.task = 'idle';
                        this.state = SERF_ACTION_STATES.IDLE;
                    }
                } else {
                    // console.warn(`${this.id} (${this.serfType}) in WORKING_AT_BUILDING but task is not 'work_at_building' or no buildingId. Going IDLE.`);
                    this.task = 'idle';
                    this.state = SERF_ACTION_STATES.IDLE;
                }
                break;

            case SERF_ACTION_STATES.PERFORMING_TASK: // This is the old "mining" task state, gathering from map to global.
                                                    // Woodcutters now use GATHERING_RESOURCE_FROM_NODE.
                                                    // This can be kept for other direct-to-global gatherers or phased out.
                if (this.task === 'mine' && this.targetResourceNode && this.targetResourceNode.resource && this.targetResourceNode.resource.amount > 0) {
                    this.taskTimer += deltaTime;
                    const miningDuration = 2.0; 

                    if (this.taskTimer >= miningDuration) {
                        this.taskTimer -= miningDuration;
                        const minedAmount = 1;
                        const resourceType = this.taskDetails.resourceType;

                        if (this.targetResourceNode.resource.amount >= minedAmount) {
                            this.targetResourceNode.resource.amount -= minedAmount;
                            this.inventory[resourceType] = (this.inventory[resourceType] || 0) + minedAmount;
                            console.log(`${this.id} (${this.serfType}) mined ${minedAmount} ${resourceType}. Inventory: ${this.inventory[resourceType]}. Resource left at node: ${this.targetResourceNode.resource.amount}`);

                            let currentInventoryAmount = Object.values(this.inventory).reduce((sum, val) => sum + val, 0);
                            if (currentInventoryAmount >= this.maxInventoryCapacity || this.targetResourceNode.resource.amount === 0) {
                                console.log(`${this.id} (${this.serfType}) inventory full or resource node depleted. Returning to global drop-off.`);
                                this._initiateReturnToDropOff(); // This goes to global resourceManager
                                this.targetResourceNode = null;
                            }
                        } else {
                            this.state = SERF_ACTION_STATES.IDLE; // Node depleted by someone else
                            this.targetResourceNode = null;
                            if (Object.keys(this.inventory).length > 0) this._initiateReturnToDropOff();
                        }
                    }
                } else {
                    console.log(`${this.id} (${this.serfType}) 'mine' target invalid. Returning if inventory has items, else idle.`);
                    if (Object.keys(this.inventory).length > 0) {
                        this._initiateReturnToDropOff();
                    } else {
                        this.state = SERF_ACTION_STATES.IDLE;
                    }
                    this.targetResourceNode = null;
                }
                break;
            
            case SERF_ACTION_STATES.RETURNING_TO_DROPOFF: // For global drop-off (e.g., old 'mine' task)
                 if (this.path) {
                    const arrived = this._moveAlongPath(deltaTime);
                    if (arrived) {
                        this.setPosition(this.dropOffPoint.x, this.dropOffPoint.y); // Arrived at logical drop-off
                        this.path = null;
                        this.pathIndex = 0;
                        console.log(`${this.id} (${this.serfType}) arrived at global drop-off point.`);
                        
                        // Deposit all resources in inventory to global resourceManager
                        for (const resourceType in this.inventory) {
                            if (this.inventory[resourceType] > 0) {
                                resourceManager.addResource(resourceType, this.inventory[resourceType]);
                                console.log(`${this.id} (${this.serfType}) deposited ${this.inventory[resourceType]} ${resourceType} to global resources.`);
                                delete this.inventory[resourceType];
                            }
                        }
                        this.inventory = {}; // Clear inventory
                        this.state = SERF_ACTION_STATES.IDLE;
                        this.task = 'idle'; // Task complete
                        console.log(`${this.id} (${this.serfType}) finished global drop-off. Becoming IDLE.`);
                    }
                } else {
                    // No path, or already at drop-off but somehow still in this state.
                    // Attempt deposit again just in case, then go IDLE.
                    for (const resourceType in this.inventory) {
                        if (this.inventory[resourceType] > 0) {
                            resourceManager.addResource(resourceType, this.inventory[resourceType]);
                        }
                    }
                    this.inventory = {};
                    this.state = SERF_ACTION_STATES.IDLE;
                    this.task = 'idle';
                }
                break;
            
            // --- TRANSPORTER STATES (largely unchanged, but review MOVING_TO_RESOURCE_DROPOFF name) ---
            case SERF_ACTION_STATES.MOVING_TO_PICKUP_LOCATION:
                if (this.targetNode && this.path) {
                    const arrived = this._moveAlongPath(deltaTime);
                    if (arrived) {
                        this.setPosition(this.targetNode.x, this.targetNode.y);
                        this.path = null;
                        this.pathIndex = 0;
                        console.log(`${this.id} (${this.serfType}) arrived at pickup location ${this.taskDetails.sourceBuildingName || this.targetNode.buildingId}.`);
                        this.state = SERF_ACTION_STATES.PICKING_UP_RESOURCE;
                        this.taskTimer = 0; // Can be used for pickup delay if needed
                        this.targetNode = null;
                    }
                } else {
                    console.warn(`${this.id} (${this.serfType}) in MOVING_TO_PICKUP_LOCATION but no targetNode or path. Reverting to IDLE.`);
                    this.state = SERF_ACTION_STATES.IDLE;
                    this.task = 'idle';
                }
                break;

            case SERF_ACTION_STATES.PICKING_UP_RESOURCE:
                if (this.task === 'transport_resource' && this.taskDetails.sourceBuildingId) {
                    const buildingModel = this.scene.getObjectByProperty('uuid', this.taskDetails.sourceBuildingId);
                    if (buildingModel && buildingModel.userData && buildingModel.userData.buildingInstance) {
                        const buildingInstance = buildingModel.userData.buildingInstance;
                        const resourceType = this.taskDetails.resourceType;
                        
                        let currentInventoryAmount = 0;
                        for(const type in this.inventory){
                            currentInventoryAmount += this.inventory[type];
                        }
                        const capacityLeft = this.maxInventoryCapacity - currentInventoryAmount;

                        if (capacityLeft <= 0) {
                            console.log(`${this.id} (${this.serfType}) inventory full before pickup. Proceeding to dropoff.`);
                        } else {
                            const amountToRequest = Math.min(capacityLeft, this.taskDetails.amountToTransport || capacityLeft); // Request specific amount or up to capacity
                            
                            const pickedUpAmount = buildingInstance.pickupResource(resourceType, amountToRequest);

                            if (pickedUpAmount > 0) {
                                this.inventory[resourceType] = (this.inventory[resourceType] || 0) + pickedUpAmount;
                                console.log(`${this.id} (${this.serfType}) picked up ${pickedUpAmount} ${resourceType} from ${buildingInstance.info.name}. Inventory: ${this.inventory[resourceType]}`);
                            } else {
                                console.log(`${this.id} (${this.serfType}) failed to pick up ${resourceType} from ${buildingInstance.info.name} (empty or 0 requested).`);
                                // Even if 0 picked up, proceed to dropoff if carrying anything, or idle if not.
                            }
                        }
                        
                        // Proceed to dropoff
                        const destinationBuilding = this.scene.getObjectByProperty('uuid', this.taskDetails.destinationBuildingId);
                        if (destinationBuilding) {
                            const targetGridX = Math.round(destinationBuilding.position.x / TILE_SIZE + (this.mapManager.width - 1) / 2);
                            const targetGridY = Math.round(destinationBuilding.position.z / TILE_SIZE + (this.mapManager.height - 1) / 2);
                            this.targetNode = { x: targetGridX, y: targetGridY, buildingId: this.taskDetails.destinationBuildingId, type: 'dropoff' };
                            this.path = this.mapManager.findPath({ x: this.x, y: this.y }, {x: targetGridX, y: targetGridY});
                            if (this.path && this.path.length > 0) {
                                this.pathIndex = 0;
                                this.state = SERF_ACTION_STATES.MOVING_TO_RESOURCE_DROPOFF;
                                console.log(`${this.id} (${this.serfType}) path found to dropoff location ${this.taskDetails.destinationBuildingName}. Moving.`);
                            } else {
                                console.warn(`${this.id} (${this.serfType}) could not find path to dropoff ${this.taskDetails.destinationBuildingName}. Going idle.`);
                                this.state = SERF_ACTION_STATES.IDLE;
                                this.task = 'idle';
                            }
                        } else {
                             console.error(`${this.id} (${this.serfType}) destination building ${this.taskDetails.destinationBuildingId} not found. Going IDLE.`);
                             this.state = SERF_ACTION_STATES.IDLE;
                             this.task = 'idle';
                        }

                    } else {
                        console.error(`${this.id} (${this.serfType}) in PICKING_UP_RESOURCE, but source building ${this.taskDetails.sourceBuildingId} not found/no instance. Going IDLE.`);
                        this.state = SERF_ACTION_STATES.IDLE;
                        this.task = 'idle';
                    }
                } else {
                    console.warn(`${this.id} (${this.serfType}) in PICKING_UP_RESOURCE but task is not 'transport_resource' or no sourceBuildingId. Going IDLE.`);
                    this.state = SERF_ACTION_STATES.IDLE;
                    this.task = 'idle';
                }
                break;

            case SERF_ACTION_STATES.MOVING_TO_RESOURCE_DROPOFF:
                if (this.targetNode && this.path) {
                    const arrived = this._moveAlongPath(deltaTime);
                    if (arrived) {
                        this.setPosition(this.targetNode.x, this.targetNode.y);
                        this.path = null;
                        this.pathIndex = 0;
                        console.log(`${this.id} (${this.serfType}) arrived at dropoff location ${this.taskDetails.destinationBuildingName || this.targetNode.buildingId}.`);
                        this.state = SERF_ACTION_STATES.DROPPING_OFF_RESOURCE;
                        this.targetNode = null;
                    }
                } else {
                    console.warn(`${this.id} (${this.serfType}) in MOVING_TO_RESOURCE_DROPOFF but no targetNode or path. Reverting to IDLE.`);
                    this.state = SERF_ACTION_STATES.IDLE;
                    this.task = 'idle';
                }
                break;

            case SERF_ACTION_STATES.DROPPING_OFF_RESOURCE:
                if (this.task === 'transport_resource' && this.taskDetails.destinationBuildingId) {
                    // For now, transporters drop resources into the global resourceManager,
                    // as per "Deposits the transported resources into the global resource pool (managed by resourceManager)."
                    // If destinationBuildingId was for a building that *takes* resources (e.g. a Warehouse that isn't global),
                    // this logic would change to call destinationBuilding.addResource().
                    
                    const resourceType = this.taskDetails.resourceType; // Assuming transporter carries one type per trip for now
                    const amountInInventory = this.inventory[resourceType] || 0;

                    if (amountInInventory > 0) {
                        resourceManager.addResource(resourceType, amountInInventory);
                        console.log(`${this.id} (${this.serfType}) deposited ${amountInInventory} ${resourceType} to global resources.`);
                        delete this.inventory[resourceType]; // Clear that resource from inventory
                    } else {
                        console.log(`${this.id} (${this.serfType}) arrived at dropoff but had no ${resourceType} to deposit.`);
                    }

                    // Check if inventory is empty, if not, something is wrong or carrying multiple types (not supported by current task def)
                    if (Object.keys(this.inventory).length === 0) {
                        console.log(`${this.id} (${this.serfType}) inventory empty. Transport task complete. Becoming IDLE.`);
                    } else {
                        console.warn(`${this.id} (${this.serfType}) inventory not empty after dropoff. Remaining: ${JSON.stringify(this.inventory)}. Becoming IDLE.`);
                        this.inventory = {}; // Clear all inventory as a fallback
                    }
                    
                    this.state = SERF_ACTION_STATES.IDLE;
                    this.task = 'idle';
                    this.taskDetails = {};

                } else {
                    console.warn(`${this.id} (${this.serfType}) in DROPPING_OFF_RESOURCE but task is not 'transport_resource' or no destinationBuildingId. Going IDLE.`);
                    this.state = SERF_ACTION_STATES.IDLE;
                    this.task = 'idle';
                }
                break;
        }
    }
}