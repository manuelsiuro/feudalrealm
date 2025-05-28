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

        if (serf.targetPos) { // Check if IdleState set a targetPos for a generic move
            // console.log(`${serf.id} (${serf.serfType}) entering ${this.name} with targetPos: (${serf.targetPos.x}, ${serf.targetPos.y})`);
            serf.path = serf.mapManager.findPath({ x: serf.x, y: serf.y }, serf.targetPos);

            if (serf.path && serf.path.length > 0) {
                serf.pathIndex = 0;
                // Set targetNode to the destination of this path.
                // For _moveAlongPath, the path waypoints are used.
                // For setPosition on arrival, targetNode needs to be the final destination.
                serf.targetNode = { x: serf.targetPos.x, y: serf.targetPos.y }; // Use the coordinates from targetPos
                // console.log(`${serf.id} (${serf.serfType}) path found to targetPos. Path length: ${serf.path.length}. TargetNode set to (${serf.targetNode.x}, ${serf.targetNode.y})`);
                // serf.playAnimation('walk');
                return; // Ready to move
            } else {
                // Enhanced logging for pathfinding failure
                const targetTile = serf.mapManager.getTile(serf.targetPos.x, serf.targetPos.y);
                const startTile = serf.mapManager.getTile(serf.x, serf.y);
                console.warn(`${serf.id} (${serf.serfType}) in ${this.name}: Failed to find path from (${serf.x}, ${serf.y}, type: ${startTile ? startTile.terrainType : 'N/A'}) to targetPos (${serf.targetPos.x}, ${serf.targetPos.y}, type: ${targetTile ? targetTile.terrainType : 'N/A'}). Reverting to IDLE.`);
                serf.targetPos = null; // Clear targetPos as pathfinding failed
                serf.targetNode = null; // Ensure targetNode is also clear
                serf.changeState(SERF_ACTION_STATES.IDLE);
                return;
            }
        } else if (!serf.targetNode || !serf.path || serf.path.length === 0) {
            // This is the original check, for cases where targetNode and path are expected to be pre-set (e.g., by a Task)
            console.warn(`${serf.id} (${serf.serfType}) entering ${this.name} without valid targetNode/path (and no targetPos). Reverting to IDLE.`);
            serf.changeState(SERF_ACTION_STATES.IDLE);
            return;
        }
        // If neither of the above conditions met (i.e., targetNode and path were already validly set by something else)
        // console.log(`${serf.id} (${serf.serfType}) entering ${this.name} with pre-set targetNode and path.`);
        // serf.playAnimation('walk');
    }

    execute(serf, deltaTime) {
        // Ensure targetNode and path are valid before attempting to move
        if (!serf.targetNode || !serf.path) {
            if (serf.currentState.name === this.name) { 
                 // console.log(`${serf.id} (${serf.serfType}) in ${this.name}.execute() but no targetNode or path. Reverting to IDLE.`);
                 serf.changeState(SERF_ACTION_STATES.IDLE);
            }
            return;
        }

        const arrived = serf._moveAlongPath(deltaTime);

        if (arrived) {
            serf.setPosition(serf.targetNode.x, serf.targetNode.y);
            serf.path = null;
            serf.pathIndex = 0;

            const taskCallbackState = serf.targetNode.taskCallbackState; 
            const arrivedAtX = serf.targetNode.x; 
            const arrivedAtY = serf.targetNode.y;

            serf.targetNode = null; 
            // Check if the arrival was due to a move initiated by setting serf.targetPos
            const wasMoveToTargetPos = serf.targetPos && serf.targetPos.x === arrivedAtX && serf.targetPos.y === arrivedAtY;
            serf.targetPos = null; // Clear targetPos after arrival consideration

            if (taskCallbackState && serf.states[taskCallbackState]) {
                // console.log(`${serf.id} (${this.name}) arrived. Task directs to state: ${taskCallbackState}`);
                serf.changeState(taskCallbackState);
            } else if (serf.currentTask) {
                // Specific handling for construction task
                if (serf.currentTask.type === TASK_TYPES.CONSTRUCT_BUILDING) { 
                    // console.log(`${serf.id} (${this.name}) arrived at construction site for task ${serf.currentTask.id}. Changing to CONSTRUCTING_BUILDING.`);
                    serf.changeState(SERF_ACTION_STATES.CONSTRUCTING_BUILDING);
                } else {
                    // For other tasks, go IDLE to allow task logic to continue in IdleState.execute
                    // console.log(`${serf.id} (${this.name}) arrived. Has currentTask ${serf.currentTask.type}. Going IDLE.`);
                    serf.changeState(SERF_ACTION_STATES.IDLE);
                }
            } else if (wasMoveToTargetPos && serf.jobBuilding) {
                // This handles the "move to job building" scenario initiated by IdleState,
                // where no specific task was driving the move, just the job assignment.
                // console.log(`${serf.id} (${serf.serfType}) arrived at job building: ${serf.jobBuilding.name} (via targetPos). Going IDLE.`);
                serf.changeState(SERF_ACTION_STATES.IDLE);
            }
            // Legacy string task fallbacks (should be reviewed/phased out)
            else if (serf.task === 'work_at_building') { 
                // console.log(`${serf.id} (${this.name}) arrived at building for 'work_at_building' (legacy). Going WORKING_AT_BUILDING.`);
                serf.changeState(SERF_ACTION_STATES.WORKING_AT_BUILDING);
            } else if (serf.task === 'mine') { 
                // console.log(`${serf.id} (${this.name}) arrived for 'mine' task (legacy). Going PERFORMING_TASK.`);
                serf.changeState(SERF_ACTION_STATES.PERFORMING_TASK);
            }
            else {
                // Default: if no specific next state or task, go IDLE.
                // console.log(`${serf.id} (${this.name}) arrived at generic target. No specific next action defined. Going IDLE.`);
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
