import Task, { TASK_STATUS, TASK_TYPES, TASK_PRIORITIES } from './Task.js'; // Import TASK_TYPES and TASK_PRIORITIES
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
import { SERF_PROFESSIONS } from '../../config/serfProfessions.js';
import { RESOURCE_TYPES } from '../../config/resourceTypes.js';

export default class GatherResourceTask extends Task {
    constructor(targetResourceNode, resourceType, assignedBuilding = null) { // Removed priority from constructor args
        // Pass type and targetEntity to parent Task constructor. Priority will be default from TASK_PRIORITIES.
        super(TASK_TYPES.GATHER_RESOURCE_FROM_NODE, TASK_PRIORITIES.GATHER_RESOURCE_FROM_NODE, targetResourceNode); 
        
        // this.type is already set by super() call if type is the first argument.
        // However, if super() doesn't set this.type directly, or if we want to be explicit:
        // this.type = TASK_TYPES.GATHER_RESOURCE_FROM_NODE; // Redundant if super() handles it. Let's remove.

        this.targetResourceNode = targetResourceNode; // Expected: { x, y, resource: { type, amount } }
        this.resourceType = resourceType;
        this.assignedBuilding = assignedBuilding; // Optional: The building instance this serf might be working for

        // Determine required profession based on resource type
        switch (this.resourceType) {
            case RESOURCE_TYPES.WOOD:
                this.requiredProfession = SERF_PROFESSIONS.WOODCUTTER;
                break;
            case RESOURCE_TYPES.STONE:
                this.requiredProfession = SERF_PROFESSIONS.STONEMASON; 
                break;
            case RESOURCE_TYPES.IRON_ORE:
            case RESOURCE_TYPES.COAL_ORE:
            case RESOURCE_TYPES.GOLD_ORE: // Added GOLD_ORE
                this.requiredProfession = SERF_PROFESSIONS.MINER;
                break;
            case RESOURCE_TYPES.FERTILE_LAND: // Added FERTILE_LAND
                this.requiredProfession = SERF_PROFESSIONS.FARMER;
                break;
            // TODO: Add other resource types and their corresponding gatherer professions
            // e.g., case RESOURCE_TYPES.IRON_ORE: this.requiredProfession = SERF_PROFESSIONS.MINER;
            default:
                this.requiredProfession = null; 
                // console.warn(`GatherResourceTask: No specific profession defined for gathering ${this.resourceType}.`);
        }
    }

    canBeExecutedBy(serf) {
        if (!this.requiredProfession) {
            // If no specific profession is required (e.g. a generic gatherable item),
            // any serf might be able to do it, or add a generic 'GATHERER' profession.
            // For now, let's assume a profession is usually required.
            // console.warn(`GatherResourceTask ${this.id}: Cannot determine eligibility, no required profession for ${this.resourceType}.`);
            return false;
        }
        if (serf.serfType !== this.requiredProfession) {
            return false;
        }

        // Check if serf's inventory is already full
        const inventorySize = Object.values(serf.inventory).reduce((sum, count) => sum + count, 0);
        if (inventorySize >= serf.maxInventoryCapacity) {
            // // console.log(`Serf ${serf.id} cannot execute GatherResourceTask ${this.id}: Inventory full.`);
            return false;
        }
        
        // Ensure the target node still has resources
        if (!this.targetResourceNode || !this.targetResourceNode.resource || this.targetResourceNode.resource.amount <= 0) {
            // // console.log(`GatherResourceTask ${this.id}: Target node is depleted or invalid.`);
            // This task should probably be invalidated by SerfManager if the node is gone.
            return false; 
        }

        return true;
    }

    onAssign(serf) {
        super.onAssign(serf); // Sets status to ACTIVE and assigns serf
        serf.targetNode = this.targetResourceNode; 
        // The GatheringResourceState will use serf.targetNode.resource.type and serf.targetNode.resource.amount
        // It also needs to know what it's gathering, ensure serf.taskDetails or similar is set if state relies on it.
        serf.taskDetails = { // Provide details for the state
            resourceType: this.resourceType,
            targetNode: this.targetResourceNode 
        };
        serf.changeState(SERF_ACTION_STATES.MOVING_TO_RESOURCE_NODE);
        // // console.log(`GatherResourceTask ${this.id} (${this.type}) assigned to Serf ${serf.id} (${serf.serfType}) for ${this.resourceType} at (${this.targetResourceNode.x}, ${this.targetResourceNode.y})`);
    }

    // Called by GatheringResourceState or MovingToResourceNodeState when an outcome occurs
    handleOutcome(serf, outcome) { 
        // console.log(`GatherResourceTask ${this.id} (Serf ${serf.id}): Outcome - ${outcome}.`);
        
        switch (outcome) {
            case 'inventory_full':
            case 'node_depleted':
            case 'inventory_full_on_arrival': // Serf is full, can't start gathering. Task considered done for this serf.
                this.status = TASK_STATUS.COMPLETED;
                // console.log(`GatherResourceTask ${this.id} status set to COMPLETED.`);
                break;
            case 'node_depleted_on_arrival':
            case 'path_not_found':
            case 'no_target_node':
            case 'node_depleted_during_gather':
                this.status = TASK_STATUS.FAILED;
                // console.log(`GatherResourceTask ${this.id} status set to FAILED.`);
                break;
            default:
                // console.warn(`GatherResourceTask ${this.id}: Unknown outcome '${outcome}'. Setting status to FAILED.`);
                this.status = TASK_STATUS.FAILED;
                break;
        }

        // Common cleanup for the serf
        if (serf) {
            serf.targetNode = null; // Clear serf's specific target for this task
            serf.taskDetails = {}; // Clear task specific details
            // serf.currentTask should be cleared by SerfManager when it filters completed/failed tasks
            // or when a new task is assigned.
            serf.changeState(SERF_ACTION_STATES.IDLE);
        } else {
            // If serf is not provided (e.g. task failed before assignment or serf died)
            // just ensure status is set.
            // console.warn(`GatherResourceTask ${this.id}: handleOutcome called without a serf instance for outcome '${outcome}'.`);
        }
    }

    // Optional: An update method if the task needs to monitor conditions itself
    // This could be called by SerfManager for all active tasks, or by the serf.
    // update(serf, gameMap) {
    //     if (this.status !== TASK_STATUS.ACTIVE) return;

    //     // Example: Check if the target node in the gameMap has been depleted by someone else
    //     const mapNode = gameMap.getTile(this.targetResourceNode.x, this.targetResourceNode.y);
    //     if (!mapNode || !mapNode.resource || mapNode.resource.amount <= 0) {
    //         // console.log(`GatherResourceTask ${this.id}: Target node at (${this.targetResourceNode.x},${this.targetResourceNode.y}) found depleted externally.`);
    //         this.status = TASK_STATUS.FAILED; // Or COMPLETED
    //         if (serf && serf.currentTask === this) {
    //            serf.targetNode = null;
    //            serf.changeState(SERF_ACTION_STATES.IDLE);
    //         }
    //         return;
    //     }

    //     // Example: Check if the assigned serf's inventory became full through other means (unlikely)
    //     const inventorySize = Object.values(serf.inventory).reduce((sum, count) => sum + count, 0);
    //     if (inventorySize >= serf.maxInventoryCapacity) {
    //         this.handleOutcome(serf, 'inventory_full_detected_by_task_update');
    //     }
    // }

    /**
     * Checks if the task is complete.
     * A GatherResourceTask is considered complete if its status is COMPLETED or FAILED.
     * The actual logic for setting these statuses is handled in `handleOutcome`.
     * @param {Serf} serf - The serf executing the task (can be null if checked externally).
     * @returns {boolean} True if the task is considered finished, false otherwise.
     */
    isComplete(serf) {
        return this.status === TASK_STATUS.COMPLETED || this.status === TASK_STATUS.FAILED || this.status === TASK_STATUS.CANCELLED;
    }
}
