import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class DroppingOffResourceState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.DROPPING_OFF_RESOURCE); }
    execute(serf, deltaTime) { /* Logic from _handleDroppingOffResourceState */ }
}
export default DroppingOffResourceState;
