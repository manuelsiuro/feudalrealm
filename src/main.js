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

console.log('Feudal Realm Manager - Game Main Initialized');

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

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
);
camera.position.set(0, 15, 15);

const renderer = new THREE.WebGLRenderer({
    canvas: gameCanvas || undefined,
    antialias: true,
    powerPreference: 'high-performance',
    precision: 'highp'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

if (!gameCanvas && appContainer) {
    appContainer.appendChild(renderer.domElement);
}

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
outlinePass.hiddenEdgeColor.set('#190a05');
composer.addPass(outlinePass);

let fxaaPass = new ShaderPass(FXAAShader);
const pixelRatio = renderer.getPixelRatio();
fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);
composer.addPass(fxaaPass);

import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
composer.addPass(gammaCorrectionPass);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 100;
controls.target.set(0, 0, 0);

const ambientLight = new THREE.AmbientLight(0xfffbf0, 0.65);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffeb, 1.0);
directionalLight.position.set(30, 50, 30);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 150;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
directionalLight.shadow.bias = -0.0003;
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0xc4d7f0, 0.35);
fillLight.position.set(-20, 30, -20);
scene.add(fillLight);

const gameElementsGroup = new THREE.Group();
gameElementsGroup.name = "GameElements";
scene.add(gameElementsGroup);

const MAP_WIDTH = 15;
const MAP_HEIGHT = 15;
const gameMap = new GameMap(MAP_WIDTH, MAP_HEIGHT);
// Donot delete stay commented
//gameMap.tileMeshes.position.y = -0.25;
gameElementsGroup.add(gameMap.tileMeshes);
console.log('GameMap created and added to scene.');

const constructionManager = new ConstructionManager(scene, gameMap);
constructionManager.setupInitialStructures(); // Initialize Castle and Transporter Hut
const serfManager = new SerfManager(scene, gameMap, constructionManager); // Pass constructionManager
// gameElementsGroup.add(serfManager.serfVisualsGroup); // serfManager.serfVisualsGroup is undefined as Serfs add themselves to the scene directly

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clock = new THREE.Clock();

// Camera positioning based on map size
const mapCenterOffset = 0; // Tiles are centered around (0,0,0)
const cameraX = (MAP_WIDTH * TILE_SIZE) * 0.65; // Positioned to view from a corner/angle
const cameraY = Math.max(MAP_WIDTH, MAP_HEIGHT) * TILE_SIZE * 0.8; // Elevated view
const cameraZ = (MAP_HEIGHT * TILE_SIZE) * 0.65; // Positioned to view from a corner/angle

camera.position.set(cameraX, cameraY, cameraZ);
controls.target.set(mapCenterOffset, 0, mapCenterOffset); // Target the center of the map
controls.maxDistance = Math.max(MAP_WIDTH, MAP_HEIGHT) * TILE_SIZE * 2.5; // Allow zooming out further
controls.minDistance = TILE_SIZE * 2; // Prevent zooming in too close

if (uiOverlay) {
    uiOverlay.innerHTML = '';

    // --- BEGIN: Injected CSS Styles for UI ---
    const uiStyles = `
        .themed-panel { /* Common class for resource and construction panels */
            position: absolute;
            padding: 10px;
            background-color: rgba(25,25,35,0.85);
            border-radius: 10px;
            color: white;
            border: 1px solid rgba(255,255,255,0.2);
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            box-sizing: border-box;
        }
        .themed-panel-title {
            text-align: center;
            margin: 2px 0 12px 0;
            color: white;
            text-shadow: 0 0 5px rgba(0,0,0,0.5);
            letter-spacing: 1px;
            font-size: 1.3em;
            padding-bottom: 6px;
            border-bottom: 1px solid rgba(255,255,255,0.3);
        }
        .building-button-content {
            display: flex;
            flex-direction: column;
            width: 100%;
            align-items: center;
            text-align: center;
        }
        .building-button-name {
            font-weight: bold;
            width: 100%;
            margin-bottom: 10px;
            font-size: 1.15em;
            text-shadow: 0px 0px 3px rgba(0,0,0,0.6);
            letter-spacing: 0.5px;
            color: inherit;
        }
        .building-button-cost-section {
            font-size: 0.9em;
            padding: 10px;
            border-top: 1px solid rgba(255,255,255,0.3);
            background-color: rgba(0,0,0,0.2);
            border-radius: 6px;
            box-sizing: border-box;
            color: inherit;
        }
        .cost-display-title-container {
            text-align: center;
            margin-bottom: 10px;
            width: 100%;
        }
        .cost-display-title-text { /* The "Cost" or "Free" block */
            background-color: rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.95);
            padding: 5px 0px; /* Vertical padding, horizontal padding handled by width */
            border-radius: 4px;
            font-weight: bold;
            font-size: 1em;
            display: inline-block;
            width: 90px; /* Fixed width for the "Cost" block */
            min-width: 90px; /* Ensure it doesn't shrink */
            box-sizing: border-box;
            text-align: center;
        }
        .cost-display-item {
            margin: 6px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            padding: 4px 2px;
            box-sizing: border-box;
            font-size: 0.95em;
        }
        .cost-display-resource-name {
            font-weight: 500;
            margin-right: 8px;
        }
        .cost-display-resource-value span {
            font-weight: bold;
            text-shadow: 0px 0px 2px rgba(0,0,0,0.7);
        }
        .resource-sufficient {
            color: #32CD32;
        }
        .resource-insufficient {
            color: #FF6347;
        }
        /* Scrollbar for themed panels */
        .themed-panel::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        .themed-panel::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 4px;
        }
        .themed-panel::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.5);
            border-radius: 4px;
        }
        .themed-panel::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.7);
        }
        .themed-panel {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.5) rgba(0, 0, 0, 0.3);
        }
    `;
    const styleElement = document.createElement('style');
    styleElement.id = 'game-ui-styles';
    if (!document.getElementById('game-ui-styles')) {
        styleElement.textContent = uiStyles;
        document.head.appendChild(styleElement);
    }
    // --- END: Injected CSS Styles for UI ---

    // Resource Display Panel
    const resourcePanel = document.createElement('div');
    resourcePanel.id = 'resource-panel';
    resourcePanel.classList.add('themed-panel'); // Apply common theme
    resourcePanel.style.top = '10px';
    resourcePanel.style.left = '10px';
    resourcePanel.style.minWidth = '230px'; // Adjusted minWidth
    resourcePanel.style.maxHeight = 'calc(100vh - 20px)'; // Make it scrollable if too long
    resourcePanel.style.overflowY = 'auto';
    uiOverlay.appendChild(resourcePanel);

    // Mini-map Placeholder
    const miniMapPanel = document.createElement('div');
    miniMapPanel.id = 'mini-map-panel';
    miniMapPanel.style.position = 'absolute';
    miniMapPanel.style.top = '10px';
    miniMapPanel.style.right = '10px';
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

    function updateResourceUI(stockpiles) {
        if (!resourcePanel) return;
        resourcePanel.innerHTML = ''; // Clear previous content

        const resourceTitle = document.createElement('h3');
        resourceTitle.textContent = 'Resources';
        resourceTitle.classList.add('themed-panel-title'); // Apply common title style
        resourcePanel.appendChild(resourceTitle);

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse'; // Keep for table structure

        for (const type in stockpiles) {
            const row = table.insertRow();
            const resourceName = type.split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');

            const labelCell = row.insertCell(0);
            labelCell.textContent = resourceName;
            labelCell.style.textAlign = 'left';
            labelCell.style.padding = '4px 2px'; // Adjusted padding
            labelCell.style.color = 'rgba(255,255,255,0.9)';


            const valueCell = row.insertCell(1);
            valueCell.textContent = stockpiles[type];
            valueCell.style.textAlign = 'right';
            valueCell.style.fontWeight = 'bold';
            valueCell.style.padding = '4px 2px'; // Adjusted padding
            valueCell.style.color = 'white';
        }
        resourcePanel.appendChild(table);
    }

    resourceManager.onChange((stockpiles) => {
        updateResourceUI(stockpiles);
        updateBuildingButtons();
    });

    const buildingButtons = new Map();

    function checkSufficientResources(cost) {
        if (Object.keys(cost).length === 0) return true;
        return Object.entries(cost).every(([resourceType, amount]) => {
            return resourceManager.getResourceCount(resourceType) >= amount;
        });
    }

    function buildCostDisplay(cost) {
        if (Object.keys(cost).length === 0) {
            return `<div class="cost-display-title-container"><span class="cost-display-title-text">Free</span></div>`;
        }
        let costItemsHTML = Object.entries(cost).map(([res, amount]) => {
            const available = resourceManager.getResourceCount(res);
            const resourceName = res.split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
            const availabilityClass = available >= amount ? 'resource-sufficient' : 'resource-insufficient';
            const availableText = `<span class="${availabilityClass}">${available}/${amount}</span>`;
            return `<div class="cost-display-item">
                        <span class="cost-display-resource-name">${resourceName}:</span>
                        <span class="cost-display-resource-value">${availableText}</span>
                    </div>`;
        }).join('');
        return `<div class="cost-display-title-container"><span class="cost-display-title-text">Cost</span></div>
                ${costItemsHTML}`;
    }

    function updateBuildingButtons() {
        buildingButtons.forEach(({ button, cost }, key) => {
            const canBuild = checkSufficientResources(cost);
            const costSectionContainer = button.querySelector('.building-button-cost-section');
            if (costSectionContainer) {
                costSectionContainer.innerHTML = buildCostDisplay(cost);
            }
            if (canBuild) {
                button.style.setProperty('--md-sys-color-primary', '#4CAF50');
                button.style.setProperty('--md-sys-color-on-primary', '#FFFFFF');
                button.style.fontWeight = 'bold';
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
                button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                button.style.transform = '';
                button.removeAttribute('title');
                button.disabled = false;
            } else {
                button.style.setProperty('--md-sys-color-primary', '#B71C1C');
                button.style.setProperty('--md-sys-color-on-primary', '#FFFFFF');
                button.style.opacity = '0.95';
                button.style.cursor = 'not-allowed';
                button.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
                const missingResources = Object.entries(cost)
                    .filter(([resource, amount]) => resourceManager.getResourceCount(resource) < amount)
                    .map(([resource, amount]) => {
                        const current = resourceManager.getResourceCount(resource);
                        const resourceName = resource.split('_')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join(' ');
                        return `${resourceName}: ${current}/${amount}`;
                    }).join(', ');
                button.title = missingResources ? `Missing Resources: ${missingResources}` : 'Not enough resources';
                button.style.transform = '';
                button.disabled = true;
            }
        });
    }

    if (resourcePanel) {
        updateResourceUI(resourceManager.getAllStockpiles());
    }

    const testButtonContainer = document.createElement('div');
    testButtonContainer.style.position = 'absolute';
    testButtonContainer.style.bottom = '10px'; // Adjusted position
    testButtonContainer.style.left = '10px';
    testButtonContainer.style.display = 'flex';
    testButtonContainer.style.gap = '8px';
    testButtonContainer.style.zIndex = '50'; // Ensure it's above map, below panels if they overlap

    const addCheatButton = document.createElement('md-filled-button');
    addCheatButton.textContent = '+50 All';
    addCheatButton.style.borderRadius = '4px';
    addCheatButton.addEventListener('click', () => {
        console.log('UI: "+50 All" button clicked.');
        Object.values(RESOURCE_TYPES).forEach(type => {
            if (typeof type === 'string') {
                 resourceManager.addResource(type, 50);
            }
        });
    });
    testButtonContainer.appendChild(addCheatButton);
    uiOverlay.appendChild(testButtonContainer);

    const constructionPanel = document.createElement('div');
    constructionPanel.id = 'construction-panel';
    constructionPanel.classList.add('themed-panel'); // Apply common theme
    constructionPanel.style.bottom = '10px';
    constructionPanel.style.right = '10px';
    constructionPanel.style.display = 'flex';
    constructionPanel.style.flexDirection = 'column';
    constructionPanel.style.gap = '8px';
    constructionPanel.style.maxHeight = '450px'; // Shorter building list
    constructionPanel.style.minWidth = '220px'; // To match button min-width + padding
    constructionPanel.style.overflowY = 'auto';
    constructionPanel.style.overflowX = 'hidden';

    const buildingsTitle = document.createElement('h3');
    buildingsTitle.textContent = 'Buildings';
    buildingsTitle.classList.add('themed-panel-title'); // Apply common title style
    constructionPanel.appendChild(buildingsTitle);

    const availableBuildings = constructionManager.getAvailableBuildings();
    availableBuildings.forEach(building => {
        const button = document.createElement('md-filled-button');
        const costString = buildCostDisplay(building.cost);
        button.innerHTML = `
            <div class="building-button-content">
                <div class="building-button-name">${building.name}</div>
                <div class="building-button-cost-section">
                    ${costString}
                </div>
            </div>
        `;
        button.style.setProperty('--md-filled-button-container-height', 'auto');
        button.style.setProperty('--md-filled-button-container-width', '100%');
        button.style.setProperty('--md-filled-button-container-shape', '8px');
        button.style.setProperty('--md-filled-button-disabled-container-opacity', '0.9');
        button.style.setProperty('--md-filled-button-disabled-label-text-color', 'rgba(255, 255, 255, 0.95)');
        button.style.setProperty('--md-filled-button-disabled-label-text-opacity', '0.95');
        button.style.padding = '12px 10px';
        button.style.borderRadius = '8px';
        button.style.margin = '0 0 12px 0';
        button.style.width = '100%';
        button.style.minWidth = '200px'; // Actual button element min-width
        button.style.maxWidth = '100%';
        button.style.boxSizing = 'border-box';
        button.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3)';
        button.style.transition = 'all 0.2s ease-in-out';
        button.style.border = '1px solid rgba(255,255,255,0.15)';
        button.style.letterSpacing = '0.3px';
        button.style.setProperty('--md-sys-color-primary', '#4CAF50');
        button.style.setProperty('--md-sys-color-on-primary', '#FFFFFF');

        button.addEventListener('mouseover', () => {
            if (!button.disabled) {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
                button.style.setProperty('--md-sys-color-primary', '#5DBF60');
            }
        });
        button.addEventListener('mouseout', () => {
            if (!button.disabled) {
                button.style.transform = '';
                button.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3)';
                button.style.setProperty('--md-sys-color-primary', '#4CAF50');
            }
        });
        button.addEventListener('click', () => {
            console.log(`UI: Construction button clicked for building key: ${building.key}, name: ${building.name}`);
            constructionManager.startPlacement(building.key);
        });
        // Initial state check (will be refined by updateBuildingButtons)
        const canBuild = checkSufficientResources(building.cost);
        if (!canBuild) {
            button.style.setProperty('--md-sys-color-primary', '#B71C1C');
            button.style.setProperty('--md-sys-color-on-primary', '#FFFFFF');
            button.style.cursor = 'not-allowed';
            button.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
            const missingResources = Object.entries(building.cost)
                .filter(([resource, amount]) => resourceManager.getResourceCount(resource) < amount)
                .map(([resource, amount]) => {
                    const current = resourceManager.getResourceCount(resource);
                    const resourceName = resource.split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');
                    return `${resourceName}: ${current}/${amount}`;
                }).join(', ');
            button.title = missingResources ? `Missing Resources: ${missingResources}` : 'Not enough resources';
            button.disabled = true;
        } else {
            button.style.fontWeight = 'bold';
        }
        buildingButtons.set(building.key, { button, cost: building.cost });
        constructionPanel.appendChild(button);
    });
    uiOverlay.appendChild(constructionPanel);
    updateBuildingButtons();
}

function onMouseMove(event) {
    if (!constructionManager.isPlacing) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(gameMap.tileMeshes, true);
    const groundPlaneIntersectPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    if (intersects.length > 0) {
        constructionManager.updatePlacementIndicator(intersects[0].point);
    } else {
        const intersectionPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(groundPlaneIntersectPlane, intersectionPoint);
        if (intersectionPoint) {
            constructionManager.updatePlacementIndicator(intersectionPoint);
        }
    }
}
window.addEventListener('mousemove', onMouseMove, false);

let selectedBuildingInfoPanel = null;
let selectedUnitInfoPanel = null;

function onMouseClick(event) {
    if (event.target !== renderer.domElement && !uiOverlay.contains(event.target)) return;
    if (event.target !== renderer.domElement && event.target.closest('md-filled-button, md-outlined-button')) {
        return;
    }
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    if (constructionManager.isPlacing) {
        const intersectsPlacement = raycaster.intersectObject(gameMap.tileMeshes, true);
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        let placementPoint = new THREE.Vector3();
        if (intersectsPlacement.length > 0) {
            placementPoint = intersectsPlacement[0].point;
        } else {
            raycaster.ray.intersectPlane(groundPlane, placementPoint);
        }
        if (placementPoint) constructionManager.confirmPlacement(placementPoint);
    } else {
        const buildingsGroup = scene.getObjectByName("GameBuildings");
        if (buildingsGroup) {
            const intersectsSelection = raycaster.intersectObjects(buildingsGroup.children, true);
            if (intersectsSelection.length > 0) {
                let topObject = intersectsSelection[0].object;
                while (topObject.parent && topObject.parent !== buildingsGroup) {
                    topObject = topObject.parent;
                }
                selectedObjects = [topObject];
                outlinePass.selectedObjects = selectedObjects;
                displaySelectedBuildingInfo(topObject);
                clearSelectedUnitInfo();
                return;
            }
        }
        const serfsGroup = serfManager.serfVisualsGroup;
        if (serfsGroup && serfsGroup.children.length > 0) {
            const intersectsSerfs = raycaster.intersectObjects([serfsGroup], true);
            if (intersectsSerfs.length > 0) {
                let topSerfModel = intersectsSerfs[0].object;
                while (topSerfModel.parent && topSerfModel.parent !== serfsGroup) {
                    topSerfModel = topSerfModel.parent;
                }
                selectedObjects = [topSerfModel];
                outlinePass.selectedObjects = selectedObjects;
                displaySelectedUnitInfo(topSerfModel);
                clearSelectedBuildingInfo();
                return;
            }
        }
        selectedObjects = [];
        outlinePass.selectedObjects = selectedObjects;
        clearSelectedBuildingInfo();
        clearSelectedUnitInfo();
    }
}
renderer.domElement.addEventListener('click', onMouseClick, false);
uiOverlay.addEventListener('click', (event) => {
    if (event.target.closest('md-filled-button, md-outlined-button, #selected-info-panel, #selected-unit-info-panel, .themed-panel')) {
        return;
    }
    if (!constructionManager.isPlacing) {
        selectedObjects = [];
        outlinePass.selectedObjects = selectedObjects;
        clearSelectedBuildingInfo();
        clearSelectedUnitInfo();
    }
}, false);

function displaySelectedBuildingInfo(buildingModel) {
    if (!uiOverlay) return;
    clearSelectedBuildingInfo();
    clearSelectedUnitInfo();
    const placedBuildingData = constructionManager.placedBuildings.find(b => b.model === buildingModel);
    if (!placedBuildingData) {
        console.warn("Could not find data for selected building model:", buildingModel);
        return;
    }
    // Access the buildingInstance for inventory
    const buildingInstance = buildingModel.userData.buildingInstance; 

    const buildingInfo = placedBuildingData.info;
    const buildingName = buildingInfo.name || "Unknown Building";
    const workers = placedBuildingData.workers ? placedBuildingData.workers.length : 0;
    const maxWorkers = buildingInfo.jobSlots || 0;
    selectedBuildingInfoPanel = document.createElement('div');
    selectedBuildingInfoPanel.id = 'selected-info-panel';
    selectedBuildingInfoPanel.classList.add('themed-panel'); // Apply theme
    selectedBuildingInfoPanel.style.bottom = '10px';
    selectedBuildingInfoPanel.style.left = '50%';
    selectedBuildingInfoPanel.style.transform = 'translateX(-50%)';
    selectedBuildingInfoPanel.style.minWidth = '220px';
    selectedBuildingInfoPanel.style.maxWidth = '300px';
    selectedBuildingInfoPanel.style.zIndex = '100';

    let contentHTML = `<h4 class="themed-panel-title" style="margin-bottom: 8px;">${buildingName}</h4>
                       <p style="margin: 4px 0;">Position: (${buildingModel.position.x.toFixed(1)}, ${buildingModel.position.z.toFixed(1)})</p>
                       <p style="margin: 4px 0;">Workers: ${workers} / ${maxWorkers}</p>`;
    if (buildingInfo.produces) {
        contentHTML += `<p style="margin: 4px 0;">Produces: ${buildingInfo.produces.map(p => p.resource.replace(/_/g, ' ')).join(', ')}</p>`;
    }

    // Display local inventory
    if (buildingInstance && buildingInstance.inventory) {
        contentHTML += `<h5 style="margin-top: 10px; margin-bottom: 5px; color: rgba(255,255,255,0.9);">Local Stock:</h5>`;
        let stockEmpty = true;
        for (const resourceType in buildingInstance.inventory) {
            if (buildingInstance.inventory[resourceType] > 0) {
                stockEmpty = false;
                const currentStock = buildingInstance.inventory[resourceType];
                const maxStock = buildingInstance.maxStock[resourceType] || buildingInstance.maxStock.default || 0; // Handle default or specific max stock
                contentHTML += `<p style="margin: 2px 0; font-size: 0.9em;">- ${resourceType.replace(/_/g, ' ')}: ${currentStock} / ${maxStock}</p>`;
            }
        }
        if (stockEmpty) {
            contentHTML += `<p style="margin: 2px 0; font-size: 0.9em; font-style: italic;">Empty</p>`;
        }
    }


    if (placedBuildingData.isProducing && placedBuildingData.currentProduction) {
        contentHTML += `<p style="margin: 4px 0;">Current Task: Producing ${placedBuildingData.currentProduction.resource.replace(/_/g, ' ')}</p>`;
    }
    contentHTML += `<div id="building-actions" style="margin-top: 16px; border-top: 1px solid #ccc; padding-top: 8px; display: flex; flex-direction: column; gap: 8px;">
                    <h4 style="margin-top:0; margin-bottom: 8px; font-size: 1em; color: rgba(255,255,255,0.8);">Actions:</h4>`;
    selectedBuildingInfoPanel.innerHTML = contentHTML;
    const actionsDiv = selectedBuildingInfoPanel.querySelector('#building-actions');
    if (actionsDiv) {
        if (buildingInfo.key === 'WOODCUTTERS_HUT') {
            const upgradeButton = document.createElement('md-filled-button');
            upgradeButton.textContent = 'Upgrade (NI)';
            upgradeButton.addEventListener('click', (e) => { e.stopPropagation(); console.log(`Action: Upgrade clicked for ${buildingName}`); });
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
    clearSelectedBuildingInfo();
    const serfData = serfManager.serfs.find(s => s.model === serfModel);
    if (!serfData) {
        console.warn("Could not find data for selected serf model:", serfModel);
        selectedObjects = []; outlinePass.selectedObjects = selectedObjects; return;
    }
    selectedUnitInfoPanel = document.createElement('div');
    selectedUnitInfoPanel.id = 'selected-unit-info-panel';
    selectedUnitInfoPanel.classList.add('themed-panel'); // Apply theme
    selectedUnitInfoPanel.style.bottom = '10px';
    selectedUnitInfoPanel.style.left = '50%';
    selectedUnitInfoPanel.style.transform = 'translateX(-50%)';
    selectedUnitInfoPanel.style.minWidth = '220px';
    selectedUnitInfoPanel.style.maxWidth = '300px';
    selectedUnitInfoPanel.style.zIndex = '100';

    let contentHTML = `<h4 class="themed-panel-title" style="margin-bottom: 8px;">Serf ID: ${serfData.id}</h4>
                       <p style="margin: 4px 0;">Status: ${serfData.state}</p>`;
    if (serfData.job) {
        contentHTML += `<p style="margin: 4px 0;">Job: ${serfData.job.profession} at ${serfData.job.building.info.name}</p>`;
    }
    if (serfData.targetResource) {
        contentHTML += `<p style="margin: 4px 0;">Target: ${serfData.targetResource.type.replace(/_/g, ' ')}</p>`;
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

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    composer.setSize(window.innerWidth, window.innerHeight);
    const newPixelRatio = renderer.getPixelRatio();
    fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * newPixelRatio);
    fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * newPixelRatio);
    outlinePass.resolution.set(window.innerWidth, window.innerHeight);

    const constrPanel = document.getElementById('construction-panel');
    if (constrPanel) constrPanel.style.maxHeight = '450px'; // Keep fixed height
    const resPanel = document.getElementById('resource-panel');
    if (resPanel) resPanel.style.maxHeight = `calc(${window.innerHeight}px - 20px)`;


}, false);

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    controls.update();
    constructionManager.update();
    serfManager.update(deltaTime, constructionManager.placedBuildings);
    composer.render();
}

if (appContainer && (gameCanvas || appContainer.contains(renderer.domElement))) {
    const constrPanel = document.getElementById('construction-panel');
    if (constrPanel) constrPanel.style.maxHeight = '450px';
    const resPanel = document.getElementById('resource-panel');
    if (resPanel) resPanel.style.maxHeight = `calc(${window.innerHeight}px - 20px)`;
    animate();
}

window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'a') {
        console.log("DEBUG: 'A' key pressed. Adding 1 TOOLS_AXE.");
        resourceManager.addResource(RESOURCE_TYPES.TOOLS_AXE, 1);
    }
    if (event.key.toLowerCase() === 'p') {
        console.log("DEBUG: 'P' key pressed. Adding 1 TOOLS_PICKAXE.");
        resourceManager.addResource(RESOURCE_TYPES.TOOLS_PICKAXE, 1);
    }
});

class FeudalRealmManager {
    constructor() {
        this.serfs = [];
        this.selectedSerf = null;
        this.initializeSerfs();
    }

    initializeSerfs() {
        // Example: Create a few serfs of different types
        // Ensure mapManager is ready and grid is populated before placing serfs
        if (!this.mapManager || !this.mapManager.grid) {
            console.error("MapManager not ready for serf initialization.");
            return;
        }

        // Place serfs at valid starting positions (e.g., near the town center or on empty tiles)
        // For simplicity, let's assume (10,10), (12,10), (10,12) are valid and empty
        // In a real game, you'd check tile properties (e.g., isWalkable)

        const serfPositions = [
            { x: 10, y: 10, type: 'miner' },
            { x: 12, y: 10, type: 'builder' }, // Will be idle for now
            { x: 10, y: 12, type: 'farmer' }  // Will be idle for now
        ];

        serfPositions.forEach((pos, index) => {
            const serfId = `serf-${index}`;
            // Ensure the position is within map bounds
            if (pos.x < 0 || pos.x >= this.mapManager.width || pos.y < 0 || pos.y >= this.mapManager.height) {
                console.warn(`Serf position (${pos.x}, ${pos.y}) is out of bounds. Skipping.`);
                return;
            }

            const serf = new Serf(serfId, pos.x, pos.y, pos.type, this.scene, this.mapManager);
            this.serfs.push(serf);
            console.log(`Initialized ${serf.serfType} serf: ${serf.id} at grid (${pos.x}, ${pos.y})`);
        });

        // Assign a task to the first miner serf for testing
        if (this.serfs.length > 0 && this.serfs[0].serfType === 'miner') {
            // Find a stone resource to assign
            let stoneNode = null;
            for (let r = 0; r < this.mapManager.height; r++) {
                for (let c = 0; c < this.mapManager.width; c++) {
                    const tile = this.mapManager.grid[r][c];
                    if (tile.resource && tile.resource.type === 'stone' && tile.resource.amount > 0) {
                        stoneNode = tile;
                        break;
                    }
                }
                if (stoneNode) break;
            }

            if (stoneNode) {
                console.log(`Assigning initial mine task to ${this.serfs[0].id} for stone at (${stoneNode.x}, ${stoneNode.y})`);
                this.serfs[0].setTask('mine', { resourceType: 'stone' });
                this.serfs[0].initialTaskAssignedByManager = true; // Mark for testing
            } else {
                console.log("No stone found to assign initial task to miner serf.");
            }
        }
    }

    update(deltaTime) {
        this.serfs.forEach(serf => {
            serf.update(deltaTime);
        });
    }
}