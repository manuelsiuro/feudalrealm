// Test script to verify RESOURCE_TYPES import
import { RESOURCE_TYPES } from './src/config/resourceTypes.js';

console.log('RESOURCE_TYPES loaded:', typeof RESOURCE_TYPES);
console.log('TOOL_AXE exists:', 'TOOL_AXE' in RESOURCE_TYPES);
console.log('TOOL_AXE value:', RESOURCE_TYPES.TOOL_AXE);

if (RESOURCE_TYPES.TOOL_AXE) {
    console.log('TOOL_AXE.key:', RESOURCE_TYPES.TOOL_AXE.key);
} else {
    console.error('TOOL_AXE is undefined!');
}

// Check all resource types
console.log('All resource types:');
for (const [key, value] of Object.entries(RESOURCE_TYPES)) {
    console.log(`${key}:`, value?.key || 'NO KEY');
}
