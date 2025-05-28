// src/core/tasks/ReturnToJobBuildingTask.js
import Task, { TASK_STATUS, TASK_TYPES } from './Task.js'; // Import TASK_TYPES
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';

class ReturnToJobBuildingTask extends Task {
    constructor(jobBuilding) {
        super(TASK_TYPES.RETURN_TO_JOB_BUILDING, null, jobBuilding); // Corrected super call
        this.name = `Return to ${jobBuilding.name}`; // Explicitly set descriptive name
        this.jobBuilding = jobBuilding; // Keep specific reference
        this.targetTile = { x: jobBuilding.x, y: jobBuilding.y };
    }

    canBeExecutedBy(serf) {
        // Any serf can execute this task if they have this job building assigned.
        return serf.jobBuilding === this.jobBuilding;
    }

    onAssign(serf) {
        super.onAssign(serf); // Sets status to ACTIVE and assigns serf
        console.log(`Task: ${this.id} (${this.name}) assigned to Serf ${serf.id}. Serf moving to job building ${this.jobBuilding.name}`);
        
        serf.target = { x: this.jobBuilding.x, y: this.jobBuilding.y, isBuilding: true, entity: this.jobBuilding };
        serf.path = serf.mapManager.findPath({ x: serf.x, y: serf.y }, { x: this.jobBuilding.x, y: this.jobBuilding.y });

        if (serf.path && serf.path.length > 0) {
            serf.pathIndex = 0;
            // Assuming MOVING_TO_TARGET_TILE can handle a general target object
            // or a more specific state like MOVING_TO_JOB_BUILDING could be created if needed.
            serf.changeState(SERF_ACTION_STATES.MOVING_TO_TARGET_TILE); 
        } else {
            console.warn(`Serf ${serf.id} could not find path to job building ${this.jobBuilding.name} for task ${this.id}. Task failing.`);
            this.handleOutcome(serf, 'failed_no_path');
        }
    }

    onUpdate(serf, deltaTime) {
        // This task primarily involves movement, which is handled by the serf's state.
        // We check if the serf has reached the destination.
        if (serf.x === this.targetTile.x && serf.y === this.targetTile.y) {
            if (serf.currentState.name === SERF_ACTION_STATES.MOVING_TO_TARGET_TILE || 
                serf.currentState.name === SERF_ACTION_STATES.MOVING_TO_TARGET) { // Or other relevant moving states
                console.log(`Serf ${serf.id} has arrived at job building ${this.jobBuilding.name} for task ${this.id}.`);
                this.handleOutcome(serf, 'completed');
            }
        } else if (serf.currentState.name === SERF_ACTION_STATES.IDLE && this.status === TASK_STATUS.ACTIVE) {
            // If serf becomes idle while this task is active (e.g. path interrupted), try to re-engage.
            console.warn(`Serf ${serf.id} became IDLE during ReturnToJobBuildingTask ${this.id}. Re-assigning movement.`);
            this.onAssign(serf); // Re-trigger pathfinding and state change
        }
    }

    onComplete(serf) {
        super.onComplete(serf);
        console.log(`Task: ${this.id} (${this.name}) completed by Serf ${serf.id}. Serf is now at job building.`);
        // Serf will transition to IDLE via handleOutcome, then IdleState logic will take over.
        // No further action needed here for this specific task.
    }

    onFail(serf) {
        super.onFail(serf);
        console.log(`Task: ${this.id} (${this.name}) failed for Serf ${serf.id}.`);
        // Serf will transition to IDLE.
    }
    
    onCancel(serf) {
        super.onCancel(serf);
        console.log(`Task: ${this.id} (${this.name}) cancelled for Serf ${serf.id}.`);
    }
}

export default ReturnToJobBuildingTask;
