// Manual Construction Cycle Test
// Run this in the browser console to test the construction cycle manually

console.log('=== Construction Cycle Manual Test ===');

// Wait for game to be ready
if (!window.game) {
    console.log('Waiting for game to initialize...');
    setTimeout(() => {
        if (window.game) {
            console.log('Game ready! Starting test...');
            runConstructionTest();
        } else {
            console.log('Game not ready after timeout');
        }
    }, 2000);
} else {
    console.log('Game ready! Starting test...');
    runConstructionTest();
}

function runConstructionTest() {
    const game = window.game;
    
    console.log('1. Checking initial state...');
    console.log(`   - Placed buildings: ${game.constructionManager.placedBuildings.length}`);
    console.log(`   - Construction queue: ${game.constructionManager.constructionQueue.length}`);
    console.log(`   - Active constructions: ${game.constructionManager.activeConstructions.length}`);
    
    const builders = game.serfManager.getAvailableSerfsByProfession('BUILDER');
    console.log(`   - Available builders: ${builders.length}`);
    
    if (builders.length === 0) {
        console.log('ERROR: No builders available!');
        return;
    }
    
    console.log('2. Checking resources...');
    const wood = game.resourceManager.getResourceCount('WOOD');
    console.log(`   - Wood: ${wood}`);
    
    if (wood < 20) {
        console.log('   - Adding wood for testing...');
        game.resourceManager.addResource('WOOD', 50);
        console.log(`   - Wood after adding: ${game.resourceManager.getResourceCount('WOOD')}`);
    }
    
    console.log('3. Starting building placement...');
    game.constructionManager.startPlacement('WOODCUTTERS_HUT');
    
    if (game.constructionManager.isPlacing) {
        console.log('   - Placement mode activated ✓');
        
        // Find a valid placement location
        const mapCenter = Math.floor(game.gameMap.width / 2);
        let placed = false;
        
        for (let offset = 3; offset < 8 && !placed; offset++) {
            const gridX = mapCenter + offset;
            const gridZ = mapCenter;
            
            if (game.constructionManager.isBuildable(gridX, gridZ)) {
                const worldX = (gridX - (game.gameMap.width - 1) / 2) * 10; // TILE_SIZE = 10
                const worldZ = (gridZ - (game.gameMap.height - 1) / 2) * 10;
                
                console.log(`4. Attempting to place building at grid (${gridX}, ${gridZ}), world (${worldX}, ${worldZ})...`);
                const success = game.constructionManager.confirmPlacement({ x: worldX, z: worldZ });
                
                if (success) {
                    console.log('   - Building placement confirmed ✓');
                    placed = true;
                    
                    console.log('5. Monitoring construction process...');
                    monitorConstruction();
                } else {
                    console.log('   - Building placement failed');
                }
            }
        }
        
        if (!placed) {
            console.log('ERROR: Could not find valid placement location');
        }
    } else {
        console.log('ERROR: Failed to activate placement mode');
    }
}

function monitorConstruction() {
    let checkCount = 0;
    const maxChecks = 30; // 30 seconds max
    
    const monitor = setInterval(() => {
        checkCount++;
        const game = window.game;
        
        const queue = game.constructionManager.constructionQueue.length;
        const active = game.constructionManager.activeConstructions.length;
        const placed = game.constructionManager.placedBuildings.length;
        
        console.log(`   Monitor ${checkCount}: Queue=${queue}, Active=${active}, Placed=${placed}`);
        
        // Check if builder was assigned and construction is progressing
        if (game.constructionManager.activeConstructions.length > 0) {
            const building = game.constructionManager.activeConstructions[0];
            const progress = (building.currentConstructionProgress / building.constructionRequiredTime * 100).toFixed(1);
            console.log(`   - Construction progress: ${progress}%`);
            console.log(`   - Assigned builder: ${building.assignedBuilderId || 'None'}`);
            
            if (building.assignedBuilderId) {
                const builder = game.serfManager.getSerfById(building.assignedBuilderId);
                if (builder) {
                    console.log(`   - Builder state: ${builder.currentState.name}`);
                    console.log(`   - Builder position: (${builder.gridX}, ${builder.gridZ})`);
                }
            }
        }
        
        // Check for completion
        const woodcutterHuts = game.constructionManager.placedBuildings.filter(b => b.type === 'WOODCUTTERS_HUT');
        if (woodcutterHuts.length > 0 && game.constructionManager.activeConstructions.length === 0) {
            console.log('🎉 CONSTRUCTION COMPLETED SUCCESSFULLY! 🎉');
            console.log(`   - Total buildings: ${game.constructionManager.placedBuildings.length}`);
            
            const completedBuilding = woodcutterHuts[woodcutterHuts.length - 1];
            console.log(`   - Completed building state: ${completedBuilding.currentConstructionState}`);
            console.log(`   - Is constructed: ${completedBuilding.isConstructed}`);
            
            clearInterval(monitor);
            return;
        }
        
        // Check for errors
        if (queue === 0 && active === 0 && woodcutterHuts.length === 0) {
            console.log('⚠️ WARNING: No buildings in queue, active, or completed');
        }
        
        if (checkCount >= maxChecks) {
            console.log('⏰ TIMEOUT: Construction monitoring stopped after 30 seconds');
            clearInterval(monitor);
        }
    }, 1000);
}

// Test helper functions
window.testHelpers = {
    checkGameState: function() {
        const game = window.game;
        console.log('=== GAME STATE ===');
        console.log(`Buildings: ${game.constructionManager.placedBuildings.length} placed, ${game.constructionManager.activeConstructions.length} active, ${game.constructionManager.constructionQueue.length} queued`);
        console.log(`Serfs: ${game.serfManager.serfs.length} total`);
        console.log(`Resources: Wood=${game.resourceManager.getResourceCount('WOOD')}, Stone=${game.resourceManager.getResourceCount('STONE')}`);
        console.log('================');
    },
    
    addResources: function() {
        const game = window.game;
        game.resourceManager.addResource('WOOD', 100);
        game.resourceManager.addResource('STONE', 100);
        console.log('Added 100 wood and 100 stone');
    },
    
    forceComplete: function() {
        const game = window.game;
        if (game.constructionManager.activeConstructions.length > 0) {
            const building = game.constructionManager.activeConstructions[0];
            building.currentConstructionProgress = building.constructionRequiredTime;
            console.log('Forced construction completion');
        } else {
            console.log('No active constructions to complete');
        }
    }
};

console.log('Test helpers available: testHelpers.checkGameState(), testHelpers.addResources(), testHelpers.forceComplete()');
