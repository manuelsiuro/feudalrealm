import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class MovingToDepositBuildingState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.MOVING_TO_DEPOSIT_BUILDING); }
    execute(serf, deltaTime) { /* Logic from _handleMovingToDepositBuildingState & _moveAlongPath */ }
}
export default MovingToDepositBuildingState;
