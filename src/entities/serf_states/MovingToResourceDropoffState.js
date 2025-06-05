// UNUSED/INCOMPLETE: This serf state is a stub implementation
// TODO: Either implement the movement logic or remove if redundant with other movement states
import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class MovingToResourceDropoffState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.MOVING_TO_RESOURCE_DROPOFF); }
    execute(serf, deltaTime) { 
        // STUB: Logic from _handleMovingToResourceDropoffState & _moveAlongPath needs to be implemented
        console.warn('MovingToResourceDropoffState.execute() is not implemented');
    }
}
export default MovingToResourceDropoffState;
