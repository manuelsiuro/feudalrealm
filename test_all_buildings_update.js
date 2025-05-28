// Comprehensive test for all buildings that call super.update()
// Run this in the browser console at http://localhost:3000

function testAllBuildingsWithSuperUpdate() {
    console.log("🔧 Testing All Buildings with super.update() Calls");
    console.log("=================================================");
    
    if (typeof window.game === 'undefined') {
        console.log("❌ Game not found, trying again in 1 second...");
        setTimeout(testAllBuildingsWithSuperUpdate, 1000);
        return;
    }
    
    // Buildings that call super.update() based on grep search
    const buildingsToTest = [
        'CASTLE',
        'BLACKSMITH', 
        'IRON_SMELTER',
        'WINDMILL',
        'TRANSPORTERS_HUT',
        'WOODCUTTERS_HUT',
        'SAWMILL'
    ];
    
    const registeredBuildings = window.game.productionChainManager.buildings;
    console.log(`Found ${registeredBuildings.size} total registered buildings`);
    
    let testedCount = 0;
    let passedCount = 0;
    
    buildingsToTest.forEach(buildingType => {
        // Find buildings of this type
        const buildings = Array.from(registeredBuildings.values()).filter(b => 
            b.type === buildingType || b.name.toUpperCase().includes(buildingType.replace('_', ''))
        );
        
        if (buildings.length === 0) {
            console.log(`ℹ️ No ${buildingType} buildings found (may not be placed yet)`);
            return;
        }
        
        buildings.forEach((building, index) => {
            testedCount++;
            try {
                // Test the update method
                building.update(100, Date.now());
                console.log(`✅ ${building.name} (${building.type}) update() - SUCCESS`);
                passedCount++;
            } catch (error) {
                console.error(`❌ ${building.name} (${building.type}) update() - FAILED: ${error.message}`);
            }
        });
    });
    
    console.log("\n" + "=".repeat(50));
    console.log(`📊 RESULTS: ${passedCount}/${testedCount} buildings passed update() test`);
    
    if (passedCount === testedCount && testedCount > 0) {
        console.log("🎉 ALL BUILDINGS PASSED! The Castle.js fix works for all buildings!");
    } else if (testedCount === 0) {
        console.log("ℹ️ No buildings tested - they may not be placed on the map yet");
        console.log("💡 Try placing some buildings first, then run this test again");
    } else {
        console.log("⚠️ Some buildings failed - there may be other issues");
    }
    
    return { tested: testedCount, passed: passedCount };
}

// Run the test
testAllBuildingsWithSuperUpdate();
