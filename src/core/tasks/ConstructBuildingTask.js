// src/core/tasks/ConstructBuildingTask.js
import Task, { TASK_STATUS, TASK_TYPES } from './Task.js';
import { SERF_PROFESSIONS } from '../../config/serfProfessions.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
import { BUILDING_STATE_NEEDS_CONSTRUCTION, BUILDING_STATE_UNDER_CONSTRUCTION, BUILDING_STATE_CONSTRUCTED } from '../../entities/Building.js'; // Added import

/**
 * @class ConstructBuildingTask
 * @classdesc Represents a task for a Serf to construct a building.
 * @extends Task
 */
class ConstructBuildingTask extends Task {
    /**
     * Creates an instance of ConstructBuildingTask.
     * @param {Building} buildingInstance - The instance of the building to be constructed.
     * @param {THREE.Scene} scene - The main THREE.js scene, required for progress bar.
     * @param {number} [priority] - The optional priority of this construction task. Defaults via Task base class.
     */
    constructor(buildingInstance, scene, priority) { // Added scene parameter
        super(TASK_TYPES.CONSTRUCT_BUILDING, priority, buildingInstance);
        /** @property {Building} building - The building instance this task is for. */
        this.building = buildingInstance;
        /** @property {THREE.Scene} scene - The main scene, for progress bar. */
        this.scene = scene;
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
        console.log(`[ConstructBuildingTask ON_ASSIGN] Task ${this.id} for ${this.building.name} (ID: ${this.building.id}) assigned to Serf ${serf.id}. Building state: ${this.building.currentConstructionState}`);
        
        // Command the building to start its construction process
        // The building needs the serf\'s ID and the scene (for the progress bar)
        if (this.building.currentConstructionState === BUILDING_STATE_NEEDS_CONSTRUCTION) {
            console.log(`[ConstructBuildingTask ON_ASSIGN] Calling startConstructionProcess for ${this.building.name}`);
            this.building.startConstructionProcess(serf.id, this.scene);
        } else if (this.building.currentConstructionState === BUILDING_STATE_UNDER_CONSTRUCTION && this.building.assignedBuilderId === null) {
            // If construction was somehow started but no builder is assigned (e.g. previous builder cancelled)
            // Re-assign this builder.
             this.building.assignedBuilderId = serf.id; // Directly assign if already under construction by "no one"
             console.log(`[ConstructBuildingTask ON_ASSIGN] Building ${this.building.name} was already UNDER_CONSTRUCTION, re-assigning builder ${serf.id}`);
        } else if (this.building.currentConstructionState === BUILDING_STATE_UNDER_CONSTRUCTION && this.building.assignedBuilderId !== serf.id) {
            console.warn(`[ConstructBuildingTask ON_ASSIGN] Building ${this.building.name} is already UNDER_CONSTRUCTION by another builder (${this.building.assignedBuilderId}). Serf ${serf.id} cannot take over. Task should fail or be re-evaluated.`);
            // This scenario should ideally be prevented by ConstructionManager or SerfManager logic.
            // For now, let the serf move to the site, the state logic might handle it, or it will idle.
            // Alternatively, fail the task here:
            // this.onFail(serf);
            // return;
        }


        const entryPoint = this.building.getEntryPointGridPosition();
        console.log(`[ConstructBuildingTask ON_ASSIGN] Commanding serf ${serf.id} to move to ${entryPoint.x}, ${entryPoint.z} for building ${this.building.name}`);
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

        // If the serf is at the construction site and the building is under construction by this serf
        if (serf.currentState.name === SERF_ACTION_STATES.CONSTRUCTING_BUILDING &&
            this.building.currentConstructionState === BUILDING_STATE_UNDER_CONSTRUCTION && 
            this.building.assignedBuilderId === serf.id) {
            
            const entryPoint = this.building.getEntryPointGridPosition();
            if (serf.x === entryPoint.x && serf.y === entryPoint.z) { // Serf is at the location
                 // console.log(`[ConstructBuildingTask ON_UPDATE] Serf ${serf.id} is at construction site for ${this.building.name}. Building progress handled by ConstructionManager.`);
                 // The building's updateConstructionProgress will be called by the ConstructionManager or Game loop directly.
                 // The serf's ConstructingBuildingState keeps the serf at the location.
                 // This task just needs to check if the building's state has changed to CONSTRUCTED.
            }
        }

        if (this.isComplete(serf)) { // Checks building.currentConstructionState
            console.log(`[ConstructBuildingTask ON_UPDATE] Task for ${this.building.name} is complete. Calling onComplete.`);
            this.onComplete(serf);
        } else if (serf.currentState.name === SERF_ACTION_STATES.IDLE && this.status === TASK_STATUS.ACTIVE) {
            // If serf became idle but task is still active (e.g. path failed, serf reset by other means)
            // try to re-engage the serf.
            console.log(`[ConstructBuildingTask ON_UPDATE] Task ${this.id}: Serf ${serf.id} is IDLE, re-engaging for construction of ${this.building.name}`);
            
            // Before re-engaging, ensure the building is still expecting this serf or needs one.
            if (this.building.currentConstructionState === BUILDING_STATE_NEEDS_CONSTRUCTION || 
                (this.building.currentConstructionState === BUILDING_STATE_UNDER_CONSTRUCTION && this.building.assignedBuilderId === null)) {
                if(this.building.currentConstructionState === BUILDING_STATE_NEEDS_CONSTRUCTION) {
                    console.log(`[ConstructBuildingTask ON_UPDATE] Re-engaging: Calling startConstructionProcess for ${this.building.name}`);
                    this.building.startConstructionProcess(serf.id, this.scene);
                } else {
                    this.building.assignedBuilderId = serf.id;
                    console.log(`[ConstructBuildingTask ON_UPDATE] Re-engaging: Re-assigned builder ${serf.id} to ${this.building.name}`);
                }
            } else if (this.building.currentConstructionState === BUILDING_STATE_UNDER_CONSTRUCTION && this.building.assignedBuilderId !== serf.id) {
                 console.warn(`[ConstructBuildingTask ON_UPDATE] Task ${this.id}: Cannot re-engage serf ${serf.id}. Building ${this.building.name} assigned to ${this.building.assignedBuilderId}. Failing task.`);
                 this.onFail(serf);
                 return;
            }


            const entryPoint = this.building.getEntryPointGridPosition();
            console.log(`[ConstructBuildingTask ON_UPDATE] Re-engaging: Commanding serf ${serf.id} to move to ${entryPoint.x}, ${entryPoint.z} for building ${this.building.name}`);
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
        // Check the building\'s new construction state
        return this.building.currentConstructionState === BUILDING_STATE_CONSTRUCTED; 
    }

    /**
     * Called when the construction task is successfully completed.
     * Ensures the serf becomes idle.
     * @param {Serf} serf - The serf that completed the task.
     * @override
     */
    onComplete(serf) {
        super.onComplete(serf); // Sets status to COMPLETED, clears serf.currentTask
        // Building's completeConstructionProcess should have been called by the building itself
        // when its progress reached maximum.
        // Ensure serf returns to its original hut or becomes idle.
        // For now, just make serf idle. Returning to hut can be a follow-up task or IdleState logic.
        if (serf.currentState.name !== SERF_ACTION_STATES.IDLE) {
            serf.changeState(SERF_ACTION_STATES.IDLE);
        }
        console.log(`[ConstructBuildingTask ON_COMPLETE] Task for ${this.building.name} (${this.building.id}) completed by Serf ${serf.id}. Serf state: ${serf.currentState.name}`);
    }
    
    /**
     * Called if the construction task fails.
     * @param {Serf} serf - The serf that was attempting the task, if any.
     * @override
     */
    onFail(serf) {
        super.onFail(serf); // Sets status to FAILED, clears serf.currentTask
        console.log(`[ConstructBuildingTask ON_FAIL] Task for ${this.building.name} failed. Serf: ${serf ? serf.id : 'none'}`);
        // If the task fails, and this serf was assigned, ensure the building knows no one is building it.
        if (this.building && serf && this.building.assignedBuilderId === serf.id) { // Added null check for serf
            console.log(`[ConstructBuildingTask ON_FAIL] Clearing assigned builder ${serf.id} from ${this.building.name}.`);
            this.building.assignedBuilderId = null;
            // If construction was in progress, it should be requeued by ConstructionManager.
            // We can notify ConstructionManager here or let its update loop handle it.
            // For now, we assume ConstructionManager\'s update loop will detect unassigned UNDER_CONSTRUCTION buildings.
            // Or, the building itself could emit an event that ConstructionManager listens to.
            // Simplest for now: ConstructionManager will handle it in its update loop.
            if (this.building.currentConstructionState === BUILDING_STATE_UNDER_CONSTRUCTION) {
                console.log(`[ConstructBuildingTask ON_FAIL] Building ${this.building.name} was UNDER_CONSTRUCTION. ConstructionManager should requeue it.`);
            }
        }
        if (serf && serf.currentState.name !== SERF_ACTION_STATES.IDLE) {
            serf.changeState(SERF_ACTION_STATES.IDLE);
        }
    }
    
    /**
     * Called if the construction task is cancelled.
     * Ensures the assigned serf becomes idle if the task was active.
     * @override
     */
    onCancel(serf) { // Added serf parameter, was missing
        super.onCancel(serf); // Sets status to CANCELLED, clears serf.currentTask if serf provided
        // If the task is cancelled, and a serf was assigned and actively building:
        if (this.building && this.assignedSerf && this.building.assignedBuilderId === this.assignedSerf.id) {
            console.log(`[ConstructBuildingTask ON_CANCEL] Task for ${this.building.name} cancelled. Clearing assigned builder ${this.assignedSerf.id}.`);
            this.building.assignedBuilderId = null;
            if (this.building.currentConstructionState === BUILDING_STATE_UNDER_CONSTRUCTION) {
                console.log(`[ConstructBuildingTask ON_CANCEL] Building ${this.building.name} was UNDER_CONSTRUCTION. ConstructionManager should requeue it.`);
            }
        }
        // Serf should automatically go IDLE if its currentTask becomes null and it\'s managed by Serf.js/SerfState.js logic.
        if (this.assignedSerf && this.assignedSerf.currentState.name !== SERF_ACTION_STATES.IDLE) {
            this.assignedSerf.changeState(SERF_ACTION_STATES.IDLE);
        }
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
