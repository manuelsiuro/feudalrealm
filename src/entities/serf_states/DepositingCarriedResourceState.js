// src/entities/serf_states/DepositingCarriedResourceState.js
import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
import IdleState from './IdleState.js';
import { RESOURCE_TYPES } from '../../config/resourceTypes.js';
import { TASK_STATUS } from '../../core/tasks/Task.js'; // Assuming this path is correct

export default class DepositingCarriedResourceState extends SerfState {
    constructor(serf, depositBuilding) {
        super(serf);
        this.name = 'DepositingCarriedResource';
        this.depositBuilding = depositBuilding;
        this.depositDuration = 1000; // milliseconds, e.g., 1 second to deposit
        this.elapsedTime = 0;

        if (!this.depositBuilding) {
            console.error(`${this.serf.id} (${this.serf.serfType}): DepositingCarriedResourceState initialized without a valid depositBuilding.`);
            this.serf.changeState(SERF_ACTION_STATES.IDLE);
            return;
        }
        if (!this.serf.carriedResource) {
            console.warn(`${this.serf.id} (${this.serf.serfType}): Entered DepositingCarriedResourceState without a carriedResource. Idling.`);
            this.serf.changeState(SERF_ACTION_STATES.IDLE);
            return;
        }
    }

    enter() {
        console.log(`${this.serf.id} (${this.serf.serfType}) entering DepositingCarriedResourceState at ${this.depositBuilding.name}. Resource: ${this.serf.carriedResource.type}, Amount: ${this.serf.carriedResource.amount}`);
        this.elapsedTime = 0;
        // Play deposit animation if available
        if (this.serf.model && typeof this.serf.model.playAnimation === 'function') {
            this.serf.model.playAnimation('Depositing'); // Assuming 'Depositing' animation exists
        }
    }

    update(deltaTime) {
        this.elapsedTime += deltaTime;

        if (this.elapsedTime >= this.depositDuration) {
            const resourceType = this.serf.carriedResource.type;
            const amount = this.serf.carriedResource.amount;

            // Attempt to add resource to the building's inventory or output buffer
            let depositedSuccessfully = false;
            if (typeof this.depositBuilding.addResourceToStock === 'function') {
                // Prefer a method that handles stock limits and specific resource types
                depositedSuccessfully = this.depositBuilding.addResourceToStock(resourceType, amount);
            } else if (this.depositBuilding.inventory && typeof this.depositBuilding.inventory.add === 'function') {
                // Fallback to a generic inventory add method
                this.depositBuilding.inventory.add(resourceType, amount);
                depositedSuccessfully = true; // Assume success if no return value indicates failure
            } else if (this.depositBuilding.outputBuffer && typeof this.depositBuilding.outputBuffer.addResource === 'function') {
                // Fallback for buildings with output buffers
                 this.depositBuilding.outputBuffer.addResource(resourceType, amount);
                 depositedSuccessfully = true; // Assume success
            }
             else {
                console.warn(`${this.serf.id} (${this.serf.serfType}): Deposit building ${this.depositBuilding.name} has no recognized method to add resources (addResourceToStock, inventory.add, outputBuffer.addResource).`);
            }

            if (depositedSuccessfully) {
                console.log(`${this.serf.id} (${this.serf.serfType}) successfully deposited ${amount} ${resourceType} into ${this.depositBuilding.name}.`);
                this.serf.carriedResource = null; // Clear carried resource

                // Woodcutter specific logic to find a new tree
                const woodcuttersHut = this.depositBuilding;
                if (woodcuttersHut && woodcuttersHut.type === 'WOODCUTTERS_HUT' && this.serf.serfType === 'WOODCUTTER') {
                    const searchRadius = woodcuttersHut.info.workingRadius;
                    const choppingDuration = woodcuttersHut.info.choppingDurationMs;

                    if (!this.serf.game || !this.serf.game.map || typeof this.serf.game.map.findClosestTreeInRadius !== 'function') {
                        console.error(`${this.serf.id} (${this.serf.serfType}): Serf's game.map.findClosestTreeInRadius method is not available. Idling.`);
                        this.serf.setState(new IdleState(this.serf));
                        return; // Exit update method
                    }
                    if (!woodcuttersHut.model || !woodcuttersHut.model.position) {
                        console.error(`${this.serf.id} (${this.serf.serfType}): Woodcutter's Hut model or position not available for tree search. Idling.`);
                        this.serf.setState(new IdleState(this.serf));
                        return; // Exit update method
                    }
                     if (searchRadius === undefined || choppingDuration === undefined) {
                        console.error(`${this.serf.id} (${this.serf.serfType}): Woodcutter's Hut info (workingRadius or choppingDurationMs) is missing. Idling.`);
                        this.serf.setState(new IdleState(this.serf));
                        return; // Exit update method
                    }

                    const tree = this.serf.game.map.findClosestTreeInRadius(
                        woodcuttersHut.model.position,
                        searchRadius,
                        RESOURCE_TYPES.TREE
                    );

                    if (tree) {
                        console.log(`${this.serf.id} (${this.serf.serfType}) found new tree ${tree.id} at (${tree.x}, ${tree.z}). Transitioning to move.`);
                        this.serf.currentTask = {
                            id: `chop-${tree.id}-${Date.now()}`,
                            type: 'GATHER_RESOURCE',
                            targetResourceNode: tree,
                            resourceType: RESOURCE_TYPES.TREE,
                            choppingDuration: choppingDuration,
                            status: TASK_STATUS.ACTIVE,
                            originBuildingId: woodcuttersHut.id
                        };
                        this.serf.changeState(SERF_ACTION_STATES.MOVING_TO_RESOURCE_NODE);
                    } else {
                        console.log(`${this.serf.id} (${this.serf.serfType}) found no trees in radius of ${woodcuttersHut.name}. Idling.`);
                        this.serf.setState(new IdleState(this.serf));
                    }
                } else {
                    // Default behavior for non-woodcutters or if hut info is missing (after successful deposit)
                    this.serf.setState(new IdleState(this.serf));
                }
            } else {
                // Failed to deposit
                console.warn(`${this.serf.id} (${this.serf.serfType}): Failed to deposit ${amount} ${resourceType} into ${this.depositBuilding.name} (perhaps full or wrong type). Serf will keep resource and idle.`);
                // Serf keeps the resource and will likely try again or get stuck if building remains full.
                // A more robust system might have the serf wait or find alternative storage.
                this.serf.setState(new IdleState(this.serf));
            }
            return; // This return is for the `if (this.elapsedTime >= this.depositDuration)` block
        }
    }

    exit() {
        console.log(`${this.serf.id} (${this.serf.serfType}) exiting DepositingCarriedResourceState.`);
        if (this.serf.model && typeof this.serf.model.stopAnimation === 'function') {
            this.serf.model.stopAnimation('Depositing');
        }
    }
}