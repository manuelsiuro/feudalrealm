// src/core/tasks/ConstructBuildingTask.js
import Task, { TASK_STATUS, TASK_TYPES } from './Task.js';
import { SERF_PROFESSIONS } from '../../config/serfProfessions.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';

/**
 * @class ConstructBuildingTask
 * @classdesc Represents a task for a Serf to construct a building.
 * @extends Task
 */
class ConstructBuildingTask extends Task {
    /**
     * Creates an instance of ConstructBuildingTask.
     * @param {Building} buildingInstance - The instance of the building to be constructed.
     * @param {number} [priority=1] - The priority of this construction task.
     */
    constructor(buildingInstance, priority = 1) {
        super(TASK_TYPES.CONSTRUCT_BUILDING, priority, buildingInstance);
        /** @property {Building} building - The building instance this task is for. */
        this.building = buildingInstance; 
    }

    /**
     * Determines if a serf can execute this construction task.
     * Requires the serf to be a Builder, idle, and not have a current task.
     * @param {Serf} serf - The serf to check.
     * @returns {boolean} True if the serf can execute the task.
     * @override
     */
    canBeExecutedBy(serf) {
        return serf.serfType === SERF_PROFESSIONS.BUILDER && 
               serf.currentState.name === SERF_ACTION_STATES.IDLE &&
               !serf.currentTask;
    }

    /**
     * Called when the task is assigned to a serf.
     * Sets the serf's initial details and commands them to move to the construction site.
     * @param {Serf} serf - The serf assigned to this task.
     * @override
     */
    onAssign(serf) {
        super.onAssign(serf);
        // serf.taskDetails is legacy, but Task's onAssign may use it or specific task properties.
        // For this task, the important part is targetEntity (this.building) and the serf's state transition.
        // The targetLocation is derived from this.building.
        
        const entryPoint = this.building.getEntryPointGridPosition();
        this._moveToLocation(serf, {x: entryPoint.x, y: entryPoint.z}, SERF_ACTION_STATES.CONSTRUCTING_BUILDING);
    }

    /**
     * Called periodically to update the task's logic.
     * Checks if the building is complete or if the serf needs re-engagement.
     * @param {Serf} serf - The serf executing the task.
     * @param {number} deltaTime - The time since the last update.
     * @override
     */
    onUpdate(serf, deltaTime) {
        super.onUpdate(serf, deltaTime); // Base Task onUpdate does nothing by default

        if (this.building.isConstructed) {
            // This check is redundant if isComplete is called correctly by the serf's state.
            // However, keeping it as a safeguard or for direct task polling.
            this.onComplete(serf);
        } else if (serf.currentState.name === SERF_ACTION_STATES.IDLE && this.status === TASK_STATUS.ACTIVE) {
            // If serf became idle but task is still active (e.g. path failed, serf reset by other means)
            // try to re-engage the serf.
            // console.log(`Task ${this.id}: Serf ${serf.id} is IDLE, re-engaging for construction of ${this.building.name}`);
            const entryPoint = this.building.getEntryPointGridPosition();
            this._moveToLocation(serf, {x: entryPoint.x, y: entryPoint.z}, SERF_ACTION_STATES.CONSTRUCTING_BUILDING);
        }
    }

    /**
     * Checks if the construction task is complete (i.e., the building is constructed).
     * @param {Serf} serf - The serf executing the task.
     * @returns {boolean} True if the building is constructed.
     * @override
     */
    isComplete(serf) {
        return this.building.isConstructed;
    }

    /**
     * Called when the construction task is successfully completed.
     * Ensures the serf becomes idle.
     * @param {Serf} serf - The serf that completed the task.
     * @override
     */
    onComplete(serf) {
        super.onComplete(serf); // Sets status to COMPLETED, clears serf.currentTask
        if (serf.currentState.name !== SERF_ACTION_STATES.IDLE) {
            serf.changeState(SERF_ACTION_STATES.IDLE);
        }
        // console.log(`ConstructBuildingTask for ${this.building.name} (${this.building.id}) completed by Serf ${serf.id}.`);
    }
    
    /**
     * Called if the construction task fails.
     * @param {Serf} serf - The serf that was attempting the task, if any.
     * @override
     */
    onFail(serf) {
        super.onFail(serf); // Sets status to FAILED, clears serf.currentTask
        // Additional cleanup specific to construction task failure, if any.
        // Serf should automatically go IDLE if its currentTask becomes null.
    }
    
    /**
     * Called if the construction task is cancelled.
     * Ensures the assigned serf becomes idle if the task was active.
     * @override
     */
    onCancel() {
        super.onCancel(); // Sets status to CANCELLED, clears serf.currentTask
        // Serf should automatically go IDLE if its currentTask becomes null.
    }
    
    /**
     * Gets the target location for the construction task (entry point of the building).
     * @returns {{x: number, z: number}} The grid coordinates of the building's entry point.
     */
    getTargetLocation() {
        return this.building.getEntryPointGridPosition(); // y from getEntryPoint is gridZ
    }
}

export default ConstructBuildingTask;
