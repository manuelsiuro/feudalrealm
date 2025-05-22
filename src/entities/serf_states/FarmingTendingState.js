import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class FarmingTendingState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.FARMING_TENDING); }
    execute(serf, deltaTime) { /* Logic from _handleFarmingTendingState */ }
}
export default FarmingTendingState;
