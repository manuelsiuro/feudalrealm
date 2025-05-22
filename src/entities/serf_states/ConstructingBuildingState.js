import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
import { TASK_TYPES, TASK_STATUS } from '../../core/tasks/Task.js'; // Import TASK_TYPES and TASK_STATUS
import { BUILDER_WORK_INTERVAL } from '../../config/unitConstants.js';

class ConstructingBuildingState extends SerfState {
    constructor() { 
        super(SERF_ACTION_STATES.CONSTRUCTING_BUILDING); 
    }

    enter(serf) {
        super.enter(serf);
        serf.taskTimer = 0; // Reset or ensure timer is ready for construction work
        
        // Ensure the serf is at the correct location, otherwise move.
        // This check is also in the old _handleConstructingBuildingState, good to have in enter too.
        if (serf.currentTask && serf.currentTask.type === TASK_TYPES.CONSTRUCT_BUILDING) {
            const targetBuilding = serf.currentTask.targetEntity;
            if (!targetBuilding) {
                console.warn(`${serf.id} (${serf.serfType}) in CONSTRUCTING_BUILDING but task has no targetEntity. Going IDLE.`);
                serf.changeState(SERF_ACTION_STATES.IDLE);
                return;
            }
            const entryPoint = targetBuilding.getEntryPointGridPosition();
            if (serf.x !== entryPoint.x || serf.y !== entryPoint.z) {
                console.log(`${serf.id} (${serf.serfType}) not at construction site ${targetBuilding.name}. Moving to (${entryPoint.x}, ${entryPoint.z}).`);
                
                // Use the Task's helper to move, which sets taskCallbackState
                serf.currentTask._moveToLocation(serf, {x: entryPoint.x, y: entryPoint.z}, SERF_ACTION_STATES.CONSTRUCTING_BUILDING);
                // The above line will change state to MOVING_TO_TARGET if path is found.
                // If path is not found, _moveToLocation in Task.js might call task.onFail, which should make serf idle.
            }
        } else if (!serf.currentTask || serf.currentTask.type !== TASK_TYPES.CONSTRUCT_BUILDING) {
            console.warn(`${serf.id} (${serf.serfType}) entered CONSTRUCTING_BUILDING without a valid construction task. Going IDLE.`);
            serf.changeState(SERF_ACTION_STATES.IDLE);
        }
    }

    execute(serf, deltaTime) {
        if (!serf.currentTask || serf.currentTask.type !== TASK_TYPES.CONSTRUCT_BUILDING || serf.currentTask.status !== TASK_STATUS.ACTIVE) {
            // console.warn(`${serf.id} (${serf.serfType}) in CONSTRUCTING_BUILDING without an active construction task. Going IDLE.`);
            serf.changeState(SERF_ACTION_STATES.IDLE);
            return;
        }

        const targetBuilding = serf.currentTask.targetEntity;

        if (!targetBuilding) {
            console.error(`${serf.id} (${serf.serfType}) in CONSTRUCTING_BUILDING: currentTask has no targetEntity. Task failing.`);
            serf.currentTask.onFail(serf); // This will set serf.currentTask to null
            serf.changeState(SERF_ACTION_STATES.IDLE);
            return;
        }
        
        // Check if already at the target location (important if re-entering state or after a short move)
        const entryPoint = targetBuilding.getEntryPointGridPosition();
        if (serf.x !== entryPoint.x || serf.y !== entryPoint.z) {
            // console.log(`${serf.id} (${serf.serfType}) not at construction site ${targetBuilding.name} during execute. Re-initiating move.`);
             // Task's _moveToLocation will set the correct next state upon arrival.
            serf.currentTask._moveToLocation(serf, {x: entryPoint.x, y: entryPoint.z}, SERF_ACTION_STATES.CONSTRUCTING_BUILDING);
            return; // Exit execute, as state will change to MOVING_TO_TARGET or task will fail
        }


        if (serf.currentTask.isComplete(serf)) { // Checks targetBuilding.isConstructed
            serf.currentTask.onComplete(serf); // This will nullify serf.currentTask and make serf IDLE
            // onComplete in ConstructBuildingTask should handle serf state change to IDLE.
            return;
        }

        // Serf is at the site. "Work" on construction.
        serf.taskTimer += deltaTime;
        if (serf.taskTimer >= BUILDER_WORK_INTERVAL) { 
            serf.taskTimer -= BUILDER_WORK_INTERVAL;
            // console.log(`${serf.id} (${serf.serfType}) performing construction work at ${targetBuilding.name} (ID: ${targetBuilding.id}).`);
            // Actual construction progress is managed by ConstructionManager's building.constructionEndTime.
            // This state just keeps the serf "busy" at the site.
            // The Serf remains in this state. The task's isComplete will eventually become true.
        }
    }

    exit(serf) {
        super.exit(serf);
        serf.taskTimer = 0; // Reset timer when exiting state
    }
}
export default ConstructingBuildingState;
