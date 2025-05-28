// Quick validation script - run in browser console at http://localhost:5173
// This will test if the Castle.js fix is working

async function quickValidateCastleFix() {
    console.log("🔧 Quick Castle.js Fix Validation (Port 5173)");
    console.log("=".repeat(50));
    
    // This script should be run in a browser environment
    if (typeof window === 'undefined') {
        console.error("❌ This script must be run in a browser console at http://localhost:5173");
        return false;
    }
    
    // Wait for game to load if not ready
    let attempts = 0;
    while (typeof window.game === 'undefined' && attempts < 10) {
        console.log(`⏳ Waiting for game to load... (attempt ${attempts + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
    }
    
    if (typeof window.game === 'undefined') {
        console.error("❌ Game failed to load after 10 seconds");
        return false;
    }
    
    console.log("✅ Game loaded successfully");
    
    // Test ProductionChainManager integration
    if (!window.game.productionChainManager) {
        console.error("❌ ProductionChainManager not found");
        return false;
    }
    console.log("✅ ProductionChainManager integrated");
    
    // Test ProductionChainUI integration  
    if (!window.game.ui?.productionChainUI) {
        console.error("❌ ProductionChainUI not found");
        return false;
    }
    console.log("✅ ProductionChainUI integrated");
    
    // Get all registered buildings
    const buildings = window.game.productionChainManager.buildings;
    console.log(`✅ Found ${buildings.size} registered buildings`);
    
    if (buildings.size === 0) {
        console.log("ℹ️ No buildings registered yet - this is normal for initial load");
        console.log("💡 Try placing some buildings to test the update() method");
        return true;
    }
    
    // Test all buildings' update methods
    let totalTested = 0;
    let totalPassed = 0;
    
    buildings.forEach((building, id) => {
        totalTested++;
        try {
            building.update(100, Date.now());
            console.log(`✅ ${building.name} (${building.type}) update() - SUCCESS`);
            totalPassed++;
        } catch (error) {
            console.error(`❌ ${building.name} (${building.type}) update() - FAILED: ${error.message}`);
            console.error(error.stack);
        }
    });
    
    // Test Castle buildings specifically if any exist
    const castles = Array.from(buildings.values()).filter(b => 
        b.type === 'CASTLE' || b.name.includes('Castle')
    );
    
    if (castles.length > 0) {
        console.log(`🏰 Testing ${castles.length} Castle building(s) specifically:`);
        castles.forEach((castle, index) => {
            try {
                castle.update(100, Date.now());
                console.log(`✅ Castle ${index + 1}: ${castle.name} - NO ERROR! Fix working!`);
            } catch (error) {
                console.error(`❌ Castle ${index + 1}: ${castle.name} - STILL HAS ERROR: ${error.message}`);
            }
        });
    }
    
    // Test UI functionality
    try {
        window.game.ui.productionChainUI.show();
        console.log("✅ ProductionChainUI can be shown");
        setTimeout(() => {
            window.game.ui.productionChainUI.hide();
            console.log("✅ ProductionChainUI can be hidden");
        }, 2000);
    } catch (error) {
        console.error(`❌ UI test failed: ${error.message}`);
    }
    
    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 VALIDATION SUMMARY:");
    console.log(`Building Update Tests: ${totalPassed}/${totalTested} passed`);
    
    if (totalTested === 0) {
        console.log("ℹ️ No buildings to test yet - place some buildings first");
        console.log("🎯 The fix should prevent the Castle.js error when buildings are placed");
    } else if (totalPassed === totalTested) {
        console.log("🎉 ALL BUILDING UPDATE METHODS WORKING!");
        console.log("🎯 Castle.js error has been FIXED!");
    } else {
        console.log("⚠️ Some buildings still have update issues");
    }
    
    return totalPassed === totalTested;
}

// Auto-run validation
quickValidateCastleFix().then(result => {
    if (result) {
        console.log("🚀 Validation complete - fix appears to be working!");
    } else {
        console.log("🔍 Validation found issues - check the log above");
    }
});

// Make function available for manual testing
window.quickValidateCastleFix = quickValidateCastleFix;
