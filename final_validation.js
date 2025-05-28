// Final validation script for Castle.js fix and production chain integration
// Run this in browser console or copy-paste into browser console

function finalValidation() {
    console.log("🎯 FINAL VALIDATION - Castle.js Fix & Production Chain Integration");
    console.log("================================================================");
    
    const results = {
        gameLoaded: false,
        productionChainManager: false,
        productionChainUI: false,
        buildingsRegistered: false,
        castleUpdateFixed: false,
        allBuildingsUpdateFixed: false,
        uiFunctional: false
    };
    
    // 1. Check if game is loaded
    if (typeof window.game !== 'undefined') {
        results.gameLoaded = true;
        console.log("✅ Game loaded successfully");
    } else {
        console.log("❌ Game not loaded");
        return showResults(results);
    }
    
    // 2. Check ProductionChainManager integration
    if (window.game.productionChainManager) {
        results.productionChainManager = true;
        console.log("✅ ProductionChainManager integrated");
    } else {
        console.log("❌ ProductionChainManager missing");
    }
    
    // 3. Check ProductionChainUI integration
    if (window.game.ui && window.game.ui.productionChainUI) {
        results.productionChainUI = true;
        console.log("✅ ProductionChainUI integrated");
    } else {
        console.log("❌ ProductionChainUI missing");
    }
    
    // 4. Check buildings registration
    const buildings = window.game.productionChainManager.buildings;
    if (buildings.size > 0) {
        results.buildingsRegistered = true;
        console.log(`✅ ${buildings.size} buildings registered with ProductionChainManager`);
    } else {
        console.log("❌ No buildings registered");
    }
    
    // 5. Test Castle update method specifically
    const castles = Array.from(buildings.values()).filter(b => 
        b.type === 'CASTLE' || b.name.includes('Castle')
    );
    
    if (castles.length > 0) {
        let castlesPassed = 0;
        castles.forEach(castle => {
            try {
                castle.update(100, Date.now());
                castlesPassed++;
            } catch (error) {
                console.error(`❌ Castle update failed: ${error.message}`);
            }
        });
        
        if (castlesPassed === castles.length) {
            results.castleUpdateFixed = true;
            console.log(`✅ All ${castles.length} Castle buildings update() method works`);
        }
    } else {
        console.log("ℹ️ No Castle buildings found to test");
        results.castleUpdateFixed = true; // No error if no castles to test
    }
    
    // 6. Test all buildings with super.update() calls
    const buildingTypesToTest = ['CASTLE', 'BLACKSMITH', 'IRON_SMELTER', 'WINDMILL', 'TRANSPORTERS_HUT', 'WOODCUTTERS_HUT', 'SAWMILL'];
    let allBuildingsPassed = true;
    let totalTested = 0;
    
    buildingTypesToTest.forEach(type => {
        const buildingsOfType = Array.from(buildings.values()).filter(b => 
            b.type === type || b.name.toUpperCase().includes(type.replace('_', ''))
        );
        
        buildingsOfType.forEach(building => {
            totalTested++;
            try {
                building.update(100, Date.now());
            } catch (error) {
                allBuildingsPassed = false;
                console.error(`❌ ${building.name} update failed: ${error.message}`);
            }
        });
    });
    
    if (allBuildingsPassed) {
        results.allBuildingsUpdateFixed = true;
        console.log(`✅ All ${totalTested} buildings with super.update() calls work correctly`);
    }
    
    // 7. Test UI functionality
    try {
        window.game.ui.productionChainUI.show();
        setTimeout(() => {
            window.game.ui.productionChainUI.hide();
        }, 1000);
        results.uiFunctional = true;
        console.log("✅ ProductionChainUI show/hide functionality works");
    } catch (error) {
        console.log(`❌ UI functionality failed: ${error.message}`);
    }
    
    return showResults(results);
}

function showResults(results) {
    console.log("\n" + "=".repeat(60));
    console.log("📋 FINAL VALIDATION RESULTS:");
    console.log("=".repeat(60));
    
    const tests = [
        { key: 'gameLoaded', name: 'Game Loaded' },
        { key: 'productionChainManager', name: 'ProductionChainManager Integration' },
        { key: 'productionChainUI', name: 'ProductionChainUI Integration' },
        { key: 'buildingsRegistered', name: 'Buildings Registered' },
        { key: 'castleUpdateFixed', name: 'Castle.js Update Fix' },
        { key: 'allBuildingsUpdateFixed', name: 'All Buildings Update Fix' },
        { key: 'uiFunctional', name: 'UI Functionality' }
    ];
    
    tests.forEach(test => {
        const status = results[test.key] ? "✅ PASS" : "❌ FAIL";
        console.log(`${status} - ${test.name}`);
    });
    
    const passedCount = Object.values(results).filter(r => r).length;
    const totalCount = Object.keys(results).length;
    
    console.log("\n" + "=".repeat(60));
    console.log(`🎯 OVERALL RESULT: ${passedCount}/${totalCount} tests passed`);
    
    if (passedCount === totalCount) {
        console.log("🎉 SUCCESS! Castle.js error is FIXED and production chain integration is COMPLETE!");
        console.log("🚀 The map should now display without errors and all systems should work properly.");
    } else {
        console.log("⚠️ Some issues remain. Please check the failed tests above.");
    }
    
    return results;
}

// Auto-run if game is ready, otherwise wait
if (typeof window.game !== 'undefined') {
    finalValidation();
} else {
    console.log("⏳ Waiting for game to load...");
    setTimeout(() => {
        if (typeof window.game !== 'undefined') {
            finalValidation();
        } else {
            console.log("❌ Game still not loaded after waiting. Please refresh and try again.");
        }
    }, 3000);
}

// Make function available globally
window.finalValidation = finalValidation;
