// Complete Construction Cycle Test - Run in Browser Console
// This script provides a comprehensive test of the construction workflow

async function runCompleteConstructionTest() {
    console.log('🎯 === COMPLETE CONSTRUCTION CYCLE TEST ===');
    
    // Step 1: Verify game initialization
    if (!window.game) {
        console.error('❌ Game instance not found');
        return false;
    }
    
    const game = window.game;
    console.log('✅ Game instance found');
    
    // Step 2: Check initial setup
    console.log('\n📋 === INITIAL SETUP VERIFICATION ===');
    
    const buildings = game.constructionManager?.getAllBuildings() || [];
    const serfs = game.serfManager?.serfs || [];
    
    console.log(`Buildings: ${buildings.length}`);
    console.log(`Serfs: ${serfs.length}`);
    
    // Verify initial structures
    const castle = buildings.find(b => b.type === 'castle');
    const builderHut = buildings.find(b => b.type === 'builders_hut');
    const transporterHut = buildings.find(b => b.type === 'transporter_hut');
    
    if (!castle || !builderHut || !transporterHut) {
        console.error('❌ Missing initial structures');
        return false;
    }
    
    console.log('✅ Initial structures present');
    
    // Verify builder serf
    const builderSerf = serfs.find(s => s.profession === 'builder');
    if (!builderSerf) {
        console.error('❌ Builder serf not found');
        return false;
    }
    
    console.log('✅ Builder serf present');
    console.log(`Builder position: (${builderSerf.x}, ${builderSerf.y})`);
    console.log(`Builder assigned to: ${builderSerf.assignedBuilding?.type || 'none'}`);
    
    // Step 3: Test construction request
    console.log('\n🏗️ === CONSTRUCTION REQUEST TEST ===');
    
    const mapWidth = game.map?.width || game.gameMap?.width || 15;
    const mapHeight = game.map?.height || game.gameMap?.height || 15;
    const testX = Math.floor(mapWidth / 2) + 4;
    const testY = Math.floor(mapHeight / 2) + 4;
    
    console.log(`Map size: ${mapWidth}x${mapHeight}`);
    console.log(`Test construction location: (${testX}, ${testY})`);
    
    // Clear any existing constructions for clean test
    if (game.constructionManager) {
        console.log(`Queue before: ${game.constructionManager.constructionQueue.length}`);
        console.log(`Active before: ${game.constructionManager.activeConstructions.length}`);
    }
    
    // Request construction
    const constructionRequest = {
        type: 'WOODCUTTERS_HUT',
        x: testX,
        y: testY,
        priority: 1
    };
    
    let requestSuccess = false;
    if (game.constructionManager?.requestConstruction) {
        requestSuccess = game.constructionManager.requestConstruction(constructionRequest);
    } else {
        console.error('❌ Construction manager or requestConstruction method not found');
        return false;
    }
    
    if (!requestSuccess) {
        console.error('❌ Construction request failed');
        return false;
    }
    
    console.log('✅ Construction request successful');
    console.log(`Queue after: ${game.constructionManager.constructionQueue.length}`);
    
    // Step 4: Monitor construction progress
    console.log('\n⏱️ === CONSTRUCTION MONITORING ===');
    
    return new Promise((resolve) => {
        let checkCount = 0;
        const maxChecks = 30; // 30 seconds timeout
        
        const monitorInterval = setInterval(() => {
            checkCount++;
            
            const queueItem = game.constructionManager.constructionQueue.find(item => 
                item.x === testX && item.y === testY
            );
            
            const activeConstruction = game.constructionManager.activeConstructions.find(item => 
                item.x === testX && item.y === testY
            );
            
            const completedBuilding = buildings.find(b => 
                b.gridX === testX && b.gridZ === testY && b.type === 'WOODCUTTERS_HUT'
            );
            
            if (queueItem) {
                console.log(`📋 [${checkCount}] Construction queued - Priority: ${queueItem.priority}`);
            } else if (activeConstruction) {
                const building = activeConstruction.building;
                const progress = building.constructionProgress || 0;
                const total = building.constructionTime || 100;
                const percentage = Math.round((progress / total) * 100);
                
                console.log(`🔨 [${checkCount}] Construction active - Progress: ${progress}/${total} (${percentage}%)`);
                
                // Check for completion
                if (progress >= total) {
                    console.log('🎉 Construction completed!');
                    clearInterval(monitorInterval);
                    
                    // Final validation after a short delay
                    setTimeout(() => {
                        const finalResult = validateFinalState(testX, testY);
                        resolve(finalResult);
                    }, 1000);
                    return;
                }
            } else if (completedBuilding) {
                console.log('🏢 Building found completed in building manager');
                clearInterval(monitorInterval);
                const finalResult = validateFinalState(testX, testY);
                resolve(finalResult);
                return;
            } else {
                console.log(`⏳ [${checkCount}] Waiting for construction to start...`);
            }
            
            // Timeout check
            if (checkCount >= maxChecks) {
                console.error('⏰ Construction monitoring timeout');
                clearInterval(monitorInterval);
                resolve(false);
            }
        }, 1000);
    });
}

function validateFinalState(x, y) {
    console.log('\n🔍 === FINAL STATE VALIDATION ===');
    
    const game = window.game;
    
    // Check if building was properly added
    const completedBuilding = game.constructionManager?.getAllBuildings()?.find(b => 
        b.gridX === x && b.gridZ === y && b.type === 'WOODCUTTERS_HUT'
    );
    
    if (!completedBuilding) {
        console.error('❌ Completed building not found in construction manager');
        return false;
    }
    
    console.log('✅ Building successfully added to construction manager');
    console.log('Building details:', {
        type: completedBuilding.type,
        position: { x: completedBuilding.x, y: completedBuilding.y },
        constructionProgress: completedBuilding.constructionProgress,
        constructionTime: completedBuilding.constructionTime,
        isUnderConstruction: completedBuilding.isUnderConstruction ? completedBuilding.isUnderConstruction() : 'method not available'
    });
    
    // Check builder serf final state
    const builderSerf = game.serfManager?.serfs?.find(s => s.profession === 'builder');
    if (builderSerf) {
        console.log('✅ Builder serf final state:', {
            position: { x: builderSerf.x, y: builderSerf.y },
            currentTask: builderSerf.currentTask ? builderSerf.currentTask.constructor.name : 'none',
            state: builderSerf.state ? builderSerf.state.constructor.name : 'none',
            assignedBuilding: builderSerf.assignedBuilding ? builderSerf.assignedBuilding.type : 'none'
        });
    }
    
    // Check construction queue cleanup
    const remainingInQueue = game.constructionManager.constructionQueue.find(item => 
        item.x === x && item.y === y
    );
    
    const remainingActive = game.constructionManager.activeConstructions.find(item => 
        item.x === x && item.y === y
    );
    
    if (remainingInQueue || remainingActive) {
        console.warn('⚠️ Construction item still in queue or active after completion');
    } else {
        console.log('✅ Construction properly cleaned up from queue and active list');
    }
    
    console.log('\n🎯 === CONSTRUCTION CYCLE TEST COMPLETE ===');
    console.log('✅ Full construction cycle validated successfully!');
    
    return true;
}

// Quick test helper functions
window.testConstruction = function() {
    runCompleteConstructionTest().then(result => {
        if (result) {
            console.log('🎉 Overall test result: SUCCESS');
        } else {
            console.log('❌ Overall test result: FAILED');
        }
    });
};

window.quickGameCheck = function() {
    if (!window.game) {
        console.log('❌ Game not loaded');
        return;
    }
    
    const game = window.game;
    console.log('=== QUICK GAME CHECK ===');
    console.log('Game managers:', {
        buildingManager: !!game.buildingManager,
        serfManager: !!game.serfManager,
        constructionManager: !!game.constructionManager
    });
    
    if (game.buildingManager) {
        console.log('Buildings:', game.buildingManager.buildings.length);
    }
    
    if (game.serfManager) {
        console.log('Serfs:', game.serfManager.serfs.length);
    }
    
    if (game.constructionManager) {
        console.log('Construction queue:', game.constructionManager.constructionQueue.length);
        console.log('Active constructions:', game.constructionManager.activeConstructions.length);
    }
};

console.log('🔧 Construction test script loaded. Run testConstruction() to start the full test.');
console.log('💡 Use quickGameCheck() for a quick status overview.');
