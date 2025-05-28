// Integration validation script
// This script can be run in the browser console to validate the production chain integration

console.log('=== Production Chain Integration Validation ===');

// Wait for game to be fully loaded
setTimeout(() => {
    if (typeof window.game === 'undefined') {
        console.error('❌ Game instance not found on window object');
        return;
    }

    const game = window.game;
    console.log('✅ Game instance found');

    // Check ProductionChainManager
    if (!game.productionChainManager) {
        console.error('❌ ProductionChainManager not found on game instance');
        return;
    }
    console.log('✅ ProductionChainManager found');

    // Check ProductionChainUI
    if (!game.uiManager || !game.uiManager.productionChainUI) {
        console.error('❌ ProductionChainUI not found');
        return;
    }
    console.log('✅ ProductionChainUI found');

    // Check ConstructionManager has game reference
    if (!game.constructionManager.game) {
        console.error('❌ ConstructionManager does not have game reference');
        return;
    }
    console.log('✅ ConstructionManager has game reference');

    // Check initial buildings registration
    const registeredBuildings = game.productionChainManager.buildings;
    console.log(`📊 Registered buildings count: ${registeredBuildings.size}`);
    
    if (registeredBuildings.size === 0) {
        console.warn('⚠️ No buildings are currently registered with ProductionChainManager');
    } else {
        console.log('✅ Buildings are registered with ProductionChainManager:');
        for (const [id, building] of registeredBuildings) {
            console.log(`  - ${building.name} (ID: ${id})`);
        }
    }

    // Check placed buildings
    const placedBuildings = game.constructionManager.placedBuildings;
    console.log(`📊 Placed buildings count: ${placedBuildings.length}`);
    
    // Validate that all placed buildings are registered
    let allRegistered = true;
    for (const building of placedBuildings) {
        if (!registeredBuildings.has(building.id)) {
            console.error(`❌ Building ${building.name} (ID: ${building.id}) is placed but not registered`);
            allRegistered = false;
        }
    }
    
    if (allRegistered && placedBuildings.length > 0) {
        console.log('✅ All placed buildings are properly registered');
    }

    // Test building placement
    console.log('\n=== Testing Building Placement ===');
    
    // Try to place a Lumber Mill to test registration
    const buildingType = 'Lumber Mill';
    console.log(`Attempting to place a ${buildingType}...`);
    
    // Simulate building placement
    game.constructionManager.selectBuilding(buildingType);
    
    // Check if building selection worked
    if (game.constructionManager.selectedBuilding) {
        console.log(`✅ Building selected: ${game.constructionManager.selectedBuilding.name}`);
        
        // Try to place it at a test position (you would need to click in the actual game)
        console.log('ℹ️ To complete the test, click on the map to place the building and check console for registration messages');
    } else {
        console.error(`❌ Failed to select ${buildingType}`);
    }

    console.log('\n=== Integration Validation Complete ===');
    
}, 2000); // Wait 2 seconds for game to initialize

// Export validation function for manual execution
window.validateIntegration = () => {
    console.log('Re-running integration validation...');
    // Re-run the validation
    setTimeout(() => {
        const script = document.createElement('script');
        script.textContent = validate_integration.toString() + '; validate_integration();';
        document.head.appendChild(script);
    }, 100);
};

console.log('Integration validation script loaded. It will run automatically in 2 seconds.');
console.log('You can also run window.validateIntegration() manually at any time.');
