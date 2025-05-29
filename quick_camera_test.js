// Quick console test to check if production chains are disabled and camera works
console.log('🎯 CAMERA CONTROL TEST - Production Chains Disabled');
console.log('================================================');

// Check if game loaded
if (typeof window.game !== 'undefined') {
    console.log('✅ Game instance loaded');
    
    // Check OrbitControls
    if (window.game.controls) {
        console.log('✅ OrbitControls found');
        console.log('   - Enable Rotate:', window.game.controls.enableRotate);
        console.log('   - Enable Zoom:', window.game.controls.enableZoom);
        console.log('   - Camera Position:', window.game.controls.object.position);
    } else {
        console.log('❌ OrbitControls NOT found');
    }
    
    // Check InputManager
    if (window.game.inputManager) {
        console.log('✅ InputManager found');
    } else {
        console.log('❌ InputManager NOT found');
    }
    
    // Check UIManager and ProductionChainUI status
    if (window.game.uiManager) {
        console.log('✅ UIManager found');
        if (window.game.uiManager.productionChainUI) {
            console.log('⚠️  ProductionChainUI STILL ENABLED - This may cause camera issues!');
        } else {
            console.log('✅ ProductionChainUI properly DISABLED');
        }
    } else {
        console.log('❌ UIManager NOT found');
    }
    
    // Check ProductionChainManager
    if (window.game.productionChainManager) {
        console.log('ℹ️  ProductionChainManager exists (backend logic)');
    } else {
        console.log('ℹ️  ProductionChainManager not found');
    }
    
} else {
    console.log('❌ Game instance NOT loaded');
}

console.log('================================================');
console.log('🎮 Manual Tests:');
console.log('1. Right-click + drag to rotate camera');
console.log('2. Mouse wheel to zoom in/out');
console.log('3. Click building buttons to test placement');
console.log('4. ESC to cancel placement');
console.log('================================================');
