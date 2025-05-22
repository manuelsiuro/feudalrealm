// src/entities/serf_states/IdleState.js
import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
import { TASK_STATUS } from '../../core/tasks/Task.js'; // Import TASK_STATUS

/**
 * @class IdleState
 * @classdesc Represents the state where a Serf is idle and waiting for tasks.
 * If a `currentTask` is assigned, it will attempt to process it.
 * Otherwise, it may handle legacy string-based tasks or wait for SerfManager.
 * @extends SerfState
 */
class IdleState extends SerfState {
    /**
     * Creates an instance of IdleState.
     */
    constructor() {
        super(SERF_ACTION_STATES.IDLE);
    }

    /**
     * Called when the serf enters the IdleState.
     * Clears any existing path and resets path index.
     * @param {Serf} serf - The serf instance.
     * @override
     */
    enter(serf) {
        super.enter(serf);
        serf.path = null;
        serf.pathIndex = 0;
        // serf.targetNode = null; // Potentially clear targetNode, but might be set by a new task immediately.
        // serf.playAnimation('idle');
    }

    /**
     * Executes the idle state logic for the serf.
     * If a `currentTask` (Task object) is active, its `onUpdate` and `isComplete` methods are called.
     * Otherwise, it falls back to handling simple string-based tasks (e.g., 'plant_sapling', 'mine').
     * If no task is active or applicable, the serf remains idle.
     * @param {Serf} serf - The serf instance.
     * @param {number} deltaTime - The time elapsed since the last frame.
     * @override
     */
    execute(serf, deltaTime) {
        if (serf.currentTask && serf.currentTask.status === TASK_STATUS.ACTIVE) {
            serf.currentTask.onUpdate(serf, deltaTime); 
            
            if (serf.currentTask && serf.currentTask.isComplete(serf)) { 
                serf.currentTask.onComplete(serf); 
            }
            return; 
        }
        
        // Fallback for simple string-based tasks
        if (serf.task === 'plant_sapling' && serf.targetTile) {
            serf.path = serf.mapManager.findPath({ x: serf.x, y: serf.y }, { x: serf.targetTile.x, y: serf.targetTile.y });
            if (serf.path && serf.path.length > 0) {
                serf.pathIndex = 0;
                serf.changeState(SERF_ACTION_STATES.MOVING_TO_TARGET_TILE);
            }
            return;
        }

        if (serf.task === 'mine' && serf.taskDetails && serf.taskDetails.resourceType) {
            serf.changeState(SERF_ACTION_STATES.SEARCHING_FOR_RESOURCE_ON_MAP);
            return;
        }
    }

    /**
     * Called when the serf exits the IdleState.
     * @param {Serf} serf - The serf instance.
     * @override
     */
    exit(serf) {
        super.exit(serf);
        // Any cleanup when exiting idle.
    }
}

export default IdleState;
