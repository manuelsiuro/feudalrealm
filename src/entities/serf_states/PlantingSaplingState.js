import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class PlantingSaplingState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.PLANTING_SAPLING); }
    execute(serf, deltaTime) { /* Logic from _handlePlantingSaplingState */ }
}
export default PlantingSaplingState;
