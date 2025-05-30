// Test script for checking builder assignment fix
console.log('🔧 Testing Builder Assignment Fix');
console.log('===============================');

// Check if game is available
if (typeof window !== 'undefined' && window.game) {
    const game = window.game;
    
    console.log('\n📋 Current Game State:');
    console.log('- Construction Queue:', game.constructionManager?.constructionQueue?.length || 0);
    console.log('- Active Constructions:', game.constructionManager?.activeConstructions?.length || 0);
    console.log('- Placed Buildings:', game.constructionManager?.placedBuildings?.length || 0);
    
    console.log('\n👷 Builder Status:');
    const allSerfs = game.serfManager?.serfs || [];
    const builders = allSerfs.filter(s => s.serfType === 'Builder');
    console.log('- Total Builders:', builders.length);
    
    builders.forEach((builder, i) => {
        console.log(`  Builder ${i + 1}:`);
        console.log(`    - ID: ${builder.id}`);
        console.log(`    - State: ${builder.currentState?.name || 'Unknown'}`);
        console.log(`    - Has Task: ${builder.currentTask ? 'Yes' : 'No'}`);
        console.log(`    - Position: (${builder.x}, ${builder.y})`);
        console.log(`    - Job Building: ${builder.jobBuilding ? builder.jobBuilding.name : 'None'}`);
    });
    
    // Test getAvailableSerfsByProfession
    console.log('\n🔍 Available Builders Test:');
    const availableBuilders = game.serfManager?.getAvailableSerfsByProfession('Builder') || [];
    console.log('- Available Builders (using "Builder"):', availableBuilders.length);
    
    const availableBuildersOld = game.serfManager?.getAvailableSerfsByProfession('BUILDER') || [];
    console.log('- Available Builders (using "BUILDER"):', availableBuildersOld.length);
    
    // Try queuing a building if none in queue
    if (game.constructionManager && game.constructionManager.constructionQueue.length === 0) {
        console.log('\n🏗️ Testing Building Queue:');
        try {
            // Find a buildable location
            let testLocation = null;
            for (let x = 5; x < 10 && !testLocation; x++) {
                for (let z = 5; z < 10 && !testLocation; z++) {
                    if (game.constructionManager.isBuildable(x, z)) {
                        testLocation = { x, z };
                    }
                }
            }
            
            if (testLocation) {
                console.log(`- Queuing building at (${testLocation.x}, ${testLocation.z})`);
                game.constructionManager.queueBuilding('WOODCUTTERS_HUT', testLocation.x, testLocation.z);
                console.log('- Building queued successfully');
                
                // Run a construction update cycle
                console.log('\n⚙️ Running Construction Update:');
                game.constructionManager.update(0.016);
                
                // Check results
                console.log('- Queue after update:', game.constructionManager.constructionQueue.length);
                console.log('- Active after update:', game.constructionManager.activeConstructions.length);
                
                // If building was assigned, check for progress bar
                if (game.constructionManager.activeConstructions.length > 0) {
                    const building = game.constructionManager.activeConstructions[0];
                    console.log('\n🎯 Construction Progress:');
                    console.log('- Building:', building.name);
                    console.log('- State:', building.currentConstructionState);
                    console.log('- Assigned Builder:', building.assignedBuilderId);
                    console.log('- Progress Bar:', building.progressBarGroup ? 'Created' : 'Not Created');
                    console.log('- Progress:', (building.currentConstructionProgress || 0), '/', building.constructionRequiredTime);
                }
            } else {
                console.log('- No buildable location found for test');
            }
        } catch (error) {
            console.error('- Error queuing building:', error.message);
        }
    }
    
} else {
    console.log('❌ Game not available. Run this in the browser console on http://localhost:5173');
}
