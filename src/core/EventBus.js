// src/core/EventBus.js

class EventBus {
    constructor() {
        this.eventListeners = new Map(); // Map<string, Array<Function>>
        console.log("EventBus initialized.");
    }

    /**
     * Subscribes a callback to an event type.
     * @param {string} eventType - The type of event to subscribe to.
     * @param {Function} callback - The function to call when the event is published.
     */
    subscribe(eventType, callback) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        const listeners = this.eventListeners.get(eventType);
        if (!listeners.includes(callback)) {
            listeners.push(callback);
        }
        // console.log(`EventBus: Subscribed to \${eventType}. Listeners: \${listeners.length}`);
    }

    /**
     * Unsubscribes a callback from an event type.
     * @param {string} eventType - The type of event to unsubscribe from.
     * @param {Function} callback - The callback function to remove.
     */
    unsubscribe(eventType, callback) {
        if (this.eventListeners.has(eventType)) {
            const listeners = this.eventListeners.get(eventType);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
                // console.log(`EventBus: Unsubscribed from \${eventType}. Listeners remaining: \${listeners.length}`);
                if (listeners.length === 0) {
                    this.eventListeners.delete(eventType);
                }
            }
        }
    }

    /**
     * Publishes an event, calling all subscribed callbacks.
     * @param {string} eventType - The type of event to publish.
     * @param {*} data - The data to pass to the event callbacks.
     */
    publish(eventType, data) {
        // console.log(`EventBus: Publishing event \${eventType} with data:`, data);
        if (this.eventListeners.has(eventType)) {
            const listeners = this.eventListeners.get(eventType);
            // Call listeners on a copy in case a listener unsubscribes itself during the call
            [...listeners].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`EventBus: Error in callback for event \${eventType}:`, error);
                    console.error('Callback:', callback.toString());
                    console.error('Data:', data);
                }
            });
        } else {
            // console.log(`EventBus: No listeners for event \${eventType}.`);
        }
    }
}

// Create a global instance (Singleton pattern)
const globalEventBus = new EventBus();
export default globalEventBus;

// Define common event types (optional, but good practice)
export const GameEvents = {
    // Selection Events
    SELECTION_CHANGED: 'SELECTION_CHANGED', // data: selectedEntity (or null)

    // Resource Events
    RESOURCE_UPDATED: 'RESOURCE_UPDATED',   // data: { resourceType: string, newAmount: number, delta: number }
    INSUFFICIENT_RESOURCES: 'INSUFFICIENT_RESOURCES', // data: { buildingType: string, missing: object }

    // Building Events
    BUILDING_CONSTRUCTION_STARTED: 'BUILDING_CONSTRUCTION_STARTED', // data: Building instance
    BUILDING_CONSTRUCTION_COMPLETED: 'BUILDING_CONSTRUCTION_COMPLETED', // data: Building instance
    BUILDING_PLACED: 'BUILDING_PLACED', // data: Building instance (for initial placement, not necessarily constructed)
    BUILDING_DEMOLISHED: 'BUILDING_DEMOLISHED', // data: Building instance
    BUILDING_INVENTORY_CHANGED: 'BUILDING_INVENTORY_CHANGED', // data: { buildingId: string, resourceType: string, newAmount: number }
    BUILDING_HALTED_NO_FOOD: 'BUILDING_HALTED_NO_FOOD', // data: Building instance
    BUILDING_RESUMED_FOOD: 'BUILDING_RESUMED_FOOD', // data: Building instance


    // Serf Events
    SERF_CREATED: 'SERF_CREATED',           // data: Serf instance
    SERF_DIED: 'SERF_DIED',             // data: Serf instance
    SERF_JOB_ASSIGNED: 'SERF_JOB_ASSIGNED', // data: { serfId: string, jobId: string (buildingId or taskType) }
    SERF_TASK_COMPLETED: 'SERF_TASK_COMPLETED',// data: { serfId: string, taskId: string, taskType: string }

    // Task Events
    TASK_CREATED: 'TASK_CREATED',           // data: Task instance
    TASK_ASSIGNED: 'TASK_ASSIGNED',         // data: Task instance
    TASK_COMPLETED: 'TASK_COMPLETED',       // data: Task instance
    TASK_FAILED: 'TASK_FAILED',           // data: Task instance
    TASK_CANCELLED: 'TASK_CANCELLED',       // data: Task instance

    // UI Events (if UI needs to signal game logic indirectly)
    UI_BUILD_REQUESTED: 'UI_BUILD_REQUESTED', // data: buildingTypeKey
    UI_CHEAT_RESOURCES: 'UI_CHEAT_RESOURCES', // data: null or specific amounts

    // Game State Events
    GAME_PAUSED: 'GAME_PAUSED',
    GAME_RESUMED: 'GAME_RESUMED',
};
