// Quick Construction Validation Script
// Run this in browser console to test construction system

(async function validateConstruction() {
    console.log('🏗️ Construction System Validation');
    console.log('================================');
    
    try {
        // Import Game class
        const { default: Game } = await import('./src/core/Game.js');
        console.log('✅ Game imported');
        
        // Create and initialize game
        const game = new Game();
        await game.init();
        console.log('✅ Game initialized');
        
        // Check components
        console.log('\n📋 Component Check:');
        console.log('- ConstructionManager:', !!game.constructionManager);
        console.log('- SerfManager:', !!game.serfManager);
        console.log('- GameMap:', !!game.gameMap);
        console.log('- ResourceManager:', !!game.resourceManager);
        
        if (!game.constructionManager) {
            throw new Error('ConstructionManager not available');
        }
        
        // Check methods
        console.log('\n🔧 Method Check:');
        const methods = ['queueBuilding', 'getConstructionQueue', 'getActiveConstructions', 'getPlacedBuildings'];
        methods.forEach(method => {
            const exists = typeof game.constructionManager[method] === 'function';
            console.log(`- ${method}:`, exists ? '✅' : '❌');
        });
        
        // Check initial state
        console.log('\n📊 Initial State:');
        console.log('- Queue:', game.constructionManager.getConstructionQueue().length);
        console.log('- Active:', game.constructionManager.getActiveConstructions().length);
        console.log('- Built:', game.constructionManager.getPlacedBuildings().length);
        
        // Test building placement
        console.log('\n🏗️ Testing Construction:');
        
        // Find buildable location
        let testLocation = null;
        for (let x = 5; x < 10 && !testLocation; x++) {
            for (let z = 5; z < 10 && !testLocation; z++) {
                if (game.constructionManager.isBuildable(x, z)) {
                    testLocation = { x, z };
                }
            }
        }
        
        if (testLocation) {
            console.log(`Testing at location: (${testLocation.x}, ${testLocation.z})`);
            
            try {
                const building = game.constructionManager.queueBuilding('WOODCUTTERS_HUT', testLocation.x, testLocation.z);
                console.log('✅ Building queued successfully');
                console.log('- Building ID:', building.id);
                console.log('- Construction State:', building.currentConstructionState);
                
                // Test construction cycle
                console.log('\n⚙️ Running construction cycle...');
                for (let i = 0; i < 5; i++) {
                    game.constructionManager.update(0.016);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                console.log('✅ Construction cycle completed');
                console.log('- Final Queue:', game.constructionManager.getConstructionQueue().length);
                console.log('- Final Active:', game.constructionManager.getActiveConstructions().length);
                console.log('- Final Built:', game.constructionManager.getPlacedBuildings().length);
                
            } catch (error) {
                console.error('❌ Construction failed:', error.message);
            }
        } else {
            console.log('⚠️ No buildable locations found');
        }
        
        console.log('\n🎉 Validation completed!');
        
        // Make game globally available for further testing
        window.testGame = game;
        console.log('💡 Game instance saved as window.testGame for further testing');
        
    } catch (error) {
        console.error('❌ Validation failed:', error.message);
        console.error(error);
    }
})();
