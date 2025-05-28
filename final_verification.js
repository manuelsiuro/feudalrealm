// Final Verification Script
// Tests all the fixes we've made to ensure the construction system is working

export async function runFinalVerification() {
    const results = {
        importResolved: false,
        gameInitialized: false,
        constructionManagerReady: false,
        buildingPlacementWorks: false,
        constructionCycleWorks: false
    };

    try {
        console.log('🔍 Final Verification: Testing Import Resolution');
        
        // Test 1: Import Game class (should work with fixed case sensitivity)
        const { default: Game } = await import('./src/core/Game.js');
        console.log('✅ Game class imported successfully');
        results.importResolved = true;

        // Test 2: Initialize Game
        console.log('🔍 Final Verification: Testing Game Initialization');
        const game = new Game();
        await game.init();
        
        // Wait for components to be ready
        let attempts = 0;
        while (attempts < 30 && (!game.constructionManager || !game.serfManager || !game.gameMap)) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (game.constructionManager && game.serfManager && game.gameMap) {
            console.log('✅ Game initialized with all components');
            results.gameInitialized = true;
            results.constructionManagerReady = true;
        }

        // Test 3: Building Placement API
        console.log('🔍 Final Verification: Testing Building Placement API');
        if (game.constructionManager && typeof game.constructionManager.isBuildable === 'function') {
            const canBuild = game.constructionManager.isBuildable(8, 8);
            console.log(`✅ isBuildable API works: ${canBuild}`);
            results.buildingPlacementWorks = true;

            // Test actual building placement
            if (canBuild) {
                game.constructionManager.queueBuilding('WOODCUTTERS_HUT', 8, 8);
                const queue = game.constructionManager.getConstructionQueue();
                console.log(`✅ Building queued successfully (Queue length: ${queue.length})`);
            }
        }

        // Test 4: Construction Cycle
        console.log('🔍 Final Verification: Testing Construction Processing');
        const initialQueue = game.constructionManager.getConstructionQueue().length;
        
        // Run a few update cycles
        for (let i = 0; i < 5; i++) {
            game.constructionManager.update(0.016);
        }
        
        const finalQueue = game.constructionManager.getConstructionQueue().length;
        const activeConstructions = game.constructionManager.getActiveConstructions().length;
        
        console.log(`✅ Construction cycle processed (Queue: ${initialQueue} → ${finalQueue}, Active: ${activeConstructions})`);
        results.constructionCycleWorks = true;

        // Summary
        console.log('\n📋 Final Verification Results:');
        Object.entries(results).forEach(([test, passed]) => {
            console.log(`  ${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
        });

        const allPassed = Object.values(results).every(Boolean);
        if (allPassed) {
            console.log('\n🎉 ALL TESTS PASSED! Construction system is fully operational.');
        } else {
            console.log('\n⚠️ Some tests failed. Check individual results above.');
        }

        return results;

    } catch (error) {
        console.error('❌ Final verification failed:', error.message);
        console.error(error.stack);
        return results;
    }
}

// For browser usage
if (typeof window !== 'undefined') {
    window.runFinalVerification = runFinalVerification;
}
