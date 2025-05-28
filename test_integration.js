import Game from './src/core/Game.js';

async function testIntegration() {
    console.log('🧪 Testing ProductionChainManager and ConstructionManager Integration...');
    
    try {
        // Create and initialize game
        const game = new Game();
        console.log('✅ Game instance created');
        
        await game.init();
        console.log('✅ Game initialized');
        
        // Check if ConstructionManager has access to game
        const hasGameRef = !!game.constructionManager.game;
        console.log('✅ ConstructionManager.game exists:', hasGameRef);
        
        if (hasGameRef) {
            const hasPCM = !!game.constructionManager.game.productionChainManager;
            console.log('✅ ConstructionManager can access ProductionChainManager:', hasPCM);
            
            if (hasPCM) {
                const registerMethod = typeof game.constructionManager.game.productionChainManager.registerBuilding;
                console.log('✅ ProductionChainManager.registerBuilding method type:', registerMethod);
            }
        }
        
        // Check if ProductionChainManager is properly initialized
        console.log('✅ ProductionChainManager exists:', !!game.productionChainManager);
        
        // Check if initial buildings are registered
        const registeredBuildings = game.productionChainManager.buildings.size;
        console.log('📊 Initial registered buildings count:', registeredBuildings);
        
        // List registered buildings
        if (registeredBuildings > 0) {
            console.log('📋 Registered buildings:');
            for (const [id, building] of game.productionChainManager.buildings) {
                console.log(`  - ${building.name} (ID: ${id})`);
            }
        }
        
        console.log('🎉 Integration test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

testIntegration();
