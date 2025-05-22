import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class MovingToPickupLocationState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.MOVING_TO_PICKUP_LOCATION); }
    execute(serf, deltaTime) { /* Logic from _handleMovingToPickupLocationState & _moveAlongPath */ }
}
export default MovingToPickupLocationState;
