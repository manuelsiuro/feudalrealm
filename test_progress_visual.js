// Test progress bar visual updates
console.log('🎯 Testing Progress Bar Visual Updates');
console.log('=====================================');

if (typeof window !== 'undefined' && window.game) {
    const game = window.game;
    const activeBuildings = game.constructionManager.activeConstructions;
    
    if (activeBuildings.length > 0) {
        const building = activeBuildings[0];
        console.log(`\n🏗️ Testing building: ${building.name}`);
        console.log(`Initial progress: ${building.currentConstructionProgress}/${building.constructionRequiredTime}`);
        
        if (building.progressBarMesh) {
            console.log('\n📊 Initial Progress Bar State:');
            console.log(`Scale X: ${building.progressBarMesh.scale.x}`);
            console.log(`Position X: ${building.progressBarMesh.position.x}`);
            
            // Test multiple progress increments
            console.log('\n🔄 Testing progress increments...');
            
            for (let i = 1; i <= 5; i++) {
                const oldProgress = building.currentConstructionProgress;
                const oldScale = building.progressBarMesh.scale.x;
                const oldPosition = building.progressBarMesh.position.x;
                
                // Increment progress
                building.currentConstructionProgress += 1000; // Add 1000ms (1 second)
                building._updateProgressBar();
                
                const newScale = building.progressBarMesh.scale.x;
                const newPosition = building.progressBarMesh.position.x;
                const progressPercent = (building.currentConstructionProgress / building.constructionRequiredTime * 100).toFixed(1);
                
                console.log(`Step ${i}:`);
                console.log(`  Progress: ${building.currentConstructionProgress} (${progressPercent}%)`);
                console.log(`  Scale X: ${oldScale.toFixed(3)} → ${newScale.toFixed(3)} (Δ${(newScale - oldScale).toFixed(3)})`);
                console.log(`  Position X: ${oldPosition.toFixed(3)} → ${newPosition.toFixed(3)} (Δ${(newPosition - oldPosition).toFixed(3)})`);
                
                if (newScale > oldScale) {
                    console.log(`  ✅ Progress bar grew!`);
                } else {
                    console.log(`  ❌ Progress bar didn't grow`);
                }
            }
            
            // Test if the progress bar is visible in the scene
            console.log('\n👁️ Visibility Test:');
            console.log(`Progress bar group visible: ${building.progressBarGroup.visible}`);
            console.log(`Progress bar mesh visible: ${building.progressBarMesh.visible}`);
            console.log(`Progress bar in scene: ${building.progressBarGroup.parent === game.scene}`);
            
            // Check if the progress bar is positioned correctly above the building
            if (building.model) {
                console.log('\n📍 Position Test:');
                console.log(`Building position: (${building.model.position.x}, ${building.model.position.y}, ${building.model.position.z})`);
                console.log(`Progress bar position: (${building.progressBarGroup.position.x}, ${building.progressBarGroup.position.y}, ${building.progressBarGroup.position.z})`);
            }
            
        } else {
            console.log('❌ No progress bar mesh found');
        }
        
    } else {
        console.log('❌ No active constructions found');
        
        // Try to trigger construction
        const queueSize = game.constructionManager.constructionQueue.length;
        if (queueSize > 0) {
            console.log(`Found ${queueSize} buildings in queue. Running update to assign builders...`);
            game.constructionManager.update(16);
            
            const newActiveSize = game.constructionManager.activeConstructions.length;
            if (newActiveSize > 0) {
                console.log(`✅ ${newActiveSize} constructions now active. Run this test again to check progress bars.`);
            }
        }
    }
    
} else {
    console.log('❌ Game not available');
}
