import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class ProspectingState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.PROSPECTING); }
    execute(serf, deltaTime) { /* Logic from _handleProspectingState */ }
}
export default ProspectingState;
