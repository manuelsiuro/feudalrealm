import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class DepositingResourceInBuildingState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.DEPOSITING_RESOURCE_IN_BUILDING); }
    execute(serf, deltaTime) { /* Logic from _handleDepositingResourceInBuildingState */ }
}
export default DepositingResourceInBuildingState;
