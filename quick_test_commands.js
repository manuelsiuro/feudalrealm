// Quick Construction Test Commands
// Copy and paste these into the browser console on the test page

// Test 1: Basic game state check
function quickGameCheck() {
    if (!window.game) return console.error('Game not loaded');
    console.log('Game:', !!window.game);
    console.log('Construction Manager:', !!window.game.constructionManager);
    console.log('Serf Manager:', !!window.game.serfManager);
    console.log('Grid Manager:', !!window.game.gridManager);
    
    const buildings = window.game.constructionManager?.getAllBuildings() || [];
    const serfs = window.game.serfManager?.serfs || [];
    console.log(`Buildings: ${buildings.length}, Serfs: ${serfs.length}`);
}

// Test 2: Quick construction request
function quickConstructionTest() {
    if (!window.game) return console.error('Game not loaded');
    
    // Try to build a woodcutter's hut at position (6, 6)
    const success = window.game.constructionManager.requestConstruction('WOODCUTTERS_HUT', 6, 6);
    console.log('Construction requested:', success);
    
    // Check state after 1 second
    setTimeout(() => {
        const buildings = window.game.constructionManager?.getAllBuildings() || [];
        const newBuilding = buildings.find(b => b.gridX === 6 && b.gridZ === 6);
        console.log('New building found:', !!newBuilding);
        if (newBuilding) {
            console.log('Building state:', newBuilding.state);
            console.log('Progress:', Math.round(newBuilding.constructionProgress * 100) + '%');
        }
    }, 1000);
}

// Test 3: Monitor construction progress
function monitorConstruction() {
    if (!window.game) return console.error('Game not loaded');
    
    let count = 0;
    const monitor = setInterval(() => {
        count++;
        const buildings = window.game.constructionManager?.getAllBuildings() || [];
        const constructingBuildings = buildings.filter(b => b.state === 'constructing');
        
        console.log(`Monitor ${count}: Constructing buildings: ${constructingBuildings.length}`);
        
        constructingBuildings.forEach(b => {
            console.log(`  ${b.type} at (${b.gridX}, ${b.gridZ}): ${Math.round(b.constructionProgress * 100)}%`);
        });
        
        if (constructingBuildings.length === 0 || count >= 20) {
            clearInterval(monitor);
            console.log('Monitoring stopped');
        }
    }, 1000);
}

console.log('Quick test commands loaded:');
console.log('- quickGameCheck() - Check game state');
console.log('- quickConstructionTest() - Request construction');
console.log('- monitorConstruction() - Monitor progress');
