// Test script for checking 3D progress bars
console.log('📊 Testing 3D Progress Bars');
console.log('===========================');

if (typeof window !== 'undefined' && window.game) {
    const game = window.game;
    
    console.log('\n🏗️ Active Constructions:');
    const activeConstructions = game.constructionManager?.activeConstructions || [];
    
    activeConstructions.forEach((building, i) => {
        console.log(`Building ${i + 1}: ${building.name} (ID: ${building.id})`);
        console.log(`  - State: ${building.currentConstructionState}`);
        console.log(`  - Progress: ${building.currentConstructionProgress}/${building.constructionRequiredTime}`);
        console.log(`  - Progress %: ${((building.currentConstructionProgress / building.constructionRequiredTime) * 100).toFixed(1)}%`);
        console.log(`  - Assigned Builder: ${building.assignedBuilderId}`);
        
        // Check progress bar components
        console.log(`  - Progress Bar Group: ${building.progressBarGroup ? 'EXISTS' : 'MISSING'}`);
        console.log(`  - Progress Bar Mesh: ${building.progressBarMesh ? 'EXISTS' : 'MISSING'}`);
        
        if (building.progressBarGroup) {
            console.log(`  - Progress Bar Children: ${building.progressBarGroup.children.length}`);
            console.log(`  - Progress Bar Visible: ${building.progressBarGroup.visible}`);
            
            // Check if it's in the scene
            let inScene = false;
            let current = building.progressBarGroup;
            while (current.parent && !inScene) {
                if (current.parent === window.game.scene) {
                    inScene = true;
                }
                current = current.parent;
            }
            console.log(`  - Progress Bar In Scene: ${inScene}`);
        }
        
        if (building.progressBarMesh) {
            console.log(`  - Progress Bar Scale X: ${building.progressBarMesh.scale.x}`);
            console.log(`  - Progress Bar Color: ${building.progressBarMesh.material.color.getHexString()}`);
        }
    });
    
    // Test a construction update cycle to see progress increment
    console.log('\n⏱️ Testing Progress Update:');
    const beforeProgress = activeConstructions.map(b => b.currentConstructionProgress);
    console.log('Progress before update:', beforeProgress);
    
    // Run a small update cycle
    game.constructionManager.update(100); // 100ms delta
    
    const afterProgress = activeConstructions.map(b => b.currentConstructionProgress);
    console.log('Progress after update:', afterProgress);
    
    // Check if progress actually increased
    let progressIncreased = false;
    for (let i = 0; i < beforeProgress.length; i++) {
        if (afterProgress[i] > beforeProgress[i]) {
            progressIncreased = true;
            console.log(`✅ Building ${i + 1} progress increased by ${afterProgress[i] - beforeProgress[i]}ms`);
        }
    }
    
    if (!progressIncreased && activeConstructions.length > 0) {
        console.log('⚠️ No progress detected - checking builder states...');
        const builders = game.serfManager.serfs.filter(s => s.serfType === 'Builder');
        builders.forEach(builder => {
            console.log(`Builder ${builder.id}:`);
            console.log(`  - State: ${builder.currentState?.name}`);
            console.log(`  - Position: (${builder.x}, ${builder.y})`);
            console.log(`  - Task Type: ${builder.currentTask?.type}`);
            console.log(`  - Task Building: ${builder.currentTask?.building?.name || 'N/A'}`);
        });
    }
    
} else {
    console.log('❌ Game not available. Run this in the browser console on http://localhost:5173');
}
