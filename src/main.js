import * as THREE from 'three';
THREE.ColorManagement.enabled = true; // Enable color management

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'; // May need for gamma correction
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'; // Anti-aliasing for composer

import { GameMap, TILE_SIZE } from './core/MapManager.js'; 
import resourceManager, { RESOURCE_TYPES } from './core/resourceManager.js';
import ConstructionManager from './core/constructionManager.js';
import SerfManager from './core/serfManager.js'; // Import SerfManager class
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js'; 
import '@material/web/iconbutton/icon-button.js';
// import '@material/web/card/elevated-card.js'; // Removed due to install issues

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

// Scene with improved background
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Lighter sky blue color for better visibility

// Camera
const camera = new THREE.PerspectiveCamera(
    60, // Slightly less FOV than preview
    window.innerWidth / window.innerHeight,
    0.1,
    2000 // Increased far plane for larger map
);
camera.position.set(0, 15, 15); // Default camera position for map view

// Renderer with enhanced settings for better visual quality
const renderer = new THREE.WebGLRenderer({ 
    canvas: gameCanvas || undefined, 
    antialias: true,
    powerPreference: 'high-performance',
    precision: 'highp' // Use high precision for better color accuracy
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
renderer.outputColorSpace = THREE.SRGBColorSpace; // Proper color space
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Adds cinematic quality with better contrast
renderer.toneMappingExposure = 1.2; // Slightly brighter scene
renderer.shadowMap.enabled = true; // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadow edges

if (!gameCanvas && appContainer) {
    appContainer.appendChild(renderer.domElement);
}

// Post-processing Composer
let composer;
let outlinePass;
let selectedObjects = [];

composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outlinePass.edgeStrength = 5;
outlinePass.edgeGlow = 0.5;
outlinePass.edgeThickness = 1;
outlinePass.visibleEdgeColor.set('#ffffff');
outlinePass.hiddenEdgeColor.set('#190a05'); // Optional: color for occluded parts
composer.addPass(outlinePass);

// Re-enable FXAA pass for better anti-aliasing
let fxaaPass = new ShaderPass(FXAAShader);
const pixelRatio = renderer.getPixelRatio();
fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);
composer.addPass(fxaaPass);

// Import additional post-processing passes
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';

// Add gamma correction pass for accurate colors
const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
composer.addPass(gammaCorrectionPass);


// Controls
const controls = new OrbitControls(camera, renderer.domElement); 
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 100;
controls.target.set(0, 0, 0); // Look at origin initially

// Enhanced lighting setup for better scene illumination
// Add ambient light with warmer tone for better visibility
const ambientLight = new THREE.AmbientLight(0xfffbf0, 0.65); // Slightly warm tint and increased intensity
scene.add(ambientLight);

// Main directional light (sun-like) with shadows
const directionalLight = new THREE.DirectionalLight(0xffffeb, 1.0); // Slightly increased intensity
directionalLight.position.set(30, 50, 30); // Higher position for better coverage
directionalLight.castShadow = true; // Enable shadows for depth and realism
directionalLight.shadow.mapSize.width = 2048; // Higher resolution shadows
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 150;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
directionalLight.shadow.bias = -0.0003; // Reduces shadow acne
scene.add(directionalLight);

// Add a secondary fill light from another angle
const fillLight = new THREE.DirectionalLight(0xc4d7f0, 0.35); // Slight blue tint
fillLight.position.set(-20, 30, -20); // Coming from opposite angle
scene.add(fillLight);

// Placeholder for game elements (map, units, etc.)
const gameElementsGroup = new THREE.Group();
gameElementsGroup.name = "GameElements";
scene.add(gameElementsGroup);

// --- Create Game Map ---
const MAP_WIDTH = 30; // Example map size
const MAP_HEIGHT = 30; // Example map size
const gameMap = new GameMap(MAP_WIDTH, MAP_HEIGHT);
// Lower the map slightly so objects at y=0 sit on top of it
gameMap.tileMeshes.position.y = -0.25; // Further increased offset
gameElementsGroup.add(gameMap.tileMeshes);
console.log('GameMap created and added to scene.');

// --- Construction Manager ---
const constructionManager = new ConstructionManager(scene, gameMap); // Pass scene and map

// --- Serf Manager ---
const serfManager = new SerfManager(scene, gameMap); // Instantiate with scene and gameMap
gameElementsGroup.add(serfManager.serfVisualsGroup); // Add serf visuals to the main game elements group

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clock = new THREE.Clock(); // Clock for deltaTime

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
    resourcePanel.style.minWidth = '180px';
    uiOverlay.appendChild(resourcePanel);

    // Mini-map Placeholder
    const miniMapPanel = document.createElement('div');
    miniMapPanel.id = 'mini-map-panel';
    miniMapPanel.style.position = 'absolute';
    miniMapPanel.style.top = '10px';    // Changed from bottom
    miniMapPanel.style.right = '10px';   // Changed from left
    // Clear previous positioning if they were set
    miniMapPanel.style.bottom = ''; 
    miniMapPanel.style.left = '';
    miniMapPanel.style.width = '150px';
    miniMapPanel.style.height = '150px';
    miniMapPanel.style.backgroundColor = 'rgba(0,0,0,0.5)';
    miniMapPanel.style.border = '1px solid #fff';
    miniMapPanel.style.borderRadius = '4px';
    miniMapPanel.style.color = 'white';
    miniMapPanel.style.display = 'flex';
    miniMapPanel.style.alignItems = 'center';
    miniMapPanel.style.justifyContent = 'center';
    miniMapPanel.textContent = 'Mini-map';
    uiOverlay.appendChild(miniMapPanel);

    // Define updateResourceUI in a scope accessible by the event listener
    function updateResourceUI(stockpiles) {
        if (!resourcePanel) return; // Guard if resourcePanel isn't created yet
        
        // Create centered title
        resourcePanel.innerHTML = '<h3 style="text-align: center; margin-bottom: 10px;">Resources</h3>';
        
        // Create table for better alignment
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        
        for (const type in stockpiles) {
            const row = table.insertRow();
            
            // Convert resource name: remove underscores, capitalize first letter only
            const resourceName = type.split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
                
            // Create left cell for resource name
            const labelCell = row.insertCell(0);
            labelCell.textContent = resourceName;
            labelCell.style.textAlign = 'left';
            labelCell.style.padding = '2px 0';
            
            // Create right cell for resource value
            const valueCell = row.insertCell(1);
            valueCell.textContent = stockpiles[type];
            valueCell.style.textAlign = 'right';
            valueCell.style.fontWeight = 'bold';
            valueCell.style.padding = '2px 0';
        }
        
        resourcePanel.appendChild(table);
    }
    
    // Register listener to update both resource display and building buttons
    resourceManager.onChange((stockpiles) => {
        updateResourceUI(stockpiles);
        updateBuildingButtons();
    });
    
    // We'll define buildingButtons here so it's available to all functions
    const buildingButtons = new Map();
    
    // Helper function to check if resources are sufficient for building
    function checkSufficientResources(cost) {
        if (Object.keys(cost).length === 0) return true;
        
        return Object.entries(cost).every(([resourceType, amount]) => {
            const available = resourceManager.getResourceCount(resourceType);
            return available >= amount;
        });
    }
    
    // Helper function to build a visual cost display with resource availability indicators
    function buildCostDisplay(cost) {
        if (Object.keys(cost).length === 0) return '<div style="font-size: 0.85em;"><b>Cost:</b> Free</div>';
        
        let costItems = Object.entries(cost).map(([res, amount]) => {
            const available = resourceManager.getResourceCount(res);
            const resourceName = res
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
                
            // Enhanced color coding with better contrast and visibility
            const color = available >= amount ? '#00FF00' : '#FF3333';
            const availableText = `<span style="color: ${color}; font-weight: bold; text-shadow: 0px 0px 2px rgba(0,0,0,0.8);">${available}/${amount}</span>`;
            
            return `<div style="margin: 3px 0; display: flex; justify-content: space-between;"><span style="font-weight: 500;">${resourceName}:</span> ${availableText}</div>`;
        }).join('');
        
        return `<div style="font-size: 0.9em; margin-bottom: 5px; background-color: rgba(255,255,255,0.1); padding: 2px 5px; border-radius: 3px; text-align: center;"><b>Cost</b></div>${costItems}`;
    }
    
    // Function to update button states based on current resources
    function updateBuildingButtons() {
        buildingButtons.forEach(({ button, cost }, key) => {
            const canBuild = checkSufficientResources(cost);
            
            // Update the cost display with current resource values
            const costContainer = button.querySelector('div > div:nth-child(2)');
            if (costContainer) {
                costContainer.innerHTML = buildCostDisplay(cost).replace('<div style="font-size: 0.85em; margin-bottom: 2px;"><b>Cost:</b></div>', '');
            }
            
            if (canBuild) {
                // Reset to enabled styling with improved contrast
                button.style.setProperty('--md-sys-color-primary', '#4CAF50'); // Green for available
                button.style.setProperty('--md-sys-color-on-primary', '#FFFFFF'); // White text
                button.style.fontWeight = 'bold'; // Make text more readable
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
                button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'; // Restore shadow
                button.removeAttribute('title');
                button.disabled = false;
            } else {
                // Apply disabled styling with much better visibility
                button.style.setProperty('--md-sys-color-primary', '#FF0000'); // Darker gray for better contrast
                button.style.setProperty('--md-sys-color-on-primary', '#FFFFFF'); // White text for better readability
                button.style.opacity = '0.95'; // Almost fully visible for better readability
                button.style.cursor = 'not-allowed';
                button.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)'; // Subtle shadow
                
                // Create tooltip showing missing resources with more details
                const missingResources = Object.entries(cost)
                    .filter(([resource, amount]) => resourceManager.getResourceCount(resource) < amount)
                    .map(([resource, amount]) => {
                        const current = resourceManager.getResourceCount(resource);
                        // Format resource name more clearly
                        const resourceName = resource
                            .split('_')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join(' ');
                        return `${resourceName}: ${current}/${amount}`;
                    })
                    .join(', ');
                
                // Enhanced tooltip with more context
                button.title = missingResources ? `Missing Resources: ${missingResources}` : 'Not enough resources';
                
                // Clear any hover transformations
                button.style.transform = '';
                button.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)'; // Flatter shadow for disabled
                
                button.disabled = true;
            }
        });
    }
    
    // Initial display after resourceManager is ready and UI panel exists
    if (resourcePanel) {
       updateResourceUI(resourceManager.getAllStockpiles());
       // updateBuildingButtons will be called after construction panel is created
    }


    // Test buttons for resource manipulation
    const testButtonContainer = document.createElement('div');
    testButtonContainer.style.position = 'absolute';
    testButtonContainer.style.bottom = '70px'; // Move up to make space for build menu
    testButtonContainer.style.left = '10px';
    testButtonContainer.style.display = 'flex';
    testButtonContainer.style.gap = '8px';

    /*
    const addWoodButton = document.createElement('md-filled-button');
    addWoodButton.textContent = '+10 Wood';
    addWoodButton.style.borderRadius = '4px';
    addWoodButton.addEventListener('click', () => {
        console.log('UI: "+10 Wood" button clicked. Calling addResource.');
        const result = resourceManager.addResource(RESOURCE_TYPES.WOOD, 10);
        console.log('UI: addResource call result:', result);
    });
    testButtonContainer.appendChild(addWoodButton);

    const removeStoneButton = document.createElement('md-outlined-button');
    removeStoneButton.textContent = '-5 Stone';
    removeStoneButton.style.borderRadius = '4px';
    removeStoneButton.addEventListener('click', () => resourceManager.removeResource(RESOURCE_TYPES.STONE, 5));
    testButtonContainer.appendChild(removeStoneButton);

    // --- +1 Axe Button Wrapper ---
    const addAxeButtonWrapper = document.createElement('div'); // Wrapper div
    const addAxeButton = document.createElement('md-filled-button');
    addAxeButton.textContent = '+1 Axe';
    addAxeButton.style.borderRadius = '4px';
    // Note: Event listener is now on the wrapper
    addAxeButtonWrapper.appendChild(addAxeButton); 
    addAxeButtonWrapper.addEventListener('click', () => {
        console.log('UI: Wrapper for "+1 Axe" button clicked. Attempting to add 1 TOOLS_AXE.');
        resourceManager.addResource(RESOURCE_TYPES.TOOLS_AXE, 1);
        console.log(`UI: TOOLS_AXE count after addResource: ${resourceManager.getResourceCount(RESOURCE_TYPES.TOOLS_AXE)}`);
        // The onChange callback in resourceManager should trigger updateResourceUI
    });
    testButtonContainer.appendChild(addAxeButtonWrapper); // Add wrapper to container

    const addBreadButton = document.createElement('md-filled-button');
    addBreadButton.textContent = '+1 Bread';
    addBreadButton.style.borderRadius = '4px';
    addBreadButton.addEventListener('click', () => {
        console.log('UI: "+1 Bread" button clicked.');
        resourceManager.addResource(RESOURCE_TYPES.BREAD, 1);
    });
    testButtonContainer.appendChild(addBreadButton);

    const addPickaxeButton = document.createElement('md-filled-button');
    addPickaxeButton.textContent = '+1 Pickaxe';
    addPickaxeButton.style.borderRadius = '4px';
    addPickaxeButton.addEventListener('click', () => {
        console.log('UI: "+1 Pickaxe" button clicked.');
        resourceManager.addResource(RESOURCE_TYPES.TOOLS_PICKAXE, 1);
    });
    testButtonContainer.appendChild(addPickaxeButton);
    */
    // All Cheat buttons
    const addCheatButton = document.createElement('md-filled-button');
    addCheatButton.textContent = '+1000 All';
    addCheatButton.style.borderRadius = '4px';
    addCheatButton.addEventListener('click', () => {
        console.log('UI: "+1000 All" button clicked.');
        resourceManager.addResource(RESOURCE_TYPES.WOOD, 1000);
        resourceManager.addResource(RESOURCE_TYPES.STONE, 1000);
        resourceManager.addResource(RESOURCE_TYPES.GRAIN, 1000);
        
        resourceManager.addResource(RESOURCE_TYPES.FISH, 1000);
        resourceManager.addResource(RESOURCE_TYPES.IRON_ORE, 1000);
        resourceManager.addResource(RESOURCE_TYPES.COAL_ORE, 1000);
        resourceManager.addResource(RESOURCE_TYPES.GOLD_ORE, 1000);
        resourceManager.addResource(RESOURCE_TYPES.PLANKS, 1000);
        resourceManager.addResource(RESOURCE_TYPES.FLOUR, 1000);
        resourceManager.addResource(RESOURCE_TYPES.BREAD, 1000);

        resourceManager.addResource(RESOURCE_TYPES.MEAT, 1000);
        resourceManager.addResource(RESOURCE_TYPES.IRON_BARS, 1000);
        resourceManager.addResource(RESOURCE_TYPES.GOLD_BARS, 1000);
        resourceManager.addResource(RESOURCE_TYPES.TOOLS_AXE, 1000);
        resourceManager.addResource(RESOURCE_TYPES.TOOLS_PICKAXE, 1000);
        resourceManager.addResource(RESOURCE_TYPES.TOOLS_SCYTHE, 1000);
        resourceManager.addResource(RESOURCE_TYPES.TOOLS_HAMMER, 1000);
        resourceManager.addResource(RESOURCE_TYPES.TOOLS_FISHING_ROD, 1000);
        resourceManager.addResource(RESOURCE_TYPES.SWORDS, 1000);
        resourceManager.addResource(RESOURCE_TYPES.SHIELDS, 1000);
    });
    testButtonContainer.appendChild(addCheatButton);

    
    uiOverlay.appendChild(testButtonContainer);

    // Construction Menu
    const constructionPanel = document.createElement('div');
    constructionPanel.id = 'construction-panel';
    constructionPanel.style.position = 'absolute';
    constructionPanel.style.bottom = '10px';
    constructionPanel.style.right = '10px';
    constructionPanel.style.padding = '10px';
    constructionPanel.style.backgroundColor = 'rgba(25,25,35,0.85)'; // Slightly blue-tinted dark background for better contrast
    constructionPanel.style.borderRadius = '10px';
    constructionPanel.style.display = 'flex';
    constructionPanel.style.flexDirection = 'column';
    constructionPanel.style.gap = '8px';
    constructionPanel.style.border = '1px solid rgba(255,255,255,0.2)'; // Subtle border
    constructionPanel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)'; // Stronger shadow for panel
    constructionPanel.style.maxHeight = '320px'; // Fixed height for about 5-6 buttons
    constructionPanel.style.overflowY = 'auto'; // Make it scrollable
    constructionPanel.style.overflowX = 'hidden'; // Prevent horizontal scrolling
    
    // Custom scrollbar styling
    constructionPanel.style.scrollbarWidth = 'thin'; // Firefox
    constructionPanel.style.scrollbarColor = 'rgba(255, 255, 255, 0.5) rgba(0, 0, 0, 0.3)'; // Firefox
    
    // Add a custom scrollbar style for Webkit browsers (Chrome, Safari)
    const scrollbarStyle = document.createElement('style');
    scrollbarStyle.textContent = `
        #construction-panel::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        #construction-panel::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 4px;
        }
        #construction-panel::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.5);
            border-radius: 4px;
        }
        #construction-panel::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.7);
        }
    `;
    document.head.appendChild(scrollbarStyle);
    
    // Add title for building panel
    const buildingsTitle = document.createElement('h3');
    buildingsTitle.textContent = 'Buildings';
    buildingsTitle.style.textAlign = 'center';
    buildingsTitle.style.margin = '2px 0 12px 0';
    buildingsTitle.style.color = 'white';
    buildingsTitle.style.textShadow = '0 0 5px rgba(0,0,0,0.5)';
    buildingsTitle.style.letterSpacing = '1px';
    buildingsTitle.style.fontSize = '1.3em';
    buildingsTitle.style.paddingBottom = '6px';
    buildingsTitle.style.borderBottom = '1px solid rgba(255,255,255,0.3)';
    constructionPanel.appendChild(buildingsTitle);
    
    // buildingButtons is already declared above
    const availableBuildings = constructionManager.getAvailableBuildings();
    availableBuildings.forEach(building => {
        const button = document.createElement('md-filled-button');
        
        // Create more readable resource cost display
        let costDisplay = '';
        if (Object.keys(building.cost).length > 0) {
            // Format each resource with proper capitalization and spacing
            costDisplay = Object.entries(building.cost)
                .map(([res, amount]) => {
                    // Format resource name with first letter capitalized only (not all caps)
                    const resourceName = res
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');
                    return `${amount} ${resourceName}`;
                })
                .join('<br>');
        } else {
            costDisplay = 'Free';
        }
        
        // Create more detailed cost display with visual indicators
        const costString = buildCostDisplay(building.cost);

        // Create a more detailed and visually appealing button content with enhanced visibility and contrast
        button.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; width: 100%;">
                <div style="font-weight: bold; margin-bottom: 6px; font-size: 1.1em; text-shadow: 0px 0px 3px rgba(0,0,0,0.5); letter-spacing: 0.5px;">${building.name}</div>
                <div style="font-size: 0.9em; width: 100%; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.4); background-color: rgba(0,0,0,0.15); border-radius: 4px; padding: 6px 3px 3px 3px;">
                    ${costString}
                </div>
            </div>
        `;
        // Apply premium styling for all building buttons with enhanced visibility and modern design
        button.style.setProperty('--md-filled-button-label-text-font-size', '1em');
        button.style.setProperty('--md-filled-button-container-height', 'auto');
        // Add proper MD3 disabled styles that will apply to disabled buttons
        button.style.setProperty('--md-filled-button-disabled-container-opacity', '0.9'); // Higher visibility for disabled container
        button.style.setProperty('--md-filled-button-disabled-label-text-color', 'rgba(255, 255, 255, 0.95)'); // Bright text for disabled
        button.style.setProperty('--md-filled-button-disabled-label-text-opacity', '0.95'); // Higher visibility for disabled text
        button.style.padding = '14px 12px';
        button.style.borderRadius = '8px';
        button.style.margin = '0 0 12px 0'; // Increased spacing between buttons
        button.style.width = '100%'; // Make all buttons same width
        button.style.boxSizing = 'border-box'; // Include padding in width calculation
        button.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3)'; // Enhanced shadow for depth
        button.style.transition = 'all 0.2s ease-in-out'; // Smooth transitions for hover effects
        button.style.border = '1px solid rgba(255,255,255,0.15)'; // Subtle border for definition
        button.style.letterSpacing = '0.3px'; // Improved text readability
        
        // Add custom CSS variables for both enabled and disabled states
        button.style.setProperty('--md-sys-color-primary', '#4CAF50'); // Default green for enabled buttons
        button.style.setProperty('--md-sys-color-on-primary', '#FFFFFF'); // White text for enabled

        // Add hover effect for enabled buttons
        button.addEventListener('mouseover', () => {
            if (!button.disabled) {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
                button.style.setProperty('--md-sys-color-primary', '#5DBF60'); // Slightly lighter green on hover
            }
        });
        
        button.addEventListener('mouseout', () => {
            if (!button.disabled) {
                button.style.transform = '';
                button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                button.style.setProperty('--md-sys-color-primary', '#4CAF50'); // Back to default green
            }
        });

        button.addEventListener('click', () => {
            console.log(`UI: Construction button clicked for building key: ${building.key}, name: ${building.name}`); // Added log
            constructionManager.startPlacement(building.key);
        });
        
        // Check if resources are sufficient and set initial button state
        const canBuild = checkSufficientResources(building.cost);
        if (!canBuild) {
            // Enhanced styling for disabled buttons with better visibility using MD3 variables
            button.style.setProperty('--md-sys-color-primary', '#B71C1C'); // Dark red for disabled buttons
            button.style.setProperty('--md-sys-color-on-primary', '#FFFFFF'); // White text for better readability
            button.style.cursor = 'not-allowed'; // Show "not-allowed" cursor on hover
            button.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)'; // Subtle shadow
            
            // Add a distinctive border to highlight it's disabled but visible
            button.style.border = '1px solid rgba(255,255,255,0.2)';
            
            // Add a tooltip to explain why it's disabled
            button.title = 'Not enough resources';
            
            // Using disabled attribute for functionality but maintaining visibility with our custom MD3 properties
            button.disabled = true;
        } else {
            // Add bold text for enabled buttons to improve readability
            button.style.fontWeight = 'bold';
        }
        
        // Store button in the map for later updates
        buildingButtons.set(building.key, { button, cost: building.cost });
        
        constructionPanel.appendChild(button);
    });
    
    // checkSufficientResources and updateBuildingButtons functions are already declared above
    
    // Register listener for resource changes to update building buttons
    // (We need to modify the existing onChange registration since we created a new one)
    uiOverlay.appendChild(constructionPanel);
    
    // Now that the construction panel is created and all building buttons are added,
    // we can update their states based on available resources
    updateBuildingButtons();
}

// Mouse move for placement indicator
function onMouseMove(event) {
    if (!constructionManager.isPlacing) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // Intersect with the map tiles or a ground plane for placement
    const intersects = raycaster.intersectObject(gameMap.tileMeshes, true); // Intersect with children of tileMeshes
    // Fallback to a conceptual ground plane if no tiles hit (e.g., for edges)
    const groundPlaneIntersectPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // y=0 plane
    
    if (intersects.length > 0) {
        constructionManager.updatePlacementIndicator(intersects[0].point);
    } else {
        const intersectionPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(groundPlaneIntersectPlane, intersectionPoint);
        if(intersectionPoint) {
            constructionManager.updatePlacementIndicator(intersectionPoint);
        }
    }
}
window.addEventListener('mousemove', onMouseMove, false);

// Mouse click for confirming placement or selecting objects
let selectedBuildingInfoPanel = null; // To display info

function onMouseClick(event) {
    if (event.target !== renderer.domElement) return; 

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    if (constructionManager.isPlacing) {
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersectsPlacement = raycaster.intersectObject(gameMap.tileMeshes, true);
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        let placementPoint = new THREE.Vector3();

        if (intersectsPlacement.length > 0) {
            placementPoint = intersectsPlacement[0].point;
        } else {
            raycaster.ray.intersectPlane(groundPlane, placementPoint);
        }
        if(placementPoint) constructionManager.confirmPlacement(placementPoint);

    } else { // Not placing, try selecting
        const buildingsGroup = scene.getObjectByName("GameBuildings");
        if (buildingsGroup) {
            const intersectsSelection = raycaster.intersectObjects(buildingsGroup.children, true);
            if (intersectsSelection.length > 0) {
                let topObject = intersectsSelection[0].object;
                // Traverse up to find the main building group if clicked a sub-mesh
                while (topObject.parent && topObject.parent !== buildingsGroup) {
                    topObject = topObject.parent;
                }
                selectedObjects = [topObject];
                outlinePass.selectedObjects = selectedObjects;
                displaySelectedBuildingInfo(topObject);
            } else {
                selectedObjects = [];
                outlinePass.selectedObjects = selectedObjects;
                clearSelectedBuildingInfo();
                clearSelectedUnitInfo(); // Also clear unit info
            }
        } else { // No building selected, try selecting a unit
            const serfsGroup = serfManager.serfVisualsGroup; 
            if (serfsGroup && serfsGroup.children.length > 0) {
                const intersectsSerfs = raycaster.intersectObjects([serfsGroup], true); 
                if (intersectsSerfs.length > 0) {
                    let topSerfModel = intersectsSerfs[0].object;
                    // Traverse up to find the main serf model group (the direct child of serfsGroup)
                    while (topSerfModel.parent && topSerfModel.parent !== serfsGroup) {
                        topSerfModel = topSerfModel.parent;
                    }
                    selectedObjects = [topSerfModel];
                    outlinePass.selectedObjects = selectedObjects;
                    displaySelectedUnitInfo(topSerfModel);
                    clearSelectedBuildingInfo(); // Deselect building if unit is selected
                } else {
                    // If nothing is clicked, clear all selections
                    selectedObjects = [];
                    outlinePass.selectedObjects = selectedObjects;
                    clearSelectedBuildingInfo();
                    clearSelectedUnitInfo();
                }
            }
        }
    }
}
renderer.domElement.addEventListener('click', onMouseClick, false);

let selectedUnitInfoPanel = null;

function displaySelectedBuildingInfo(buildingModel) {
    if (!uiOverlay) return;
    clearSelectedBuildingInfo();
    clearSelectedUnitInfo(); // Ensure only one info panel is visible

    const placedBuildingData = constructionManager.placedBuildings.find(
        b => b.model === buildingModel
    );

    if (!placedBuildingData) {
        console.warn("Could not find data for selected building model:", buildingModel);
        return;
    }

    const buildingInfo = placedBuildingData.info;
    const buildingName = buildingInfo.name || "Unknown Building";
    const workers = placedBuildingData.workers ? placedBuildingData.workers.length : 0;
    const maxWorkers = buildingInfo.jobSlots || 0;

    selectedBuildingInfoPanel = document.createElement('div'); // Reverted to div
    selectedBuildingInfoPanel.id = 'selected-info-panel';
    selectedBuildingInfoPanel.style.position = 'absolute';
    selectedBuildingInfoPanel.style.bottom = '10px';
    selectedBuildingInfoPanel.style.left = '50%';
    selectedBuildingInfoPanel.style.transform = 'translateX(-50%)';
    selectedBuildingInfoPanel.style.padding = '10px';
    selectedBuildingInfoPanel.style.minWidth = '200px'; // Adjusted minWidth
    selectedBuildingInfoPanel.style.maxWidth = '300px'; // Adjusted maxWidth
    selectedBuildingInfoPanel.style.backgroundColor = 'rgba(0,0,0,0.7)'; // Reverted style
    selectedBuildingInfoPanel.style.borderRadius = '8px'; // Reverted style
    selectedBuildingInfoPanel.style.color = 'white'; // Reverted style
    selectedBuildingInfoPanel.style.textAlign = 'center'; // Reverted style


    let contentHTML = `
        <h4 style="margin-top: 0; margin-bottom: 8px;">${buildingName}</h4>
        <p style="margin: 4px 0;">Position: (${buildingModel.position.x.toFixed(1)}, ${buildingModel.position.z.toFixed(1)})</p>
        <p style="margin: 4px 0;">Workers: ${workers} / ${maxWorkers}</p>
    `;

    if (buildingInfo.produces) {
        contentHTML += `<p style="margin: 4px 0;">Produces: ${buildingInfo.produces.map(p => p.resource.replace('_', ' ')).join(', ')}</p>`;
    }
    if (placedBuildingData.isProducing && placedBuildingData.currentProduction) {
         contentHTML += `<p style="margin: 4px 0;">Current Task: Producing ${placedBuildingData.currentProduction.resource.replace('_', ' ')}</p>`;
    }


    // Placeholder for action buttons
    // Placeholder for action buttons
    contentHTML += `<div id="building-actions" style="margin-top: 16px; border-top: 1px solid #ccc; padding-top: 8px; display: flex; flex-direction: column; gap: 8px;">`; // Added flex for button layout
    contentHTML += `<h4 style="margin-top:0; margin-bottom: 8px;">Actions:</h4>`;
    
    selectedBuildingInfoPanel.innerHTML = contentHTML;
    const actionsDiv = selectedBuildingInfoPanel.querySelector('#building-actions');

    if (actionsDiv) {
        // Example: Add a specific action button for Woodcutter's Hut
        if (buildingInfo.key === 'WOODCUTTERS_HUT') {
            const upgradeButton = document.createElement('md-filled-button');
            upgradeButton.textContent = 'Upgrade (NI)';
            upgradeButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent click from bubbling to map/deselect
                console.log(`Action: Upgrade clicked for ${buildingName}`);
                // Future: Implement upgrade logic
            });
            actionsDiv.appendChild(upgradeButton);
        } else {
            const placeholderButton = document.createElement('md-outlined-button');
            placeholderButton.textContent = 'No specific actions';
            placeholderButton.disabled = true;
            actionsDiv.appendChild(placeholderButton);
        }
    }


    uiOverlay.appendChild(selectedBuildingInfoPanel);
}

function clearSelectedBuildingInfo() {
    if (selectedBuildingInfoPanel && selectedBuildingInfoPanel.parentElement) {
        selectedBuildingInfoPanel.parentElement.removeChild(selectedBuildingInfoPanel);
    }
    selectedBuildingInfoPanel = null;
}

function displaySelectedUnitInfo(serfModel) {
    if (!uiOverlay) return;
    clearSelectedUnitInfo();
    clearSelectedBuildingInfo(); // Ensure only one info panel is visible

    // Find serf data - serfModel itself should have its ID or link back to SerfManager data
    const serfData = serfManager.serfs.find(s => s.model === serfModel);

    if (!serfData) {
        console.warn("Could not find data for selected serf model:", serfModel);
        selectedObjects = []; // Deselect if no data
        outlinePass.selectedObjects = selectedObjects;
        return;
    }

    selectedUnitInfoPanel = document.createElement('div');
    selectedUnitInfoPanel.id = 'selected-unit-info-panel';
    // Basic styling, similar to building panel for now
    selectedUnitInfoPanel.style.position = 'absolute';
    selectedUnitInfoPanel.style.bottom = '10px';
    selectedUnitInfoPanel.style.left = '50%';
    selectedUnitInfoPanel.style.transform = 'translateX(-50%)';
    selectedUnitInfoPanel.style.padding = '10px';
    selectedUnitInfoPanel.style.backgroundColor = 'rgba(0,0,0,0.7)';
    selectedUnitInfoPanel.style.borderRadius = '8px';
    selectedUnitInfoPanel.style.color = 'white';
    selectedUnitInfoPanel.style.textAlign = 'center';
    selectedUnitInfoPanel.style.minWidth = '200px';
    selectedUnitInfoPanel.style.maxWidth = '300px';

    let contentHTML = `
        <h4 style="margin-top: 0; margin-bottom: 8px;">Serf ID: ${serfData.id}</h4>
        <p style="margin: 4px 0;">Status: ${serfData.state}</p>
    `;
    if (serfData.job) {
        contentHTML += `<p style="margin: 4px 0;">Job: ${serfData.job.profession} at ${serfData.job.building.info.name}</p>`;
    }
     if (serfData.targetResource) {
        contentHTML += `<p style="margin: 4px 0;">Target: ${serfData.targetResource.type}</p>`;
    }


    selectedUnitInfoPanel.innerHTML = contentHTML;
    uiOverlay.appendChild(selectedUnitInfoPanel);
}

function clearSelectedUnitInfo() {
    if (selectedUnitInfoPanel && selectedUnitInfoPanel.parentElement) {
        selectedUnitInfoPanel.parentElement.removeChild(selectedUnitInfoPanel);
    }
    selectedUnitInfoPanel = null;
}


// Handle window resize with improved updates for all components
window.addEventListener('resize', () => {
    // Update camera
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Update composer and all passes
    composer.setSize(window.innerWidth, window.innerHeight);
    
    // Update FXAA pass resolution uniforms
    const pixelRatio = renderer.getPixelRatio();
    fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
    fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);
    
    // Update outline pass
    outlinePass.resolution.set(window.innerWidth, window.innerHeight);
}, false);

// Enhanced animation loop with better timing
function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta(); // Get delta time once for all updates
    
    // Update controls and game logic
    controls.update();
    constructionManager.update(); 
    serfManager.update(deltaTime, constructionManager.placedBuildings); 
    
    // Render the scene with improved post-processing
    composer.render();
}

// Ensure animation loop starts only if main container and renderer are set up
if (appContainer && (gameCanvas || appContainer.contains(renderer.domElement))) {
    animate();
}

// TEMPORARY: Keyboard shortcut to add an axe for testing
window.addEventListener('keydown', (event) => {
    if (event.key === 'a' || event.key === 'A') {
        console.log("DEBUG: 'A' key pressed. Adding 1 TOOLS_AXE.");
        resourceManager.addResource(RESOURCE_TYPES.TOOLS_AXE, 1);
        console.log("DEBUG: TOOLS_AXE count after key press:", resourceManager.getResourceCount(RESOURCE_TYPES.TOOLS_AXE));
        if (typeof updateResourceUI === 'function') updateResourceUI(resourceManager.getAllStockpiles()); 
    }
    if (event.key.toLowerCase() === 'p') {
        console.log("DEBUG: 'P' key pressed. Adding 1 TOOLS_PICKAXE.");
        resourceManager.addResource(RESOURCE_TYPES.TOOLS_PICKAXE, 1);
        console.log("DEBUG: TOOLS_PICKAXE count after key press:", resourceManager.getResourceCount(RESOURCE_TYPES.TOOLS_PICKAXE));
        if (typeof updateResourceUI === 'function') updateResourceUI(resourceManager.getAllStockpiles());
    }
});
