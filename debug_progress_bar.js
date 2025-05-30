// Debug progress bar updates
console.log('🐛 Debugging Progress Bar Updates');
console.log('================================');

if (typeof window !== 'undefined' && window.game) {
    const game = window.game;
    const activeBuildings = game.constructionManager.activeConstructions;
    
    if (activeBuildings.length > 0) {
        const building = activeBuildings[0];
        console.log(`\n🏗️ Testing building: ${building.name}`);
        console.log(`Progress: ${building.currentConstructionProgress}/${building.constructionRequiredTime}`);
        
        if (building.progressBarMesh) {
            console.log('\n📊 Current Progress Bar State:');
            console.log(`Geometry width: ${building.progressBarMesh.geometry.parameters.width}`);
            console.log(`Position X: ${building.progressBarMesh.position.x}`);
            console.log(`Scale X: ${building.progressBarMesh.scale.x}`);
            console.log(`Material color: #${building.progressBarMesh.material.color.getHexString()}`);
        }
        
        // Test manual progress update
        console.log('\n🔄 Testing manual progress update...');
        const oldProgress = building.currentConstructionProgress;
        
        // Manually increment progress
        building.currentConstructionProgress += 500; // Add 500ms
        console.log(`Progress incremented from ${oldProgress} to ${building.currentConstructionProgress}`);
        
        // Test the _updateProgressBar method directly
        console.log('\n🎯 Testing _updateProgressBar method...');
        try {
            building._updateProgressBar();
            console.log('✅ _updateProgressBar called successfully');
            
            if (building.progressBarMesh) {
                console.log(`New geometry width: ${building.progressBarMesh.geometry.parameters.width}`);
                console.log(`New position X: ${building.progressBarMesh.position.x}`);
            }
        } catch (error) {
            console.error('❌ Error in _updateProgressBar:', error.message);
            console.error(error.stack);
        }
        
        // Test updateConstructionProgress method
        console.log('\n⚙️ Testing updateConstructionProgress method...');
        const progressBefore = building.currentConstructionProgress;
        try {
            const isComplete = building.updateConstructionProgress(100);
            console.log(`updateConstructionProgress returned: ${isComplete}`);
            console.log(`Progress after: ${building.currentConstructionProgress}`);
            console.log(`Delta: ${building.currentConstructionProgress - progressBefore}`);
        } catch (error) {
            console.error('❌ Error in updateConstructionProgress:', error.message);
            console.error(error.stack);
        }
        
    } else {
        console.log('❌ No active constructions to test');
    }
    
} else {
    console.log('❌ Game not available');
}
