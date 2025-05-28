// Paste this script into the browser console on http://localhost:3000
// to validate the ProductionChain integration

console.log('🔍 Starting Production Chain Integration Test...');

// Wait for game to initialize
setTimeout(() => {
    try {
        if (!window.game) {
            console.error('❌ Game not found - make sure the game has loaded');
            return;
        }
        
        console.log('✅ Game found');
        
        // Test 1: Check ProductionChainManager exists
        if (!window.game.productionChainManager) {
            console.error('❌ ProductionChainManager not found');
            return;
        }
        console.log('✅ ProductionChainManager exists');
        
        // Test 2: Check ConstructionManager has game reference
        if (!window.game.constructionManager.game) {
            console.error('❌ ConstructionManager missing game reference');
            return;
        }
        console.log('✅ ConstructionManager has game reference');
        
        // Test 3: Check registered buildings
        const registeredBuildings = window.game.productionChainManager.buildings;
        console.log(`📊 Registered buildings: ${registeredBuildings.size}`);
        
        if (registeredBuildings.size > 0) {
            console.log('✅ Buildings are registered:');
            for (const [id, building] of registeredBuildings) {
                console.log(`  - ${building.name} (${building.type}) at (${building.gridX}, ${building.gridZ})`);
            }
        } else {
            console.warn('⚠️ No buildings registered yet');
        }
        
        // Test 4: Check placed buildings vs registered buildings
        const placedBuildings = window.game.constructionManager.placedBuildings;
        console.log(`📊 Placed buildings: ${placedBuildings.length}`);
        
        let missingRegistrations = 0;
        for (const building of placedBuildings) {
            if (!registeredBuildings.has(building.id)) {
                console.warn(`⚠️ Building ${building.name} (${building.id}) is placed but not registered`);
                missingRegistrations++;
            }
        }
        
        if (missingRegistrations === 0 && placedBuildings.length > 0) {
            console.log('✅ All placed buildings are properly registered');
        }
        
        // Test 5: Check ProductionChainUI
        if (window.game.uiManager?.productionChainUI) {
            console.log('✅ ProductionChainUI exists');
        } else {
            console.warn('⚠️ ProductionChainUI not found');
        }
        
        // Test 6: Verify animate loop integration
        const animateCode = window.game.animate.toString();
        const hasProductionUpdate = animateCode.includes('productionChainManager.update');
        const hasUIUpdate = animateCode.includes('productionChainUI.update');
        
        console.log(`✅ ProductionChainManager.update in animate loop: ${hasProductionUpdate}`);
        console.log(`✅ ProductionChainUI.update in animate loop: ${hasUIUpdate}`);
        
        console.log('\n🎉 Integration test completed!');
        
        if (registeredBuildings.size > 0 && missingRegistrations === 0 && hasProductionUpdate && hasUIUpdate) {
            console.log('🟢 All tests passed - Integration is working correctly!');
        } else {
            console.log('🟡 Some issues detected - see warnings above');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}, 3000); // Wait 3 seconds for game initialization

console.log('ℹ️ Test will run in 3 seconds...');
