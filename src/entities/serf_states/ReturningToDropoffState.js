// UNUSED/INCOMPLETE: This serf state is a stub implementation
// TODO: Either implement the movement logic or remove if this state is redundant
import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class ReturningToDropoffState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.RETURNING_TO_DROPOFF); }
    execute(serf, deltaTime) { 
        // STUB: Logic from _handleReturningToDropoffState & _moveAlongPath needs to be implemented
        console.warn('ReturningToDropoffState.execute() is not implemented');
    }
}
export default ReturningToDropoffState;
