import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GameMap, TILE_SIZE } from './core/mapManager.js';
import resourceManager, { RESOURCE_TYPES } from './core/resourceManager.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js'; // For test buttons
import '@material/web/iconbutton/icon-button.js';
// Note: Material Design base styles/theming would typically be set up more globally.

console.log('Feudal Realm Manager - Game Main Initialized');

// Get the container element
const appContainer = document.getElementById('app');
if (!appContainer) {
    console.error('Error: Root container #app not found in HTML.');
}

const gameCanvas = document.getElementById('game-canvas');
if (!gameCanvas && appContainer) { 
    console.warn('Warning: #game-canvas not found. Renderer will be appended to #app.');
}

const uiOverlay = document.getElementById('ui-overlay');
if (!uiOverlay) {
    console.error('Error: #ui-overlay not found. UI will not be rendered.');
}

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x607D8B); // A neutral bluish-grey

// Camera
const camera = new THREE.PerspectiveCamera(
    60, // Slightly less FOV than preview
    window.innerWidth / window.innerHeight,
    0.1,
    2000 // Increased far plane for larger map
);
camera.position.set(0, 15, 15); // Default camera position for map view

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: gameCanvas || undefined, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
if (!gameCanvas && appContainer) {
    appContainer.appendChild(renderer.domElement);
}

// Controls
const controls = new OrbitControls(camera, renderer.domElement); // Ensure controls use the correct element
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 100;
controls.target.set(0, 0, 0); // Look at origin initially

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(20, 30, 15);
// directionalLight.castShadow = true; // Enable shadows later - can be performance intensive
scene.add(directionalLight);

// Placeholder for game elements (map, units, etc.)
const gameElementsGroup = new THREE.Group();
gameElementsGroup.name = "GameElements";
scene.add(gameElementsGroup);

// --- Create Game Map ---
const MAP_WIDTH = 30; // Example map size
const MAP_HEIGHT = 30; // Example map size
const gameMap = new GameMap(MAP_WIDTH, MAP_HEIGHT);
gameMap.tileMeshes.position.y = 0; // Map tiles are at y=0 within this group
gameElementsGroup.add(gameMap.tileMeshes);
console.log('GameMap created and added to scene.');

// Adjust camera to view the map
camera.position.set(MAP_WIDTH * TILE_SIZE / 2, Math.max(MAP_WIDTH, MAP_HEIGHT) * TILE_SIZE * 0.75, MAP_HEIGHT * TILE_SIZE / 2 + 5);
controls.target.set(0, 0, 0); // Target center of map
controls.maxDistance = Math.max(MAP_WIDTH, MAP_HEIGHT) * TILE_SIZE * 2;

// --- UI Setup for Resources ---
if (uiOverlay) {
    uiOverlay.innerHTML = ''; // Clear placeholder

    // Resource Display Panel
    const resourcePanel = document.createElement('div');
    resourcePanel.id = 'resource-panel';
    resourcePanel.style.position = 'absolute';
    resourcePanel.style.top = '10px';
    resourcePanel.style.left = '10px';
    resourcePanel.style.padding = '10px';
    resourcePanel.style.backgroundColor = 'rgba(0,0,0,0.6)';
    resourcePanel.style.borderRadius = '8px';
    resourcePanel.style.color = 'white';
    resourcePanel.style.minWidth = '150px';
    uiOverlay.appendChild(resourcePanel);

    function updateResourceUI(stockpiles) {
        resourcePanel.innerHTML = '<h3>Resources</h3>';
        const ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.padding = '0';
        for (const type in stockpiles) {
            const li = document.createElement('li');
            li.textContent = `${type.replace('_', ' ').toUpperCase()}: ${stockpiles[type]}`;
            ul.appendChild(li);
        }
        resourcePanel.appendChild(ul);
    }
    
    resourceManager.onChange(updateResourceUI);
    updateResourceUI(resourceManager.getAllStockpiles()); // Initial display

    // Test buttons for resource manipulation
    const buttonContainer = document.createElement('div');
    buttonContainer.style.position = 'absolute';
    buttonContainer.style.bottom = '10px';
    buttonContainer.style.left = '10px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '8px';

    const addWoodButton = document.createElement('md-filled-button');
    addWoodButton.textContent = '+10 Wood';
    addWoodButton.addEventListener('click', () => resourceManager.addResource(RESOURCE_TYPES.WOOD, 10));
    buttonContainer.appendChild(addWoodButton);

    const removeStoneButton = document.createElement('md-outlined-button');
    removeStoneButton.textContent = '-5 Stone';
    removeStoneButton.addEventListener('click', () => resourceManager.removeResource(RESOURCE_TYPES.STONE, 5));
    buttonContainer.appendChild(removeStoneButton);
    
    uiOverlay.appendChild(buttonContainer);
}


// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Ensure animation loop starts only if main container and renderer are set up
if (appContainer && (gameCanvas || appContainer.contains(renderer.domElement))) {
    animate();
}
