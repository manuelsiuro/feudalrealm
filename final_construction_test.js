// Final construction progress test
console.log('🎯 Final Construction Progress Test');
console.log('==================================');

if (typeof window !== 'undefined' && window.game) {
    const game = window.game;
    
    // Check current state
    const activeBuildings = game.constructionManager.activeConstructions;
    console.log(`\n📊 Active Constructions: ${activeBuildings.length}`);
    
    if (activeBuildings.length > 0) {
        const building = activeBuildings[0];
        console.log(`\nTesting building: ${building.name} (${building.id})`);
        console.log(`Current state: ${building.currentConstructionState}`);
        console.log(`Progress: ${building.currentConstructionProgress}/${building.constructionRequiredTime}`);
        console.log(`Assigned builder: ${building.assignedBuilderId}`);
        
        // Check progress bar
        const hasProgressBar = !!building.progressBarGroup;
        console.log(`Progress bar exists: ${hasProgressBar}`);
        
        if (hasProgressBar) {
            console.log(`Progress bar visible: ${building.progressBarGroup.visible}`);
            console.log(`Progress bar children: ${building.progressBarGroup.children.length}`);
            console.log(`Progress bar in scene: ${building.progressBarGroup.parent === game.scene}`);
            
            if (building.progressBarMesh) {
                const currentWidth = building.progressBarMesh.geometry.parameters.width;
                console.log(`Progress bar width: ${currentWidth.toFixed(3)}`);
            }
        }
        
        // Test progress update
        console.log('\n⏱️ Testing progress update...');
        const beforeProgress = building.currentConstructionProgress;
        
        // Force a progress update
        game.constructionManager.update(100); // 100ms delta
        
        const afterProgress = building.currentConstructionProgress;
        const progressDelta = afterProgress - beforeProgress;
        
        console.log(`Progress before: ${beforeProgress}`);
        console.log(`Progress after: ${afterProgress}`);
        console.log(`Progress delta: ${progressDelta}`);
        
        if (progressDelta > 0) {
            console.log('✅ Progress is updating correctly!');
            
            if (hasProgressBar && building.progressBarMesh) {
                const newWidth = building.progressBarMesh.geometry.parameters.width;
                console.log(`Progress bar width after update: ${newWidth.toFixed(3)}`);
            }
        } else {
            console.log('⚠️ No progress detected - checking builder status...');
            
            const builder = game.serfManager.getSerfById(building.assignedBuilderId);
            if (builder) {
                console.log(`Builder state: ${builder.currentState.name}`);
                console.log(`Builder position: (${builder.x}, ${builder.y})`);
                console.log(`Builder task: ${builder.currentTask ? builder.currentTask.type : 'None'}`);
                
                // Check if builder is at the building location
                const entryPoint = building.getEntryPointGridPosition();
                const atLocation = (builder.x === entryPoint.x && builder.y === entryPoint.z);
                console.log(`Builder at construction site: ${atLocation}`);
            } else {
                console.log('❌ Builder not found!');
            }
        }
        
    } else {
        console.log('No active constructions to test');
        
        // Check if we can create a test construction
        const queueSize = game.constructionManager.constructionQueue.length;
        console.log(`Queue size: ${queueSize}`);
        
        if (queueSize > 0) {
            console.log('Buildings in queue - running update to assign builders...');
            game.constructionManager.update(16);
            
            const newActiveSize = game.constructionManager.activeConstructions.length;
            console.log(`Active constructions after update: ${newActiveSize}`);
        }
    }
    
} else {
    console.log('❌ Game not available');
}
