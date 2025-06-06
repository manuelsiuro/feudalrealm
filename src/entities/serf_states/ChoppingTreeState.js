// src/entities/serf_states/ChoppingTreeState.js
import SerfState from './SerfState.js';
import { RESOURCE_TYPES } from '../../config/resourceTypes.js';
import ReturningCarriedResourceState from './ReturningCarriedResourceState.js';
import IdleState from './IdleState.js'; // Fallback

export default class ChoppingTreeState extends SerfState {
    constructor(serf, targetTree, choppingDuration) {
        super(serf);
        this.targetTree = targetTree;
        this.choppingDuration = choppingDuration;
        this.elapsedTime = 0;
        this.name = 'ChoppingTree';
    }

    enter() {
        console.log(`${this.serf.id} entering ChoppingTreeState for tree ${this.targetTree.id}`);
        this.elapsedTime = 0;
        // Potentially play an animation or sound
        if (this.serf.model && typeof this.serf.model.playAnimation === 'function') {
            this.serf.model.playAnimation('Chopping'); // Assuming 'Chopping' animation exists
        }
    }

    update(deltaTime) {
        this.elapsedTime += deltaTime;

        if (this.elapsedTime >= this.choppingDuration) {
            console.log(`${this.serf.id} finished chopping tree ${this.targetTree.id}`);

            // 1. Remove or mark the tree as felled
            // This will likely involve the game's map or a nature manager
            if (this.serf.game && this.serf.game.map && typeof this.serf.game.map.removeTree === 'function') {
                this.serf.game.map.removeTree(this.targetTree);
            } else if (this.serf.game && this.serf.game.natureManager && typeof this.serf.game.natureManager.removeTree === 'function') {
                this.serf.game.natureManager.removeTree(this.targetTree);
            } else {
                console.warn("ChoppingTreeState: Could not find a method to remove the tree.");
                // Fallback: mark tree as felled if possible
                if (this.targetTree && typeof this.targetTree.setFelled === 'function') {
                    this.targetTree.setFelled(true);
                }
            }
            
            // 2. Serf "collects" a wood resource
            this.serf.carriedResource = { type: RESOURCE_TYPES.WOOD.key, amount: 1 };
            console.log(`${this.serf.id} collected 1 WOOD. Inventory:`, this.serf.carriedResource);

            // 3. Transition to ReturningCarriedResourceState
            if (this.serf.assignedBuilding) {
                this.serf.setState(new ReturningCarriedResourceState(this.serf, this.serf.assignedBuilding));
            } else {
                console.error(`${this.serf.id} (${this.serf.serfType}) has no assignedBuilding to return the ${this.serf.carriedResource.type} to. Idling with resource.`);
                // Serf will keep the resource and idle. This might require manual intervention or further logic.
                this.serf.setState(new IdleState(this.serf));
            }

        }
        // Continue chopping animation or logic
    }

    exit() {
        console.log(`${this.serf.id} exiting ChoppingTreeState`);
        if (this.serf.model && typeof this.serf.model.stopAnimation === 'function') {
            this.serf.model.stopAnimation('Chopping');
        }
        // Any other cleanup
    }
}