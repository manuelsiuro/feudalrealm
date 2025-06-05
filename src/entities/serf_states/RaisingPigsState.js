// UNUSED/INCOMPLETE: This serf state is a stub implementation for pig raising feature
// TODO: Either implement pig raising logic or remove if this feature is not part of current game design
import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
class RaisingPigsState extends SerfState {
    constructor() { super(SERF_ACTION_STATES.RAISING_PIGS); }
    execute(serf, deltaTime) { 
        // STUB: Logic from _handleRaisingPigsState needs to be implemented
        console.warn('RaisingPigsState.execute() is not implemented - pig raising feature incomplete');
    }
}
export default RaisingPigsState;
