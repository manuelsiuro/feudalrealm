// Construction Cycle Validation Script
// This script validates the complete construction cycle in the browser console

async function validateConstructionCycle() {
    console.log('🏗️ Starting Construction Cycle Validation...');
    
    // Step 1: Check if game is loaded
    if (!window.game) {
        console.error('❌ Game not found! Make sure to load this on the game page.');
        return false;
    }
    
    console.log('✅ Game found');
    
    // Step 2: Get initial state
    const initialBuildings = window.game.constructionManager?.getAllBuildings() || [];
    const initialSerfs = window.game.serfManager?.serfs || [];
    const builders = initialSerfs.filter(s => s.profession === 'builder');
    
    console.log(`📊 Initial State:
    - Buildings: ${initialBuildings.length}
    - Total Serfs: ${initialSerfs.length}
    - Builder Serfs: ${builders.length}`);
    
    // Step 3: Find a good location for construction
    const gridManager = window.game.gridManager;
    let constructionX = 5, constructionZ = 5;
    
    // Find an empty spot
    for (let x = 3; x < 10; x++) {
        for (let z = 3; z < 10; z++) {
            if (gridManager.canPlaceBuilding('WOODCUTTERS_HUT', x, z)) {
                constructionX = x;
                constructionZ = z;
                break;
            }
        }
        if (constructionX !== 5) break;
    }
    
    console.log(`🎯 Construction location: (${constructionX}, ${constructionZ})`);
    
    // Step 4: Request construction
    try {
        const success = window.game.constructionManager.requestConstruction('WOODCUTTERS_HUT', constructionX, constructionZ);
        if (!success) {
            console.error('❌ Failed to request construction');
            return false;
        }
        console.log('✅ Construction requested successfully');
    } catch (error) {
        console.error('❌ Error requesting construction:', error);
        return false;
    }
    
    // Step 5: Monitor the construction process
    let monitoring = true;
    let checkCount = 0;
    const maxChecks = 60; // 30 seconds with 500ms intervals
    
    console.log('🔄 Monitoring construction progress...');
    
    const monitorInterval = setInterval(() => {
        checkCount++;
        
        // Get current state
        const currentBuildings = window.game.constructionManager?.getAllBuildings() || [];
        const activeConstructions = window.game.constructionManager?.activeConstructions || new Map();
        const constructionQueue = window.game.constructionManager?.constructionQueue || [];
        
        // Find our building
        const ourBuilding = currentBuildings.find(b => 
            b.gridX === constructionX && 
            b.gridZ === constructionZ && 
            b.type === 'WOODCUTTERS_HUT'
        );
        
        if (ourBuilding) {
            console.log(`🏗️ Check ${checkCount}: Building found - State: ${ourBuilding.state}, Progress: ${(ourBuilding.constructionProgress * 100).toFixed(1)}%`);
            
            // Check if construction is complete
            if (ourBuilding.state === 'built' || ourBuilding.constructionProgress >= 1.0) {
                clearInterval(monitorInterval);
                console.log('🎉 Construction completed successfully!');
                
                // Final validation
                validateFinalState(ourBuilding, constructionX, constructionZ);
                return;
            }
        } else {
            console.log(`🔍 Check ${checkCount}: Building not found yet. Queue: ${constructionQueue.length}, Active: ${activeConstructions.size}`);
        }
        
        // Timeout check
        if (checkCount >= maxChecks) {
            clearInterval(monitorInterval);
            console.error('⏰ Timeout: Construction did not complete within expected time');
            validateFinalState(null, constructionX, constructionZ);
        }
    }, 500);
    
    return true;
}

function validateFinalState(building, expectedX, expectedZ) {
    console.log('\n📋 Final State Validation:');
    
    const allBuildings = window.game.constructionManager?.getAllBuildings() || [];
    const allSerfs = window.game.serfManager?.serfs || [];
    const builders = allSerfs.filter(s => s.profession === 'builder');
    
    console.log(`📊 Final Counts:
    - Total Buildings: ${allBuildings.length}
    - Builder Serfs: ${builders.length}`);
    
    if (building) {
        console.log(`✅ Target Building:
        - Type: ${building.type}
        - Position: (${building.gridX}, ${building.gridZ})
        - State: ${building.state}
        - Progress: ${(building.constructionProgress * 100).toFixed(1)}%`);
        
        // Validate builder returned to hut
        const buildersHut = allBuildings.find(b => b.type === 'BUILDERS_HUT');
        if (buildersHut && builders.length > 0) {
            const builderSerf = builders[0];
            const distanceToHut = Math.abs(builderSerf.gridX - buildersHut.gridX) + Math.abs(builderSerf.gridZ - buildersHut.gridZ);
            console.log(`🏠 Builder status:
            - Position: (${builderSerf.gridX}, ${builderSerf.gridZ})
            - State: ${builderSerf.currentState?.constructor.name || 'Unknown'}
            - Distance to hut: ${distanceToHut} tiles`);
        }
    } else {
        console.log('❌ Target building not found or construction failed');
    }
    
    console.log('\n🏁 Validation complete!');
}

// Quick test functions for manual execution
window.testConstruction = validateConstructionCycle;
window.checkGameState = () => {
    if (!window.game) {
        console.log('❌ Game not loaded');
        return;
    }
    
    const buildings = window.game.constructionManager?.getAllBuildings() || [];
    const serfs = window.game.serfManager?.serfs || [];
    const queue = window.game.constructionManager?.constructionQueue || [];
    const active = window.game.constructionManager?.activeConstructions || new Map();
    
    console.log(`🎮 Game State:
    - Buildings: ${buildings.length}
    - Serfs: ${serfs.length}
    - Construction Queue: ${queue.length}
    - Active Constructions: ${active.size}`);
    
    buildings.forEach((b, i) => {
        console.log(`  Building ${i + 1}: ${b.type} at (${b.gridX}, ${b.gridZ}) - ${b.state}`);
    });
    
    serfs.forEach((s, i) => {
        console.log(`  Serf ${i + 1}: ${s.profession} at (${s.gridX}, ${s.gridZ}) - ${s.currentState?.constructor.name || 'Unknown'}`);
    });
};

console.log('🎯 Construction validation script loaded!');
console.log('Usage:');
console.log('- testConstruction() - Run full construction cycle test');
console.log('- checkGameState() - Check current game state');
