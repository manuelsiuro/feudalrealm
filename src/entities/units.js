import * as THREE from 'three';
// import * as Resources from './resources.js'; // No longer needed here
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TILE_SIZE } from '../config/mapConstants.js'; // Corrected import path for TILE_SIZE
import resourceManager from '../core/resourceManager.js'; // Import resourceManager
import { RESOURCE_TYPES } from '../config/resourceTypes.js';
import { SERF_ACTION_STATES } from '../config/serfActionStates.js'; // Updated import
// import { COLORS } from '../config/colors.js'; // No longer needed here
import { MAX_SERF_INVENTORY_CAPACITY, DEFAULT_DROPOFF_POINT } from '../config/unitConstants.js';
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
    constructor(id, x, y, type, scene, mapManager, parentGroup) { // Added parentGroup
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
        this.parentGroup = parentGroup; // Store parentGroup

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

    _handleIdleState(deltaTime) {
        if (this.task === 'gather_resource_for_building' && this.assignedBuilding) {
            const resourceToDeposit = this.taskDetails.resourceType;
            const amountCarrying = this.inventory[resourceToDeposit] || 0;
            let totalInventoryAmount = Object.values(this.inventory).reduce((sum, val) => sum + val, 0);

            if (amountCarrying > 0) {
                // Serf has the specific resource to deposit. Prioritize depositing.
                console.log(`${this.id} (${this.serfType}) is IDLE, carrying ${amountCarrying} ${resourceToDeposit}. Preparing to move to deposit at ${this.assignedBuilding.info.name}.`);
                
                if (!this.assignedBuilding.getEntryPointGridPosition) {
                    console.error(`${this.id} (${this.serfType}) IDLE: assignedBuilding ${this.assignedBuilding.info.name} is missing getEntryPointGridPosition. Staying IDLE.`);
                    return; 
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
                }
            } else if (totalInventoryAmount < this.maxInventoryCapacity) {
                console.log(`${this.id} (${this.serfType}) is IDLE at ${this.assignedBuilding.info.name}, empty of ${resourceToDeposit} and has capacity. Starting SEARCHING_FOR_RESOURCE_ON_MAP for ${resourceToDeposit}`);
                this.state = SERF_ACTION_STATES.SEARCHING_FOR_RESOURCE_ON_MAP;
            } else {
                console.log(`${this.id} (${this.serfType}) is IDLE at ${this.assignedBuilding.info.name}. Inventory full or no specific resource to deposit. Waiting.`);
            }
        } else if (this.task === 'work_at_building' && this.taskDetails.buildingId) {
            const buildingModel = this.scene.getObjectByProperty('uuid', this.taskDetails.buildingId); 
            if (buildingModel) {
                let targetGridX, targetGridY; 

                if (buildingModel.userData && buildingModel.userData.buildingInstance) {
                    const buildingInstance = buildingModel.userData.buildingInstance;
                    const entryPointGrid = buildingInstance.getEntryPointGridPosition();
                    targetGridX = entryPointGrid.x;
                    targetGridY = entryPointGrid.z; 
                    console.log(`${this.id} (${this.serfType}) target for ${this.taskDetails.buildingName}: entry point (${targetGridX}, ${targetGridY}) from buildingInstance.`);
                } else {
                    targetGridX = Math.round(buildingModel.position.x / TILE_SIZE + (this.mapManager.width - 1) / 2);
                    targetGridY = Math.round(buildingModel.position.z / TILE_SIZE + (this.mapManager.height - 1) / 2);
                    console.warn(`${this.id} (${this.serfType}) could not get buildingInstance for ${this.taskDetails.buildingName}. Using model origin (${targetGridX}, ${targetGridY}) as target.`);
                }

                if (this.x === targetGridX && this.y === targetGridY) {
                    console.log(`${this.id} (${this.serfType}) is IDLE and already at ${this.taskDetails.buildingName}'s target/entry point. Transitioning to WORKING_AT_BUILDING.`);
                    this.state = SERF_ACTION_STATES.WORKING_AT_BUILDING;
                    this.taskTimer = 0;
                } else {
                    this.targetNode = { x: targetGridX, y: targetGridY, buildingId: this.taskDetails.buildingId, buildingName: this.taskDetails.buildingName };
                    this.path = this.mapManager.findPath({ x: this.x, y: this.y }, { x: targetGridX, y: targetGridY });
                    if (this.path && this.path.length > 0) {
                        this.pathIndex = 0;
                        this.state = SERF_ACTION_STATES.MOVING_TO_TARGET;
                        console.log(`${this.id} (${this.serfType}) path found to building ${this.taskDetails.buildingName} entry point (${targetGridX}, ${targetGridY}). Moving.`);
                    } else {
                        console.warn(`${this.id} (${this.serfType}) could not find path to building ${this.taskDetails.buildingName} entry point (${targetGridX}, ${targetGridY}). Serf at (${this.x},${this.y}). Going idle.`);
                        this.task = 'idle'; 
                    }
                }
            } else {
                console.error(`${this.id} (${this.serfType}) assigned to work at non-existent building ID ${this.taskDetails.buildingId}. Going idle.`);
                this.task = 'idle';
            }
        } else if (this.task === 'transport_resource' && this.taskDetails.sourceBuildingId) {
            // TODO: Extract Transporter IDLE logic to its own helper or integrate into a general transport handler
            const sourceBuilding = this.scene.getObjectByProperty('uuid', this.taskDetails.sourceBuildingId);
            if (sourceBuilding) {
                const targetGridX = Math.round(sourceBuilding.position.x / TILE_SIZE + (this.mapManager.width - 1) / 2);
                const targetGridY = Math.round(sourceBuilding.position.z / TILE_SIZE + (this.mapManager.height - 1) / 2);
                this.targetNode = { x: targetGridX, y: targetGridY, buildingId: this.taskDetails.sourceBuildingId, type: 'pickup' };
                this.path = this.mapManager.findPath({ x: this.x, y: this.y }, {x: targetGridX, y: targetGridY});
                if (this.path && this.path.length > 0) {
                    this.pathIndex = 0;
                    this.state = SERF_ACTION_STATES.MOVING_TO_PICKUP_LOCATION;
                    console.log(`${this.id} (${this.serfType}) path found to pickup location ${this.taskDetails.sourceBuildingName}. Moving.`);
                } else {
                    console.warn(`${this.id} (${this.serfType}) could not find path to pickup ${this.taskDetails.sourceBuildingName}. Going idle.`);
                    this.task = 'idle';
                }
            } else {
                console.error(`${this.id} (${this.serfType}) source building ${this.taskDetails.sourceBuildingId} not found. Going IDLE.`);
                this.task = 'idle';
            }
        } else if (this.task === 'mine') { 
            this._findTaskTarget(); 
        }
    }

    _handleSearchingForResourceOnMapState(deltaTime) {
        if (this.task === 'gather_resource_for_building') {
            this._findTaskTarget(); 
        } else {
            this.state = SERF_ACTION_STATES.IDLE; 
        }
    }

    _handleMovingToResourceNodeState(deltaTime) {
        if (this.targetResourceNode && this.path) {
            const arrived = this._moveAlongPath(deltaTime);
            if (arrived) {
                this.setPosition(this.targetResourceNode.x, this.targetResourceNode.y);
                this.path = null;
                this.pathIndex = 0;
                console.log(`${this.id} (${this.serfType}) arrived at resource node ${this.taskDetails.resourceType} at (${this.targetResourceNode.x}, ${this.targetResourceNode.y}).`);
                this.state = SERF_ACTION_STATES.GATHERING_RESOURCE_FROM_NODE;
                this.taskTimer = 0; 
            }
        } else {
            console.log(`${this.id} (${this.serfType}) in MOVING_TO_RESOURCE_NODE but no targetResourceNode or path. Reverting to IDLE.`);
            this.state = SERF_ACTION_STATES.IDLE;
            this.targetResourceNode = null;
        }
    }

    _handleGatheringResourceFromNodeState(deltaTime) {
        if (this.task === 'gather_resource_for_building' && this.targetResourceNode && this.targetResourceNode.resource && this.targetResourceNode.resource.amount > 0) {
            this.taskTimer += deltaTime;
            const gatheringDuration = 2.0; 

            if (this.taskTimer >= gatheringDuration) {
                this.taskTimer -= gatheringDuration;
                
                const gatheredAmount = 1; 
                const resourceType = this.taskDetails.resourceType;
                
                if (this.targetResourceNode.resource.amount >= gatheredAmount) {
                    this.targetResourceNode.resource.amount -= gatheredAmount; 
                    this.inventory[resourceType] = (this.inventory[resourceType] || 0) + gatheredAmount;
                    console.log(`${this.id} (${this.serfType}) gathered ${gatheredAmount} ${resourceType}. Inventory: ${this.inventory[resourceType]}. Resource left at node: ${this.targetResourceNode.resource.amount}`);

                    let currentInventoryAmount = Object.values(this.inventory).reduce((sum, val) => sum + val, 0);
                    if (currentInventoryAmount >= this.maxInventoryCapacity || this.targetResourceNode.resource.amount === 0) {
                        console.log(`${this.id} (${this.serfType}) inventory full or resource node depleted. Returning to deposit at ${this.assignedBuilding.info.name}.`);
                        this.state = SERF_ACTION_STATES.MOVING_TO_DEPOSIT_BUILDING;
                        this.targetResourceNode = null; 
                        
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
        } else { 
            console.log(`${this.id} (${this.serfType}) target resource node invalid or task changed. Deciding next action.`);
            let currentInventoryAmount = Object.values(this.inventory).reduce((sum, val) => sum + val, 0);
            if (currentInventoryAmount > 0 && this.assignedBuilding) {
                this.state = SERF_ACTION_STATES.MOVING_TO_DEPOSIT_BUILDING; 
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
                this.state = SERF_ACTION_STATES.SEARCHING_FOR_RESOURCE_ON_MAP; 
            } else {
                this.state = SERF_ACTION_STATES.IDLE;
            }
            this.targetResourceNode = null;
        }
    }

    _handleMovingToDepositBuildingState(deltaTime) {
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
    }

    _handleDepositingResourceInBuildingState(deltaTime) {
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
                }
            } else {
                console.log(`${this.id} (${this.serfType}) arrived at ${this.assignedBuilding.info.name} to deposit, but no ${resourceType} in inventory.`);
            }
            
            this.state = SERF_ACTION_STATES.IDLE; 
        } else {
            console.warn(`${this.id} (${this.serfType}) in DEPOSITING_RESOURCE_IN_BUILDING but task/assignedBuilding invalid. Going IDLE.`);
            this.state = SERF_ACTION_STATES.IDLE;
            this.task = 'idle';
        }
    }

    _handleMovingToTargetState(deltaTime) {
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
    }

    _handleWorkingAtBuildingState(deltaTime) {
        if (this.serfType === 'Woodcutter' && this.task === 'work_at_building') {
             console.warn(`Woodcutter ${this.id} in deprecated WORKING_AT_BUILDING state. Transitioning to IDLE to be reassigned.`);
             this.task = 'idle'; // Clear task to allow SerfManager to re-evaluate
             this.state = SERF_ACTION_STATES.IDLE;
             return;
        }

        if (this.task === 'work_at_building' && this.taskDetails.buildingId) {
            const buildingModel = this.scene.getObjectByProperty('uuid', this.taskDetails.buildingId);
            if (buildingModel && buildingModel.userData && buildingModel.userData.buildingInstance) {
                const buildingInstance = buildingModel.userData.buildingInstance;
                if (buildingInstance.info &&
                    buildingInstance.info.jobProfession === this.serfType &&
                    buildingInstance.info.producesResource && 
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
                        if (buildingInstance.getStock(resourceProduced) >= buildingInstance.maxStock) {
                            console.log(`${this.id} (${this.serfType}) [direct production] ${buildingInstance.info.name} is full of ${resourceProduced}. Going IDLE.`);
                            this.task = 'idle';
                            this.state = SERF_ACTION_STATES.IDLE;
                        }
                    }
                } else {
                    this.task = 'idle';
                    this.state = SERF_ACTION_STATES.IDLE;
                }
            } else {
                this.task = 'idle';
                this.state = SERF_ACTION_STATES.IDLE;
            }
        } else {
            this.task = 'idle';
            this.state = SERF_ACTION_STATES.IDLE;
        }
    }

    _handlePerformingTaskState(deltaTime) {
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
                        this._initiateReturnToDropOff(); 
                        this.targetResourceNode = null;
                    }
                } else {
                    this.state = SERF_ACTION_STATES.IDLE; 
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
    }

    _handleReturningToDropoffState(deltaTime) {
         if (this.path) {
            const arrived = this._moveAlongPath(deltaTime);
            if (arrived) {
                this.setPosition(this.dropOffPoint.x, this.dropOffPoint.y); 
                this.path = null;
                this.pathIndex = 0;
                console.log(`${this.id} (${this.serfType}) arrived at global drop-off point.`);
                
                for (const resourceType in this.inventory) {
                    if (this.inventory[resourceType] > 0) {
                        resourceManager.addResource(resourceType, this.inventory[resourceType]);
                        console.log(`${this.id} (${this.serfType}) deposited ${this.inventory[resourceType]} ${resourceType} to global resources.`);
                        delete this.inventory[resourceType];
                    }
                }
                this.inventory = {}; 
                this.state = SERF_ACTION_STATES.IDLE;
                this.task = 'idle'; 
                console.log(`${this.id} (${this.serfType}) finished global drop-off. Becoming IDLE.`);
            }
        } else {
            for (const resourceType in this.inventory) {
                if (this.inventory[resourceType] > 0) {
                    resourceManager.addResource(resourceType, this.inventory[resourceType]);
                }
            }
            this.inventory = {};
            this.state = SERF_ACTION_STATES.IDLE;
            this.task = 'idle';
        }
    }

    _handleMovingToPickupLocationState(deltaTime) {
        if (this.targetNode && this.path) {
            const arrived = this._moveAlongPath(deltaTime);
            if (arrived) {
                this.setPosition(this.targetNode.x, this.targetNode.y);
                this.path = null;
                this.pathIndex = 0;
                console.log(`${this.id} (${this.serfType}) arrived at pickup location ${this.taskDetails.sourceBuildingName || this.targetNode.buildingId}.`);
                this.state = SERF_ACTION_STATES.PICKING_UP_RESOURCE;
                this.taskTimer = 0; 
                this.targetNode = null;
            }
        } else {
            console.warn(`${this.id} (${this.serfType}) in MOVING_TO_PICKUP_LOCATION but no targetNode or path. Reverting to IDLE.`);
            this.state = SERF_ACTION_STATES.IDLE;
            this.task = 'idle';
        }
    }

    _handlePickingUpResourceState(deltaTime) {
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
                    const amountToRequest = Math.min(capacityLeft, this.taskDetails.amountToTransport || capacityLeft); 
                    
                    const pickedUpAmount = buildingInstance.pickupResource(resourceType, amountToRequest);

                    if (pickedUpAmount > 0) {
                        this.inventory[resourceType] = (this.inventory[resourceType] || 0) + pickedUpAmount;
                        console.log(`${this.id} (${this.serfType}) picked up ${pickedUpAmount} ${resourceType} from ${buildingInstance.info.name}. Inventory: ${this.inventory[resourceType]}`);
                    } else {
                        console.log(`${this.id} (${this.serfType}) failed to pick up ${resourceType} from ${buildingInstance.info.name} (empty or 0 requested).`);
                    }
                }
                
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
    }

    _handleMovingToResourceDropoffState(deltaTime) {
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
    }

    _handleDroppingOffResourceState(deltaTime) {
        if (this.task === 'transport_resource' && this.taskDetails.destinationBuildingId) {
            const resourceType = this.taskDetails.resourceType; 
            const amountInInventory = this.inventory[resourceType] || 0;

            if (amountInInventory > 0) {
                resourceManager.addResource(resourceType, amountInInventory);
                console.log(`${this.id} (${this.serfType}) deposited ${amountInInventory} ${resourceType} to global resources.`);
                delete this.inventory[resourceType]; 
            } else {
                console.log(`${this.id} (${this.serfType}) arrived at dropoff but had no ${resourceType} to deposit.`);
            }

            if (Object.keys(this.inventory).length === 0) {
                console.log(`${this.id} (${this.serfType}) inventory empty. Transport task complete. Becoming IDLE.`);
            } else {
                console.warn(`${this.id} (${this.serfType}) inventory not empty after dropoff. Remaining: ${JSON.stringify(this.inventory)}. Becoming IDLE.`);
                this.inventory = {}; 
            }
            
            this.state = SERF_ACTION_STATES.IDLE;
            this.task = 'idle';
            this.taskDetails = {};

        } else {
            console.warn(`${this.id} (${this.serfType}) in DROPPING_OFF_RESOURCE but task is not 'transport_resource' or no destinationBuildingId. Going IDLE.`);
            this.state = SERF_ACTION_STATES.IDLE;
            this.task = 'idle';
        }
    }

    update(deltaTime) {
        super.update(deltaTime); // Base unit update

        switch (this.state) {
            case SERF_ACTION_STATES.IDLE:
                this._handleIdleState(deltaTime);
                break;

            case SERF_ACTION_STATES.SEARCHING_FOR_RESOURCE_ON_MAP: 
                this._handleSearchingForResourceOnMapState(deltaTime);
                break;

            case SERF_ACTION_STATES.MOVING_TO_RESOURCE_NODE: 
                this._handleMovingToResourceNodeState(deltaTime);
                break;

            case SERF_ACTION_STATES.GATHERING_RESOURCE_FROM_NODE: 
                this._handleGatheringResourceFromNodeState(deltaTime);
                break;

            case SERF_ACTION_STATES.MOVING_TO_DEPOSIT_BUILDING: 
                this._handleMovingToDepositBuildingState(deltaTime);
                break;

            case SERF_ACTION_STATES.DEPOSITING_RESOURCE_IN_BUILDING: 
                this._handleDepositingResourceInBuildingState(deltaTime);
                break;

            case SERF_ACTION_STATES.MOVING_TO_TARGET: 
                this._handleMovingToTargetState(deltaTime);
                break;
            
            case SERF_ACTION_STATES.WORKING_AT_BUILDING: 
                this._handleWorkingAtBuildingState(deltaTime);
                break;

            case SERF_ACTION_STATES.PERFORMING_TASK: 
                this._handlePerformingTaskState(deltaTime);
                break;
            
            case SERF_ACTION_STATES.RETURNING_TO_DROPOFF: 
                this._handleReturningToDropoffState(deltaTime);
                break;
            
            case SERF_ACTION_STATES.MOVING_TO_PICKUP_LOCATION:
                this._handleMovingToPickupLocationState(deltaTime);
                break;

            case SERF_ACTION_STATES.PICKING_UP_RESOURCE:
                this._handlePickingUpResourceState(deltaTime);
                break;

            case SERF_ACTION_STATES.MOVING_TO_RESOURCE_DROPOFF:
                this._handleMovingToResourceDropoffState(deltaTime);
                break;

            case SERF_ACTION_STATES.DROPPING_OFF_RESOURCE:
                this._handleDroppingOffResourceState(deltaTime);
                break;
        }
    }
}