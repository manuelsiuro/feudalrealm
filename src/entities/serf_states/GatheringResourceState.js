import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
import { TASK_STATUS, TASK_TYPES } from '../../core/tasks/Task.js'; // Import TASK_TYPES
import { GATHER_TIME_PER_UNIT } from '../../config/unitConstants.js'; // Time to gather one unit
import resourceManager from '../../core/resourceManager.js'; // To add gathered resources

class GatheringResourceState extends SerfState {
    constructor() {
        super(SERF_ACTION_STATES.GATHERING_RESOURCE_FROM_NODE);
        this.gatherTimer = 0;
    }

    enter(serf) {
        super.enter(serf);
        this.gatherTimer = 0;

        if (!serf.currentTask || serf.currentTask.type !== TASK_TYPES.GATHER_RESOURCE_FROM_NODE || serf.currentTask.status !== TASK_STATUS.ACTIVE) {
            console.error(`Serf ${serf.id} entered GatheringResourceState without a valid GATHER_RESOURCE_FROM_NODE task.`);
            serf.currentTask?.handleOutcome(serf, 'task_invalidated_on_enter', { reason: "Invalid task for GatheringResourceState" });
            serf.changeState(SERF_ACTION_STATES.IDLE);
            return;
        }

        const targetNode = serf.currentTask.targetResourceNode;
        if (!targetNode || !targetNode.resource || targetNode.resource.amount <= 0) {
            console.log(`Serf ${serf.id} cannot gather: Target node at (${targetNode ? targetNode.x : 'N/A'}, ${targetNode ? targetNode.y : 'N/A'}) is depleted or invalid.`);
            serf.currentTask.handleOutcome(serf, 'node_depleted_on_arrival');
            // serf.changeState(SERF_ACTION_STATES.IDLE); // handleOutcome should manage state transition
            return;
        }
        
        const currentInventorySize = Object.values(serf.inventory).reduce((sum, count) => sum + count, 0);
        if (currentInventorySize >= serf.maxInventoryCapacity) {
            console.log(`Serf ${serf.id} inventory is full before starting to gather. Max: ${serf.maxInventoryCapacity}`);
            serf.currentTask.handleOutcome(serf, 'inventory_full_on_arrival');
            // serf.changeState(SERF_ACTION_STATES.IDLE);

        }

        // console.log(`Serf ${serf.id} starting to gather ${serf.currentTask.resourceType} from node at (${targetNode.x}, ${targetNode.y}). Node amount: ${targetNode.resource.amount}`);
    }

    execute(serf, deltaTime) {
        if (!serf.currentTask || serf.currentTask.type !== TASK_TYPES.GATHER_RESOURCE_FROM_NODE || serf.currentTask.status !== TASK_STATUS.ACTIVE) {
            // console.log(`Serf ${serf.id} in GatheringResourceState: Task no longer valid or active. Transitioning to IDLE.`);
            // If task became invalid/inactive, its outcome should have been handled.
            // Ensure serf goes idle if no specific outcome was processed that did so.
            if (serf.currentTask && (serf.currentTask.status === TASK_STATUS.COMPLETED || serf.currentTask.status === TASK_STATUS.FAILED || serf.currentTask.status === TASK_STATUS.CANCELLED)) {
                // Task is already finalized, serf should be idle.
            } else {
                // Task might be PENDING or reassigned, or simply gone.
                serf.currentTask?.handleOutcome(serf, 'task_became_invalid_during_gather', { reason: "Task no longer GATHER_RESOURCE_FROM_NODE or not ACTIVE" });
            }
            serf.changeState(SERF_ACTION_STATES.IDLE);
            return;
        }

        const targetNode = serf.currentTask.targetResourceNode;
        const resourceType = serf.currentTask.resourceType;

        if (!targetNode || !targetNode.resource || targetNode.resource.amount <= 0) {
            // console.log(`Serf ${serf.id} stopping gather: Target node depleted.`);
            serf.currentTask.handleOutcome(serf, 'node_depleted_during_gather');
            // serf.changeState(SERF_ACTION_STATES.IDLE);
            return;
        }

        this.gatherTimer += deltaTime * 1000; // deltaTime is in seconds, GATHER_TIME_PER_UNIT in ms

        if (this.gatherTimer >= GATHER_TIME_PER_UNIT) {
            this.gatherTimer = 0; 

            const amountToGather = 1; 

            if (!serf.inventory[resourceType]) {
                serf.inventory[resourceType] = 0;
            }
            serf.inventory[resourceType] += amountToGather;
            // console.log(`Serf ${serf.id} gathered ${amountToGather} ${resourceType}. Inventory: ${serf.inventory[resourceType]}`);

            targetNode.resource.amount -= amountToGather;
            // console.log(`Node at (${targetNode.x}, ${targetNode.y}) now has ${targetNode.resource.amount} ${resourceType}.`);

            const currentInventorySize = Object.values(serf.inventory).reduce((sum, count) => sum + count, 0);
            if (currentInventorySize >= serf.maxInventoryCapacity) {
                // console.log(`Serf ${serf.id} inventory full after gathering. Max: ${serf.maxInventoryCapacity}`);
                serf.currentTask.handleOutcome(serf, 'inventory_full');
                // serf.changeState(SERF_ACTION_STATES.IDLE);
                return;
            }

            if (targetNode.resource.amount <= 0) {
                // console.log(`Serf ${serf.id} depleted resource node at (${targetNode.x}, ${targetNode.y}).`);
                if (serf.game && serf.game.natureManager) {
                    serf.game.natureManager.removeResourceNode(targetNode.x, targetNode.y);
                }
                serf.currentTask.handleOutcome(serf, 'node_depleted');
                // serf.changeState(SERF_ACTION_STATES.IDLE);

            }
        }
    }

    exit(serf) {
        super.exit(serf);
        this.gatherTimer = 0;
        // Task outcome should have been handled already, leading to IDLE state or another task.
    }
}

export default GatheringResourceState;
