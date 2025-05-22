import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class FishingState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.FISHING); }
    execute(serf, deltaTime) { /* Logic from _handleFishingState */ }
}
export default FishingState;
