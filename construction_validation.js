// Quick validation for construction system
console.log('🔍 Construction System Validation');
console.log('=================================');

if (typeof window !== 'undefined' && window.game) {
    const game = window.game;
    
    // 1. Check builder availability and assignment
    console.log('\n👷 Builder Assignment Check:');
    const builders = game.serfManager.serfs.filter(s => s.serfType === 'Builder');
    console.log(`Total builders: ${builders.length}`);
    
    builders.forEach(builder => {
        console.log(`Builder ${builder.id}:`);
        console.log(`  - State: ${builder.currentState.name}`);
        console.log(`  - Has Task: ${!!builder.currentTask}`);
        if (builder.currentTask) {
            console.log(`  - Task Type: ${builder.currentTask.type}`);
            console.log(`  - Task Target: ${builder.currentTask.targetEntity ? builder.currentTask.targetEntity.name : 'N/A'}`);
        }
    });
    
    // 2. Check construction queue processing
    console.log('\n🏗️ Construction Queue Status:');
    const queue = game.constructionManager.constructionQueue;
    const active = game.constructionManager.activeConstructions;
    
    console.log(`Queue: ${queue.length} buildings`);
    console.log(`Active: ${active.length} buildings`);
    
    queue.forEach((building, i) => {
        console.log(`  Queue[${i}]: ${building.name} - ${building.currentConstructionState}`);
    });
    
    active.forEach((building, i) => {
        console.log(`  Active[${i}]: ${building.name} - ${building.currentConstructionState} - Builder: ${building.assignedBuilderId}`);
    });
    
    // 3. Test progress bar creation and updates
    console.log('\n📊 Progress Bar Validation:');
    active.forEach((building, i) => {
        const hasProgressBar = !!building.progressBarGroup;
        const progressPercent = (building.currentConstructionProgress / building.constructionRequiredTime * 100).toFixed(1);
        
        console.log(`Building ${i + 1} (${building.name}):`);
        console.log(`  - Progress: ${progressPercent}%`);
        console.log(`  - Progress Bar: ${hasProgressBar ? '✅ EXISTS' : '❌ MISSING'}`);
        
        if (hasProgressBar) {
            console.log(`  - Visible: ${building.progressBarGroup.visible}`);
            console.log(`  - Children: ${building.progressBarGroup.children.length}`);
        }
    });
    
    // 4. Test one construction update cycle
    console.log('\n⚙️ Testing Construction Update:');
    try {
        game.constructionManager.update(16); // 16ms frame
        console.log('✅ Construction update completed without errors');
    } catch (error) {
        console.error('❌ Construction update failed:', error.message);
        console.error(error.stack);
    }
    
} else {
    console.log('❌ Game not available');
}
