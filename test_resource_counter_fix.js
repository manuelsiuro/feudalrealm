// Test script to verify resource counter fix
console.log('Testing resource counter fix...');

// Import modules to test
import { RESOURCE_TYPES } from './src/config/resourceTypes.js';
import { UIManager } from './src/ui/UIManager.js';

// Mock game elements for testing
const mockCanvas = document.createElement('canvas');
const mockGame = {
    resourceManager: {
        onChange: (callback) => {
            // Mock onChange registration
            console.log('Resource manager onChange registered');
        }
    }
};

// Test resource types that were causing issues
console.log('Testing resource type constants:');
console.log('IRON_BARS:', RESOURCE_TYPES.IRON_BARS);
console.log('TOOL_AXE:', RESOURCE_TYPES.TOOL_AXE);
console.log('TOOL_PICKAXE:', RESOURCE_TYPES.TOOL_PICKAXE);

// Create UIManager instance to test
try {
    const uiManager = new UIManager(mockCanvas, mockGame);
    console.log('✅ UIManager created successfully');
    
    // Test resource counter initialization
    if (uiManager.resourceCounterBar) {
        console.log('✅ Resource counter bar initialized');
    } else {
        console.log('❌ Resource counter bar not initialized');
    }
    
    // Test updateResourceCounterBar with mock stockpiles
    const mockStockpiles = {
        [RESOURCE_TYPES.WOOD]: 50,
        [RESOURCE_TYPES.STONE]: 25,
        [RESOURCE_TYPES.IRON_BARS]: 10,
        [RESOURCE_TYPES.TOOL_AXE]: 5,
        [RESOURCE_TYPES.TOOL_PICKAXE]: 3
    };
    
    uiManager.updateResourceCounterBar(mockStockpiles);
    console.log('✅ Resource counter updated successfully');
    
} catch (error) {
    console.error('❌ Error during testing:', error);
}

console.log('Test completed.');
