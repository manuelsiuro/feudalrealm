// Urgent validation script for map controls fix
// Run this in the browser console at http://localhost:5173

console.log('🚨 URGENT: Testing map controls fix...');

// Test 1: Check if game exists
if (typeof window.game === 'undefined') {
    console.error('❌ CRITICAL: Game object not found!');
} else {
    console.log('✅ Game object exists');
    
    // Test 2: Check OrbitControls
    if (window.game.controls) {
        console.log('✅ OrbitControls found');
        console.log(`📊 Controls enabled: ${window.game.controls.enabled}`);
        console.log(`📊 Controls type: ${window.game.controls.constructor.name}`);
        
        // Test if controls respond to programmatic changes
        const originalDistance = window.game.controls.getDistance ? window.game.controls.getDistance() : 'unknown';
        console.log(`📏 Current camera distance: ${originalDistance}`);
        
    } else {
        console.error('❌ CRITICAL: OrbitControls not found!');
    }
    
    // Test 3: Check InputManager
    if (window.game.inputManager) {
        console.log('✅ InputManager found');
        console.log(`📊 Click callbacks: ${window.game.inputManager.clickCallbacks.length}`);
        console.log(`📊 Has drag detection: ${typeof window.game.inputManager.isDragging !== 'undefined'}`);
    } else {
        console.error('❌ CRITICAL: InputManager not found!');
    }
    
    // Test 4: Check construction manager
    if (window.game.constructionManager) {
        console.log('✅ ConstructionManager found');
        console.log(`📊 Is placing: ${window.game.constructionManager.isPlacing}`);
    } else {
        console.error('❌ CRITICAL: ConstructionManager not found!');
    }
}

// Test 5: Instructions for manual testing
console.log('📋 MANUAL TESTS REQUIRED:');
console.log('1. 🔄 ROTATION: Try dragging with mouse - camera should rotate');
console.log('2. 🔍 ZOOM: Try mouse wheel - camera should zoom');
console.log('3. 🏠 BUILDING: Click building button, then click map - should place without interfering with camera');

// Test 6: Check for any JavaScript errors
console.log('🔍 Checking for runtime errors...');
const originalError = console.error;
let errorCount = 0;
console.error = function(...args) {
    errorCount++;
    originalError.apply(console, ['🚨 ERROR DETECTED:'].concat(args));
};

setTimeout(() => {
    if (errorCount === 0) {
        console.log('✅ No JavaScript errors detected in the last 3 seconds');
    } else {
        console.log(`❌ ${errorCount} JavaScript errors detected!`);
    }
    console.error = originalError; // Restore original console.error
}, 3000);

console.log('🎯 Fix validation complete - check manual tests above!');
