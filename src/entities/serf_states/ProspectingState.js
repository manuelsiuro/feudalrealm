// UNUSED/INCOMPLETE: This serf state is a stub implementation
// TODO: Either implement the logic or remove if not needed in current game design
import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class ProspectingState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.PROSPECTING); }
    execute(serf, deltaTime) { 
        // STUB: Logic from _handleProspectingState needs to be implemented
        console.warn('ProspectingState.execute() is not implemented');
    }
}
export default ProspectingState;
