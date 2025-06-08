import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
import { TASK_STATUS } from '../../core/tasks/Task.js';

/**
 * @class ConstructingBuildingState
 * @description Represents the state of a serf while they are at a construction site.
 * The actual construction progress is handled by the Building instance itself and updated
 * by the ConstructionManager. This state ensures the serf remains at the site
 * and becomes idle once the building is complete or the task fails/is cancelled.
 */
class ConstructingBuildingState {
    constructor() {
        this.name = SERF_ACTION_STATES.CONSTRUCTING_BUILDING;
    }

    /**
     * Called when the serf enters this state.
     * @param {Serf} serf - The serf entering this state.
     */
    enter(serf) {
        console.log(
            `Serf ${serf.id} (${serf.serfType}) entering CONSTRUCTING_BUILDING state for building ${serf.currentTask && serf.currentTask.building ? serf.currentTask.building.name : 'Unknown'}.`
        );
        // Serf should already be at the location, or the task's _moveToLocation handles it.
        // No specific action needed here other than logging, as the serf just needs to "be present".
    }

    /**
     * Called every game tick to update the serf's state.
     * @param {Serf} serf - The serf to update.
     * @param {number} deltaTime - The time elapsed since the last update.
     */
    execute(serf, deltaTime) {
        if (
            !serf.currentTask ||
            !(serf.currentTask.constructor.name === 'ConstructBuildingTask')
        ) {
            console.warn(
                `Serf ${serf.id} is in CONSTRUCTING_BUILDING state but has no valid ConstructBuildingTask. Transitioning to IDLE.`
            );
            serf.changeState(SERF_ACTION_STATES.IDLE);
            return;
        }

        const task = serf.currentTask;
        const building = task.building;

        // Update the task - this is crucial for task completion detection
        if (task.status === TASK_STATUS.ACTIVE) {
            task.onUpdate(serf, deltaTime);

            // Check if the task is now complete after the update
            if (task.isComplete(serf)) {
                task.onComplete(serf);
                console.log(
                    `Serf ${serf.id} (${serf.serfType}): Construction task for ${building.name} completed. Transitioning to IDLE.`
                );
                serf.changeState(SERF_ACTION_STATES.IDLE);
                return;
            }
        }

        // Check if the task failed or was cancelled
        if (
            task.status === TASK_STATUS.FAILED ||
            task.status === TASK_STATUS.CANCELLED
        ) {
            console.log(
                `Serf ${serf.id} (${serf.serfType}): Construction task for ${building.name} is ${task.status}. ConstructingBuildingState transitioning to IDLE.`
            );
            serf.changeState(SERF_ACTION_STATES.IDLE);
            return;
        }

        // Check if the task is already completed (backup check)
        if (task.status === TASK_STATUS.COMPLETED) {
            console.log(
                `Serf ${serf.id} (${serf.serfType}): Construction task for ${building.name} is COMPLETED. ConstructingBuildingState transitioning to IDLE.`
            );
            serf.changeState(SERF_ACTION_STATES.IDLE);
            return;
        }

        const entryPoint = building.getEntryPointGridPosition();
        if (serf.x !== entryPoint.x || serf.y !== entryPoint.z) {
            console.warn(
                `Serf ${serf.id} (${serf.serfType}) in CONSTRUCTING_BUILDING state is not at the building site (${entryPoint.x}, ${entryPoint.z}). Current: (${serf.x}, ${serf.y}). Task should manage location.`
            );
        }
    }

    /**
     * Called when the serf exits this state.
     * @param {Serf} serf - The serf exiting this state.
     */
    exit(serf) {
        console.log(
            `Serf ${serf.id} (${serf.serfType}) exiting CONSTRUCTING_BUILDING state.`
        );
    }
}

export default ConstructingBuildingState;
