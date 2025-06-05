// UNUSED/INCOMPLETE: This serf state is a stub implementation
// TODO: Either implement the logic or remove if not needed in current game design
import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class PickingUpResourceState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.PICKING_UP_RESOURCE); }
    execute(serf, deltaTime) { 
        // STUB: Logic from _handlePickingUpResourceState needs to be implemented
        console.warn('PickingUpResourceState.execute() is not implemented');
    }
}
export default PickingUpResourceState;
