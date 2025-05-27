import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
import { TASK_STATUS } from '../../core/tasks/Task.js';

class WorkingAtBuildingState extends SerfState {
    constructor() {
        super(SERF_ACTION_STATES.WORKING_AT_BUILDING);
        this.processingTimer = 0;
    }

    enter(serf) {
        this.processingTimer = 0;

        if (!serf.currentTask || serf.currentTask.type !== 'PROCESS_ITEMS') {
        }
    }

    execute(serf, deltaTime) {
        if (!serf.currentTask || serf.currentTask.type !== 'PROCESS_ITEMS' || !serf.currentTask.building) {
            serf.currentTask?.handleOutcome(serf, 'task_invalidated_in_state', { reason: "No valid ProcessItemsTask or building in WorkingAtBuildingState" });
            serf.transitionToState(SERF_ACTION_STATES.IDLE);
            return;
        }

        const task = serf.currentTask;
        const building = task.building;

        if (!building || !building.isConstructed) {
            task.handleOutcome(serf, 'building_invalidated', { buildingId: building?.id });
            serf.transitionToState(SERF_ACTION_STATES.IDLE);
            return;
        }
        
        if (task.status === TASK_STATUS.CANCELLED || task.status === TASK_STATUS.COMPLETED || task.status === TASK_STATUS.FAILED) {
            serf.transitionToState(SERF_ACTION_STATES.IDLE);
            return;
        }


        if (!building.hasSufficientInputMaterials()) {
            task.handleOutcome(serf, 'processed_cycle_ran_out_of_input');
            return;
        }

        if (!building.hasSpaceForOutput()) {
            task.handleOutcome(serf, 'processed_cycle_output_full');
            return;
        }

        this.processingTimer += deltaTime;

        if (this.processingTimer >= (building.buildingTypeData.processingTime / 1000)) {
            this.processingTimer = 0;

            const processOutcome = building.processCycle();

            switch (processOutcome) {
                case 'success':
                    if (!building.hasSufficientInputMaterials()) {
                        task.handleOutcome(serf, 'processed_cycle_ran_out_of_input');
                    } else if (!building.hasSpaceForOutput()) {
                        task.handleOutcome(serf, 'processed_cycle_output_full');
                    }
                    break;
                case 'ran_out_of_input':
                    task.handleOutcome(serf, 'processed_cycle_ran_out_of_input');
                    break;
                case 'output_full':
                    task.handleOutcome(serf, 'processed_cycle_output_full');
                    break;
                case 'failed_internal_error':
                default:
                    task.handleOutcome(serf, 'processing_failed', { reason: `Building.processCycle returned: ${processOutcome}` });
                    break;
            }
        }
    }

    exit(serf) {
        this.processingTimer = 0;
    }
}

export default WorkingAtBuildingState;
