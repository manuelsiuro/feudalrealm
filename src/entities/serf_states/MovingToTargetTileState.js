import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
import { TASK_STATUS, TASK_TYPES } from '../../core/tasks/Task.js';

class MovingToTargetTileState extends SerfState {
    constructor() {
        super(SERF_ACTION_STATES.MOVING_TO_TARGET_TILE);
    }

    enter(serf) {
        super.enter(serf);

        if (!serf.currentTask || 
            (serf.currentTask.type !== TASK_TYPES.PLANT_SAPLING && serf.currentTask.type !== TASK_TYPES.FARM_PLOT) || // Add other task types that use this state
            serf.currentTask.status !== TASK_STATUS.ACTIVE) {
            console.error(`Serf ${serf.id} entered MovingToTargetTileState without a valid task (e.g., PLANT_SAPLING). Current task:`, serf.currentTask);
            serf.changeState(SERF_ACTION_STATES.IDLE); // Go idle if no valid task
            return;
        }

        const targetTile = serf.currentTask.targetTile;
        if (!targetTile || targetTile.x === undefined || targetTile.y === undefined) {
            console.error(`Serf ${serf.id} has no valid targetTile for its current task ${serf.currentTask.id} (${serf.currentTask.type}).`);
            serf.currentTask.handleOutcome(serf, 'invalid_target_tile');
            return;
        }

        serf.target = { x: targetTile.x, y: targetTile.y }; // y is gridZ for pathfinding
        console.log(`Serf ${serf.id} moving to target tile (${serf.target.x}, ${serf.target.y}) for task ${serf.currentTask.id} (${serf.currentTask.type}).`);
        serf.calculatePath();

        if (!serf.path || serf.path.length === 0) {
            console.warn(`Serf ${serf.id} could not find a path to target tile (${serf.target.x}, ${serf.target.y}) for task ${serf.currentTask.id}.`);
            // Determine specific outcome string based on task type
            let outcome = 'path_not_found_to_target_tile';
            if (serf.currentTask.type === TASK_TYPES.PLANT_SAPLING) {
                outcome = 'path_not_found_to_plant_tile';
            }
            // Add more else if for other task types like FARM_PLOT
            serf.currentTask.handleOutcome(serf, outcome);
        }
    }

    execute(serf, deltaTime) {
        if (!serf.currentTask || serf.currentTask.status !== TASK_STATUS.ACTIVE) {
            serf.changeState(SERF_ACTION_STATES.IDLE);
            return;
        }

        if (!serf.path || serf.path.length === 0) {
            if (serf.isAtTarget()) {
                this.transitionToNextState(serf);
            } else {
                console.warn(`Serf ${serf.id} in MovingToTargetTileState with no path and not at target for task ${serf.currentTask.id}.`);
                let outcome = 'path_became_invalid_to_target_tile';
                if (serf.currentTask.type === TASK_TYPES.PLANT_SAPLING) {
                    outcome = 'path_became_invalid_to_plant_tile';
                }
                serf.currentTask.handleOutcome(serf, outcome);
            }
            return;
        }

        serf.moveAlongPath(deltaTime);

        if (serf.isAtTarget()) {
            this.transitionToNextState(serf);
        }
    }

    transitionToNextState(serf) {
        console.log(`Serf ${serf.id} arrived at target tile (${serf.target.x}, ${serf.target.y}) for task ${serf.currentTask.id} (${serf.currentTask.type}).`);
        switch (serf.currentTask.type) {
            case TASK_TYPES.PLANT_SAPLING:
                serf.changeState(SERF_ACTION_STATES.PLANTING_SAPLING);
                break;
            // Add cases for other tasks like FARM_PLOT -> FARMING_PLANTING
            default:
                console.error(`Serf ${serf.id}: No next state defined for task type ${serf.currentTask.type} after reaching target tile.`);
                serf.currentTask.handleOutcome(serf, 'unknown_next_state_after_move');
                break;
        }
    }

    exit(serf) {
        super.exit(serf);
        // Path and target are usually cleared by serf.clearTask() or when a new task/state begins
    }
}

export default MovingToTargetTileState;
