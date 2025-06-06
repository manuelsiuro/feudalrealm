// src/entities/serf_states/ReturningCarriedResourceState.js
import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
import DepositingCarriedResourceState from './DepositingCarriedResourceState.js'; // Will be created next

export default class ReturningCarriedResourceState extends SerfState {
    constructor(serf, destinationBuilding) {
        super(serf);
        this.name = 'ReturningCarriedResource';
        this.destinationBuilding = destinationBuilding;

        if (!this.destinationBuilding || typeof this.destinationBuilding.gridX === 'undefined' || typeof this.destinationBuilding.gridZ === 'undefined') {
            console.error(`${this.serf.id} (${this.serf.serfType}): ReturningCarriedResourceState initialized without a valid destinationBuilding.`);
            this.serf.changeState(SERF_ACTION_STATES.IDLE); // Fallback
            return;
        }
        if (!this.serf.carriedResource) {
            console.warn(`${this.serf.id} (${this.serf.serfType}): Entered ReturningCarriedResourceState without a carriedResource. Returning to IDLE.`);
            this.serf.changeState(SERF_ACTION_STATES.IDLE); // Fallback

        }
    }

    enter() {
        console.log(`${this.serf.id} (${this.serf.serfType}) entering ReturningCarriedResourceState, moving to ${this.destinationBuilding.name} at (${this.destinationBuilding.gridX}, ${this.destinationBuilding.gridZ}) with ${this.serf.carriedResource.type}.`);
        
        this.serf.target = { x: this.destinationBuilding.gridX, y: this.destinationBuilding.gridZ };
        
        // Use the serf's internal pathfinding method if available and mapManager is present
        if (this.serf.mapManager && typeof this.serf.mapManager.findPath === 'function') {
            this.serf.path = this.serf.mapManager.findPath({ x: this.serf.x, y: this.serf.y }, this.serf.target);
            this.serf.pathIndex = 0;

            if (!this.serf.path || this.serf.path.length === 0) {
                console.warn(`${this.serf.id} (${this.serf.serfType}) could not find a path to destination building ${this.destinationBuilding.name}. Going IDLE.`);
                this.serf.changeState(SERF_ACTION_STATES.IDLE);
            }
        } else {
            console.error(`${this.serf.id} (${this.serf.serfType}): mapManager or findPath not available for ReturningCarriedResourceState.`);
            this.serf.changeState(SERF_ACTION_STATES.IDLE);
        }
    }

    update(deltaTime) {
        if (!this.serf.path || this.serf.pathIndex >= this.serf.path.length) {
            // This condition implies arrival or path failure, which should have been handled in enter or by _moveAlongPath
            // If somehow still here, and at target, transition. Otherwise, idle.
            if (this.serf.x === this.serf.target.x && this.serf.y === this.serf.target.y) {
                console.log(`${this.serf.id} (${this.serf.serfType}) arrived at ${this.destinationBuilding.name}. Transitioning to DepositingCarriedResourceState.`);
                this.serf.setState(new DepositingCarriedResourceState(this.serf, this.destinationBuilding));
            } else {
                console.warn(`${this.serf.id} (${this.serf.serfType}) in ReturningCarriedResourceState with no valid path and not at target. Idling.`);
                this.serf.changeState(SERF_ACTION_STATES.IDLE);
            }
            return;
        }

        const arrived = this.serf._moveAlongPath(deltaTime); // Assuming _moveAlongPath exists and returns true on arrival

        if (arrived) {
            console.log(`${this.serf.id} (${this.serf.serfType}) arrived at ${this.destinationBuilding.name}. Transitioning to DepositingCarriedResourceState.`);
            // Ensure serf's x, y are updated by _moveAlongPath before this check
             if (this.serf.x === this.serf.target.x && this.serf.y === this.serf.target.y) {
                this.serf.setState(new DepositingCarriedResourceState(this.serf, this.destinationBuilding));
             } else {
                 console.error(`${this.serf.id} _moveAlongPath reported arrival, but serf not at target. Pos: (${this.serf.x},${this.serf.y}), Target: (${this.serf.target.x},${this.serf.target.y}). Idling.`);
                 this.serf.changeState(SERF_ACTION_STATES.IDLE);
             }
        }
    }

    exit() {
        console.log(`${this.serf.id} (${this.serf.serfType}) exiting ReturningCarriedResourceState.`);
        this.serf.path = null;
        this.serf.pathIndex = 0;
        // this.serf.target should be cleared by the next state or if idling
    }
}