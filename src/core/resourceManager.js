// src/core/resourceManager.js
import { RESOURCE_TYPES } from '../config/resourceTypes.js';

class ResourceManager {
    constructor() {
        this.stockpiles = {};
        this._initializeStockpiles();

        // Simple event emitter for UI updates
        this.eventListeners = [];
    }

    _initializeStockpiles() {
        for (const type in RESOURCE_TYPES) {
            this.stockpiles[RESOURCE_TYPES[type]] = 0;
        }
        // Starting resources (example)
        this.stockpiles[RESOURCE_TYPES.WOOD] = 50;
        this.stockpiles[RESOURCE_TYPES.STONE] = 20;
        this.stockpiles[RESOURCE_TYPES.GRAIN] = 10; // For pig farm or early food
        this.stockpiles[RESOURCE_TYPES.TOOLS_AXE] = 1; // Add one axe for the initial Woodcutter
    }

    addResource(type, amount) {
        if (amount <= 0) return false;
        if (this.stockpiles.hasOwnProperty(type)) {
            console.log(`ResourceManager: Attempting to add ${amount} of ${type}. Current: ${this.stockpiles[type]}`);
            this.stockpiles[type] += amount;
            console.log(`ResourceManager: Added ${amount} of ${type}. New Total: ${this.stockpiles[type]}`);
            this._emitChange();
            return true;
        }
        console.warn(`Resource type ${type} not recognized.`);
        return false;
    }

    removeResource(type, amount) {
        if (amount <= 0) return false;
        if (this.stockpiles.hasOwnProperty(type)) {
            if (this.stockpiles[type] >= amount) {
                this.stockpiles[type] -= amount;
                console.log(`Removed ${amount} of ${type}. Total: ${this.stockpiles[type]}`);
                this._emitChange();
                return true;
            }
            console.warn(`Not enough ${type} to remove. Have: ${this.stockpiles[type]}, Need: ${amount}`);
            return false; // Not enough resources
        }
        console.warn(`Resource type ${type} not recognized.`);
        return false;
    }

    getResourceCount(type) {
        if (this.stockpiles.hasOwnProperty(type)) {
            return this.stockpiles[type];
        }
        console.warn(`Resource type ${type} not recognized for getResourceCount.`);
        return 0;
    }

    getAllStockpiles() {
        return { ...this.stockpiles }; // Return a copy
    }

    // Basic event system for UI updates
    onChange(callback) {
        this.eventListeners.push(callback);
    }

    _emitChange() {
        this.eventListeners.forEach(callback => callback(this.getAllStockpiles()));
    }
}

// Singleton instance
const resourceManager = new ResourceManager();
export default resourceManager;
