// UNUSED/INCOMPLETE: This serf state is a stub implementation
// TODO: Either implement the logic or remove if this generic state is not needed
import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class PerformingTaskState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.PERFORMING_TASK); }
    execute(serf, deltaTime) { 
        // STUB: Logic from _handlePerformingTaskState needs to be implemented
        console.warn('PerformingTaskState.execute() is not implemented - generic task state incomplete');
    }
}
export default PerformingTaskState;
