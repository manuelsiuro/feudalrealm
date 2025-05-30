// Console test script for construction progress indicators
// Run this in the browser console when the main game is loaded

console.log('🏗️ Testing Construction Progress Indicators...');

// Function to test progress indicators
function testProgressIndicators() {
    if (!window.game) {
        console.log('❌ Game not loaded. Make sure you are on the main game page (localhost:5173)');
        return false;
    }

    const game = window.game;
    console.log('✅ Game instance found');

    // Check required managers
    if (!game.constructionManager) {
        console.log('❌ ConstructionManager not found');
        return false;
    }
    if (!game.serfManager) {
        console.log('❌ SerfManager not found');
        return false;
    }
    if (!game.resourceManager) {
        console.log('❌ ResourceManager not found');
        return false;
    }

    console.log('✅ All required managers found');

    // Check current state
    const stats = {
        totalBuildings: game.constructionManager.getAllBuildings().length,
        queuedBuildings: game.constructionManager.getConstructionQueue().length,
        activeConstructions: game.constructionManager.getActiveConstructions().length,
        availableBuilders: game.serfManager.serfs.filter(s => s.serfType === 'BUILDER' && !s.currentTask).length,
        wood: game.resourceManager.getResourceCount('WOOD'),
        stone: game.resourceManager.getResourceCount('STONE')
    };

    console.log('📊 Current State:', stats);

    // Add resources if needed
    if (stats.wood < 5) {
        game.resourceManager.addResource('WOOD', 10);
        console.log('➕ Added 10 WOOD');
    }
    if (stats.stone < 3) {
        game.resourceManager.addResource('STONE', 5);
        console.log('➕ Added 5 STONE');
    }

    // Find a buildable location
    let buildableLocation = null;
    for (let x = 8; x < 15; x++) {
        for (let z = 8; z < 15; z++) {
            if (game.constructionManager.isBuildable(x, z)) {
                buildableLocation = { x, z };
                break;
            }
        }
        if (buildableLocation) break;
    }

    if (!buildableLocation) {
        console.log('❌ No buildable location found');
        return false;
    }

    console.log(`🎯 Found buildable location: (${buildableLocation.x}, ${buildableLocation.z})`);

    // Queue a building
    try {
        const building = game.constructionManager.queueBuilding('WOODCUTTERS_HUT', buildableLocation.x, buildableLocation.z);
        
        if (!building) {
            console.log('❌ Failed to queue building');
            return false;
        }

        console.log(`✅ Building queued: ${building.name} (ID: ${building.id})`);
        console.log(`🔨 Initial construction state: ${building.currentConstructionState}`);

        // Start monitoring
        let monitorCount = 0;
        const maxMonitorChecks = 60; // 60 seconds timeout
        let foundProgressBar = false;
        let foundBuilder = false;

        const monitor = setInterval(() => {
            monitorCount++;
            
            // Get updated building reference
            const currentBuilding = game.constructionManager.getAllBuildings().find(b => b.id === building.id);
            
            if (!currentBuilding) {
                console.log('❌ Building not found in manager');
                clearInterval(monitor);
                return;
            }

            const progress = (currentBuilding.getConstructionProgress() * 100).toFixed(1);
            const state = currentBuilding.currentConstructionState;
            const hasProgressBar = !!currentBuilding.progressBarGroup;
            const hasModel = !!currentBuilding.model;
            const assignedBuilder = currentBuilding.assignedBuilderId;

            console.log(`📊 [${monitorCount}] State: ${state} | Progress: ${progress}% | ProgressBar: ${hasProgressBar ? '✅' : '❌'} | Model: ${hasModel ? '✅' : '❌'} | Builder: ${assignedBuilder || 'None'}`);

            // Track key milestones
            if (hasProgressBar && !foundProgressBar) {
                console.log('🎉 MILESTONE: Progress bar created!');
                foundProgressBar = true;
                
                // Log progress bar details
                if (currentBuilding.progressBarGroup) {
                    console.log(`📏 Progress bar position: x=${currentBuilding.progressBarGroup.position.x.toFixed(2)}, y=${currentBuilding.progressBarGroup.position.y.toFixed(2)}, z=${currentBuilding.progressBarGroup.position.z.toFixed(2)}`);
                    console.log(`👥 Progress bar children: ${currentBuilding.progressBarGroup.children.length}`);
                }
            }

            if (assignedBuilder && !foundBuilder) {
                console.log(`🎉 MILESTONE: Builder assigned (${assignedBuilder})!`);
                foundBuilder = true;
            }

            // Check if construction completed
            if (state === 'CONSTRUCTED') {
                console.log('🏁 CONSTRUCTION COMPLETED!');
                console.log(`🧹 Progress bar cleaned up: ${!currentBuilding.progressBarGroup ? '✅' : '❌'}`);
                console.log(`👷 Builder released: ${!currentBuilding.assignedBuilderId ? '✅' : '❌'}`);
                
                // Final validation
                const success = foundProgressBar && foundBuilder;
                console.log(`\n🎯 FINAL RESULT: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
                console.log(`- Progress bar was created: ${foundProgressBar ? '✅' : '❌'}`);
                console.log(`- Builder was assigned: ${foundBuilder ? '✅' : '❌'}`);
                console.log(`- Construction completed: ✅`);
                console.log(`- Progress bar cleaned up: ${!currentBuilding.progressBarGroup ? '✅' : '❌'}`);
                
                clearInterval(monitor);
                return success;
            }

            // Check for timeout
            if (monitorCount >= maxMonitorChecks) {
                console.log('⏰ TIMEOUT: Test took too long');
                console.log(`\n🎯 PARTIAL RESULT:`);
                console.log(`- Progress bar was created: ${foundProgressBar ? '✅' : '❌'}`);
                console.log(`- Builder was assigned: ${foundBuilder ? '✅' : '❌'}`);
                console.log(`- Construction state: ${state}`);
                
                clearInterval(monitor);
                return foundProgressBar && foundBuilder;
            }

        }, 1000); // Check every second

        return true; // Test started successfully

    } catch (error) {
        console.log('❌ Error during test:', error.message);
        console.error(error);
        return false;
    }
}

// Export for console use
window.testProgressIndicators = testProgressIndicators;

// Auto-run if this script is loaded
if (typeof window !== 'undefined' && window.game) {
    console.log('🚀 Auto-running progress indicators test...');
    testProgressIndicators();
} else {
    console.log('💡 To run the test manually, type: testProgressIndicators()');
}
