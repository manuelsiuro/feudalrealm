// src/entities/serf_states/SerfState.js

/**
 * @class SerfState
 * @classdesc Base class for all Serf states in the state machine.
 * Defines the interface for state-specific behavior.
 */
class SerfState {
    /**
     * Creates an instance of SerfState.
     * @param {string} stateName - The name of the state, typically from `SERF_ACTION_STATES`.
     * @property {string} name - The name of this state.
     */
    constructor(stateName) {
        this.name = stateName;
    }

    /**
     * Called when the serf enters this state.
     * Can be used for setup logic specific to this state.
     * @param {Serf} serf - The serf instance transitioning into this state.
     */
    enter(serf) {
        // console.log(`${serf.id} (${serf.serfType}) entering state: ${this.name}`);
    }

    /**
     * Called every frame by the Serf's update loop while the serf is in this state.
     * Contains the core logic for the state's behavior.
     * @param {Serf} serf - The serf instance.
     * @param {number} deltaTime - The time elapsed since the last frame, in seconds.
     * @abstract
     */
    execute(serf, deltaTime) {
        throw new Error("Method 'execute()' must be implemented by subclasses.");
    }

    /**
     * Called when the serf exits this state.
     * Can be used for cleanup logic specific to this state.
     * @param {Serf} serf - The serf instance transitioning out of this state.
     */
    exit(serf) {
        // console.log(`${serf.id} (${serf.serfType}) exiting state: ${this.name}`);
    }
}

export default SerfState;
