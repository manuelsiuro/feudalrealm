import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class MovingToTargetTileState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.MOVING_TO_TARGET_TILE); }
    execute(serf, deltaTime) { /* Logic from _handleMovingToTargetTileState & _moveAlongPath */ }
}
export default MovingToTargetTileState;
