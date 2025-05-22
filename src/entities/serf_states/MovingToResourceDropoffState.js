import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class MovingToResourceDropoffState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.MOVING_TO_RESOURCE_DROPOFF); }
    execute(serf, deltaTime) { /* Logic from _handleMovingToResourceDropoffState & _moveAlongPath */ }
}
export default MovingToResourceDropoffState;
