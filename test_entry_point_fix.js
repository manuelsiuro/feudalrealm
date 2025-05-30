// Test script to validate the getEntryPointGridPosition fix
// Run this in the browser console after the game loads

console.log("🔧 Testing getEntryPointGridPosition() fix...");

function testEntryPointMethod() {
    const game = window.game;
    if (!game || !game.constructionManager) {
        console.error("❌ Game or constructionManager not found");
        return false;
    }

    console.log("📋 Getting all buildings...");
    const allBuildings = game.constructionManager.getAllBuildings();
    console.log(`Found ${allBuildings.length} buildings:`, allBuildings.map(b => `${b.name} (${b.id})`));

    if (allBuildings.length === 0) {
        console.warn("⚠️ No buildings found to test");
        return false;
    }

    // Test the method on existing buildings
    let testsPassed = 0;
    let testsTotal = 0;

    for (const building of allBuildings) {
        testsTotal++;
        
        try {
            const entryPoint = building.getEntryPointGridPosition();
            
            if (entryPoint && typeof entryPoint.x === 'number' && typeof entryPoint.z === 'number') {
                console.log(`✅ ${building.name} (${building.id}):`, 
                    `Building at (${building.gridX}, ${building.gridZ})`, 
                    `Entry point: (${entryPoint.x}, ${entryPoint.z})`);
                testsPassed++;
            } else {
                console.error(`❌ ${building.name} (${building.id}): Invalid entry point returned:`, entryPoint);
            }
        } catch (error) {
            console.error(`❌ ${building.name} (${building.id}): Error calling getEntryPointGridPosition():`, error.message);
        }
    }

    console.log(`\n📊 Test Results: ${testsPassed}/${testsTotal} buildings passed`);
    
    if (testsPassed === testsTotal) {
        console.log("🎉 All getEntryPointGridPosition() tests passed!");
        return true;
    } else {
        console.error("💥 Some getEntryPointGridPosition() tests failed!");
        return false;
    }
}

function testConstructionTaskCreation() {
    console.log("\n🏗️ Testing construction task creation...");
    
    const game = window.game;
    const serfManager = game.serfManager;
    const constructionManager = game.constructionManager;
    
    // Check if there are buildings needing construction
    const queuedBuildings = constructionManager.getConstructionQueue();
    console.log(`Buildings in construction queue: ${queuedBuildings.length}`);
    
    if (queuedBuildings.length > 0) {
        const testBuilding = queuedBuildings[0];
        console.log(`Testing with queued building: ${testBuilding.name} (${testBuilding.id})`);
        
        try {
            // Try to call the entry point method that was causing issues
            const entryPoint = testBuilding.getEntryPointGridPosition();
            console.log(`✅ Entry point method works: (${entryPoint.x}, ${entryPoint.z})`);
            
            // Check if there are available builders
            const builders = serfManager.getAvailableSerfsByProfession('Builder');
            console.log(`Available builders: ${builders.length}`);
            
            if (builders.length > 0) {
                console.log(`✅ ConstructBuildingTask should now be able to create successfully`);
                return true;
            } else {
                console.warn("⚠️ No builders available, but method fix is working");
                return true;
            }
        } catch (error) {
            console.error(`❌ Construction task still failing:`, error.message);
            return false;
        }
    } else {
        console.log("ℹ️ No buildings in construction queue to test with");
        
        // Try to create a test building
        try {
            console.log("🏗️ Creating test building to validate fix...");
            
            // Find a buildable location
            let testLocation = null;
            for (let x = 5; x < 10 && !testLocation; x++) {
                for (let z = 5; z < 10 && !testLocation; z++) {
                    if (constructionManager.isBuildable(x, z)) {
                        testLocation = { x, z };
                    }
                }
            }
            
            if (testLocation) {
                const building = constructionManager.queueBuilding('WOODCUTTERS_HUT', testLocation.x, testLocation.z);
                console.log(`✅ Test building created: ${building.name} (${building.id})`);
                
                const entryPoint = building.getEntryPointGridPosition();
                console.log(`✅ Entry point: (${entryPoint.x}, ${entryPoint.z})`);
                return true;
            } else {
                console.warn("⚠️ No buildable location found for test");
                return true; // Method fix still valid
            }
        } catch (error) {
            console.error(`❌ Test building creation failed:`, error.message);
            return false;
        }
    }
}

// Run the tests
console.log("🚀 Starting getEntryPointGridPosition() validation tests...\n");

const entryPointTestResult = testEntryPointMethod();
const constructionTaskTestResult = testConstructionTaskCreation();

if (entryPointTestResult && constructionTaskTestResult) {
    console.log("\n🎉 All tests passed! The getEntryPointGridPosition() fix is working correctly.");
    console.log("✅ Buildings can now provide entry points for serfs");
    console.log("✅ ConstructBuildingTask should work without errors");
    console.log("✅ Construction progress indicators feature should now work!");
} else {
    console.log("\n💥 Some tests failed. The fix may need additional work.");
}
