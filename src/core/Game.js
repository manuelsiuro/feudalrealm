import * as THREE from 'three';

import { GameMap } from './MapManager.js';
import { TILE_SIZE, TERRAIN_COLORS, TERRAIN_TYPES } from '../config/mapConstants.js'; // Corrected import path, Added TERRAIN_COLORS, TERRAIN_TYPES
import resourceManager from './resourceManager.js';
import ConstructionManager from './constructionManager.js';
import SerfManager from './serfManager.js';
import { NatureManager } from './natureManager.js'; // Added import
import Renderer from './Renderer.js';
import UIManager from '../ui/UIManager.js';
import { RESOURCE_TYPES } from '../config/resourceTypes.js';
import InputManager from './InputManager.js'; // Added
import SelectionManager from './SelectionManager.js'; // Added

const MAP_WIDTH = 15;
const MAP_HEIGHT = 15;

class Game {
    constructor() {
        this.renderer = null;
        this.uiManager = null;
        this.gameMap = null;
        this.constructionManager = null;
        this.serfManager = null;
        this.natureManager = null; // Added property
        this.resourceManager = resourceManager; // Direct assignment

        this.scene = null;
        this.camera = null;
        this.controls = null;
        this.clock = new THREE.Clock();

        // this.selectedObjects = []; // Replaced by SelectionManager
        this.inputManager = null; // Added
        this.selectionManager = null; // Added

        // DOM elements that Game needs to interact with or pass to UIManager
        this.gameCanvas = document.getElementById('game-canvas');

        // Bind event handlers to the game instance
        this.handleResize = this.handleResize.bind(this);
        // Old event handlers like handleMouseMove, handleCanvasClick, handleKeyDown are removed
    }

    init() {
        // 1. Initialize Renderer
        this.renderer = new Renderer(this.gameCanvas);
        this.scene = this.renderer.scene;
        this.camera = this.renderer.camera;
        this.controls = this.renderer.controls;

        // Initialize InputManager
        this.inputManager = new InputManager(this.gameCanvas);

        // Initialize SelectionManager
        this.selectionManager = new SelectionManager(this.scene, this.camera);


        // 2. Initialize GameMap
        this.gameMap = new GameMap(MAP_WIDTH, MAP_HEIGHT);
        this.renderer.gameElementsGroup.add(this.gameMap.tileMeshes);
        console.log('GameMap created and added to scene via Game.js.');

        // Initialize NatureManager
        this.natureManager = new NatureManager(this.gameMap, this.scene);
        this.natureManager.initializeNaturalResources();
        this.renderer.gameElementsGroup.add(this.natureManager.resourceNodesGroup);
        console.log('NatureManager initialized and its resources added to scene.');

        // Create and add the ground plane
        const groundGeometry = new THREE.PlaneGeometry(MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
        const groundMaterial = new THREE.MeshBasicMaterial({ color: TERRAIN_COLORS[TERRAIN_TYPES.GRASSLAND] });
        const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
        groundPlane.rotation.x = -Math.PI / 2;
        groundPlane.position.y = -0.05;
        this.renderer.gameElementsGroup.add(groundPlane);
        console.log('Ground plane created and added to scene.');

        // 3. Initialize ConstructionManager
        // ConstructionManager will be given SerfManager instance later to avoid circular dependency at construction
        this.constructionManager = new ConstructionManager(this.scene, this.gameMap, this.renderer.gameElementsGroup);
        // setupInitialStructures might rely on SerfManager if it spawns serfs or assigns tasks.
        // For now, assuming it only places buildings. If it needs SerfManager, this order is problematic.
        // Let's assume setupInitialStructures is okay for now.
        // this.constructionManager.setupInitialStructures(); // Moved after SerfManager is set on ConstructionManager

        // 4. Initialize SerfManager
        this.serfManager = new SerfManager(this.scene, this.gameMap, this.constructionManager, this.renderer.gameElementsGroup, this);

        // Now, provide SerfManager to ConstructionManager
        this.constructionManager.setSerfManager(this.serfManager); // New method call
        this.constructionManager.setupInitialStructures(); // Call after SerfManager is set, if it needs it.


        // Configure SelectionManager with selectable groups
        const buildingsGroup = this.renderer.gameElementsGroup.getObjectByName("GameBuildings");
        const serfsGroup = this.serfManager.serfVisualsGroup;
        this.selectionManager.setSelectableGroups(buildingsGroup, serfsGroup);

        // 5. Initialize UIManager
        this.uiManager = new UIManager(
            document.body,
            this.resourceManager,
            this.constructionManager,
            this.serfManager,
            this.selectionManager // NEW: Pass the selectionManager instance
        );

        // Setup callback for when a serf is selected in the UI
        this.uiManager.setSerfSelectCallback((serfId) => {
            this.selectAndFocusSerf(serfId);
        });

        // Setup callback for when a building is selected in the UI
        this.uiManager.setBuildingSelectCallback((buildingModelId) => { // Changed from buildingId to buildingModelId for clarity
            this.selectAndFocusBuilding(buildingModelId);
        });
        
        // 6. Camera and Controls Setup
        this.setupCameraAndControls();

        // 7. Setup New Event Handlers using InputManager and SelectionManager
        this.setupNewEventHandlers(); // New method
        window.addEventListener('resize', this.handleResize, false); // Keep general resize

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

    setupNewEventHandlers() {
        const tempRaycaster = new THREE.Raycaster(); // For placement logic, Game still does this raycast

        this.inputManager.onClick((clickData) => {
            // Prevent click handling if a UI element was the target
            if (clickData.rawEvent.target.closest('.themed-panel') || clickData.rawEvent.target.closest('.ui-button')) {
                console.log("Game: Click on UI element ignored for game world interaction.");
                return;
            }

            if (this.constructionManager.isPlacing) {
                tempRaycaster.setFromCamera({ x: clickData.normalizedX, y: clickData.normalizedY }, this.camera);
                const intersectsPlacement = tempRaycaster.intersectObject(this.gameMap.tileMeshes, true);
                const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
                let placementPoint = new THREE.Vector3();

                if (intersectsPlacement.length > 0) {
                    placementPoint.copy(intersectsPlacement[0].point);
                } else {
                    tempRaycaster.ray.intersectPlane(groundPlane, placementPoint);
                }

                if (placementPoint) {
                    const success = this.constructionManager.confirmPlacement(placementPoint);
                    if (success) {
                        // Update selectable groups in SelectionManager if a new building was added
                        const buildingsGroup = this.renderer.gameElementsGroup.getObjectByName("GameBuildings");
                        const serfsGroup = this.serfManager.serfVisualsGroup;
                        this.selectionManager.setSelectableGroups(buildingsGroup, serfsGroup);
                    }
                    this.uiManager.updateBuildingButtons(); // Update UI buttons regardless of success
                }
            } else {
                this.selectionManager.handleSelectionClick({ x: clickData.normalizedX, y: clickData.normalizedY });
            }
        });

        this.inputManager.onMouseMove((moveData) => {
            if (this.constructionManager.isPlacing) {
                tempRaycaster.setFromCamera({ x: moveData.normalizedX, y: moveData.normalizedY }, this.camera);
                const intersects = tempRaycaster.intersectObject(this.gameMap.tileMeshes, true);
                const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
                let indicatorPoint = new THREE.Vector3();

                if (intersects.length > 0) {
                    indicatorPoint.copy(intersects[0].point);
                } else {
                    tempRaycaster.ray.intersectPlane(groundPlane, indicatorPoint);
                }
                if (indicatorPoint) {
                    this.constructionManager.updatePlacementIndicator(indicatorPoint);
                }
            }
        });

        this.inputManager.onKeyDown((event) => {
            if (event.key.toLowerCase() === 'escape') {
                if (this.constructionManager.isPlacing) {
                    this.constructionManager.cancelPlacement();
                    this.uiManager.updateBuildingButtons();
                } else {
                    this.selectionManager.clearSelection();
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
        });

        this.selectionManager.onSelectionChange((selectedEntity) => {
            if (selectedEntity && selectedEntity.model) {
                this.renderer.setSelectedObjects([selectedEntity.model]);
                this.focusOnEntity(selectedEntity); 
                // UIManager also subscribes to selectionManager.onSelectionChange directly now
            } else {
                this.renderer.setSelectedObjects([]);
                // UIManager handles hiding info panels
            }
        });
    }

    focusOnEntity(entity) {
        if (!entity || !entity.model) return;

        const entityPosition = entity.model.position.clone();
        // Maintain current camera distance/zoom, but change target
        const offset = this.camera.position.clone().sub(this.controls.target);
        this.controls.target.copy(entityPosition);
        this.camera.position.copy(entityPosition).add(offset);
        this.controls.update();
    }


    handleResize() {
        this.renderer.onWindowResize();
        this.uiManager.onWindowResize(); 
    }

    selectAndFocusSerf(serfId) {
        const serf = this.serfManager.getSerfById(serfId);
        if (serf) {
            this.selectionManager.setSelection(serf);
            // focusOnEntity will be called by the onSelectionChange callback if selection is successful
        } else {
            console.warn(`Game: Serf with ID ${serfId} not found.`);
            this.selectionManager.clearSelection(); // Clear selection if serf not found
        }
    }

    selectAndFocusBuilding(buildingModelId) { // Parameter is model UUID
        // Use the new constructionManager.getAllBuildings() method
        const allBuildings = this.constructionManager.getAllBuildings();
        const building = allBuildings.find(b => b.model && b.model.uuid === buildingModelId);

        if (building) {
            this.selectionManager.setSelection(building);
            // focusOnEntity will be called by the onSelectionChange callback
        } else {
            console.warn(`Game: Building with model ID ${buildingModelId} not found.`);
            this.selectionManager.clearSelection(); // Clear selection if building not found
        }
    }

    start() {
        this.animate();
        // Ensure UI is correctly sized after all initializations
        this.handleResize();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = this.clock.getDelta();

        // Update game components
        if (this.serfManager) {
            this.serfManager.update(deltaTime);
        }
        if (this.constructionManager) {
            this.constructionManager.update(deltaTime);
        }
        if (this.natureManager) { 
            this.natureManager.update(deltaTime);
        }

        this.controls.update(); 
        this.renderer.render();
    }
}

export default Game;
