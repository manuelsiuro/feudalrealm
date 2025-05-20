import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // Game will manage controls instance from Renderer

import { GameMap } from './MapManager.js';
import { TILE_SIZE, TERRAIN_COLORS, TERRAIN_TYPES } from '../config/mapConstants.js'; // Corrected import path, Added TERRAIN_COLORS, TERRAIN_TYPES
import resourceManager from './resourceManager.js';
import ConstructionManager from './constructionManager.js';
import SerfManager from './serfManager.js';
import Renderer from './Renderer.js';
import UIManager from '../ui/UIManager.js';
import { RESOURCE_TYPES } from '../config/resourceTypes.js';

const MAP_WIDTH = 15;
const MAP_HEIGHT = 15;

class Game {
    constructor() {
        this.renderer = null;
        this.uiManager = null;
        this.gameMap = null;
        this.constructionManager = null;
        this.serfManager = null;
        this.resourceManager = resourceManager; // Direct assignment

        this.scene = null;
        this.camera = null;
        this.controls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.clock = new THREE.Clock();

        this.selectedObjects = []; // Managed by Game, passed to Renderer/UIManager

        // DOM elements that Game needs to interact with or pass to UIManager
        this.gameCanvas = document.getElementById('game-canvas');
        // this.uiOverlay = document.getElementById('ui-overlay'); // Removed

        // Bind event handlers to the game instance
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleCanvasClick = this.handleCanvasClick.bind(this);
        // this.handleOverlayClick = this.handleOverlayClick.bind(this); // Removed, UIManager handles its own clicks
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }

    init() {
        // 1. Initialize Renderer
        this.renderer = new Renderer(this.gameCanvas);
        this.scene = this.renderer.scene;
        this.camera = this.renderer.camera;
        this.controls = this.renderer.controls; // Get controls from Renderer

        // 2. Initialize GameMap
        this.gameMap = new GameMap(MAP_WIDTH, MAP_HEIGHT);
        this.renderer.gameElementsGroup.add(this.gameMap.tileMeshes);
        console.log('GameMap created and added to scene via Game.js.');

        // Create and add the ground plane
        const groundGeometry = new THREE.PlaneGeometry(MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
        const groundMaterial = new THREE.MeshBasicMaterial({ color: TERRAIN_COLORS[TERRAIN_TYPES.GRASSLAND] });
        const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
        groundPlane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        groundPlane.position.y = -0.05; // Position slightly below tiles to avoid z-fighting if tiles are at y=0
        this.renderer.gameElementsGroup.add(groundPlane);
        console.log('Ground plane created and added to scene.');

        // 3. Initialize ConstructionManager
        this.constructionManager = new ConstructionManager(this.scene, this.gameMap, this.renderer.gameElementsGroup);
        this.constructionManager.setupInitialStructures();

        // 4. Initialize SerfManager
        this.serfManager = new SerfManager(this.scene, this.gameMap, this.constructionManager, this.renderer.gameElementsGroup);

        // 5. Initialize UIManager
        // UIManager needs references to managers and renderer for its operations
        this.uiManager = new UIManager(
            // this.uiOverlay, // Pass the uiOverlay DOM element - Removed
            document.body, // Pass document.body as the container for UI elements
            this.resourceManager,
            this.constructionManager,
            this.serfManager
        );

        // Setup callback for when a serf is selected in the UI
        this.uiManager.setSerfSelectCallback((serfId) => {
            this.selectAndFocusSerf(serfId);
        });

        // Setup callback for when a building is selected in the UI (new)
        // this.uiManager.onBuildingSelectCallback = (buildingId) => { // Directly assigning for now
        //     this.selectAndFocusBuilding(buildingId);
        // };
        this.uiManager.setBuildingSelectCallback((buildingId) => {
            this.selectAndFocusBuilding(buildingId);
        });

        // 6. Camera and Controls Setup
        this.setupCameraAndControls();

        // 7. Event Listeners
        this.setupEventListeners();

        // Initial UI updates
        this.uiManager.updateResourceUI(this.resourceManager.getAllStockpiles());
        this.uiManager.updateBuildingButtons();

        console.log("Game initialized.");
    }

    setupCameraAndControls() {
        const mapCenterOffset = 0;
        const cameraX = (MAP_WIDTH * TILE_SIZE) * 0.65;
        const cameraY = Math.max(MAP_WIDTH, MAP_HEIGHT) * TILE_SIZE * 0.8;
        const cameraZ = (MAP_HEIGHT * TILE_SIZE) * 0.65;

        this.camera.position.set(cameraX, cameraY, cameraZ);
        this.controls.target.set(mapCenterOffset, 0, mapCenterOffset);
        this.controls.maxDistance = Math.max(MAP_WIDTH, MAP_HEIGHT) * TILE_SIZE * 2.5;
        this.controls.minDistance = TILE_SIZE * 2;
    }

    setupEventListeners() {
        window.addEventListener('mousemove', this.handleMouseMove, false);
        // renderer.domElement might not be available if canvas is passed directly
        const targetElementForClicks = this.renderer.renderer.domElement;
        targetElementForClicks.addEventListener('click', this.handleCanvasClick, false);
        // this.uiOverlay.addEventListener('click', this.handleOverlayClick, false); // Removed
        window.addEventListener('resize', this.handleResize, false);
        window.addEventListener('keydown', this.handleKeyDown, false);
    }

    handleMouseMove(event) {
        if (!this.constructionManager.isPlacing) return;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObject(this.gameMap.tileMeshes, true);
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Assuming Y-up

        if (intersects.length > 0) {
            this.constructionManager.updatePlacementIndicator(intersects[0].point);
        } else {
            const intersectionPoint = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(groundPlane, intersectionPoint);
            if (intersectionPoint) {
                this.constructionManager.updatePlacementIndicator(intersectionPoint);
            }
        }
    }

    handleCanvasClick(event) {
        // Prevent click handling if a UI element on the overlay was the target
        // Check if the click originated from within the uiOverlay
        // if (this.uiOverlay.contains(event.target) && event.target !== this.uiOverlay) { // Removed
        // Check if the click target is part of the game canvas or the document body directly
        // This logic might need refinement based on how UI elements are structured without the overlay
        if (event.target !== this.gameCanvas && event.target !== document.body) {
            // If the click is on any element that is NOT the game canvas or body,
            // assume UIManager's internal event listeners will handle it.
            return;
        }

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        if (this.constructionManager.isPlacing) {
            const intersectsPlacement = this.raycaster.intersectObject(this.gameMap.tileMeshes, true);
            const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            let placementPoint = new THREE.Vector3();

            if (intersectsPlacement.length > 0) {
                placementPoint.copy(intersectsPlacement[0].point);
            } else {
                this.raycaster.ray.intersectPlane(groundPlane, placementPoint);
            }

            if (placementPoint) {
                this.constructionManager.confirmPlacement(placementPoint);
                // UIManager might need an update after placement (e.g., button states if costs change)
                this.uiManager.updateBuildingButtons();
            }
        } else {
            // Selection logic
            let clickedObject = null;

            // Check for buildings
            const buildingsGroup = this.renderer.gameElementsGroup.getObjectByName("GameBuildings");
            if (buildingsGroup) {
                const intersectsSelection = this.raycaster.intersectObjects(buildingsGroup.children, true);
                if (intersectsSelection.length > 0) {
                    let topObject = intersectsSelection[0].object;
                    while (topObject.parent && topObject.parent !== buildingsGroup && !topObject.userData.buildingInstance) { // Check for userData on current or parent
                        topObject = topObject.parent;
                    }
                    if (topObject.userData.buildingInstance) {
                        clickedObject = topObject;
                        this.selectedObjects = [topObject];
                        this.renderer.setSelectedObjects(this.selectedObjects);
                        this.uiManager.displaySelectedBuildingInfo(topObject); // Pass the model
                        return; 
                    }
                }
            }

            // Check for serfs
            const serfsGroup = this.serfManager.serfVisualsGroup; 
            if (serfsGroup && serfsGroup.children.length > 0) {
                const intersectsSerfs = this.raycaster.intersectObjects(serfsGroup.children, true); 
                if (intersectsSerfs.length > 0) {
                    let topSerfModel = intersectsSerfs[0].object;
                    while (topSerfModel.parent && topSerfModel.parent !== serfsGroup && !topSerfModel.userData.serfInstance) {
                        topSerfModel = topSerfModel.parent;
                    }

                    if (topSerfModel.userData.serfInstance) { 
                        clickedObject = topSerfModel;
                        this.selectedObjects = [topSerfModel];
                        this.renderer.setSelectedObjects(this.selectedObjects);
                        this.uiManager.displaySelectedUnitInfo(topSerfModel); // Pass the model
                        return; 
                    }
                }
            }
            
            // If nothing was clicked or an irrelevant part of a model was clicked
            if (!clickedObject) {
                this.selectedObjects = [];
                this.renderer.setSelectedObjects(this.selectedObjects);
                this.uiManager.clearSelectedBuildingInfo(); // Clear specific panels
                this.uiManager.clearSelectedUnitInfo();   // Clear specific panels
            }
        }
    }
    
    // handleOverlayClick(event) { // Removed
    //     // If the click is on the overlay itself (not its children like panels or buttons)
    //     // and not in placement mode, then deselect.
    //     if (event.target === this.uiOverlay && !this.constructionManager.isPlacing) {
    //         this.selectedObjects = [];
    //         this.renderer.setSelectedObjects(this.selectedObjects);
    //         this.uiManager.clearSelectionInfo();
    //     }
    //     // If the click is on a button or panel, UIManager's own event listeners should handle it.
    //     // This function primarily handles deselection when clicking on the "empty" part of the overlay.
    // }


    handleKeyDown(event) {
        if (event.key.toLowerCase() === 'escape') {
            if (this.constructionManager.isPlacing) {
                this.constructionManager.cancelPlacement();
                this.uiManager.updateBuildingButtons(); 
            } else {
                this.selectedObjects = [];
                this.renderer.setSelectedObjects(this.selectedObjects);
                this.uiManager.clearSelectedBuildingInfo(); // Clear specific panels
                this.uiManager.clearSelectedUnitInfo();   // Clear specific panels
            }
        }
        // Debug keys
        if (event.key.toLowerCase() === 'a') {
            console.log("DEBUG: 'A' key pressed. Adding 1 TOOLS_AXE.");
            this.resourceManager.addResource(RESOURCE_TYPES.TOOLS_AXE, 1);
        }
        if (event.key.toLowerCase() === 'p') {
            console.log("DEBUG: 'P' key pressed. Adding 1 TOOLS_PICKAXE.");
            this.resourceManager.addResource(RESOURCE_TYPES.TOOLS_PICKAXE, 1);
        }
    }

    handleResize() {
        this.renderer.onWindowResize(); // Renderer handles its own components
        this.uiManager.onWindowResize(); // UIManager handles its components
    }

    // handleBuildRequest(buildingKey) { // Removed - UIManager calls constructionManager directly
    //     console.log(`Game: Build request for ${buildingKey}`);
    //     this.constructionManager.startPlacement(buildingKey);
    // }

    // handleCheatResources() { // Removed - UIManager calls resourceManager directly
    //     console.log('Game: Cheat resources requested.');
    //     Object.values(RESOURCE_TYPES).forEach(type => {
    //         if (typeof type === 'string') { 
    //             this.resourceManager.addResource(type, 50);
    //         }
    //     });
    // }

    selectAndFocusSerf(serfId) {
        const serf = this.serfManager.getSerfById(serfId);
        if (serf && serf.model) {
            this.selectedObjects = [serf.model];
            this.renderer.setSelectedObjects(this.selectedObjects);
            this.uiManager.displaySelectedUnitInfo(serf.model);

            // Move camera to focus on the serf
            const serfPosition = serf.model.position;
            // Maintain current camera distance/zoom, but change target
            const offset = this.camera.position.clone().sub(this.controls.target);
            this.controls.target.copy(serfPosition);
            this.camera.position.copy(serfPosition).add(offset);
            this.controls.update();
        } else {
            console.warn(`Game: Serf with ID ${serfId} not found or has no model.`);
        }
    }

    selectAndFocusBuilding(buildingId) {
        const building = this.constructionManager.placedBuildings.concat(this.constructionManager.buildingsUnderConstruction)
            .find(b => b.model.uuid === buildingId);

        if (building && building.model) {
            this.selectedObjects = [building.model];
            this.renderer.setSelectedObjects(this.selectedObjects);
            this.uiManager.displaySelectedBuildingInfo(building.model); // UIManager needs to handle this

            // Move camera to focus on the building
            const buildingPosition = building.model.position;
            const offset = this.camera.position.clone().sub(this.controls.target);
            this.controls.target.copy(buildingPosition);
            this.camera.position.copy(buildingPosition).add(offset);
            this.controls.update();
        } else {
            console.warn(`Game: Building with ID ${buildingId} not found or has no model.`);
        }
    }

    start() {
        this.animate();
        // Ensure UI is correctly sized after all initializations
        this.handleResize();
    }

    animate() {
        requestAnimationFrame(() => this.animate()); // Arrow function to keep 'this' context

        const deltaTime = this.clock.getDelta();

        this.controls.update(); // Update orbit controls
        this.constructionManager.update(deltaTime); // Update construction manager (e.g., placement indicator)
        this.serfManager.update(deltaTime, this.constructionManager.placedBuildings); // Update serfs

        // UIManager might have animations or time-based updates too, if any.
        // this.uiManager.update(deltaTime); 

        this.renderer.render(); // Renderer handles the composer and actual rendering
    }
}

export default Game;
