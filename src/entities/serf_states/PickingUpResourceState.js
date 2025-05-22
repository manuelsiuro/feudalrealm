import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class PickingUpResourceState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.PICKING_UP_RESOURCE); }
    execute(serf, deltaTime) { /* Logic from _handlePickingUpResourceState */ }
}
export default PickingUpResourceState;
