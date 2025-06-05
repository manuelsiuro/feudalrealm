// UNUSED/INCOMPLETE: This serf state is a stub implementation for farming feature
// TODO: Either implement farming logic or remove if farming is not part of current game design
import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class FarmingPlantingState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.FARMING_PLANTING); }
    execute(serf, deltaTime) { 
        // STUB: Logic from _handleFarmingPlantingState needs to be implemented
        console.warn('FarmingPlantingState.execute() is not implemented - farming feature incomplete');
    }
}
export default FarmingPlantingState;
