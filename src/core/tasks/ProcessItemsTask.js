import Task, { TASK_STATUS, TASK_TYPES } from './Task.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';

class ProcessItemsTask extends Task {
    constructor(building) {
        super(TASK_TYPES.PROCESS_ITEMS, null, building, `Processing items at ${building.name || building.type}`);
        // this.building = building; // building is now set as targetEntity in super()
        // this.description = `Processing items at ${building.name || building.type}`; // description is set in super()
    }

    canBeExecutedBy(serf) {
        const building = this.targetEntity; // Use targetEntity
        if (!building || !building.isConstructed || !building.buildingTypeData) {
            // // console.warn(`ProcessItemsTask ${this.id}: Building is invalid or not constructed.`);
            return false;
        }

        if (serf.serfType !== building.buildingTypeData.jobProfession) {
            // // console.warn(`ProcessItemsTask ${this.id}: Serf ${serf.id} has wrong profession (${serf.serfType}) for ${building.buildingTypeData.jobProfession}.`);
            return false;
        }

        // Check for required tool (basic check, assumes serf.hasTool is managed)
        if (building.buildingTypeData.requiredTool && !serf.hasTool) {
            // // console.warn(`ProcessItemsTask ${this.id}: Serf ${serf.id} missing required tool ${building.buildingTypeData.requiredTool}.`);
            // TODO: Add logic for serf to fetch tool if needed
            return false;
        }

        // Check if building has enough input materials for one cycle
        if (typeof building.hasSufficientInputMaterials !== 'function' || !building.hasSufficientInputMaterials()) {
            // // console.log(`ProcessItemsTask ${this.id}: Building ${building.id} does not have sufficient input materials.`);
            return false;
        }

        // Check if building has space for output of one cycle
        if (typeof building.hasSpaceForOutput !== 'function' || !building.hasSpaceForOutput()) {
            // // console.log(`ProcessItemsTask ${this.id}: Building ${building.id} does not have space for output.`);
            return false;
        }
        
        // Check if serf's inventory is not full (in case it needs to pick up something, though usually not for processing)
        const currentInventorySize = Object.values(serf.inventory).reduce((sum, count) => sum + count, 0);
        if (currentInventorySize >= serf.maxInventoryCapacity) {
            // // console.log(`ProcessItemsTask ${this.id}: Serf ${serf.id} inventory is full.`);
            return false; 
        }

        return true;
    }

    onAssign(serf) {
        super.onAssign(serf); // Sets assignedSerf, status to PENDING then ACTIVE by default if enter is called by state machine
        const building = this.targetEntity; // Use targetEntity

        // console.log(`ProcessItemsTask ${this.id} assigned to Serf ${serf.id} for building ${building.id} (${building.name}).`);
        serf.jobBuilding = building; // Ensure serf knows its primary workplace for this task

        // Determine if serf needs to move to the building
        // Assuming building.getPosition() returns {x, y} grid coordinates
        const buildingPos = building.getPosition();
        if (serf.x === buildingPos.x && serf.y === buildingPos.y) {
            serf.changeState(SERF_ACTION_STATES.WORKING_AT_BUILDING);
        } else {
            serf.target = buildingPos;
            // Store necessary details for MovingToTargetState to know what to do upon arrival
            serf.taskDetails = { // Using taskDetails for compatibility with potential existing states
                ...serf.taskDetails,
                nextState: SERF_ACTION_STATES.WORKING_AT_BUILDING,
                targetBuilding: building // Pass building ref if needed by moving state or next state
            };
            serf.changeState(SERF_ACTION_STATES.MOVING_TO_TARGET);
        }
    }

    isComplete() {
        return this.status === TASK_STATUS.COMPLETED ||
               this.status === TASK_STATUS.FAILED ||
               this.status === TASK_STATUS.CANCELLED;
    }

    handleOutcome(serf, outcome, details = {}) {
        const building = this.targetEntity; // Use targetEntity
        // console.log(`ProcessItemsTask ${this.id} for building ${building.id} outcome: ${outcome}`, details);
        
        switch (outcome) {
            case 'processed_cycle_ran_out_of_input':
            case 'processed_cycle_output_full':
            case 'processing_halted_no_input': // From WorkingAtBuildingState if it can't even start a cycle
            case 'processing_halted_output_full': // From WorkingAtBuildingState
                this.status = TASK_STATUS.COMPLETED; // Task considered done for now, new one can be made if conditions change
                break;
            case 'building_error':
            case 'processing_failed':
                this.status = TASK_STATUS.FAILED;
                break;
            case 'cancelled_by_serf_manager':
            case 'cancelled_job_change':
            case 'cancelled':
                this.status = TASK_STATUS.CANCELLED;
                break;
            default:
                // console.warn(`ProcessItemsTask ${this.id}: Unhandled outcome '''${outcome}'''. Setting to FAILED.`);
                this.status = TASK_STATUS.FAILED;
                break;
        }

        // Clear task from serf. Serf's jobBuilding might persist if they are still employed there.
        if (serf.currentTask === this) {
            serf.currentTask = null;
        }
        // Task details on serf should be cleared or managed by the state transition
        // serf.taskDetails = {}; 

        if (this.status !== TASK_STATUS.ACTIVE && this.status !== TASK_STATUS.PENDING) { // Ensure serf goes idle if task is truly over
             if (serf.currentState.name !== SERF_ACTION_STATES.IDLE) {
                serf.changeState(SERF_ACTION_STATES.IDLE);
            }
        }
        this.cleanup();
    }
}

export default ProcessItemsTask;
