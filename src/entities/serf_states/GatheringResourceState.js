import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class GatheringResourceState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.GATHERING_RESOURCE_FROM_NODE); }
    execute(serf, deltaTime) { /* Logic from _handleGatheringResourceFromNodeState */ }
}
export default GatheringResourceState;
