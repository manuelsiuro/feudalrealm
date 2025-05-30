// Test script for faster construction progress
console.log('🚀 Testing Faster Construction Progress');
console.log('=====================================');

if (typeof window !== 'undefined' && window.game) {
    const game = window.game;
    
    // Check current construction times
    console.log('\n📋 Updated Construction Times:');
    console.log('Builder\'s Hut: 1000ms (was 2000ms)');
    console.log('Woodcutter\'s Hut: 1500ms (was 3000ms)');
    console.log('Forester\'s Hut: 1200ms (was 4000ms)');
    console.log('Transporter\'s Hut: 800ms (was 3000ms)');
    console.log('Quarry: 2000ms (was 8000ms)');
    
    // Test with active constructions if any
    const activeConstructions = game.constructionManager?.activeConstructions || [];
    if (activeConstructions.length > 0) {
        console.log('\n🏗️ Current Active Constructions:');
        activeConstructions.forEach((building, i) => {
            const progressPercent = (building.currentConstructionProgress / building.constructionRequiredTime * 100).toFixed(1);
            console.log(`${i + 1}. ${building.name}: ${progressPercent}% (${building.currentConstructionProgress}/${building.constructionRequiredTime}ms)`);
            
            if (building.progressBarMesh) {
                console.log(`   Progress bar scale: ${building.progressBarMesh.scale.x.toFixed(4)}`);
            }
        });
        
        // Test a few update cycles to see faster progress
        console.log('\n⚡ Testing rapid progress updates...');
        const building = activeConstructions[0];
        const initialProgress = building.currentConstructionProgress;
        const initialScale = building.progressBarMesh ? building.progressBarMesh.scale.x : 0;
        
        console.log(`Initial: ${initialProgress}ms (${(initialProgress/building.constructionRequiredTime*100).toFixed(1)}%) - Scale: ${initialScale.toFixed(4)}`);
        
        // Run several quick updates
        for (let i = 1; i <= 5; i++) {
            game.constructionManager.update(50); // 50ms chunks for faster visible updates
            const currentProgress = building.currentConstructionProgress;
            const currentScale = building.progressBarMesh ? building.progressBarMesh.scale.x : 0;
            const percent = (currentProgress/building.constructionRequiredTime*100).toFixed(1);
            
            console.log(`Update ${i}: ${currentProgress}ms (${percent}%) - Scale: ${currentScale.toFixed(4)}`);
            
            // Check if construction completed
            if (building.currentConstructionState === 'CONSTRUCTED') {
                console.log('🎉 Construction completed during test!');
                break;
            }
        }
        
    } else {
        console.log('\n⚠️ No active constructions found.');
        console.log('Starting quick test construction...');
        
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
        
        // Queue a fast construction
        const building = game.constructionManager.queueBuilding('TRANSPORTER_HUT', testX, testZ);
        if (building) {
            console.log(`✅ Queued ${building.name} with ${building.constructionRequiredTime}ms construction time`);
            console.log('🔄 Running initial updates to assign builder...');
            
            // Run a few updates to get things started
            for (let i = 0; i < 10; i++) {
                game.constructionManager.update(16);
            }
            
            console.log('✨ Test ready! Check progress in a few seconds.');
        }
    }
    
    console.log('\n💡 The progress bars should now update much faster!');
    console.log('💡 With shorter construction times, each 16ms frame represents a larger percentage.');
    console.log('💡 Example: 16ms out of 800ms = 2% per frame vs 16ms out of 3000ms = 0.5% per frame');
    
} else {
    console.log('❌ Game not available');
}
