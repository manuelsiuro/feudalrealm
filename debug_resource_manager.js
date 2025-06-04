// Quick debug test for ResourceManager
import { RESOURCE_TYPES } from './src/config/resourceTypes.js';

console.log('🔍 Debugging RESOURCE_TYPES structure...');

// Check if RESOURCE_TYPES is properly imported
console.log('RESOURCE_TYPES:', typeof RESOURCE_TYPES, RESOURCE_TYPES);

// Check individual resource types
console.log('WOOD:', RESOURCE_TYPES.WOOD);
console.log('STONE:', RESOURCE_TYPES.STONE);

// Test the iteration that was causing issues
console.log('\n🔍 Testing Object.values iteration...');
Object.values(RESOURCE_TYPES).forEach((resourceType, index) => {
    console.log(`${index}: ${resourceType?.key || 'NO KEY'} -`, resourceType);
});

console.log('\n🔍 Testing for...in iteration...');
for (const type in RESOURCE_TYPES) {
    const resourceType = RESOURCE_TYPES[type];
    console.log(`${type}: ${resourceType?.key || 'NO KEY'} -`, resourceType);
}

// Test ResourceManager import
console.log('\n🔍 Testing ResourceManager import...');
try {
    const resourceManagerModule = await import('./src/core/resourceManager.js');
    console.log('✅ ResourceManager imported successfully');
    const resourceManager = resourceManagerModule.default;
    const stockpiles = resourceManager.getAllStockpiles();
    console.log('✅ Stockpiles initialized:', stockpiles);
} catch (error) {
    console.error('❌ ResourceManager import failed:', error);
}
