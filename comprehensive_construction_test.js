// Comprehensive construction progress test
console.log('🔧 Comprehensive Construction Progress Test');
console.log('==========================================');

if (typeof window !== 'undefined' && window.game) {
    const game = window.game;
    
    // Check construction state
    console.log('\n📋 Current Construction State:');
    console.log(`Queue: ${game.constructionManager.constructionQueue.length}`);
    console.log(`Active: ${game.constructionManager.activeConstructions.length}`);
    
    // Check builders
    console.log('\n👷 Builder Status:');
    const builders = game.serfManager.serfs.filter(s => s.serfType === 'Builder');
    builders.forEach(builder => {
        console.log(`Builder ${builder.id}:`);
        console.log(`  State: ${builder.currentState.name}`);
        console.log(`  Position: (${builder.x}, ${builder.y})`);
        console.log(`  Has Task: ${!!builder.currentTask}`);
        if (builder.currentTask) {
            console.log(`  Task Type: ${builder.currentTask.type}`);
            console.log(`  Task Building: ${builder.currentTask.building ? builder.currentTask.building.name : 'N/A'}`);
        }
    });
    
    // Check active constructions in detail
    if (game.constructionManager.activeConstructions.length > 0) {
        console.log('\n🏗️ Active Construction Details:');
        const building = game.constructionManager.activeConstructions[0];
        
        console.log(`Building: ${building.name} (${building.id})`);
        console.log(`State: ${building.currentConstructionState}`);
        console.log(`Progress: ${building.currentConstructionProgress}/${building.constructionRequiredTime}`);
        console.log(`Assigned Builder: ${building.assignedBuilderId}`);
        
        // Check progress bar
        const hasProgressBar = !!building.progressBarGroup;
        console.log(`Progress Bar Exists: ${hasProgressBar}`);
        
        if (hasProgressBar) {
            console.log(`Progress Bar Visible: ${building.progressBarGroup.visible}`);
            console.log(`Progress Bar In Scene: ${building.progressBarGroup.parent === game.scene}`);
            console.log(`Progress Bar Children: ${building.progressBarGroup.children.length}`);
            
            if (building.progressBarMesh) {
                console.log(`Progress Bar Scale X: ${building.progressBarMesh.scale.x}`);
                console.log(`Progress Bar Position X: ${building.progressBarMesh.position.x}`);
            }
        }
        
        // Check if builder is at construction site
        if (building.assignedBuilderId) {
            const builder = game.serfManager.getSerfById(building.assignedBuilderId);
            if (builder) {
                const entryPoint = building.getEntryPointGridPosition();
                const atSite = (builder.x === entryPoint.x && builder.y === entryPoint.z);
                console.log(`Builder at construction site: ${atSite}`);
                console.log(`Entry point: (${entryPoint.x}, ${entryPoint.z})`);
                console.log(`Builder position: (${builder.x}, ${builder.y})`);
            }
        }
        
        // Test progress update cycle
        console.log('\n⚙️ Testing Progress Update Cycle:');
        const beforeProgress = building.currentConstructionProgress;
        const beforeScale = building.progressBarMesh ? building.progressBarMesh.scale.x : 0;
        
        console.log(`Before - Progress: ${beforeProgress}, Scale: ${beforeScale.toFixed(3)}`);
        
        // Run construction manager update
        game.constructionManager.update(100); // 100ms
        
        const afterProgress = building.currentConstructionProgress;
        const afterScale = building.progressBarMesh ? building.progressBarMesh.scale.x : 0;
        
        console.log(`After - Progress: ${afterProgress}, Scale: ${afterScale.toFixed(3)}`);
        console.log(`Progress Delta: ${afterProgress - beforeProgress}`);
        console.log(`Scale Delta: ${(afterScale - beforeScale).toFixed(3)}`);
        
        if (afterProgress > beforeProgress) {
            console.log('✅ Progress increased!');
        } else {
            console.log('❌ No progress increase');
        }
        
        if (afterScale > beforeScale) {
            console.log('✅ Progress bar visually updated!');
        } else {
            console.log('❌ Progress bar not visually updated');
        }
        
    } else {
        // Try to start construction
        if (game.constructionManager.constructionQueue.length > 0) {
            console.log('\n🚀 Attempting to start construction...');
            game.constructionManager.update(16);
            
            if (game.constructionManager.activeConstructions.length > 0) {
                console.log('✅ Construction started! Run test again to check progress.');
            } else {
                console.log('❌ Construction not started. Checking why...');
                
                const availableBuilders = game.serfManager.getAvailableSerfsByProfession('Builder');
                console.log(`Available builders: ${availableBuilders.length}`);
                
                if (availableBuilders.length === 0) {
                    console.log('No available builders found');
                }
            }
        } else {
            console.log('\n📝 No constructions in queue. Creating test building...');
            
            // Find buildable location
            let location = null;
            for (let x = 5; x < 10 && !location; x++) {
                for (let z = 5; z < 10 && !location; z++) {
                    if (game.constructionManager.isBuildable(x, z)) {
                        location = { x, z };
                    }
                }
            }
            
            if (location) {
                game.constructionManager.queueBuilding('WOODCUTTERS_HUT', location.x, location.z);
                console.log(`Queued building at (${location.x}, ${location.z}). Run test again.`);
            } else {
                console.log('No buildable location found');
            }
        }
    }
    
} else {
    console.log('❌ Game not available');
}
