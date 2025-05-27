import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
import { TASK_STATUS } from '../../core/tasks/Task.js';

class MovingToResourceNodeState extends SerfState {
    constructor() {
        super(SERF_ACTION_STATES.MOVING_TO_RESOURCE_NODE);
    }

    enter(serf) {
        super.enter(serf);
        if (!serf.currentTask || serf.currentTask.type !== 'GATHER_RESOURCE') {
            console.error(`Serf ${serf.id} entered MovingToResourceNodeState without a valid GATHER_RESOURCE task.`);
            serf.changeState(SERF_ACTION_STATES.IDLE);
            return;
        }

        const targetNode = serf.currentTask.targetResourceNode;
        if (!targetNode) {
            console.error(`Serf ${serf.id} has no targetNode in GATHER_RESOURCE task.`);
            serf.currentTask.handleOutcome(serf, 'no_target_node'); // Task handles its own status change
            // serf.changeState(SERF_ACTION_STATES.IDLE); // Task handleOutcome should do this
            return;
        }

        serf.path = serf.mapManager.findPath({ x: serf.x, y: serf.y }, { x: targetNode.x, y: targetNode.y });
        serf.pathIndex = 0;

        if (!serf.path || serf.path.length === 0) {
            console.log(`Serf ${serf.id} could not find a path to resource node at (${targetNode.x}, ${targetNode.y}).`);
            serf.currentTask.handleOutcome(serf, 'path_not_found');
            // serf.changeState(SERF_ACTION_STATES.IDLE);
        }
    }

    execute(serf, deltaTime) {
        if (!serf.currentTask || serf.currentTask.type !== 'GATHER_RESOURCE' || serf.currentTask.status !== TASK_STATUS.ACTIVE) {
            // If task changed or no longer active, go idle to re-evaluate
            // console.warn(`Serf ${serf.id} in MovingToResourceNodeState but task is invalid or not active. Task: ${serf.currentTask ? serf.currentTask.id : 'none'}`);
            serf.changeState(SERF_ACTION_STATES.IDLE);
            return;
        }

        if (!serf.path || serf.pathIndex >= serf.path.length) {
            // Arrived at the target node (or adjacent)
            console.log(`Serf ${serf.id} arrived at resource node for task ${serf.currentTask.id}.`);
            serf.changeState(SERF_ACTION_STATES.GATHERING_RESOURCE_FROM_NODE);
            return;
        }

        const arrived = serf._moveAlongPath(deltaTime);
        if (arrived) {
            console.log(`Serf ${serf.id} finished moving along path for task ${serf.currentTask.id}.`);
            serf.changeState(SERF_ACTION_STATES.GATHERING_RESOURCE_FROM_NODE);
        }
    }

    exit(serf) {
        super.exit(serf);
        // serf.path = null; // Clear path when exiting, or let next state handle if needed
    }
}

export default MovingToResourceNodeState;
