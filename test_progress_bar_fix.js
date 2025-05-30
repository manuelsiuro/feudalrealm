// Test to check if progress bar visual updates are working
console.log('🎯 Testing Progress Bar Visual Updates Fix');
console.log('==========================================');

if (typeof window !== 'undefined' && window.game) {
    const game = window.game;
    
    // 1. Check current active constructions
    const activeBuildings = game.constructionManager?.activeConstructions || [];
    console.log(`📊 Active constructions: ${activeBuildings.length}`);
    
    if (activeBuildings.length === 0) {
        console.log('⚠️ No active constructions found. Starting test construction...');
        
        // Add resources
        game.resourceManager.addResource('WOOD', 50);
        game.resourceManager.addResource('STONE', 30);
        
        // Find buildable location
        let testX = 10, testZ = 10;
        for (let x = 8; x < 15; x++) {
            for (let z = 8; z < 15; z++) {
                if (game.constructionManager.isBuildable(x, z)) {
                    testX = x;
                    testZ = z;
                    break;
                }
            }
            if (testX === x) break;
        }
        
        // Queue building
        const building = game.constructionManager.queueBuilding('WOODCUTTERS_HUT', testX, testZ);
        console.log(`✅ Building queued: ${building?.name} at (${testX}, ${testZ})`);
        
        // Run updates to assign builder
        for (let i = 0; i < 10; i++) {
            game.constructionManager.update(16);
        }
        
        console.log('🔄 Run this test again after a few seconds to see progress updates...');
        return;
    }
    
    // 2. Test existing active construction
    const building = activeBuildings[0];
    console.log(`\n🏗️ Testing building: ${building.name} (ID: ${building.id})`);
    console.log(`Current state: ${building.currentConstructionState}`);
    console.log(`Progress: ${building.currentConstructionProgress}/${building.constructionRequiredTime}`);
    console.log(`Assigned builder: ${building.assignedBuilderId}`);
    
    // 3. Check progress bar existence
    const hasProgressBar = !!building.progressBarGroup;
    const hasProgressMesh = !!building.progressBarMesh;
    console.log(`\n📊 Progress Bar Status:`);
    console.log(`Progress bar group exists: ${hasProgressBar}`);
    console.log(`Progress bar mesh exists: ${hasProgressMesh}`);
    
    if (hasProgressBar) {
        console.log(`Progress bar visible: ${building.progressBarGroup.visible}`);
        console.log(`Progress bar children: ${building.progressBarGroup.children.length}`);
        console.log(`Progress bar in scene: ${building.progressBarGroup.parent === game.scene}`);
    }
    
    if (hasProgressMesh) {
        console.log(`\n📏 Progress Bar Mesh Details:`);
        console.log(`Scale X: ${building.progressBarMesh.scale.x.toFixed(4)}`);
        console.log(`Position X: ${building.progressBarMesh.position.x.toFixed(4)}`);
        console.log(`Geometry width: ${building.progressBarMesh.geometry.parameters.width}`);
        console.log(`Material color: #${building.progressBarMesh.material.color.getHexString()}`);
    }
    
    // 4. Test manual progress update
    console.log(`\n🔄 Testing Manual Progress Update:`);
    const beforeProgress = building.currentConstructionProgress;
    const beforeScale = hasProgressMesh ? building.progressBarMesh.scale.x : 0;
    const beforePosition = hasProgressMesh ? building.progressBarMesh.position.x : 0;
    
    console.log(`Before - Progress: ${beforeProgress}, Scale: ${beforeScale.toFixed(4)}, Position: ${beforePosition.toFixed(4)}`);
    
    // Manually increment progress to test visual update
    building.currentConstructionProgress += 1000; // Add 1 second
    building._updateProgressBar(); // Force visual update
    
    const afterProgress = building.currentConstructionProgress;
    const afterScale = hasProgressMesh ? building.progressBarMesh.scale.x : 0;
    const afterPosition = hasProgressMesh ? building.progressBarMesh.position.x : 0;
    
    console.log(`After - Progress: ${afterProgress}, Scale: ${afterScale.toFixed(4)}, Position: ${afterPosition.toFixed(4)}`);
    console.log(`Deltas - Progress: ${afterProgress - beforeProgress}, Scale: ${(afterScale - beforeScale).toFixed(4)}, Position: ${(afterPosition - beforePosition).toFixed(4)}`);
    
    if (afterScale > beforeScale) {
        console.log('✅ Progress bar scale increased - Visual update working!');
    } else {
        console.log('❌ Progress bar scale did not increase - Visual update NOT working');
    }
    
    // 5. Test construction manager update cycle
    console.log(`\n⚙️ Testing Construction Manager Update:`);
    const initialProgress = building.currentConstructionProgress;
    const initialScale = hasProgressMesh ? building.progressBarMesh.scale.x : 0;
    
    // Run construction manager update
    game.constructionManager.update(100); // 100ms delta time
    
    const updatedProgress = building.currentConstructionProgress;
    const updatedScale = hasProgressMesh ? building.progressBarMesh.scale.x : 0;
    
    console.log(`Manager update - Progress delta: ${updatedProgress - initialProgress}, Scale delta: ${(updatedScale - initialScale).toFixed(4)}`);
    
    if (updatedProgress > initialProgress) {
        console.log('✅ Construction manager is updating progress');
        if (updatedScale > initialScale) {
            console.log('✅ Progress bar is visually updating with manager updates');
        } else {
            console.log('❌ Progress bar is NOT visually updating with manager updates');
        }
    } else {
        console.log('⚠️ Construction manager is not updating progress (builder may not be working)');
        
        // Check builder state
        if (building.assignedBuilderId) {
            const builder = game.serfManager.getSerfById(building.assignedBuilderId);
            if (builder) {
                console.log(`Builder state: ${builder.currentState.name}`);
                console.log(`Builder position: (${builder.x}, ${builder.y})`);
                const entryPoint = building.getEntryPointGridPosition();
                console.log(`Building entry point: (${entryPoint.x}, ${entryPoint.z})`);
                console.log(`Builder at site: ${builder.x === entryPoint.x && builder.y === entryPoint.z}`);
            }
        }
    }
    
    // 6. Monitor for a few seconds
    console.log(`\n🔍 Starting 10-second progress monitor...`);
    let monitorCount = 0;
    const progressMonitor = setInterval(() => {
        monitorCount++;
        const currentProgress = building.currentConstructionProgress;
        const currentScale = hasProgressMesh ? building.progressBarMesh.scale.x : 0;
        const progressPercent = (currentProgress / building.constructionRequiredTime * 100).toFixed(1);
        
        console.log(`Monitor [${monitorCount}]: ${progressPercent}% (Scale: ${currentScale.toFixed(4)})`);
        
        if (monitorCount >= 10) {
            clearInterval(progressMonitor);
            console.log('🏁 Monitor complete');
        }
        
        if (building.currentConstructionState === 'CONSTRUCTED') {
            console.log('🎉 Construction completed during monitoring!');
            clearInterval(progressMonitor);
        }
    }, 1000);
    
} else {
    console.log('❌ Game not available. Make sure you run this in the browser console at http://localhost:5173');
}
