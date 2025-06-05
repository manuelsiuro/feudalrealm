// UNUSED/INCOMPLETE: This serf state is a stub implementation for fishing feature
// TODO: Either implement fishing logic or remove if fishing is not part of current game design
import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class FishingState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.FISHING); }
    execute(serf, deltaTime) { 
        // STUB: Logic from _handleFishingState needs to be implemented
        console.warn('FishingState.execute() is not implemented - fishing feature incomplete');
    }
}
export default FishingState;
