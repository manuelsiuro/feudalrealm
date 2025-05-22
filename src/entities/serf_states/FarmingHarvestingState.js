import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class FarmingHarvestingState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.FARMING_HARVESTING); }
    execute(serf, deltaTime) { /* Logic from _handleFarmingHarvestingState */ }
}
export default FarmingHarvestingState;
