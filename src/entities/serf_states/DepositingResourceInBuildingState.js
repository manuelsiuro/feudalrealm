import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
import { TASK_STATUS } from '../../core/tasks/Task.js';
import resourceManager from '../../core/resourceManager.js'; // For global resource management

class DepositingResourceInBuildingState extends SerfState {
    constructor() {
        super(SERF_ACTION_STATES.DEPOSITING_RESOURCE_IN_BUILDING);
        this.depositTimer = 0;
        this.DEPOSIT_TIME_PER_ITEM = 200; // ms per item, adjust as needed
    }

    enter(serf) {
        super.enter(serf);
        this.depositTimer = 0;

        if (!serf.currentTask || serf.currentTask.type !== 'TRANSPORT_RESOURCE' || serf.currentTask.status !== TASK_STATUS.ACTIVE) {
            console.error(`Serf ${serf.id} entered DepositingResourceInBuildingState without a valid TRANSPORT_RESOURCE task.`);
            serf.changeState(SERF_ACTION_STATES.IDLE);
            return;
        }

        const destinationBuilding = serf.currentTask.destinationBuilding;
        if (!destinationBuilding) {
            console.error(`Serf ${serf.id} has no destinationBuilding in DepositingResourceInBuildingState.`);
            serf.currentTask.handleOutcome(serf, 'deposit_failed_no_building');
            return;
        }

        const inventorySize = Object.values(serf.inventory).reduce((sum, count) => sum + count, 0);
        if (inventorySize === 0) {
            console.log(`Serf ${serf.id} has nothing to deposit.`);
            serf.currentTask.handleOutcome(serf, 'deposit_complete_empty_inventory');
            return;
        }

        console.log(`Serf ${serf.id} starting to deposit resources at ${destinationBuilding.name || destinationBuilding.type}. Inventory:`, serf.inventory);
    }

    execute(serf, deltaTime) {
        if (!serf.currentTask || serf.currentTask.status !== TASK_STATUS.ACTIVE) {
            serf.changeState(SERF_ACTION_STATES.IDLE);
            return;
        }

        this.depositTimer += deltaTime * 1000;

        if (this.depositTimer >= this.DEPOSIT_TIME_PER_ITEM) {
            this.depositTimer = 0;

            const destinationBuilding = serf.currentTask.destinationBuilding;
            let itemDepositedThisTick = false;
            let depositedItemsSummary = {}; // For task outcome

            for (const resourceType in serf.inventory) {
                if (serf.inventory[resourceType] > 0) {
                    const amountToDeposit = 1; // Deposit one unit of one resource type per tick
                    
                    // Add to building's inventory OR global resource manager
                    if (destinationBuilding.addItemsToInventory) { // Assuming buildings have this method
                        destinationBuilding.addItemsToInventory(resourceType, amountToDeposit);
                    } else {
                        // Fallback to global resource manager if building doesn't handle its own inventory
                        resourceManager.addResource(resourceType, amountToDeposit);
                    }
                    
                    serf.inventory[resourceType] -= amountToDeposit;
                    if (serf.inventory[resourceType] <= 0) {
                        delete serf.inventory[resourceType];
                    }

                    if (!depositedItemsSummary[resourceType]) depositedItemsSummary[resourceType] = 0;
                    depositedItemsSummary[resourceType] += amountToDeposit;

                    console.log(`Serf ${serf.id} deposited 1 ${resourceType} into ${destinationBuilding.name || destinationBuilding.type}. Serf inventory:`, serf.inventory);
                    itemDepositedThisTick = true;
                    break; // Process one item type per tick to simulate time
                }
            }

            const currentInventorySize = Object.values(serf.inventory).reduce((sum, count) => sum + count, 0);
            if (currentInventorySize === 0) {
                console.log(`Serf ${serf.id} finished depositing all items.`);
                serf.currentTask.handleOutcome(serf, 'deposit_complete', depositedItemsSummary);
                return;
            }

            if (!itemDepositedThisTick) {
                // Should not happen if inventory check in enter() is correct and items are present
                console.warn(`Serf ${serf.id} in deposit state but no items were deposited this tick, though inventory is not empty.`);
                serf.currentTask.handleOutcome(serf, 'deposit_failed_unexpected', depositedItemsSummary);
            }
        }
    }

    exit(serf) {
        super.exit(serf);
        this.depositTimer = 0;
        // Task outcome should make the serf IDLE or assign a new task.
    }
}

export default DepositingResourceInBuildingState;
