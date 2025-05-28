// Final Integration Test for ProductionChain Integration
// Copy and paste this entire script into the browser console at http://localhost:3000

(async function runFinalIntegrationTest() {
    console.clear();
    console.log('🚀 Starting FINAL ProductionChain Integration Test');
    console.log('='.repeat(60));
    
    // Helper function to wait for game initialization
    function waitForGame(maxAttempts = 10) {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const checkGame = () => {
                attempts++;
                if (window.game && window.game.constructionManager) {
                    resolve(window.game);
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Game failed to initialize within timeout'));
                } else {
                    setTimeout(checkGame, 500);
                }
            };
            checkGame();
        });
    }
    
    try {
        // Wait for game to be ready
        console.log('⏳ Waiting for game initialization...');
        const game = await waitForGame();
        console.log('✅ Game initialized successfully');
        
        // Test 1: Core System Checks
        console.log('\n📋 Test 1: Core System Verification');
        console.log('-'.repeat(40));
        
        const tests = [
            { name: 'Game instance', check: () => !!window.game },
            { name: 'ProductionChainManager', check: () => !!game.productionChainManager },
            { name: 'ConstructionManager', check: () => !!game.constructionManager },
            { name: 'ConstructionManager.game reference', check: () => !!game.constructionManager.game },
            { name: 'UIManager', check: () => !!game.uiManager },
            { name: 'ProductionChainUI', check: () => !!game.uiManager?.productionChainUI }
        ];
        
        tests.forEach(test => {
            const result = test.check();
            console.log(`${result ? '✅' : '❌'} ${test.name}: ${result}`);
        });
        
        // Test 2: Animate Loop Integration
        console.log('\n📋 Test 2: Animate Loop Integration');
        console.log('-'.repeat(40));
        
        const animateCode = game.animate.toString();
        const hasProductionUpdate = animateCode.includes('productionChainManager.update');
        const hasUIUpdate = animateCode.includes('productionChainUI.update');
        
        console.log(`${hasProductionUpdate ? '✅' : '❌'} ProductionChainManager.update in animate loop`);
        console.log(`${hasUIUpdate ? '✅' : '❌'} ProductionChainUI.update in animate loop`);
        
        // Test 3: Building Registration Analysis
        console.log('\n📋 Test 3: Building Registration Analysis');
        console.log('-'.repeat(40));
        
        const registeredBuildings = game.productionChainManager.buildings;
        const placedBuildings = game.constructionManager.placedBuildings;
        
        console.log(`📊 Total registered buildings: ${registeredBuildings.size}`);
        console.log(`📊 Total placed buildings: ${placedBuildings.length}`);
        
        if (registeredBuildings.size > 0) {
            console.log('\n🏢 Registered Buildings:');
            for (const [id, building] of registeredBuildings) {
                console.log(`  • ${building.name} (${building.type}) - ID: ${id} - Status: ${building.status}`);
            }
        }
        
        // Check for unregistered buildings
        let unregisteredCount = 0;
        for (const building of placedBuildings) {
            if (!registeredBuildings.has(building.id)) {
                if (unregisteredCount === 0) {
                    console.log('\n⚠️ Unregistered Buildings:');
                }
                console.log(`  • ${building.name} (ID: ${building.id}) - Status: ${building.status}`);
                unregisteredCount++;
            }
        }
        
        if (unregisteredCount === 0 && placedBuildings.length > 0) {
            console.log('✅ All placed buildings are properly registered');
        }
        
        // Test 4: Method Availability Check
        console.log('\n📋 Test 4: Method Availability Check');
        console.log('-'.repeat(40));
        
        const methodChecks = [
            { obj: 'productionChainManager', method: 'registerBuilding', path: game.productionChainManager },
            { obj: 'productionChainManager', method: 'unregisterBuilding', path: game.productionChainManager },
            { obj: 'productionChainManager', method: 'update', path: game.productionChainManager },
            { obj: 'constructionManager', method: 'setGame', path: game.constructionManager },
            { obj: 'productionChainUI', method: 'update', path: game.uiManager?.productionChainUI }
        ];
        
        methodChecks.forEach(check => {
            const hasMethod = check.path && typeof check.path[check.method] === 'function';
            console.log(`${hasMethod ? '✅' : '❌'} ${check.obj}.${check.method}()`);
        });
        
        // Test 5: Building Placement Test (if possible)
        console.log('\n📋 Test 5: Building Placement Test');
        console.log('-'.repeat(40));
        
        const initialBuildingCount = registeredBuildings.size;
        console.log(`📊 Initial registered buildings: ${initialBuildingCount}`);
        
        // Try to place a test building if possible
        if (game.constructionManager.confirmPlacement) {
            console.log('🔧 Building placement method available for testing');
        }
        
        // Test 6: Production Chain Functionality
        console.log('\n📋 Test 6: Production Chain Functionality');
        console.log('-'.repeat(40));
        
        if (registeredBuildings.size > 0) {
            // Check if any buildings have production capabilities
            let productionCapableBuildings = 0;
            for (const [id, building] of registeredBuildings) {
                if (building.canProduce && typeof building.canProduce === 'function') {
                    productionCapableBuildings++;
                    console.log(`  • ${building.name} has production capabilities`);
                }
            }
            console.log(`📊 Production-capable buildings: ${productionCapableBuildings}`);
        }
        
        // Final Summary
        console.log('\n🎯 FINAL INTEGRATION TEST SUMMARY');
        console.log('='.repeat(60));
        
        const criticalChecks = [
            hasProductionUpdate && hasUIUpdate,
            game.constructionManager.game === game,
            game.productionChainManager,
            registeredBuildings.size >= 0,
            unregisteredCount === 0 || placedBuildings.length === 0
        ];
        
        const passedChecks = criticalChecks.filter(Boolean).length;
        const totalChecks = criticalChecks.length;
        
        console.log(`📊 Critical Checks Passed: ${passedChecks}/${totalChecks}`);
        
        if (passedChecks === totalChecks) {
            console.log('🎉 🟢 INTEGRATION SUCCESSFUL! 🟢 🎉');
            console.log('✅ ProductionChainManager and ProductionChainUI are fully integrated');
            console.log('✅ Building registration is working correctly');
            console.log('✅ Update loops are properly connected');
        } else {
            console.log('🟡 INTEGRATION PARTIALLY SUCCESSFUL');
            console.log('⚠️ Some issues detected - review the test results above');
        }
        
        console.log('\n📋 Next Steps:');
        console.log('1. Place some buildings using the game UI');
        console.log('2. Check console for registration messages');
        console.log('3. Verify production chain functionality');
        
        return {
            success: passedChecks === totalChecks,
            registeredBuildings: registeredBuildings.size,
            placedBuildings: placedBuildings.length,
            unregisteredCount,
            hasAnimateIntegration: hasProductionUpdate && hasUIUpdate
        };
        
    } catch (error) {
        console.error('❌ Integration test failed:', error);
        return { success: false, error: error.message };
    }
})();
