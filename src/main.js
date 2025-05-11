import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as Buildings from './entities/buildings.js';
import * as Resources from './entities/resources.js';
import * as Units from './entities/units.js';

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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// --- Test Scene for All Buildings ---
const allBuildingCreators = {
    Castle: Buildings.createCastle,
    WoodcuttersHut: Buildings.createWoodcuttersHut,
    ForestersHut: Buildings.createForestersHut,
    Quarry: Buildings.createQuarry,
    FishermansHut: Buildings.createFishermansHut,
    Farm: Buildings.createFarm,
    GeologistsHut: Buildings.createGeologistsHut,
    IronMine: () => Buildings.createMine('iron'),
    CoalMine: () => Buildings.createMine('coal'),
    GoldMine: () => Buildings.createMine('gold'),
    StoneMine: () => Buildings.createMine('stone'),
    Sawmill: Buildings.createSawmill,
    Windmill: Buildings.createWindmill,
    Bakery: Buildings.createBakery,
    PigFarm: Buildings.createPigFarm,
    Slaughterhouse: Buildings.createSlaughterhouse,
    IronSmelter: Buildings.createIronSmelter,
    ToolmakersWorkshop: Buildings.createToolmakersWorkshop,
    GoldsmithsMint: Buildings.createGoldsmithsMint,
    BlacksmithArmory: Buildings.createBlacksmithArmory,
    GuardHut: Buildings.createGuardHut,
    Watchtower: Buildings.createWatchtower,
    BarracksFortress: Buildings.createBarracksFortress,
    WarehouseStorehouse: Buildings.createWarehouseStorehouse,
    BuildersHut: Buildings.createBuildersHut,
    Harbor: Buildings.createHarbor,
};

const buildingSpacing = 5;
const buildingsPerRow = 5;
let buildingCount = 0;

for (const name in allBuildingCreators) {
    if (Object.hasOwnProperty.call(allBuildingCreators, name)) {
        const createFunction = allBuildingCreators[name];
        const building = createFunction();
        
        const row = Math.floor(buildingCount / buildingsPerRow);
        const col = buildingCount % buildingsPerRow;

        building.position.set(
            col * buildingSpacing - (buildingsPerRow -1) * buildingSpacing / 2,
            0, // y position will be set by the building's internal logic
            row * buildingSpacing - (Object.keys(allBuildingCreators).length / buildingsPerRow -1) * buildingSpacing / 2
        );
        scene.add(building);
        console.log(`Added ${name} to scene at x:${building.position.x}, z:${building.position.z}`);
        buildingCount++;
    }
}

// Adjust camera to view the grid of buildings
const totalRowsBuildings = Math.ceil(Object.keys(allBuildingCreators).length / buildingsPerRow);
// camera.position.set(0, totalRowsBuildings * buildingSpacing * 0.6 , totalRowsBuildings * buildingSpacing * 0.8);
// controls.target.set(0, 0, 0);


// --- Test Scene for All Resources ---
const allResourceCreators = {
    WoodLog: Resources.createWoodLog,
    StoneBlock: Resources.createStoneBlock,
    GrainSack: Resources.createGrainSack,
    Fish: Resources.createFish,
    IronOreLump: Resources.createIronOreLump,
    CoalOreLump: Resources.createCoalOreLump,
    GoldOreLump: Resources.createGoldOreLump,
    Plank: Resources.createPlank,
    FlourSack: Resources.createFlourSack,
    BreadLoaf: Resources.createBreadLoaf,
    MeatPiece: Resources.createMeatPiece,
    IronBar: Resources.createIronBar,
    GoldBar: Resources.createGoldBar,
    Axe: Resources.createAxe,
    Pickaxe: Resources.createPickaxe,
    Scythe: Resources.createScythe,
    Hammer: Resources.createHammer,
    FishingRod: Resources.createFishingRod,
    Sword: Resources.createSword,
    Shield: Resources.createShield,
    Pig: Resources.createPig,
};

const resourceSpacing = 2;
const resourcesPerRow = 6;
let resourceCount = 0;
const resourceGridOffsetY = - (totalRowsBuildings * buildingSpacing / 2) - 5; // Place resources below buildings

for (const name in allResourceCreators) {
    if (Object.hasOwnProperty.call(allResourceCreators, name)) {
        const createFunction = allResourceCreators[name];
        const resource = createFunction();
        
        const row = Math.floor(resourceCount / resourcesPerRow);
        const col = resourceCount % resourcesPerRow;

        resource.position.set(
            col * resourceSpacing - (resourcesPerRow -1) * resourceSpacing / 2,
            0, // Place directly on the new ground plane y-level
            row * resourceSpacing + resourceGridOffsetY
        );
        scene.add(resource);
        console.log(`Added ${name} to scene at x:${resource.position.x}, z:${resource.position.z}`);
        resourceCount++;
    }
}

// Adjust camera to view both grids (approximate)
const totalRowsResources = Math.ceil(Object.keys(allResourceCreators).length / resourcesPerRow);
// const totalContentHeight = (totalRowsBuildings * buildingSpacing) + (totalRowsResources * resourceSpacing) + 5;
// camera.position.set(0, totalContentHeight * 0.4, totalContentHeight * 0.5);
// controls.target.set(0, -totalContentHeight * 0.2, 0); // Target a point between the two grids


// --- Test Scene for All Units ---
const allUnitCreators = {
    Transporter: Units.createTransporter,
    Builder: Units.createBuilder,
    Woodcutter: Units.createWoodcutter,
    Forester: Units.createForester,
    Stonemason: Units.createStonemason,
    Miner: Units.createMiner,
    Farmer: Units.createFarmer,
    Fisherman: Units.createFisherman,
    Miller: Units.createMiller,
    Baker: Units.createBaker,
    PigFarmer: Units.createPigFarmer,
    Butcher: Units.createButcher,
    SawmillWorker: Units.createSawmillWorker,
    SmelterWorker: Units.createSmelterWorker,
    Goldsmith: Units.createGoldsmith,
    Toolmaker: Units.createToolmaker,
    Blacksmith: Units.createBlacksmith,
    Geologist: Units.createGeologist,
    KnightBlue: () => Units.createKnight(0x0000FF), // Example player color
    KnightRed: () => Units.createKnight(0xFF0000),   // Example player color
};

const unitSpacing = 1.5;
const unitsPerRow = 7;
let unitCount = 0;
const unitGridOffsetY = resourceGridOffsetY - (totalRowsResources * resourceSpacing) - 5; // Place units below resources

for (const name in allUnitCreators) {
    if (Object.hasOwnProperty.call(allUnitCreators, name)) {
        const createFunction = allUnitCreators[name];
        const unit = createFunction();
        
        const row = Math.floor(unitCount / unitsPerRow);
        const col = unitCount % unitsPerRow;

        unit.position.set(
            col * unitSpacing - (unitsPerRow -1) * unitSpacing / 2,
            0, // y position will be set by the unit's internal logic (base at y=0)
            row * unitSpacing + unitGridOffsetY
        );
        scene.add(unit);
        console.log(`Added ${name} to scene at x:${unit.position.x}, z:${unit.position.z}`);
        unitCount++;
    }
}

// Adjust camera to view all grids
const totalRowsUnits = Math.ceil(Object.keys(allUnitCreators).length / unitsPerRow);
const totalContentDepth = (totalRowsBuildings * buildingSpacing) + 
                           (totalRowsResources * resourceSpacing) + 
                           (totalRowsUnits * unitSpacing) + 15; // Extra spacing

camera.position.set(0, totalContentDepth * 0.3, totalContentDepth * 0.35);
controls.target.set(0, -totalContentDepth * 0.25, 0); // Adjust target to be lower
controls.maxDistance = Math.max(50, totalContentDepth); // Ensure camera can zoom out enough


// Simple ground plane for context
const groundSize = Math.max(buildingsPerRow * buildingSpacing, resourcesPerRow * resourceSpacing, unitsPerRow * unitSpacing, totalContentDepth) * 1.2;
const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, side: THREE.DoubleSide }); // ForestGreen
const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
groundPlane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
groundPlane.position.y = -0.5; // Lower the ground plane significantly
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

    controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

    // No individual rotation for now, focus on viewing all
    // scene.traverse(child => {
    //     if (child.isGroup && child.name !== '') { // Rotate top-level building groups
    //         // child.rotation.y += 0.001;
    //     }
    // });

    renderer.render(scene, camera);
}

animate();

console.log('Three.js scene initialized with OrbitControls.');
