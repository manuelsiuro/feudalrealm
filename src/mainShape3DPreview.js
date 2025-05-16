import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as Buildings from './entities/buildings.js';
import * as Resources from './entities/resources.js';
import * as Units from './entities/units.js';
import * as Terrains from './entities/terrains.js'; // Import terrains
import { GameMap } from './map/map.js'; // Import GameMap
import { MapRenderer, TILE_SIZE, TILE_GAP } from './map/mapRenderer.js'; // Import MapRenderer

// Get the container element
const container = document.getElementById('app');

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background

// Camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 5;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 2;
controls.maxDistance = 20;
// controls.maxPolarAngle = Math.PI / 2; // Prevent camera from going below the ground

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Slightly brighter ambient
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Slightly stronger directional
directionalLight.position.set(8, 15, 10);
directionalLight.castShadow = true; // Enable shadows for the light
// Configure shadow properties (optional, but good for quality)
directionalLight.shadow.mapSize.width = 2048; // Increased shadow map size
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 100; // Increased far plane for larger scene
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
scene.add(directionalLight);

// Renderer shadow configuration
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows

// --- Game Map Setup ---
const MAP_WIDTH = 10; // Example map width
const MAP_HEIGHT = 10; // Example map height
const gameMap = new GameMap(MAP_WIDTH, MAP_HEIGHT);
gameMap.generateMapFeatures(); // Populate with some basic terrain variations

const mapRenderer = new MapRenderer(gameMap, scene);
mapRenderer.renderMap(); // Render the initial state of the map

// Adjust camera to view the new map
const mapTotalWidth = MAP_WIDTH * (TILE_SIZE + TILE_GAP);
const mapTotalDepth = MAP_HEIGHT * (TILE_SIZE + TILE_GAP);

// --- Test Scene for All Buildings (Optional - can be removed or integrated with map) ---
const SHOW_ASSET_GRIDS = false; // Set to true to show old asset grids, false to hide

const allBuildingCreators = {
    CoalMine: () => Buildings.createMine('coal'),
    GoldMine: () => Buildings.createMine('gold'),
    // Row 3
    StoneMine: () => Buildings.createMine('stone'), // Assuming this was intended
    Sawmill: Buildings.createSawmill,
    Windmill: Buildings.createWindmill,
    Bakery: Buildings.createBakery,
    PigFarm: Buildings.createPigFarm,
    // Row 4
    Slaughterhouse: Buildings.createSlaughterhouse,
    IronSmelter: Buildings.createIronSmelter,
    ToolmakersWorkshop: Buildings.createToolmakersWorkshop,
    GoldsmithsMint: Buildings.createGoldsmithsMint,
    BlacksmithArmory: Buildings.createBlacksmithArmory,
    // Row 5
    GuardHut: Buildings.createGuardHut,
    Watchtower: Buildings.createWatchtower,
    BarracksFortress: Buildings.createBarracksFortress,
    WarehouseStorehouse: Buildings.createWarehouseStorehouse,
    BuildersHut: Buildings.createBuildersHut,
    // Row 6
    Harbor: Buildings.createHarbor,
};

const buildingSpacing = 6; // Increased spacing
const buildingsPerRow = 5;
let buildingCount = 0;
const buildingGridBaseY = 0; // Base Y for buildings

for (const name in allBuildingCreators) {
    if (Object.hasOwnProperty.call(allBuildingCreators, name)) {
        const createFunction = allBuildingCreators[name];
        const building = createFunction();
        building.name = name; // Ensure name is set for debugging

        // Enable shadows for building components
        building.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        const row = Math.floor(buildingCount / buildingsPerRow);
        const col = buildingCount % buildingsPerRow;

        building.position.set(
            col * buildingSpacing - (buildingsPerRow -1) * buildingSpacing / 2,
            buildingGridBaseY, 
            row * buildingSpacing - (Math.ceil(Object.keys(allBuildingCreators).length / buildingsPerRow) -1) * buildingSpacing / 2
        );
        scene.add(building);
        // console.log(`Added ${name} to scene at x:${building.position.x}, y:${building.position.y}, z:${building.position.z}`);
        buildingCount++;
    }
}
const totalRowsBuildings = Math.ceil(Object.keys(allBuildingCreators).length / buildingsPerRow);
const buildingGridDepth = totalRowsBuildings * buildingSpacing;


// --- Test Scene for All Terrains (Optional - can be removed or integrated with map) ---
const allTerrainCreators = {
    Grassland: () => Terrains.createGrassland({ width: 8, depth: 8 }),
    Forest: () => Terrains.createForest({ width: 8, depth: 8 }, 0.6),
    Mountain: () => Terrains.createMountain({ width: 6, depth: 6, height: 5 }),
    WaterLake: () => Terrains.createWater({ width: 8, depth: 8 }, 'lake'),
    WaterRiver: () => Terrains.createWater({ width: 3, depth: 10 }, 'river'),
    Desert: () => Terrains.createDesert({ width: 8, depth: 8 }),
};

const terrainSpacing = 12; // Terrains are larger, need more space
const terrainsPerRow = 3;
let terrainCount = 0;
// Place terrains behind buildings (more positive Z)
const terrainGridOffsetZ = (buildingGridDepth / 2) + (Object.keys(allBuildingCreators).length > 0 ? 15 : 0);
const terrainGridBaseY = 0; // Terrains are designed with base at y=0

for (const name in allTerrainCreators) {
    if (Object.hasOwnProperty.call(allTerrainCreators, name)) {
        const createFunction = allTerrainCreators[name];
        const terrain = createFunction();
        terrain.name = name;

        terrain.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        const row = Math.floor(terrainCount / terrainsPerRow);
        const col = terrainCount % terrainsPerRow;

        terrain.position.set(
            col * terrainSpacing - (terrainsPerRow -1) * terrainSpacing / 2,
            terrainGridBaseY, 
            row * terrainSpacing + terrainGridOffsetZ 
        );
        scene.add(terrain);
        terrainCount++;
    }
}
const totalRowsTerrains = Math.ceil(Object.keys(allTerrainCreators).length / terrainsPerRow);
const terrainGridDepth = totalRowsTerrains * terrainSpacing;

// --- Test Scene for All Resources (Optional - can be removed or integrated with map) ---
const allResourceCreators = {
    // Row 1
    WoodLog: Resources.createWoodLog,
    StoneBlock: Resources.createStoneBlock,
    GrainSack: Resources.createGrainSack,
    Fish: Resources.createFish,
    IronOreLump: Resources.createIronOreLump,
    CoalOreLump: Resources.createCoalOreLump,
    // Row 2
    GoldOreLump: Resources.createGoldOreLump,
    Plank: Resources.createPlank,
    FlourSack: Resources.createFlourSack,
    BreadLoaf: Resources.createBreadLoaf,
    MeatPiece: Resources.createMeatPiece,
    IronBar: Resources.createIronBar,
    // Row 3
    GoldBar: Resources.createGoldBar,
    Axe: Resources.createAxe,
    Pickaxe: Resources.createPickaxe,
    Scythe: Resources.createScythe,
    Hammer: Resources.createHammer,
    // Row 4
    FishingRod: Resources.createFishingRod,
    Sword: Resources.createSword,
    Shield: Resources.createShield,
    Pig: Resources.createPig,
};

const resourceSpacing = 2.5; // Increased spacing
const resourcesPerRow = 6;
let resourceCount = 0;
// Place resources in front of (more negative Z) buildings
const resourceGridOffsetZ = - (buildingGridDepth / 2) - (Object.keys(allBuildingCreators).length > 0 ? 10 : 0); 
const resourceGridBaseY = 0;

for (const name in allResourceCreators) {
    if (Object.hasOwnProperty.call(allResourceCreators, name)) {
        const createFunction = allResourceCreators[name];
        const resource = createFunction();
        resource.name = name;

        resource.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true; // Resources can also receive shadows if on a plane
            }
        });
        
        const row = Math.floor(resourceCount / resourcesPerRow);
        const col = resourceCount % resourcesPerRow;

        resource.position.set(
            col * resourceSpacing - (resourcesPerRow -1) * resourceSpacing / 2,
            resourceGridBaseY, 
            row * resourceSpacing + resourceGridOffsetZ
        );
        scene.add(resource);
        // console.log(`Added ${name} (Resource) to scene at x:${resource.position.x}, y:${resource.position.y}, z:${resource.position.z}`);
        resourceCount++;
    }
}
const totalRowsResources = Math.ceil(Object.keys(allResourceCreators).length / resourcesPerRow);
const resourceGridDepth = totalRowsResources * resourceSpacing;


// --- Test Scene for All Units (Optional - can be removed or integrated with map) ---
const allUnitCreators = {
    // Row 1
    Transporter: Units.createTransporter,
    Builder: Units.createBuilder,
    Woodcutter: Units.createWoodcutter,
    Forester: Units.createForester,
    Stonemason: Units.createStonemason,
    Miner: Units.createMiner,
    Farmer: Units.createFarmer,
    // Row 2
    Fisherman: Units.createFisherman,
    Miller: Units.createMiller,
    Baker: Units.createBaker,
    PigFarmer: Units.createPigFarmer,
    Butcher: Units.createButcher,
    SawmillWorker: Units.createSawmillWorker,
    SmelterWorker: Units.createSmelterWorker,
    // Row 3
    Goldsmith: Units.createGoldsmith,
    Toolmaker: Units.createToolmaker,
    Blacksmith: Units.createBlacksmith,
    Geologist: Units.createGeologist,
    KnightBlue: () => Units.createKnight(Units.COLORS.PLAYER_BLUE), 
    KnightRed: () => Units.createKnight(Units.COLORS.PLAYER_RED),   
    KnightGreen: () => Units.createKnight(Units.COLORS.PLAYER_GREEN),
};

const unitSpacing = 2.0; // Increased spacing
const unitsPerRow = 7;
let unitCount = 0;
// Place units in front of resources
const unitGridOffsetZ = resourceGridOffsetZ - (resourceGridDepth / 2) - (Object.keys(allResourceCreators).length > 0 ? 5 : 0);
const unitGridBaseY = 0; // Units are designed with base at y=0

for (const name in allUnitCreators) {
    if (Object.hasOwnProperty.call(allUnitCreators, name)) {
        const createFunction = allUnitCreators[name];
        const unit = createFunction();
        unit.name = name;

        unit.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        const row = Math.floor(unitCount / unitsPerRow);
        const col = unitCount % unitsPerRow;

        unit.position.set(
            col * unitSpacing - (unitsPerRow -1) * unitSpacing / 2,
            unitGridBaseY, 
            row * unitSpacing + unitGridOffsetZ
        );
        scene.add(unit);
        // console.log(`Added ${name} (Unit) to scene at x:${unit.position.x}, y:${unit.position.y}, z:${unit.position.z}`);
        unitCount++;
    }
}
const totalRowsUnits = Math.ceil(Object.keys(allUnitCreators).length / unitsPerRow);
const unitGridDepth = totalRowsUnits * unitSpacing;

// Calculate overall content dimensions for camera setup
let maxGridWidth = Math.max(
    SHOW_ASSET_GRIDS ? buildingsPerRow * buildingSpacing : 0,
    SHOW_ASSET_GRIDS ? resourcesPerRow * resourceSpacing : 0,
    SHOW_ASSET_GRIDS ? unitsPerRow * unitSpacing : 0,
    SHOW_ASSET_GRIDS ? terrainsPerRow * terrainSpacing : 0,
    mapTotalWidth // Include map width
);

// Total depth now includes terrains, buildings, resources, units
// Terrains are at positive Z, others at negative Z relative to origin or each other
const positiveZExtent = SHOW_ASSET_GRIDS ? (terrainGridOffsetZ + terrainGridDepth / 2) : (mapTotalDepth / 2);
const negativeZExtent = SHOW_ASSET_GRIDS ? (Math.abs(unitGridOffsetZ) + unitGridDepth / 2) : (mapTotalDepth / 2);
let totalContentVisualDepth = mapTotalDepth; // Default to map depth

if (SHOW_ASSET_GRIDS) {
    maxGridWidth = Math.max(maxGridWidth, buildingsPerRow * buildingSpacing, resourcesPerRow * resourceSpacing, unitsPerRow * unitSpacing, terrainsPerRow * terrainSpacing);
    const assetPositiveZExtent = terrainGridOffsetZ + terrainGridDepth / 2;
    const assetNegativeZExtent = Math.abs(unitGridOffsetZ) + unitGridDepth / 2;
    totalContentVisualDepth = Math.max(totalContentVisualDepth, assetPositiveZExtent + assetNegativeZExtent);
    // If showing asset grids, ensure camera Z considers them if they are further out.
    // This logic might need refinement based on how asset grids are positioned relative to the map.
}


// Adjust camera to view all grids or the map
const cameraY = Math.max(30, totalContentVisualDepth * 0.5, maxGridWidth * 0.5) + 20; // Increased height slightly
// If asset grids are shown and are behind the map, camera Z needs to account for that.
// For now, let's assume map is primary focus or asset grids are far if shown.
const cameraZ = Math.max(mapTotalDepth / 2 * 1.5, SHOW_ASSET_GRIDS ? positiveZExtent * 1.2 : mapTotalDepth / 2 * 1.5);

camera.position.set(0, cameraY, cameraZ);
// Target the approximate center of the entire layout.
// Center Z is between the front of units and back of terrains if asset grids are shown,
// otherwise, it's the center of the map.
const targetZ = SHOW_ASSET_GRIDS ? (positiveZExtent - negativeZExtent) / 2 : 0; // Map is centered at 0,0,0
controls.target.set(0, 0, targetZ);
controls.maxDistance = Math.max(150, totalContentVisualDepth * 1.8, maxGridWidth * 1.8); // Increased max distance


// Simple ground plane for context (can be removed if map covers everything)
const groundSize = Math.max(maxGridWidth, totalContentVisualDepth) * 1.5;
const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, side: THREE.DoubleSide }); // ForestGreen
const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
groundPlane.rotation.x = -Math.PI / 2;
groundPlane.position.y = -0.05; // Position ground slightly below items that are at y=0
groundPlane.receiveShadow = true; // Ground should receive shadows
scene.add(groundPlane);


// Handle window resize
window.addEventListener(
    'resize',
    () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    },
    false
);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    controls.update(); 

    // Optional: Rotate all items slowly for better viewing
    if (SHOW_ASSET_GRIDS) { // Only rotate if asset grids are shown
        scene.traverse(child => {
            if (child.isGroup && (allBuildingCreators[child.name] || allResourceCreators[child.name] || allUnitCreators[child.name] || allTerrainCreators[child.name])) {
                 child.rotation.y += 0.002;
            }
        });
    }

    renderer.render(scene, camera);
}

animate();

console.log('Three.js scene initialized with a game map and optional asset grids.');
if (SHOW_ASSET_GRIDS) {
    console.log(`Terrains (Grid): ${Object.keys(allTerrainCreators).length}, Buildings: ${Object.keys(allBuildingCreators).length}, Resources: ${Object.keys(allResourceCreators).length}, Units: ${Object.keys(allUnitCreators).length}`);
}
console.log(`Map Dimensions: ${MAP_WIDTH}x${MAP_HEIGHT}`);
