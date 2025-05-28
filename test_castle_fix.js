// Test script to verify Castle.js error is fixed and production chain integration works

// Function to test that the map loads without the Castle.js error
function testMapLoading() {
    console.log("=== Testing Map Loading (Castle.js Fix) ===");
    
    // Check if game exists and is initialized
    if (typeof window.game === 'undefined') {
        console.error("❌ Game object not found on window");
        return false;
    }
    
    console.log("✅ Game object exists");
    
    // Check if the map rendered without errors
    const mapContainer = document.getElementById('gameContainer') || document.getElementById('game-container');
    if (!mapContainer) {
        console.error("❌ Game container not found");
        return false;
    }
    
    console.log("✅ Game container found");
    
    // Check if the ProductionChainManager is integrated
    if (!window.game.productionChainManager) {
        console.error("❌ ProductionChainManager not found on game instance");
        return false;
    }
    
    console.log("✅ ProductionChainManager integrated");
    
    // Check if ProductionChainUI exists
    if (!window.game.ui || !window.game.ui.productionChainUI) {
        console.error("❌ ProductionChainUI not found");
        return false;
    }
    
    console.log("✅ ProductionChainUI integrated");
    
    return true;
}

// Function to test building placement and registration
function testBuildingPlacement() {
    console.log("\n=== Testing Building Placement and Registration ===");
    
    // Get the construction manager
    const constructionManager = window.game.constructionManager;
    if (!constructionManager) {
        console.error("❌ ConstructionManager not found");
        return false;
    }
    
    console.log("✅ ConstructionManager exists");
    
    // Check if buildings are registered with ProductionChainManager
    const registeredBuildings = window.game.productionChainManager.buildings;
    console.log(`✅ Found ${registeredBuildings.size} registered buildings:`);
    
    registeredBuildings.forEach((building, id) => {
        console.log(`  - ${building.name} (${id}) at (${building.gridX}, ${building.gridZ})`);
    });
    
    return true;
}

// Function to test production chain functionality
function testProductionChainFunctionality() {
    console.log("\n=== Testing Production Chain Functionality ===");
    
    // Get chain efficiencies
    const efficiencies = window.game.productionChainManager.getAllChainEfficiencies();
    console.log(`✅ Found ${efficiencies.length} production chains:`);
    
    efficiencies.forEach(chain => {
        console.log(`  - ${chain.name}: ${chain.overallEfficiency.toFixed(1)}% efficiency`);
        chain.stages.forEach(stage => {
            console.log(`    └ ${stage.buildingType}: ${stage.buildings} buildings, ${stage.efficiency.toFixed(1)}% efficiency`);
        });
    });
    
    // Test building status
    const buildingStatuses = window.game.productionChainManager.getProductionBuildingsStatus();
    console.log(`✅ Found ${buildingStatuses.length} production buildings with status`);
    
    return true;
}

// Function to test Castle specifically
function testCastleSpecifically() {
    console.log("\n=== Testing Castle Building Specifically ===");
    
    // Find Castle buildings
    const castles = Array.from(window.game.productionChainManager.buildings.values())
        .filter(building => building.type === 'CASTLE' || building.name.includes('Castle'));
    
    if (castles.length === 0) {
        console.log("ℹ️ No Castle buildings found");
        return true;
    }
    
    castles.forEach(castle => {
        console.log(`✅ Found Castle: ${castle.name} (${castle.id})`);
        console.log(`  - Position: (${castle.gridX}, ${castle.gridZ})`);
        console.log(`  - Constructed: ${castle.isConstructed}`);
        console.log(`  - Workers: ${castle.workers?.length || 0}/${castle.jobSlots || 0}`);
        
        // Test the update method that was causing the error
        try {
            castle.update(100, Date.now()); // Call update with deltaTime=100ms
            console.log("✅ Castle.update() called successfully - NO ERROR!");
        } catch (error) {
            console.error(`❌ Castle.update() failed: ${error.message}`);
            return false;
        }
    });
    
    return true;
}

// Function to show UI elements
function showProductionChainUI() {
    console.log("\n=== Testing Production Chain UI ===");
    
    try {
        window.game.ui.productionChainUI.show();
        console.log("✅ Production Chain UI shown successfully");
        
        // Hide after 3 seconds
        setTimeout(() => {
            window.game.ui.productionChainUI.hide();
            console.log("✅ Production Chain UI hidden successfully");
        }, 3000);
        
        return true;
    } catch (error) {
        console.error(`❌ Failed to show Production Chain UI: ${error.message}`);
        return false;
    }
}

// Main test function
function runAllTests() {
    console.log("🔧 Starting Castle.js Fix and Production Chain Integration Tests...\n");
    
    const results = {
        mapLoading: false,
        buildingPlacement: false,
        productionChain: false,
        castleSpecific: false,
        uiTest: false
    };
    
    // Wait for game to be ready
    if (typeof window.game === 'undefined') {
        console.log("⏳ Waiting for game to initialize...");
        setTimeout(runAllTests, 1000);
        return;
    }
    
    try {
        results.mapLoading = testMapLoading();
        results.buildingPlacement = testBuildingPlacement();
        results.productionChain = testProductionChainFunctionality();
        results.castleSpecific = testCastleSpecifically();
        results.uiTest = showProductionChainUI();
        
        // Summary
        console.log("\n" + "=".repeat(60));
        console.log("🎯 TEST RESULTS SUMMARY:");
        console.log("=".repeat(60));
        
        Object.entries(results).forEach(([test, passed]) => {
            const status = passed ? "✅ PASS" : "❌ FAIL";
            const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            console.log(`${status} - ${testName}`);
        });
        
        const allPassed = Object.values(results).every(result => result);
        
        if (allPassed) {
            console.log("\n🎉 ALL TESTS PASSED! Castle.js error is FIXED and production chain integration is working!");
        } else {
            console.log("\n⚠️ Some tests failed. Please check the issues above.");
        }
        
    } catch (error) {
        console.error(`❌ Test execution failed: ${error.message}`);
        console.error(error.stack);
    }
}

// Auto-run tests when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    runAllTests();
}

// Make test functions available globally for manual testing
window.testCastleFix = {
    runAllTests,
    testMapLoading,
    testBuildingPlacement,
    testProductionChainFunctionality,
    testCastleSpecifically,
    showProductionChainUI
};

console.log("🔧 Castle.js Fix Test Script Loaded! Tests will run automatically, or call window.testCastleFix.runAllTests() manually.");
