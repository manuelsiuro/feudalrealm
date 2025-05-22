import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class PerformingTaskState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.PERFORMING_TASK); }
    execute(serf, deltaTime) { /* Logic from _handlePerformingTaskState */ }
}
export default PerformingTaskState;
