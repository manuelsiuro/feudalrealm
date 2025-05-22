// src/config/unitConstants.js
export const MAX_SERF_INVENTORY_CAPACITY = 10;
export const DEFAULT_DROPOFF_POINT = { x: 10, y: 10 }; // Example coordinates
export const BUILDER_WORK_INTERVAL = 1000; // ms per construction progress tick
export const FORESTER_PLANTING_TIME = 5000; // ms to plant a sapling
export const FORESTER_PLANTING_RADIUS = 5; // tiles search radius around hut for planting
export const FORESTER_MAX_PLANTED_SAPLINGS_INITIAL = 10; // Initial maximum number of saplings a forester can plant
export const FORESTER_SAPLING_UPGRADE_AMOUNT = 5; // Amount to increase max saplings by per upgrade
export const FORESTER_SAPLING_UPGRADE_COST = { WOOD: 10, GOLD: 5 };
