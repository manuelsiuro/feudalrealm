import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class FarmingPlantingState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.FARMING_PLANTING); }
    execute(serf, deltaTime) { /* Logic from _handleFarmingPlantingState */ }
}
export default FarmingPlantingState;
