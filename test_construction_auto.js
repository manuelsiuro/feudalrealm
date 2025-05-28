// Construction Test Script
// This script will test the complete construction workflow

async function runConstructionTest() {
    console.log('🏗️ Starting Construction System Test');
    
    try {
        // Import and initialize game
        const { default: Game } = await import('./src/core/Game.js');
        const game = new Game();
        await game.init();
        
        console.log('✅ Game initialized');
        console.log('📍 Construction Manager:', !!game.constructionManager);
        console.log('👷 Serf Manager:', !!game.serfManager);
        console.log('🗺️ Game Map:', !!game.gameMap);
        
        // Test 1: Check if we can place a building
        console.log('\n🧪 Test 1: Building Placement Validation');
        const testX = 5, testZ = 5;
        const canBuild = game.constructionManager.isBuildable(testX, testZ);
        console.log(`Can build at (${testX}, ${testZ}): ${canBuild}`);
        
        // Test 2: Queue a building for construction
        if (canBuild) {
            console.log('\n🧪 Test 2: Queue Building Construction');
            try {
                game.constructionManager.queueBuilding('WOODCUTTERS_HUT', testX, testZ);
                console.log('✅ Building queued successfully');
                
                const queueLength = game.constructionManager.getConstructionQueue().length;
                console.log(`📋 Construction queue length: ${queueLength}`);
                
            } catch (error) {
                console.error('❌ Failed to queue building:', error.message);
            }
        }
        
        // Test 3: Check serf assignment
        console.log('\n🧪 Test 3: Builder Assignment');
        const builders = game.serfManager.getAvailableBuilders();
        console.log(`👷 Available builders: ${builders.length}`);
        
        // Test 4: Process construction cycle
        console.log('\n🧪 Test 4: Construction Processing');
        game.constructionManager.update(0.016); // Simulate 16ms frame
        
        const activeConstructions = game.constructionManager.getActiveConstructions();
        console.log(`🏗️ Active constructions: ${activeConstructions.length}`);
        
        console.log('\n🎉 Construction test completed successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ Construction test failed:', error.message);
        console.error(error.stack);
        return false;
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.runConstructionTest = runConstructionTest;
}

export default runConstructionTest;
