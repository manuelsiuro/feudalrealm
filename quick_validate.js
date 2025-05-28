// Simple console validation script for production chain integration
// Run this in the browser console on the main game page (http://localhost:3000)

function quickValidateIntegration() {
    console.log('=== Quick Production Chain Integration Check ===');
    
    if (typeof window.game === 'undefined') {
        console.error('❌ Game not found. Make sure the game is loaded.');
        return false;
    }
    
    const game = window.game;
    let success = true;
    
    // Check 1: ProductionChainManager exists
    if (!game.productionChainManager) {
        console.error('❌ ProductionChainManager missing');
        success = false;
    } else {
        console.log('✅ ProductionChainManager exists');
    }
    
    // Check 2: ConstructionManager has game reference
    if (!game.constructionManager.game) {
        console.error('❌ ConstructionManager missing game reference');
        success = false;
    } else {
        console.log('✅ ConstructionManager has game reference');
    }
    
    // Check 3: Building registration
    const registeredCount = game.productionChainManager.buildings.size;
    console.log(`📊 Registered buildings: ${registeredCount}`);
    
    if (registeredCount > 0) {
        console.log('✅ Buildings are registered:');
        for (const [id, building] of game.productionChainManager.buildings) {
            console.log(`  - ${building.name} (${building.type || 'unknown type'})`);
        }
    }
    
    // Check 4: ProductionChainUI exists
    if (!game.uiManager?.productionChainUI) {
        console.warn('⚠️ ProductionChainUI not found');
    } else {
        console.log('✅ ProductionChainUI exists');
    }
    
    console.log(success ? '🎉 Integration looks good!' : '❌ Issues found in integration');
    return success;
}

// Auto-run if this script is loaded
if (typeof window !== 'undefined') {
    // Wait a bit for game to fully initialize
    setTimeout(quickValidateIntegration, 1000);
}

// Instructions
console.log('Integration validation script loaded.');
console.log('Run quickValidateIntegration() to check the integration status.');

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { quickValidateIntegration };
}
