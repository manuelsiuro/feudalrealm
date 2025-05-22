import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class ReturningToDropoffState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.RETURNING_TO_DROPOFF); }
    execute(serf, deltaTime) { /* Logic from _handleReturningToDropoffState & _moveAlongPath */ }
}
export default ReturningToDropoffState;
