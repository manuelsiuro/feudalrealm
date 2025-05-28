// Test building placement and registration
// Paste this in browser console after the main integration test

console.log('🏗️ Testing building placement and registration...');

setTimeout(() => {
    try {
        if (!window.game) {
            console.error('❌ Game not found');
            return;
        }
        
        const initialCount = window.game.productionChainManager.buildings.size;
        console.log(`📊 Initial registered buildings: ${initialCount}`);
        
        // Select a building type to place
        const buildingType = 'LUMBER_MILL'; // A production building
        console.log(`Selecting ${buildingType} for placement...`);
        
        // Start placement mode
        window.game.constructionManager.selectBuilding(buildingType);
        
        if (window.game.constructionManager.selectedBuilding) {
            console.log(`✅ Building selected: ${window.game.constructionManager.selectedBuilding.name}`);
            
            // Find a good location (near castle but not occupied)
            const castle = window.game.constructionManager.placedBuildings.find(b => b.type === 'CASTLE');
            if (castle) {
                const testX = castle.gridX + 2;
                const testZ = castle.gridZ + 2;
                
                // Check if location is buildable
                if (window.game.constructionManager.isBuildable(testX, testZ)) {
                    console.log(`Attempting to place at grid (${testX}, ${testZ})...`);
                    
                    // Convert grid to world coordinates for placement
                    const worldX = (testX - (window.game.gameMap.width - 1) / 2) * 3; // TILE_SIZE = 3
                    const worldZ = (testZ - (window.game.gameMap.height - 1) / 2) * 3;
                    
                    const success = window.game.constructionManager.confirmPlacement({x: worldX, y: 0, z: worldZ});
                    
                    if (success) {
                        console.log('✅ Building placed successfully');
                        
                        // Check if it was registered
                        setTimeout(() => {
                            const newCount = window.game.productionChainManager.buildings.size;
                            if (newCount > initialCount) {
                                console.log('✅ New building was registered with ProductionChainManager');
                                console.log(`📊 Total registered buildings: ${newCount}`);
                            } else {
                                console.warn('⚠️ Building was placed but not registered');
                            }
                        }, 500);
                        
                    } else {
                        console.error('❌ Building placement failed');
                    }
                } else {
                    console.warn(`⚠️ Location (${testX}, ${testZ}) is not buildable`);
                }
            } else {
                console.error('❌ Castle not found for reference positioning');
            }
        } else {
            console.error(`❌ Failed to select ${buildingType}`);
        }
        
    } catch (error) {
        console.error('❌ Building placement test failed:', error);
    }
}, 1000);

console.log('ℹ️ Building placement test will run in 1 second...');
