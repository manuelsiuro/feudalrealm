// src/core/tasks/Task.js

/** @private Counter for generating unique task IDs */
let nextTaskId = 1;

/**
 * @enum {string}
 * @readonly
 * @description Represents the possible statuses of a task.
 */
export const TASK_STATUS = {
    /** Task is waiting for a serf to be assigned. */
    PENDING: 'PENDING',     
    /** Task is assigned to a serf and is currently being processed. */
    ACTIVE: 'ACTIVE',       
    /** Task has been successfully finished by a serf. */
    COMPLETED: 'COMPLETED',   
    /** Task could not be completed due to an error or unmet condition. */
    FAILED: 'FAILED',       
    /** Task was explicitly cancelled before completion. */
    CANCELLED: 'CANCELLED'    
};

/**
 * @enum {string}
 * @readonly
 * @description Defines the different types of tasks available in the game.
 */
export const TASK_TYPES = {
    /** Task for constructing a new building. */
    CONSTRUCT_BUILDING: 'CONSTRUCT_BUILDING',
    /** Task for gathering a resource from a natural resource node (e.g., tree, stone deposit). */
    GATHER_RESOURCE_FROM_NODE: 'GATHER_RESOURCE_FROM_NODE',
    /** Task for transporting a resource from one location (e.g., building) to another. */
    TRANSPORT_RESOURCE: 'TRANSPORT_RESOURCE',
    /** Task for a Forester to plant a sapling. */
    PLANT_SAPLING: 'PLANT_SAPLING',
    /** Generic task for a serf to perform work at a building (e.g., production, research). */
    WORK_AT_BUILDING: 'WORK_AT_BUILDING', 
    // Add more task types as needed
};

/**
 * @class Task
 * @classdesc Base class for all tasks that can be assigned to Serfs.
 * Manages task lifecycle, priority, and assignment.
 */
class Task {
    /**
     * Creates an instance of Task.
     * @param {TASK_TYPES} type - The type of the task.
     * @param {number} [priority=0] - The priority of the task (higher numbers are typically higher priority).
     * @param {object|null} [targetEntity=null] - The primary entity associated with this task (e.g., a Building instance, a resource node object).
     * @property {string} id - Unique identifier for this task instance.
     * @property {TASK_TYPES} type - The type of this task.
     * @property {number} priority - The priority of this task.
     * @property {object|null} targetEntity - The main entity this task relates to.
     * @property {Serf|null} assignedSerf - The serf currently assigned to this task, if any.
     * @property {TASK_STATUS} status - The current status of the task.
     * @property {number} creationTime - Timestamp of when the task was created.
     */
    constructor(type, priority = 0, targetEntity = null) {
        this.id = `task-${nextTaskId++}`;
        this.type = type; 
        this.priority = priority; 
        this.targetEntity = targetEntity; 
        this.assignedSerf = null;
        this.status = TASK_STATUS.PENDING;

        this.creationTime = Date.now();
    }

    /**
     * Checks if a given serf can execute this task.
     * Base implementation checks if the serf is idle.
     * Subclasses should override this for specific requirements (e.g., profession, tools).
     * @param {Serf} serf - The serf to check.
     * @returns {boolean} True if the serf can execute the task, false otherwise.
     */
    canBeExecutedBy(serf) {
        // Assumes serf.currentState.name exists and reflects SERF_ACTION_STATES
        return serf.currentState.name === 'IDLE' && !serf.currentTask; 
    }

    /**
     * Called when the task is assigned to a serf.
     * Sets the task status to ACTIVE and links the serf.
     * @param {Serf} serf - The serf assigned to this task.
     */
    onAssign(serf) {
        this.assignedSerf = serf;
        this.status = TASK_STATUS.ACTIVE;
        // console.log(`Task ${this.id} (${this.type}) assigned to Serf ${serf.id}`);
    }

    /**
     * Called periodically by the assigned serf's current state (typically IdleState)
     * to update the task's logic or guide the serf.
     * Subclasses should implement the core logic of how the task progresses.
     * This method can change the serf's state via `serf.changeState()`.
     * @param {Serf} serf - The serf executing the task.
     * @param {number} deltaTime - The time elapsed since the last update, in seconds.
     */
    onUpdate(serf, deltaTime) {
        // Subclasses implement this.
    }

    /**
     * Checks if the task is complete.
     * Subclasses must implement this method to define completion criteria.
     * @param {Serf} serf - The serf executing the task.
     * @returns {boolean} True if the task is complete, false otherwise.
     * @abstract
     */
    isComplete(serf) {
        throw new Error("Method 'isComplete()' must be implemented by subclasses.");
    }

    /**
     * Called when the task is successfully completed.
     * Sets the task status to COMPLETED and unassigns the serf.
     * @param {Serf} serf - The serf that completed the task.
     */
    onComplete(serf) {
        this.status = TASK_STATUS.COMPLETED;
        // console.log(`Task ${this.id} (${this.type}) completed by Serf ${serf.id}`);
        if (this.assignedSerf && this.assignedSerf.id === serf.id) {
            this.assignedSerf.currentTask = null; 
        }
        // Note: Serf should be made IDLE by its state that detected task completion.
    }

    /**
     * Called if the task fails.
     * Sets the task status to FAILED and unassigns the serf.
     * @param {Serf} serf - The serf that was attempting the task, if any.
     */
    onFail(serf) {
        this.status = TASK_STATUS.FAILED;
        console.warn(`Task ${this.id} (${this.type}) failed. Assigned serf: ${serf ? serf.id : 'none'}`);
        if (this.assignedSerf && serf && this.assignedSerf.id === serf.id) {
            this.assignedSerf.currentTask = null;
            // Serf should transition to IDLE if not already handled by the state that detected failure.
            // if (serf.currentState.name !== 'IDLE') serf.changeState('IDLE');
        }
    }
    
    /**
     * Called if the task is cancelled.
     * Sets the task status to CANCELLED and unassigns the serf.
     * The serf should typically transition to IDLE.
     */
    onCancel() {
        this.status = TASK_STATUS.CANCELLED;
        // console.log(`Task ${this.id} (${this.type}) cancelled.`);
        if (this.assignedSerf) {
            this.assignedSerf.currentTask = null;
            // Ensure the serf is made idle if it was processing this task.
            // if (this.assignedSerf.currentState.name !== 'IDLE') {
            //     this.assignedSerf.changeState('IDLE');
            // }
        }
    }

    /**
     * @protected
     * Helper method for subclasses to instruct the assigned serf to move to a target location.
     * Sets the serf's targetNode and path, then changes its state to MOVING_TO_TARGET.
     * @param {Serf} serf - The serf to command.
     * @param {object} targetLocation - Grid coordinates {x, y} for the destination.
     * @param {string} nextStateAfterArrivalKey - The key (from SERF_ACTION_STATES) of the state the serf should transition to upon arrival.
     */
    _moveToLocation(serf, targetLocation, nextStateAfterArrivalKey) {
        serf.targetNode = { 
            x: targetLocation.x, 
            y: targetLocation.y, 
            taskCallbackState: nextStateAfterArrivalKey // Store where to go after moving
        };
        serf.path = serf.mapManager.findPath({ x: serf.x, y: serf.y }, targetLocation);
        if (serf.path && serf.path.length > 0) {
            serf.pathIndex = 0; // Reset pathIndex
            serf.changeState(serf.states.MOVING_TO_TARGET.name); // Use name for key
        } else {
            console.warn(`Task ${this.id}: Serf ${serf.id} could not find path to (${targetLocation.x},${targetLocation.y}). Task may fail or retry.`);
            // Task might fail or serf goes idle and task gets reassigned or retried.
            this.onFail(serf); // Example: fail the task if pathing fails critically
        }
    }
}

export default Task;
