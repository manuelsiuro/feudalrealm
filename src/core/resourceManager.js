// src/core/resourceManager.js

// Define all resource types used in the game
// This can be expanded from the existing lists in resources.md / entities/resources.js
export const RESOURCE_TYPES = {
    WOOD: 'wood',
    STONE: 'stone',
    GRAIN: 'grain',
    FISH: 'fish',
    IRON_ORE: 'iron_ore',
    COAL_ORE: 'coal_ore',
    GOLD_ORE: 'gold_ore',
    PLANKS: 'planks',
    FLOUR: 'flour',
    BREAD: 'bread',
    MEAT: 'meat',
    IRON_BARS: 'iron_bars',
    GOLD_BARS: 'gold_bars',
    TOOLS_AXE: 'tools_axe',
    TOOLS_PICKAXE: 'tools_pickaxe',
    TOOLS_SCYTHE: 'tools_scythe',
    TOOLS_HAMMER: 'tools_hammer',
    TOOLS_FISHING_ROD: 'tools_fishing_rod',
    SWORDS: 'swords',
    SHIELDS: 'shields',
    // PIGS are handled as units/entities rather than simple stockpile items for now
};

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
    }

    addResource(type, amount) {
        if (amount <= 0) return false;
        if (this.stockpiles.hasOwnProperty(type)) {
            this.stockpiles[type] += amount;
            console.log(`Added ${amount} of ${type}. Total: ${this.stockpiles[type]}`);
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
