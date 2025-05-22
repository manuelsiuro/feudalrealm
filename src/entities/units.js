import * as THREE from 'three';
// import * as Resources from './resources.js'; // No longer needed here
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TILE_SIZE } from '../config/mapConstants.js'; // Corrected import path for TILE_SIZE
import resourceManager from '../core/resourceManager.js'; // Import resourceManager
import { RESOURCE_TYPES } from '../config/resourceTypes.js';
import { SERF_ACTION_STATES } from '../config/serfActionStates.js';
import { MAX_SERF_INVENTORY_CAPACITY, DEFAULT_DROPOFF_POINT, BUILDER_WORK_INTERVAL, FORESTER_PLANTING_TIME, FORESTER_SAPLING_UPGRADE_COST } from '../config/unitConstants.js';
import { SERF_PROFESSIONS } from '../config/serfProfessions.js';
import { FORESTER_MAX_PLANTED_SAPLINGS_INITIAL } from '../config/unitConstants.js';

// Import all Serf State Classes
import IdleState from './serf_states/IdleState.js';
import MovingToTargetState from './serf_states/MovingToTargetState.js';
import SearchingForResourceState from './serf_states/SearchingForResourceState.js';
import MovingToResourceNodeState from './serf_states/MovingToResourceNodeState.js';
import GatheringResourceState from './serf_states/GatheringResourceState.js';
import MovingToDepositBuildingState from './serf_states/MovingToDepositBuildingState.js';
import DepositingResourceInBuildingState from './serf_states/DepositingResourceInBuildingState.js';
import WorkingAtBuildingState from './serf_states/WorkingAtBuildingState.js';
import PerformingTaskState from './serf_states/PerformingTaskState.js';
import ReturningToDropoffState from './serf_states/ReturningToDropoffState.js';
import MovingToPickupLocationState from './serf_states/MovingToPickupLocationState.js';
import PickingUpResourceState from './serf_states/PickingUpResourceState.js';
import MovingToResourceDropoffState from './serf_states/MovingToResourceDropoffState.js';
import DroppingOffResourceState from './serf_states/DroppingOffResourceState.js';
import PlantingSaplingState from './serf_states/PlantingSaplingState.js';
import FishingState from './serf_states/FishingState.js';
import RaisingPigsState from './serf_states/RaisingPigsState.js';
import FarmingPlantingState from './serf_states/FarmingPlantingState.js';
import FarmingTendingState from './serf_states/FarmingTendingState.js';
import FarmingHarvestingState from './serf_states/FarmingHarvestingState.js';
import ProspectingState from './serf_states/ProspectingState.js';
import ConstructingBuildingState from './serf_states/ConstructingBuildingState.js';
import MovingToTargetTileState from './serf_states/MovingToTargetTileState.js';
import {
    createBaseSerf,
    SERF_MODEL_CREATORS
} from './serfModels.js';

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
    constructor(id, x, y, type, scene, mapManager, parentGroup, game) { // Added parentGroup and game
        super(id, x, y, 'serf', scene, mapManager); // this.model is initially null from Unit constructor
        this.serfType = type;
        this.task = 'idle';
        this.taskDetails = {};
        this.inventory = {};
        this.currentTask = null; // Added currentTask property

        this.mapManager = mapManager;
        this.game = game;
        
        this.targetNode = null; // General target for movement
        this.taskTimer = 0; // General purpose timer for states
        this.initialTaskAssignedByManager = false;

        this.path = null; // Path for movement
        this.pathIndex = 0; // Current index in the path
        this.speed = 0.75; // Tiles per second
        this.maxInventoryCapacity = MAX_SERF_INVENTORY_CAPACITY;
        this.dropOffPoint = DEFAULT_DROPOFF_POINT; // Default {x,y}
        this.parentGroup = parentGroup; // THREE.Group for serf models

        // State Machine Initialization
        this.states = {
            [SERF_ACTION_STATES.IDLE]: new IdleState(),
            [SERF_ACTION_STATES.MOVING_TO_TARGET]: new MovingToTargetState(),
            [SERF_ACTION_STATES.SEARCHING_FOR_RESOURCE_ON_MAP]: new SearchingForResourceState(),
            [SERF_ACTION_STATES.MOVING_TO_RESOURCE_NODE]: new MovingToResourceNodeState(),
            [SERF_ACTION_STATES.GATHERING_RESOURCE_FROM_NODE]: new GatheringResourceState(),
            [SERF_ACTION_STATES.MOVING_TO_DEPOSIT_BUILDING]: new MovingToDepositBuildingState(),
            [SERF_ACTION_STATES.DEPOSITING_RESOURCE_IN_BUILDING]: new DepositingResourceInBuildingState(),
            [SERF_ACTION_STATES.WORKING_AT_BUILDING]: new WorkingAtBuildingState(),
            [SERF_ACTION_STATES.PERFORMING_TASK]: new PerformingTaskState(),
            [SERF_ACTION_STATES.RETURNING_TO_DROPOFF]: new ReturningToDropoffState(),
            [SERF_ACTION_STATES.MOVING_TO_PICKUP_LOCATION]: new MovingToPickupLocationState(),
            [SERF_ACTION_STATES.PICKING_UP_RESOURCE]: new PickingUpResourceState(),
            [SERF_ACTION_STATES.MOVING_TO_RESOURCE_DROPOFF]: new MovingToResourceDropoffState(),
            [SERF_ACTION_STATES.DROPPING_OFF_RESOURCE]: new DroppingOffResourceState(),
            [SERF_ACTION_STATES.PLANTING_SAPLING]: new PlantingSaplingState(),
            [SERF_ACTION_STATES.FISHING]: new FishingState(),
            [SERF_ACTION_STATES.RAISING_PIGS]: new RaisingPigsState(),
            [SERF_ACTION_STATES.FARMING_PLANTING]: new FarmingPlantingState(),
            [SERF_ACTION_STATES.FARMING_TENDING]: new FarmingTendingState(),
            [SERF_ACTION_STATES.FARMING_HARVESTING]: new FarmingHarvestingState(),
            [SERF_ACTION_STATES.PROSPECTING]: new ProspectingState(),
            [SERF_ACTION_STATES.CONSTRUCTING_BUILDING]: new ConstructingBuildingState(),
            [SERF_ACTION_STATES.MOVING_TO_TARGET_TILE]: new MovingToTargetTileState(),
        };
        
        this.state = SERF_ACTION_STATES.IDLE; 
        this.currentState = this.states[SERF_ACTION_STATES.IDLE];
        // this.currentState.enter(this); // SerfManager or direct task assignment will call enter on initial state.

        if (this.serfType === SERF_PROFESSIONS.FORESTER) {
            this.plantedSaplingsCount = 0;
            this.maxPlantedSaplings = FORESTER_MAX_PLANTED_SAPLINGS_INITIAL;
        }

        let modelCreator;
        const serfTypeLower = this.serfType ? String(this.serfType).toLowerCase() : 'idle';

        // Use the imported SERF_MODEL_CREATORS map
        const creatorFunctionName = Object.keys(SERF_MODEL_CREATORS).find(key => key.toLowerCase() === serfTypeLower);
        if (creatorFunctionName) {
            modelCreator = SERF_MODEL_CREATORS[creatorFunctionName];
        } else {
            if (serfTypeLower !== 'idle') {
                console.warn(`Serf ${this.id}: Unrecognized serfType '''${this.serfType}''', defaulting to createBaseSerf.`);
            }
            modelCreator = createBaseSerf; // Fallback to createBaseSerf from serfModels.js
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

        // Add model to the provided parentGroup instead of directly to the scene
        if (this.parentGroup) {
            if (this.model) {
                this.parentGroup.add(this.model);
                // Add a userData marker to the model for easier identification during raycasting
                this.model.userData.serfInstance = this; 
            } else {
                console.error(`Serf ${this.id} (${this.serfType}): parentGroup provided, but model is unexpectedly null/undefined before adding to group.`);
            }
        } else if (this.scene) { // Fallback to scene if parentGroup not provided (should not happen with SerfManager update)
            console.warn(`Serf ${this.id} (${this.serfType}): parentGroup not provided. Adding model directly to scene as a fallback.`);
            if (this.model) {
                 this.scene.add(this.model);
                 this.model.userData.serfInstance = this; 
            } else {
                console.error(`Serf ${this.id} (${this.serfType}): Scene provided (fallback), but model is unexpectedly null/undefined before adding to scene.`);
            }
        } else {
            console.warn(`Serf ${this.id} (${this.serfType}): Neither parentGroup nor scene object provided during construction. Model will not be added to any group/scene initially.`);
        }

        console.log(`Serf ${this.id} created at (${x},${y}), type: ${type}. Model assigned: ${!!this.model}. Model name: ${this.model ? this.model.name : 'N/A'}`);
    }

    setTask(taskType, details = {}) {
        // console.warn(`Serf.setTask (\${this.id}) called with type: \${taskType}. This method is being phased out by direct task object assignment.`);
        // this.task = taskType; // The 'task' string might still be used by some UI or simple logic
        // this.taskDetails = details; // Store for compatibility if needed
        
        // If a full Task object is somehow passed here, handle it (unlikely given current SerfManager)
        // For this refactor, currentTask is expected to be set directly by SerfManager.
        // This method is now primarily for simple/legacy task string setting.
        if (taskType instanceof Task) { // Task is from core/tasks/Task.js
            // This case should ideally not be hit if SerfManager assigns currentTask directly
            console.warn(`Serf.setTask called with a Task object. SerfManager should assign to serf.currentTask directly.`);
            this.currentTask = taskType;
            if (this.currentTask.status === TASK_STATUS.PENDING) { 
                 this.currentTask.onAssign(this); 
            }
            // The task's onAssign should guide the initial state.
            // If not, default to IDLE to re-evaluate.
            // Ensure state is IDLE if task isn't immediately making serf active.
            if (this.currentState.name !== SERF_ACTION_STATES.IDLE && this.currentTask.status !== TASK_STATUS.ACTIVE) {
                 this.changeState(SERF_ACTION_STATES.IDLE);
            }
            return;
        }

        // Minimal handling for old string-based tasks if necessary
        this.task = taskType; 
        this.taskDetails = details;
        this.currentTask = null; // Clear any complex task if a simple string task is set.
        this.changeState(SERF_ACTION_STATES.IDLE); // Go idle to re-evaluate the simple task string.

        // The old logic for finding assignedBuilding, constructionSite, targetTile based on 'details'
        // is removed here. If needed for string-based tasks, it would have to be re-added
        // or (preferably) those string tasks converted to proper Task objects.
        // For this subtask, we assume SerfManager will provide necessary context via Task objects.
    }

    changeState(newStateKey) {
            if (buildingModel && buildingModel.userData && buildingModel.userData.buildingInstance) {
                this.assignedBuilding = buildingModel.userData.buildingInstance;
                console.log(`${this.id} (${this.serfType}) associated with building: ${this.assignedBuilding.info.name}`);
            } else {
                console.warn(`${this.id} (${this.serfType}) could not find or associate with buildingId: ${details.buildingId}`);
            }
        }

        if (taskType === 'construct_building' && details.constructionSiteId) {
            const siteModel = this.scene.getObjectByProperty('uuid', details.constructionSiteId);
            if (siteModel && siteModel.userData && siteModel.userData.buildingInstance) {
                this.assignedConstructionSite = siteModel.userData.buildingInstance;
                console.log(`${this.id} (${this.serfType}) assigned to construct: ${this.assignedConstructionSite.info.name} (ID: ${details.constructionSiteId})`);
                if (details.targetLocation) {
                    this.targetNode = { 
                        x: details.targetLocation.x, 
                        y: details.targetLocation.y, 
                        constructionSiteId: details.constructionSiteId,
                        type: 'construction_site_target'
                    };
                    this.changeState(SERF_ACTION_STATES.MOVING_TO_TARGET);
                    console.log(`${this.id} (${this.serfType}) will move to construction site at (${details.targetLocation.x}, ${details.targetLocation.y})`);
                } else {
                    console.warn(`${this.id} (${this.serfType}) construct_building task for ${details.constructionSiteId} but no targetLocation provided. Cannot initiate move.`);
                    this.task = 'idle';
                    this.changeState(SERF_ACTION_STATES.IDLE);
                }
            } else {
                console.error(`${this.id} (${this.serfType}) could not find construction site model or buildingInstance for ID: ${details.constructionSiteId}. Going IDLE.`);
                this.task = 'idle';
                this.changeState(SERF_ACTION_STATES.IDLE);
            }
        } else if (details.constructionSiteId) {
             console.log(`${this.id} (${this.serfType}) task involves construction site: ${details.constructionSiteId} but task is ${taskType}`);
             if (details.targetLocation) { 
                 this.targetNode = { 
                    x: details.targetLocation.x, 
                    y: details.targetLocation.y, 
                    constructionSiteId: details.constructionSiteId,
                    type: 'construction_site' 
                };
            }
        }

        if (details.targetTile) {
            this.targetTile = details.targetTile;
            console.log(`${this.id} (${this.serfType}) task involves target tile: (${details.targetTile.x}, ${details.targetTile.y})`);
            // The IdleState will handle transitioning to MOVING_TO_TARGET_TILE if this task is set
        }
        // Initial state is already IDLE, the IdleState's execute method will then transition based on the task.
    }

    changeState(newStateKey) {
        if (this.states[newStateKey]) {
            if (this.currentState) {
                this.currentState.exit(this);
            }
            this.state = newStateKey; // Update the string state for logging or simple checks
            this.currentState = this.states[newStateKey];
            this.currentState.enter(this);
        } else {
            console.error(`${this.id} (${this.serfType}): Tried to change to unknown state: ${newStateKey}`);
        }
    }

    setDropOffPoint(point) {
        this.dropOffPoint = point;
        console.log(`Serf ${this.id} drop-off point set to: ${JSON.stringify(this.dropOffPoint)}`);
    }

    _findTaskTarget() {
        if (!this.taskDetails || !this.taskDetails.resourceType) {
            console.log(`${this.id} (${this.serfType}) cannot find resource target: resourceType not specified in taskDetails.`);
            this.changeState(SERF_ACTION_STATES.IDLE);
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
            this.targetResourceNode = bestTarget;
            this.path = this.mapManager.findPath({ x: this.x, y: this.y }, { x: this.targetResourceNode.x, y: this.targetResourceNode.y });
            if (this.path && this.path.length > 0) {
                this.pathIndex = 0;
                this.changeState(SERF_ACTION_STATES.MOVING_TO_RESOURCE_NODE);
                console.log(`${this.id} (${this.serfType}) path found to ${resourceTypeToFind} at (${this.targetResourceNode.x}, ${this.targetResourceNode.y}). Moving.`);
                return true;
            } else {
                console.log(`${this.id} (${this.serfType}) could not find a path to ${resourceTypeToFind} at (${this.targetResourceNode.x}, ${this.targetResourceNode.y}). Going idle.`);
                this.targetResourceNode = null;
                this.changeState(SERF_ACTION_STATES.IDLE);
                return false;
            }
        } else {
            console.log(`${this.id} (${this.serfType}) could not find any available ${resourceTypeToFind} on map. Going idle.`);
            this.changeState(SERF_ACTION_STATES.IDLE);
            return false;
        }
    }

    _moveAlongPath(deltaTime) {
        if (!this.model) {
            console.error(`Serf ${this.id} (${this.serfType}): ABORTING MOVEMENT - this.model is null in _moveAlongPath. State: ${this.state}, Task: ${this.task}`);
            this.changeState(SERF_ACTION_STATES.IDLE);
            this.path = null;
            this.task = 'idle';
            return true;
        }
        if (!this.path || this.pathIndex >= this.path.length) {
            return true;
        }
        const targetWaypoint = this.path[this.pathIndex];
        const targetWorldX = (targetWaypoint.x - (this.mapManager.width - 1) / 2) * TILE_SIZE;
        const targetWorldZ = (targetWaypoint.y - (this.mapManager.height - 1) / 2) * TILE_SIZE;
        const directionX = targetWorldX - this.model.position.x;
        const directionZ = targetWorldZ - this.model.position.z;
        const distanceToWaypoint = Math.sqrt(directionX * directionX + directionZ * directionZ);
        const moveDistance = this.speed * TILE_SIZE * deltaTime;
        if (distanceToWaypoint <= moveDistance) {
            this.model.position.x = targetWorldX;
            this.model.position.z = targetWorldZ;
            this.x = targetWaypoint.x;
            this.y = targetWaypoint.y;
            this.pathIndex++;
            if (this.pathIndex >= this.path.length) {
                return true;
            }
        } else {
            const normDirectionX = directionX / distanceToWaypoint;
            const normDirectionZ = directionZ / distanceToWaypoint;
            this.model.position.x += normDirectionX * moveDistance;
            this.model.position.z += normDirectionZ * moveDistance;
        }
        return false;
    }

    _initiateReturnToDropOff() {
        console.log(`${this.id} inventory full or task complete. Returning to drop-off: ${JSON.stringify(this.dropOffPoint)}.`);
        this.path = this.mapManager.findPath({ x: this.x, y: this.y }, this.dropOffPoint);
        this.pathIndex = 0;
        if (!this.path) {
            console.error(`${this.id} cannot find path to drop-off point! Going idle.`);
            this.changeState(SERF_ACTION_STATES.IDLE);
        } else {
            this.changeState(SERF_ACTION_STATES.RETURNING_TO_DROPOFF);
            console.log(`${this.id} path found to drop-off. Length: ${this.path.length}.`);
        }
    }

    // All _handle<StateName>State methods are removed here.
    // Their logic is now in the respective state classes.

    update(deltaTime) {
        super.update(deltaTime); // Base unit update

        if (this.currentState) {
            this.currentState.execute(this, deltaTime);
        }
    }

    upgradeMaxPlantedSaplings(amount) {
        if (this.serfType === SERF_PROFESSIONS.FORESTER) {
            // Check if the game instance and resourceManager are available
            if (this.game && this.game.resourceManager) {
                // Check for sufficient resources
                let canAfford = true;
                for (const resourceType in FORESTER_SAPLING_UPGRADE_COST) {
                    if (this.game.resourceManager.getResourceCount(resourceType) < FORESTER_SAPLING_UPGRADE_COST[resourceType]) {
                        canAfford = false;
                        console.warn(`Forester ${this.id} cannot afford sapling upgrade. Missing ${resourceType}.`);
                        // Optionally, provide feedback to the UI or user here
                        break;
                    }
                }

                if (canAfford) {
                    // Deduct resources
                    for (const resourceType in FORESTER_SAPLING_UPGRADE_COST) {
                        this.game.resourceManager.removeResource(resourceType, FORESTER_SAPLING_UPGRADE_COST[resourceType]);
                    }
                    this.maxPlantedSaplings += amount;
                    console.log(`Forester ${this.id} upgraded maxPlantedSaplings to ${this.maxPlantedSaplings}. Resources deducted.`);
                } else {
                    // Handle the case where the player cannot afford the upgrade (e.g., UI message)
                    console.log(`Forester ${this.id}: Not enough resources to upgrade maxPlantedSaplings.`);
                    // Potentially trigger a UI notification
                }
            } else {
                console.error(`Forester ${this.id} cannot upgrade maxPlantedSaplings: game instance or resourceManager not found.`);
            }
        } else {
            console.warn(`Attempted to upgrade maxPlantedSaplings for non-Forester serf ${this.id}`);
        }
    }
}