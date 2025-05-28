// Construction Cycle Validation Script
// Run this in the browser console after the game loads

function validateConstructionCycle() {
    console.log('=== CONSTRUCTION CYCLE VALIDATION ===');
    
    if (!window.game) {
        console.error('Game instance not found. Make sure the game is loaded.');
        return false;
    }
    
    const game = window.game;
    
    // 1. Validate initial structures
    console.log('1. Checking initial structures...');
    const buildings = game.buildingManager.buildings;
    const castle = buildings.find(b => b.type === 'castle');
    const builderHut = buildings.find(b => b.type === 'builders_hut');
    const transporterHut = buildings.find(b => b.type === 'transporter_hut');
    
    if (!castle || !builderHut || !transporterHut) {
        console.error('Initial structures missing:', { castle: !!castle, builderHut: !!builderHut, transporterHut: !!transporterHut });
        return false;
    }
    console.log('✓ Initial structures present');
    
    // 2. Validate builder serf
    console.log('2. Checking builder serf...');
    const serfs = game.serfManager.serfs;
    const builderSerf = serfs.find(s => s.profession === 'builder');
    
    if (!builderSerf) {
        console.error('Builder serf not found');
        return false;
    }
    
    if (builderSerf.assignedBuilding !== builderHut) {
        console.error('Builder serf not assigned to Builder\'s Hut');
        return false;
    }
    console.log('✓ Builder serf found and assigned');
    
    // 3. Check construction manager
    console.log('3. Checking construction manager...');
    const constructionManager = game.constructionManager;
    console.log('Construction queue length:', constructionManager.constructionQueue.length);
    console.log('Active constructions:', constructionManager.activeConstructions.length);
    
    // 4. Test construction request
    console.log('4. Testing construction request...');
    
    // Find a suitable location for a woodcutter
    const mapWidth = game.map.width;
    const mapHeight = game.map.height;
    const testX = Math.floor(mapWidth / 2) + 5;
    const testY = Math.floor(mapHeight / 2) + 5;
    
    console.log(`Attempting to place woodcutter at (${testX}, ${testY})`);
    
    // Request construction
    const success = constructionManager.requestConstruction({
        type: 'woodcutter',
        x: testX,
        y: testY,
        priority: 1
    });
    
    if (!success) {
        console.error('Construction request failed');
        return false;
    }
    
    console.log('✓ Construction request successful');
    console.log('New queue length:', constructionManager.constructionQueue.length);
    
    // 5. Monitor construction progress
    console.log('5. Monitoring construction progress...');
    monitorConstruction(constructionManager, testX, testY);
    
    return true;
}

function monitorConstruction(constructionManager, x, y) {
    const monitorInterval = setInterval(() => {
        const queueItem = constructionManager.constructionQueue.find(item => 
            item.x === x && item.y === y
        );
        
        const activeConstruction = constructionManager.activeConstructions.find(item => 
            item.x === x && item.y === y
        );
        
        if (queueItem) {
            console.log(`📋 Construction queued at (${x}, ${y}) - Priority: ${queueItem.priority}`);
        } else if (activeConstruction) {
            const building = activeConstruction.building;
            console.log(`🔨 Construction active at (${x}, ${y}) - Progress: ${building.constructionProgress}/${building.constructionTime}`);
            
            if (building.constructionProgress >= building.constructionTime) {
                console.log('🎉 Construction completed!');
                clearInterval(monitorInterval);
                
                // Final validation
                setTimeout(() => {
                    validateCompletedConstruction(x, y);
                }, 1000);
            }
        } else {
            // Check if building is completed
            const completedBuilding = window.game.buildingManager.buildings.find(b => 
                b.x === x && b.y === y && b.type === 'woodcutter'
            );
            
            if (completedBuilding) {
                console.log('🏢 Building found in building manager - construction cycle complete!');
                clearInterval(monitorInterval);
            }
        }
    }, 1000);
    
    // Stop monitoring after 30 seconds
    setTimeout(() => {
        clearInterval(monitorInterval);
        console.log('⏰ Monitoring timeout reached');
    }, 30000);
}

function validateCompletedConstruction(x, y) {
    console.log('=== FINAL VALIDATION ===');
    
    const game = window.game;
    const building = game.buildingManager.buildings.find(b => 
        b.x === x && b.y === y && b.type === 'woodcutter'
    );
    
    if (!building) {
        console.error('❌ Completed building not found in building manager');
        return false;
    }
    
    console.log('✓ Building successfully added to building manager');
    console.log('Building state:', {
        type: building.type,
        position: { x: building.x, y: building.y },
        constructionProgress: building.constructionProgress,
        constructionTime: building.constructionTime,
        isUnderConstruction: building.isUnderConstruction()
    });
    
    // Check if builder returned to hut
    const builderSerf = game.serfManager.serfs.find(s => s.profession === 'builder');
    if (builderSerf) {
        console.log('Builder serf final state:', {
            position: { x: builderSerf.x, y: builderSerf.y },
            currentTask: builderSerf.currentTask ? builderSerf.currentTask.constructor.name : 'none',
            state: builderSerf.state ? builderSerf.state.constructor.name : 'none'
        });
    }
    
    console.log('🎯 Construction cycle validation complete!');
    return true;
}

// Quick test functions for manual execution
function quickConstructionTest() {
    validateConstructionCycle();
}

function checkGameState() {
    if (!window.game) {
        console.error('Game not loaded');
        return;
    }
    
    const game = window.game;
    console.log('=== GAME STATE ===');
    console.log('Buildings:', game.buildingManager.buildings.length);
    console.log('Serfs:', game.serfManager.serfs.length);
    console.log('Construction queue:', game.constructionManager.constructionQueue.length);
    console.log('Active constructions:', game.constructionManager.activeConstructions.length);
    
    game.buildingManager.buildings.forEach((building, i) => {
        console.log(`Building ${i}:`, {
            type: building.type,
            position: { x: building.x, y: building.y },
            underConstruction: building.isUnderConstruction()
        });
    });
    
    game.serfManager.serfs.forEach((serf, i) => {
        console.log(`Serf ${i}:`, {
            profession: serf.profession,
            position: { x: serf.x, y: serf.y },
            assignedBuilding: serf.assignedBuilding ? serf.assignedBuilding.type : 'none',
            currentTask: serf.currentTask ? serf.currentTask.constructor.name : 'none'
        });
    });
}

// Auto-run validation when script loads
console.log('Construction validation script loaded. Run validateConstructionCycle() to test.');
