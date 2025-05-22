// src/entities/serf_states/MovingToTargetState.js
import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
import { TASK_TYPES } from '../../core/tasks/Task.js'; // Import TASK_TYPES

class MovingToTargetState extends SerfState {
    constructor() {
        super(SERF_ACTION_STATES.MOVING_TO_TARGET);
    }

    enter(serf) {
        super.enter(serf);
        if (!serf.targetNode || !serf.path || serf.path.length === 0) {
            console.warn(`${serf.id} (${serf.serfType}) entering ${this.name} without valid targetNode or path. Reverting to IDLE.`);
            serf.changeState(SERF_ACTION_STATES.IDLE);
            return;
        }
        // serf.playAnimation('walk');
    }

    execute(serf, deltaTime) {
        if (!serf.targetNode || !serf.path) {
            // console.log(`${serf.id} (${serf.serfType}) in ${this.name} but no targetNode or path. Reverting to IDLE.`);
            serf.changeState(SERF_ACTION_STATES.IDLE);
            return;
        }

        const arrived = serf._moveAlongPath(deltaTime);

        if (arrived) {
            serf.setPosition(serf.targetNode.x, serf.targetNode.y);
            serf.path = null;
            serf.pathIndex = 0;

            const nextStateKey = serf.targetNode.taskCallbackState;
            // Clear targetNode after extracting callback state,
            // but only if it's not needed by the next state immediately (e.g. for target validation).
            // For now, we'll clear it here. The next state's enter() or execute() can re-set if needed based on currentTask.
            const oldTargetNode = serf.targetNode; // Keep a reference if needed for logging or task
            serf.targetNode = null; 

            if (nextStateKey && serf.states[nextStateKey]) {
                // console.log(`${serf.id} (MovingToTargetState) arrived. Task directs to state: ${nextStateKey}`);
                serf.changeState(nextStateKey);
            } else if (serf.currentTask && serf.currentTask.type === TASK_TYPES.CONSTRUCT_BUILDING) {
                // Fallback for ConstructBuildingTask if taskCallbackState wasn't set
                // console.log(`${serf.id} (MovingToTargetState) arrived at construction site (fallback logic).`);
                serf.changeState(SERF_ACTION_STATES.CONSTRUCTING_BUILDING);
            }
            // Add more fallbacks if necessary for other tasks that use MOVING_TO_TARGET
            // and might not have set taskCallbackState (especially for older task string logic)
            else if (serf.task === 'work_at_building' && oldTargetNode && oldTargetNode.buildingId) {
                // console.log(`${serf.id} (MovingToTargetState) arrived at building ${serf.taskDetails.buildingName || oldTargetNode.buildingId} for 'work_at_building' (legacy).`);
                serf.changeState(SERF_ACTION_STATES.WORKING_AT_BUILDING);
            } else if (serf.task === 'mine' && oldTargetNode) { 
                // console.log(`${serf.id} (MovingToTargetState) arrived at ${serf.taskDetails.resourceType} at (${oldTargetNode.x}, ${oldTargetNode.y}) for 'mine' task (legacy).`);
                serf.changeState(SERF_ACTION_STATES.PERFORMING_TASK);
            }
            else {
                // console.log(`${serf.id} (MovingToTargetState) arrived at generic target or no callback state. Going IDLE.`);
                serf.changeState(SERF_ACTION_STATES.IDLE);
            }
        }
    }

    exit(serf) {
        super.exit(serf);
        // serf.playAnimation('idle');
    }
}

export default MovingToTargetState;
