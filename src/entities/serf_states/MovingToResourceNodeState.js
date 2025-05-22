import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class MovingToResourceNodeState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.MOVING_TO_RESOURCE_NODE); }
    execute(serf, deltaTime) { /* Logic from _handleMovingToResourceNodeState & _moveAlongPath */ }
}
export default MovingToResourceNodeState;
