// Quick validation script for Castle.js fix
// Run this in the browser console at http://localhost:3000

console.log("🔧 Quick Castle.js Fix Validation");
console.log("===================================");

// 1. Test if game loads without errors
if (typeof window.game !== 'undefined') {
    console.log("✅ Game object exists");
    
    // 2. Test if ProductionChainManager is integrated
    if (window.game.productionChainManager) {
        console.log("✅ ProductionChainManager integrated");
        
        // 3. Check registered buildings
        const buildings = window.game.productionChainManager.buildings;
        console.log(`✅ Found ${buildings.size} registered buildings`);
        
        // 4. Test Castle buildings specifically
        const castles = Array.from(buildings.values()).filter(b => 
            b.type === 'CASTLE' || b.name.includes('Castle')
        );
        
        if (castles.length > 0) {
            console.log(`✅ Found ${castles.length} Castle building(s)`);
            
            // 5. Test the update method that was causing the error
            castles.forEach((castle, index) => {
                try {
                    castle.update(100, Date.now());
                    console.log(`✅ Castle ${index + 1} update() method works - NO ERROR!`);
                } catch (error) {
                    console.error(`❌ Castle ${index + 1} update() failed: ${error.message}`);
                }
            });
        } else {
            console.log("ℹ️ No Castle buildings found yet");
        }
        
        // 6. Test ProductionChainUI
        if (window.game.ui?.productionChainUI) {
            console.log("✅ ProductionChainUI integrated");
            
            // Show UI briefly
            window.game.ui.productionChainUI.show();
            console.log("✅ ProductionChainUI can be shown");
            
            setTimeout(() => {
                window.game.ui.productionChainUI.hide();
                console.log("✅ ProductionChainUI can be hidden");
            }, 2000);
        } else {
            console.log("❌ ProductionChainUI not found");
        }
        
    } else {
        console.log("❌ ProductionChainManager not found");
    }
} else {
    console.log("❌ Game object not found - may still be loading");
}

console.log("\n🎯 SUMMARY: If you see ✅ for Castle update() method, the fix is working!");
console.log("You should now be able to see the map and buildings without the TypeError.");
