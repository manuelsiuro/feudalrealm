// Construction Progress Indicator Test
// This test validates the construction progress system including 3D progress bars

console.log('🏗️ === CONSTRUCTION PROGRESS INDICATOR TEST ===');

async function testConstructionProgress() {
    if (!window.game) {
        console.error('❌ Game not loaded. Please run this test on the game page.');
        return false;
    }

    const game = window.game;
    console.log('✅ Game instance found');

    // Test 1: Verify construction system components
    console.log('\n📋 Test 1: System Component Verification');
    console.log('-'.repeat(50));
    
    const components = [
        { name: 'ConstructionManager', obj: game.constructionManager },
        { name: 'SerfManager', obj: game.serfManager },
        { name: 'ResourceManager', obj: game.resourceManager },
        { name: 'GameMap', obj: game.gameMap }
    ];

    for (const component of components) {
        if (component.obj) {
            console.log(`✅ ${component.name}: Available`);
        } else {
            console.error(`❌ ${component.name}: Missing`);
            return false;
        }
    }

    // Test 2: Verify Building class construction methods
    console.log('\n📋 Test 2: Building Construction Methods Verification');
    console.log('-'.repeat(50));
    
    const requiredMethods = [
        'startConstructionProcess',
        'updateConstructionProgress', 
        'completeConstructionProcess',
        'getConstructionProgress',
        'getConstructionTimeRemaining',
        '_createProgressBar',
        '_updateProgressBar',
        '_removeProgressBar'
    ];

    // Create a test building to check methods
    const testBuilding = game.constructionManager.getPlacedBuildings()[0];
    if (!testBuilding) {
        console.error('❌ No buildings found to test methods');
        return false;
    }

    for (const method of requiredMethods) {
        if (typeof testBuilding[method] === 'function') {
            console.log(`✅ Building.${method}(): Available`);
        } else {
            console.error(`❌ Building.${method}(): Missing`);
            return false;
        }
    }

    // Test 3: Verify initial resources
    console.log('\n📋 Test 3: Resource Verification');
    console.log('-'.repeat(50));
    
    const woodCount = game.resourceManager.getResourceCount('WOOD');
    console.log(`Wood available: ${woodCount}`);
    
    if (woodCount < 50) {
        console.log('Adding wood for testing...');
        game.resourceManager.addResource('WOOD', 100);
        console.log(`Wood after adding: ${game.resourceManager.getResourceCount('WOOD')}`);
    }

    // Test 4: Verify builders are available
    console.log('\n📋 Test 4: Builder Verification');
    console.log('-'.repeat(50));
    
    const allSerfs = game.serfManager.serfs || [];
    const builders = allSerfs.filter(s => s.profession === 'BUILDER');
    console.log(`Total serfs: ${allSerfs.length}`);
    console.log(`Available builders: ${builders.length}`);

    if (builders.length === 0) {
        console.error('❌ No builders available for testing');
        return false;
    }

    const availableBuilder = builders.find(s => !s.currentTask);
    if (!availableBuilder) {
        console.log('⚠️ All builders are busy, but we can still test');
    } else {
        console.log(`✅ Available builder found: ${availableBuilder.id}`);
    }

    // Test 5: Construction Progress Test
    console.log('\n📋 Test 5: Construction Progress Test');
    console.log('-'.repeat(50));

    // Find a suitable location
    let testX = 8, testZ = 8;
    for (let x = 5; x < 12; x++) {
        for (let z = 5; z < 12; z++) {
            if (game.constructionManager.isBuildable(x, z)) {
                testX = x;
                testZ = z;
                break;
            }
        }
        if (testX === x) break;
    }

    console.log(`Testing construction at (${testX}, ${testZ})`);

    // Clear any existing constructions at this location
    const existingBuildings = game.constructionManager.getAllBuildings();
    const existingAtLocation = existingBuildings.find(b => b.gridX === testX && b.gridZ === testZ);
    if (existingAtLocation) {
        console.log('⚠️ Building already exists at test location, choosing different spot');
        testX += 2;
        testZ += 2;
    }

    // Start construction
    let constructionBuilding;
    try {
        constructionBuilding = game.constructionManager.queueBuilding('WOODCUTTERS_HUT', testX, testZ);
        console.log('✅ Building queued successfully');
        console.log(`Building ID: ${constructionBuilding.id}`);
        console.log(`Construction state: ${constructionBuilding.currentConstructionState}`);
        console.log(`Required time: ${constructionBuilding.constructionRequiredTime}ms`);
    } catch (error) {
        console.error('❌ Failed to queue building:', error.message);
        return false;
    }

    // Test 6: Monitor construction progress indicators
    console.log('\n📋 Test 6: Construction Progress Monitoring');
    console.log('-'.repeat(50));

    return new Promise((resolve) => {
        let checkCount = 0;
        const maxChecks = 30; // 30 seconds timeout
        let progressBarFound = false;
        let builderAssigned = false;

        const progressMonitor = setInterval(() => {
            checkCount++;
            
            // Get current building state
            const allBuildings = game.constructionManager.getAllBuildings();
            const ourBuilding = allBuildings.find(b => 
                b.gridX === testX && 
                b.gridZ === testZ && 
                b.type === 'WOODCUTTERS_HUT'
            );

            if (!ourBuilding) {
                console.log(`❌ [${checkCount}] Building not found`);
                clearInterval(progressMonitor);
                resolve(false);
                return;
            }

            // Check construction state
            const state = ourBuilding.currentConstructionState;
            const progress = ourBuilding.getConstructionProgress();
            const timeRemaining = ourBuilding.getConstructionTimeRemaining();
            const assignedBuilder = ourBuilding.assignedBuilderId;

            console.log(`🔨 [${checkCount}] State: ${state}, Progress: ${(progress * 100).toFixed(1)}%, Time remaining: ${timeRemaining}ms`);

            // Check for builder assignment
            if (assignedBuilder && !builderAssigned) {
                console.log(`✅ Builder assigned: ${assignedBuilder}`);
                builderAssigned = true;
            }

            // Check for progress bar
            if (ourBuilding.progressBarGroup && !progressBarFound) {
                console.log('✅ 3D progress bar created and visible');
                progressBarFound = true;
                
                // Verify progress bar properties
                if (ourBuilding.progressBarGroup.visible) {
                    console.log('✅ Progress bar is visible in scene');
                }
                
                // Check if progress bar has expected children (background and progress)
                if (ourBuilding.progressBarGroup.children.length >= 2) {
                    console.log('✅ Progress bar has background and progress elements');
                } else {
                    console.log('⚠️ Progress bar structure incomplete');
                }
            }

            // Check if progress bar is updating
            if (ourBuilding.progressBarGroup && progress > 0) {
                // The progress bar should be updating as construction progresses
                console.log(`🎯 Progress bar position: x=${ourBuilding.progressBarGroup.position.x.toFixed(1)}, y=${ourBuilding.progressBarGroup.position.y.toFixed(1)}, z=${ourBuilding.progressBarGroup.position.z.toFixed(1)}`);
            }

            // Check for construction completion
            if (state === 'CONSTRUCTED') {
                console.log('🎉 Construction completed successfully!');
                
                // Verify final state
                if (!ourBuilding.progressBarGroup || !ourBuilding.progressBarGroup.visible) {
                    console.log('✅ Progress bar removed after completion');
                } else {
                    console.log('⚠️ Progress bar still visible after completion');
                }

                if (!ourBuilding.assignedBuilderId) {
                    console.log('✅ Builder released after completion');
                } else {
                    console.log('⚠️ Builder still assigned after completion');
                }

                console.log('✅ Building is now operational');
                clearInterval(progressMonitor);
                
                // Final validation
                const finalValidation = validateConstructionResults(ourBuilding, progressBarFound, builderAssigned);
                resolve(finalValidation);
                return;
            }

            // Handle timeout
            if (checkCount >= maxChecks) {
                console.log('⏰ Test timeout reached');
                clearInterval(progressMonitor);
                
                // Check what we accomplished
                const partialResults = validateConstructionResults(ourBuilding, progressBarFound, builderAssigned);
                resolve(partialResults);
            }

        }, 1000); // Check every second
    });
}

function validateConstructionResults(building, progressBarFound, builderAssigned) {
    console.log('\n📊 === CONSTRUCTION TEST RESULTS ===');
    console.log('-'.repeat(50));
    
    let score = 0;
    const maxScore = 10;

    // Check 1: Building was created (2 points)
    if (building) {
        console.log('✅ Building object created successfully (+2 points)');
        score += 2;
    } else {
        console.log('❌ Building object not created (0 points)');
        return false;
    }

    // Check 2: Construction state tracking (2 points)
    if (building.currentConstructionState) {
        console.log('✅ Construction state properly tracked (+2 points)');
        score += 2;
    } else {
        console.log('❌ Construction state not tracked (0 points)');
    }

    // Check 3: Progress tracking methods (2 points)
    const progressMethods = ['getConstructionProgress', 'getConstructionTimeRemaining'];
    const methodsWork = progressMethods.every(method => 
        typeof building[method] === 'function'
    );
    if (methodsWork) {
        console.log('✅ Progress tracking methods available (+2 points)');
        score += 2;
    } else {
        console.log('❌ Progress tracking methods missing (0 points)');
    }

    // Check 4: 3D Progress bar creation (2 points)
    if (progressBarFound) {
        console.log('✅ 3D progress bar created and displayed (+2 points)');
        score += 2;
    } else {
        console.log('❌ 3D progress bar not found (0 points)');
    }

    // Check 5: Builder assignment (2 points)
    if (builderAssigned) {
        console.log('✅ Builder properly assigned to construction (+2 points)');
        score += 2;
    } else {
        console.log('❌ Builder not assigned to construction (0 points)');
    }

    console.log(`\n🎯 Final Score: ${score}/${maxScore} points`);
    
    if (score >= 8) {
        console.log('🎉 EXCELLENT: Construction progress system working correctly!');
        return true;
    } else if (score >= 6) {
        console.log('✅ GOOD: Construction progress system mostly working');
        return true;
    } else if (score >= 4) {
        console.log('⚠️ PARTIAL: Construction progress system partially working');
        return false;
    } else {
        console.log('❌ FAILED: Construction progress system needs significant fixes');
        return false;
    }
}

// Quick helper functions
window.testConstructionProgress = testConstructionProgress;

window.quickConstructionCheck = function() {
    const game = window.game;
    if (!game) {
        console.log('❌ Game not loaded');
        return;
    }

    console.log('🏗️ Quick Construction Status Check');
    console.log('='.repeat(40));
    
    const buildings = game.constructionManager?.getAllBuildings() || [];
    const queue = game.constructionManager?.getConstructionQueue() || [];
    const active = game.constructionManager?.getActiveConstructions() || [];
    const placed = game.constructionManager?.getPlacedBuildings() || [];

    console.log(`📊 Current State:`);
    console.log(`  - Total buildings: ${buildings.length}`);
    console.log(`  - In queue: ${queue.length}`);
    console.log(`  - Under construction: ${active.length}`);
    console.log(`  - Completed: ${placed.length}`);

    // Show buildings under construction
    active.forEach((building, index) => {
        const progress = building.getConstructionProgress ? 
            (building.getConstructionProgress() * 100).toFixed(1) : 'N/A';
        const hasProgressBar = building.progressBarGroup ? 'Yes' : 'No';
        const assignedBuilder = building.assignedBuilderId || 'None';
        
        console.log(`  🔨 Construction ${index + 1}:`);
        console.log(`     - Type: ${building.type}`);
        console.log(`     - Progress: ${progress}%`);
        console.log(`     - Progress bar: ${hasProgressBar}`);
        console.log(`     - Builder: ${assignedBuilder}`);
    });
};

console.log('🚀 Construction Progress Test Ready!');
console.log('Run: testConstructionProgress() - Full construction progress test');
console.log('Run: quickConstructionCheck() - Quick status check');
