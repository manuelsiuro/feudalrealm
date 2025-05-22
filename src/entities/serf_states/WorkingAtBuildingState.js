import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class WorkingAtBuildingState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.WORKING_AT_BUILDING); }
    execute(serf, deltaTime) { /* Logic from _handleWorkingAtBuildingState */ }
}
export default WorkingAtBuildingState;
