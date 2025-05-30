// Test script to verify construction progress indicators in main game
(function() {
    console.log('🏗️ === CONSTRUCTION PROGRESS INDICATORS TEST ===');
    
    if (!window.game) {
        console.log('❌ Game not loaded yet. Waiting...');
        setTimeout(arguments.callee, 1000);
        return;
    }
    
    const game = window.game;
    console.log('✅ Game loaded successfully');
    
    // Check if ConstructionManager is available
    if (!game.constructionManager) {
        console.log('❌ ConstructionManager not found');
        return;
    }
    console.log('✅ ConstructionManager available');
    
    // Check Building class methods
    const testBuilding = game.constructionManager.getPlacedBuildings()[0];
    if (testBuilding) {
        const requiredMethods = [
            'startConstructionProcess',
            'updateConstructionProgress',
            '_createProgressBar',
            '_updateProgressBar',
            '_removeProgressBar'
        ];
        
        console.log('📋 Building methods check:');
        requiredMethods.forEach(method => {
            if (typeof testBuilding[method] === 'function') {
                console.log(`  ✅ ${method}() - Available`);
            } else {
                console.log(`  ❌ ${method}() - Missing`);
            }
        });
    }
    
    // Check current construction state
    const stats = {
        totalBuildings: game.constructionManager.getAllBuildings().length,
        queuedBuildings: game.constructionManager.getConstructionQueue().length,
        activeConstructions: game.constructionManager.getActiveConstructions().length,
        placedBuildings: game.constructionManager.getPlacedBuildings().length,
        availableBuilders: game.serfManager.serfs.filter(s => s.serfType === 'BUILDER' && !s.currentTask).length
    };
    
    console.log('📊 Current game state:');
    Object.entries(stats).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
    });
    
    // Auto-test construction if no active constructions
    if (stats.activeConstructions === 0 && stats.availableBuilders > 0) {
        console.log('🏗️ Starting auto-test construction...');
        
        // Find a buildable location
        let testX = 10, testZ = 10;
        for (let x = 8; x < 15; x++) {
            for (let z = 8; z < 15; z++) {
                if (game.constructionManager.isBuildable(x, z)) {
                    testX = x;
                    testZ = z;
                    break;
                }
            }
            if (testX === x) break;
        }
        
        try {
            // Add resources if needed
            game.resourceManager.addResource('WOOD', 10);
            game.resourceManager.addResource('STONE', 5);
            
            // Queue a building
            console.log(`🏠 Queuing WOODCUTTERS_HUT at (${testX}, ${testZ})`);
            const building = game.constructionManager.queueBuilding('WOODCUTTERS_HUT', testX, testZ);
            
            if (building) {
                console.log(`✅ Building queued: ${building.name} (ID: ${building.id})`);
                console.log(`🔨 Construction state: ${building.currentConstructionState}`);
                
                // Monitor progress
                let monitorCount = 0;
                const monitor = setInterval(() => {
                    monitorCount++;
                    const currentBuilding = game.constructionManager.getAllBuildings().find(b => b.id === building.id);
                    
                    if (!currentBuilding) {
                        console.log('❌ Building not found');
                        clearInterval(monitor);
                        return;
                    }
                    
                    const progress = (currentBuilding.getConstructionProgress() * 100).toFixed(1);
                    const hasProgressBar = currentBuilding.progressBarGroup ? '✅' : '❌';
                    const hasModel = currentBuilding.model ? '✅' : '❌';
                    const assignedBuilder = currentBuilding.assignedBuilderId || 'None';
                    
                    console.log(`📊 [${monitorCount}] Progress: ${progress}% | ProgressBar: ${hasProgressBar} | Model: ${hasModel} | Builder: ${assignedBuilder}`);
                    
                    if (currentBuilding.currentConstructionState === 'CONSTRUCTED') {
                        console.log('🎉 Construction completed!');
                        console.log(`🧹 Progress bar cleaned up: ${!currentBuilding.progressBarGroup ? '✅' : '❌'}`);
                        clearInterval(monitor);
                    }
                    
                    if (monitorCount > 60) { // 60 second timeout
                        console.log('⏰ Monitor timeout');
                        clearInterval(monitor);
                    }
                }, 1000);
                
            } else {
                console.log('❌ Failed to queue building');
            }
            
        } catch (error) {
            console.log('❌ Error during auto-test:', error.message);
        }
    }
    
})();
