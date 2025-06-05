// UNUSED/INCOMPLETE: This serf state is a stub implementation
// TODO: Either implement the movement logic or remove if redundant with other movement states
import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class MovingToPickupLocationState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.MOVING_TO_PICKUP_LOCATION); }
    execute(serf, deltaTime) { 
        // STUB: Logic from _handleMovingToPickupLocationState & _moveAlongPath needs to be implemented
        console.warn('MovingToPickupLocationState.execute() is not implemented');
    }
}
export default MovingToPickupLocationState;
