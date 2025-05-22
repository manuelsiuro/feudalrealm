import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class RaisingPigsState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.RAISING_PIGS); }
    execute(serf, deltaTime) { /* Logic from _handleRaisingPigsState */ }
}
export default RaisingPigsState;
