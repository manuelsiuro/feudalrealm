import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class SearchingForResourceState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.SEARCHING_FOR_RESOURCE_ON_MAP); }
    execute(serf, deltaTime) { /* Logic from _handleSearchingForResourceOnMapState */ }
}
export default SearchingForResourceState;
