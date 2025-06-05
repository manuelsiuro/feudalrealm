// UNUSED/INCOMPLETE: This serf state is a stub implementation
// TODO: Either implement the resource dropping logic or remove if redundant
import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class DroppingOffResourceState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.DROPPING_OFF_RESOURCE); }
    execute(serf, deltaTime) { 
        // STUB: Logic from _handleDroppingOffResourceState needs to be implemented
        console.warn('DroppingOffResourceState.execute() is not implemented');
    }
}
export default DroppingOffResourceState;
