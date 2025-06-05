// UNUSED/INCOMPLETE: This serf state is a stub implementation
// TODO: Either implement the logic or remove if not needed in current game design
import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class SearchingForResourceState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.SEARCHING_FOR_RESOURCE_ON_MAP); }
    execute(serf, deltaTime) { 
        // STUB: Logic from _handleSearchingForResourceOnMapState needs to be implemented
        console.warn('SearchingForResourceState.execute() is not implemented');
    }
}
export default SearchingForResourceState;
