import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
import { TASK_STATUS } from '../../core/tasks/Task.js';

class MovingToDepositBuildingState extends SerfState {
    constructor() {
        super(SERF_ACTION_STATES.MOVING_TO_DEPOSIT_BUILDING);
    }

    enter(serf) {
        super.enter(serf);
        if (!serf.currentTask || serf.currentTask.type !== 'TRANSPORT_RESOURCE' || serf.currentTask.status !== TASK_STATUS.ACTIVE) {
            console.error(`Serf ${serf.id} entered MovingToDepositBuildingState without a valid TRANSPORT_RESOURCE task.`);
            serf.changeState(SERF_ACTION_STATES.IDLE);
            return;
        }

        const destinationBuilding = serf.currentTask.destinationBuilding;
        if (!destinationBuilding || !destinationBuilding.gridX === undefined || !destinationBuilding.gridZ === undefined) {
            console.error(`Serf ${serf.id} has no valid destinationBuilding for TransportResourceTask.`);
            serf.currentTask.handleOutcome(serf, 'invalid_destination');
            return;
        }

        serf.target = { x: destinationBuilding.gridX, y: destinationBuilding.gridZ }; // y is gridZ
        console.log(`Serf ${serf.id} moving to deposit resources at ${destinationBuilding.name || destinationBuilding.type} (${serf.target.x}, ${serf.target.y}). Task: ${serf.currentTask.id}`);
        serf.calculatePath();

        if (!serf.path || serf.path.length === 0) {
            console.warn(`Serf ${serf.id} could not find a path to deposit building at (${serf.target.x}, ${serf.target.y}).`);
            serf.currentTask.handleOutcome(serf, 'path_not_found_to_deposit');
            // Serf will become IDLE via task outcome
        }
    }

    execute(serf, deltaTime) {
        if (!serf.currentTask || serf.currentTask.status !== TASK_STATUS.ACTIVE) {
            // Task might have been completed or failed by another state or logic
            serf.changeState(SERF_ACTION_STATES.IDLE);
            return;
        }

        if (!serf.path || serf.path.length === 0) {
            // Path might have failed or serf arrived but state didn't change yet
            // If already at target, transition. Otherwise, it's a path failure.
            if (serf.isAtTarget()) {
                console.log(`Serf ${serf.id} arrived at deposit building: ${serf.currentTask.destinationBuilding.name || serf.currentTask.destinationBuilding.type}.`);
                serf.changeState(SERF_ACTION_STATES.DEPOSITING_RESOURCE_IN_BUILDING);
            } else {
                // This case should ideally be handled by enter() or if path becomes invalid mid-movement
                console.warn(`Serf ${serf.id} in MovingToDepositBuildingState with no path and not at target.`);
                serf.currentTask.handleOutcome(serf, 'path_became_invalid_to_deposit');
            }
            return;
        }

        serf.moveAlongPath(deltaTime);

        if (serf.isAtTarget()) {
            console.log(`Serf ${serf.id} arrived at deposit building: ${serf.currentTask.destinationBuilding.name || serf.currentTask.destinationBuilding.type}.`);
            serf.changeState(SERF_ACTION_STATES.DEPOSITING_RESOURCE_IN_BUILDING);
        }
    }

    exit(serf) {
        super.exit(serf);
        // Clear path and target if not handled by serf.changeState or serf.clearTask
        // serf.path = null; 
        // serf.target = null;
    }
}

export default MovingToDepositBuildingState;
