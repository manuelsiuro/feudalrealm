import Task, { TASK_STATUS, TASK_TYPES } from './Task.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
import { SERF_PROFESSIONS } from '../../config/serfProfessions.js';
import resourceManager from '../resourceManager.js'; // To add resources to global stockpile

export default class TransportResourceTask extends Task {
    constructor(serfToTransport, destinationBuilding, priority = null) { // Higher priority than gathering
        const itemsToTransport = JSON.parse(JSON.stringify(serfToTransport.inventory)); // Deep copy
        const itemSummary = Object.entries(itemsToTransport)
            .map(([type, count]) => `${count} ${type}`)
            .join(', ');

        super(TASK_TYPES.TRANSPORT_RESOURCE, priority, destinationBuilding, `Transport ${itemSummary} to ${destinationBuilding.info.name}`);
        // this.type = 'TRANSPORT_RESOURCE'; // Type is set in super constructor

        this.serfId = serfToTransport.id; // The ID of the serf whose inventory is being transported
        this.itemsToTransport = itemsToTransport; // The specific items and amounts
        this.destinationBuilding = destinationBuilding; // Building instance
        this.requiredProfession = null; // Any serf can transport their own goods, or specifically Transporters
                                        // For now, let's assume the serf who gathered does the transport.
                                        // If we want dedicated transporters for items dropped on ground, this changes.
    }

    canBeExecutedBy(serf) {
        // This task is typically created for a specific serf who has items.
        if (serf.id !== this.serfId) {
            // // console.log(`TransportResourceTask ${this.id}: Serf ${serf.id} is not the designated serf ${this.serfId}.`);
            return false;
        }

        const inventorySize = Object.values(serf.inventory).reduce((sum, count) => sum + count, 0);
        if (inventorySize === 0) {
            // // console.log(`TransportResourceTask ${this.id}: Serf ${serf.id} has an empty inventory.`);
            return false; // No items to transport
        }

        // Ensure the items this task was created for roughly match current inventory
        // This is a sanity check; the task should only be assigned if the serf has these items.
        for (const resourceType in this.itemsToTransport) {
            if (!serf.inventory[resourceType] || serf.inventory[resourceType] < this.itemsToTransport[resourceType]) {
                // // console.warn(`TransportResourceTask ${this.id}: Serf ${serf.id} inventory mismatch for ${resourceType}. Expected: ${this.itemsToTransport[resourceType]}, Has: ${serf.inventory[resourceType] || 0}`);
                // This might mean the serf used/dropped items elsewhere. Task might need to be failed or adjusted.
                // For now, we'll proceed if they have *at least some* of what was expected,
                // and the deposit state will handle depositing what they actually have.
            }
        }
        
        if (!this.destinationBuilding || !this.destinationBuilding.isConstructed) {
            // console.warn(`TransportResourceTask ${this.id}: Destination building ${this.destinationBuilding ? this.destinationBuilding.id : 'N/A'} is invalid or not constructed.`);
            return false;
        }

        return true;
    }

    onAssign(serf) {
        super.onAssign(serf); // Sets status to ACTIVE and assigns serf
        
        serf.targetBuilding = this.destinationBuilding;
        serf.taskDetails = {
            itemsToDeposit: JSON.parse(JSON.stringify(serf.inventory)), // What the serf currently has
            destinationBuildingId: this.destinationBuilding.id
        };
        // Assuming MOVING_TO_DEPOSIT_BUILDING is the correct state.
        // It might be MOVING_TO_RESOURCE_DROPOFF or a new state if behavior is different.
        serf.changeState(SERF_ACTION_STATES.MOVING_TO_DEPOSIT_BUILDING); 
        // console.log(`TransportResourceTask ${this.id} assigned to Serf ${serf.id}. Transporting to ${this.destinationBuilding.info.name}.`);
    }

    // Called by DepositingResourceInBuildingState (or similar)
    handleOutcome(serf, outcome, depositedItems = null) {
        // console.log(`TransportResourceTask ${this.id} (Serf ${serf.id}): Outcome - ${outcome}.`);

        switch (outcome) {
            case 'deposit_complete':
                this.status = TASK_STATUS.COMPLETED;
                if (depositedItems) {
                    // console.log(`TransportResourceTask ${this.id}: Successfully deposited items by serf ${serf.id}:`, depositedItems);
                    // The DepositingResourceInBuildingState should have already updated the global resourceManager
                    // and cleared the serf's inventory for the deposited items.
                }
                break;
            case 'path_not_found':
            case 'destination_invalid':
            case 'cannot_deposit': // e.g., building inventory full, if that's a mechanic
                this.status = TASK_STATUS.FAILED;
                // console.warn(`TransportResourceTask ${this.id} FAILED for serf ${serf.id}. Reason: ${outcome}. Serf keeps inventory.`);
                // Serf keeps inventory, SerfManager might try to find another drop-off or re-evaluate.
                break;
            default:
                // console.warn(`TransportResourceTask ${this.id}: Unknown outcome '${outcome}'. Setting status to FAILED.`);
                this.status = TASK_STATUS.FAILED;
                break;
        }

        if (serf) {
            serf.targetBuilding = null;
            serf.taskDetails = {};
            // If task COMPLETED, serf's inventory should be empty or reduced by depositedItems.
            // If FAILED, serf keeps inventory.
            serf.changeState(SERF_ACTION_STATES.IDLE);
        }
    }

    isComplete() {
        return this.status === TASK_STATUS.COMPLETED ||
               this.status === TASK_STATUS.FAILED ||
               this.status === TASK_STATUS.CANCELLED;
    }
}
