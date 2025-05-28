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
import Task from '../core/tasks/Task.js'; // Added import for Task
import { TASK_STATUS } from '../core/tasks/Task.js'; // Added import for TASK_STATUS

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
import ReturnToJobBuildingTask from '../core/tasks/ReturnToJobBuildingTask.js'; // Import the new task

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
    constructor(id, x, y, type, scene, mapManager, parentGroup, game, resourceFlowManager) { // Added resourceFlowManager parameter
        super(id, x, y, 'serf', scene, mapManager); // this.model is initially null from Unit constructor
        this.serfType = type;
        this.task = 'idle';
        this.taskDetails = {};
        this.inventory = {};
        this.currentTask = null; // Added currentTask property
        this.plantedSaplingsCount = 0; // Initialize for all serfs

        this.mapManager = mapManager;
        this.game = game;
        this.resourceFlowManager = resourceFlowManager; // Store ResourceFlowManager reference for Quick Win #3
        
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
        // Ensure the CONSTRUCTING_BUILDING state is correctly mapped
        if (!this.states[SERF_ACTION_STATES.CONSTRUCTING_BUILDING]) {
            console.error(`Serf ${this.id}: CONSTRUCTING_BUILDING state not initialized!`);
            // Fallback, though it should be present from the list above
            this.states[SERF_ACTION_STATES.CONSTRUCTING_BUILDING] = new ConstructingBuildingState(); 
        }

        // Removed Forester-specific initialization of plantedSaplingsCount as it's now done above for all serfs.
        // if (this.serfType === SERF_PROFESSIONS.FORESTER) {
        //     this.plantedSaplingsCount = 0; 
        //     this.maxPlantedSaplings = FORESTER_MAX_PLANTED_SAPLINGS_INITIAL;
        // }

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

    // Add a method to set profession and reset relevant counters
    setProfession(newProfession, jobBuilding = null) {
        let professionChanged = false;
        if (this.serfType !== newProfession) {
            professionChanged = true;
            console.log(`Serf ${this.id} changing profession from ${this.serfType} to ${newProfession}`);
            this.serfType = newProfession;
        }

        this.jobBuilding = jobBuilding; // Update the associated job building
        this.plantedSaplingsCount = 0;  // Reset sapling count on any job assignment change

        if (this.serfType === SERF_PROFESSIONS.FORESTER) {
            if (this.jobBuilding && this.jobBuilding.buildingTypeData && typeof this.jobBuilding.buildingTypeData.maxSaplingsToPlantPerForester === 'number') {
                this.maxPlantedSaplings = this.jobBuilding.buildingTypeData.maxSaplingsToPlantPerForester;
            } else {
                // Default for Forester if no specific hut data or no hut assigned
                this.maxPlantedSaplings = FORESTER_MAX_PLANTED_SAPLINGS_INITIAL;
            }
        } else {
            this.maxPlantedSaplings = 0; // Non-foresters don't have this limit
        }
        
        // Potentially update model or other profession-specific attributes here
        // For now, we assume model changes are handled elsewhere or not needed for this scope.
        
        // If profession actually changed, re-evaluate task
        if (professionChanged) {
            if (this.currentTask && !this.currentTask.canBeExecutedBy(this)) {
                console.warn(`Serf ${this.id} changed profession to ${newProfession}. Current task ${this.currentTask.id} (${this.currentTask.constructor.name}) is no longer valid. Clearing task and setting to IDLE.`);
                if (this.currentTask.status === TASK_STATUS.ACTIVE || this.currentTask.status === TASK_STATUS.PENDING) {
                    this.currentTask.handleOutcome(this, 'cancelled_job_change');
                }
                this.currentTask = null;
                this.changeState(SERF_ACTION_STATES.IDLE);
            } else if (!this.currentTask) { // If no task, go idle to pick up new profession tasks
                this.changeState(SERF_ACTION_STATES.IDLE);
            }
        } else if (!this.currentTask && this.currentState.name !== SERF_ACTION_STATES.IDLE) {
            // If profession didn't change, but serf has a new jobBuilding context and no task, ensure it can re-evaluate from IDLE
            // This might be useful if job assignment itself should make the serf re-evaluate its IDLE state.
             this.changeState(SERF_ACTION_STATES.IDLE);
        }
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
        this.changeState(SERF_ACTION_STATES.IDLE); // Go idle to re-evaluate the simple task string

        // The old logic for finding assignedBuilding, constructionSite, targetTile based on 'details'
        // is removed here. If needed for string-based tasks, it would have to be re-added
        // or (preferably) those string tasks converted to proper Task objects.
        // For this subtask, we assume SerfManager will provide necessary context via Task objects.
    }

    assignTask(task) {
        if (!(task instanceof Task)) {
            console.error(`Serf ${this.id} (${this.serfType}): assignTask called with invalid task object.`, task);
            // Ensure currentTask is cleared and serf goes idle if the new task is invalid.
            if (this.currentTask && (this.currentTask.status === TASK_STATUS.ACTIVE || this.currentTask.status === TASK_STATUS.PENDING)) {
                console.warn(`Serf ${this.id} (${this.serfType}): Invalid task assignment, cancelling existing task ${this.currentTask.id} (${this.currentTask.constructor.name})`);
                this.currentTask.handleOutcome(this, 'cancelled_invalid_new_task');
            }
            this.currentTask = null;
            this.changeState(SERF_ACTION_STATES.IDLE);
            return;
        }

        // If there's an existing task, and it's different from the new one, cancel the old one.
        if (this.currentTask && this.currentTask !== task) {
            if (this.currentTask.status === TASK_STATUS.ACTIVE || this.currentTask.status === TASK_STATUS.PENDING) {
                console.log(`Serf ${this.id} (${this.serfType}): New task ${task.constructor.name} (ID: ${task.id}) assigned, cancelling previous task ${this.currentTask.id} (${this.currentTask.constructor.name}, Status: ${this.currentTask.status})`);
                this.currentTask.handleOutcome(this, 'cancelled_new_task'); // Task's onCancel should handle state changes
            }
        }

        this.currentTask = task;
        console.log(`Serf ${this.id} (${this.serfType}) assigned task: ${task.constructor.name} (ID: ${task.id}, Status: ${task.status})`);

        if (this.currentTask.status === TASK_STATUS.PENDING) {
            this.currentTask.onAssign(this); // This should set the task status to ACTIVE and potentially change serf state
        } else {
            console.warn(`Serf ${this.id} (${this.serfType}): Assigned task ${task.id} that is not in PENDING state. Current status: ${task.status}. The task's onAssign method will not be called again unless the task logic handles this.`);
            // If a task is re-assigned (e.g. from PENDING to ACTIVE by an external manager, then assigned here),
            // and it's already ACTIVE and meant for this serf, this is okay.
            // The main concern is if onAssign was missed.
            // If the task is active and assigned to another serf, that's an issue SerfManager should prevent.
        }

        // If the task's onAssign didn't change the state, and the serf is IDLE,
        // it might need a nudge or the task itself will guide it in its update cycle.
        // For now, we rely on onAssign to correctly set the serf's state.
        // If still idle and task is active, it implies the task is waiting for conditions the serf will check in IdleState.
        if (this.currentState.name === SERF_ACTION_STATES.IDLE && this.currentTask && this.currentTask.status === TASK_STATUS.ACTIVE) {
            // console.log(`Serf ${this.id} is IDLE after task assignment, task ${this.currentTask.id} is ACTIVE. Task should guide next action.`);
            // The IdleState's execute method should now pick up the active task.
        } else if (this.currentTask && this.currentTask.status !== TASK_STATUS.ACTIVE && this.currentState.name !== SERF_ACTION_STATES.IDLE) {
            // If task assignment didn't make it active and serf is not idle, force idle to re-evaluate.
            // This case should ideally be handled by onAssign setting the correct state or the task itself failing.
            // console.warn(`Serf ${this.id} (${this.serfType}): Task ${task.id} not ACTIVE after onAssign, and serf not IDLE. Forcing IDLE.`);
            // this.changeState(SERF_ACTION_STATES.IDLE); // This might be too aggressive, let task lifecycle manage failures.
        }
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
        
        // Record movement for trail visualization
        if (this.resourceFlowManager) {
            const currentPosition = this.model.position.clone();
            const carriedResources = Object.keys(this.inventory).filter(type => this.inventory[type] > 0);
            this.resourceFlowManager.recordSerfMovement(this.id, currentPosition, carriedResources);
        }
        
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

        // If a serf becomes IDLE and has a currentTask that is COMPLETED, FAILED, or CANCELLED,
        // clear it so it can pick up new tasks or truly be idle.
        if (this.currentState.name === SERF_ACTION_STATES.IDLE && this.currentTask) {
            if (this.currentTask.status === TASK_STATUS.COMPLETED || 
                this.currentTask.status === TASK_STATUS.FAILED ||
                this.currentTask.status === TASK_STATUS.CANCELLED) { // Added CANCELLED
                console.log(`Serf ${this.id} is IDLE and current task ${this.currentTask.id} (${this.currentTask.constructor.name}) is ${this.currentTask.status}. Clearing task.`);
                if (typeof this.currentTask.onCleanUp === 'function') { // Safety check for onCleanUp
                    this.currentTask.onCleanUp(this); 
                }
                this.currentTask = null;
            }
        }
    }

    returnToJobBuilding() {
        if (this.jobBuilding) {
            console.log(`Serf ${this.id} (${this.serfType}) is returning to its job building: ${this.jobBuilding.name} at (${this.jobBuilding.gridX}, ${this.jobBuilding.gridZ}).`);
            const returnTask = new ReturnToJobBuildingTask(this.jobBuilding);
            this.assignTask(returnTask);
        } else {
            console.warn(`Serf ${this.id} (${this.serfType}) tried to return to job building, but has no jobBuilding assigned.`);
            // If no job building, just go idle or handle as appropriate
            if (this.currentState.name !== SERF_ACTION_STATES.IDLE) {
                this.changeState(SERF_ACTION_STATES.IDLE);
            }
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