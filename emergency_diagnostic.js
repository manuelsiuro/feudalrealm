// Emergency diagnostic for camera controls regression
// Paste this in browser console at http://localhost:5173

console.log("🚨 EMERGENCY CAMERA CONTROLS DIAGNOSTIC");
console.log("======================================");

// Test 1: Check game object
if (typeof window.game !== 'undefined') {
    console.log("✅ Game object exists");
    
    // Test 2: Check renderer and controls
    if (window.game.renderer && window.game.renderer.controls) {
        const controls = window.game.renderer.controls;
        console.log("✅ OrbitControls found");
        console.log(`   - Enabled: ${controls.enabled}`);
        console.log(`   - Target: (${controls.target.x.toFixed(2)}, ${controls.target.y.toFixed(2)}, ${controls.target.z.toFixed(2)})`);
        console.log(`   - Auto rotate: ${controls.autoRotate}`);
        console.log(`   - Enable rotation: ${controls.enableRotate}`);
        console.log(`   - Enable zoom: ${controls.enableZoom}`);
        console.log(`   - Enable pan: ${controls.enablePan}`);
        
        // Test 3: Manually trigger controls update
        try {
            controls.update();
            console.log("✅ Controls update() method works");
        } catch (error) {
            console.log("❌ Controls update() failed:", error.message);
        }
        
    } else {
        console.log("❌ CRITICAL: OrbitControls not found!");
    }
    
    // Test 4: Check InputManager
    if (window.game.inputManager) {
        const inputManager = window.game.inputManager;
        console.log("✅ InputManager exists");
        console.log(`   - Click callbacks: ${inputManager.clickCallbacks.length}`);
        console.log(`   - Mouse move callbacks: ${inputManager.mouseMoveCallbacks.length}`);
        console.log(`   - Is dragging: ${inputManager.isDragging}`);
    } else {
        console.log("❌ InputManager not found");
    }
    
} else {
    console.log("❌ CRITICAL: Game object not found!");
    console.log("The game may not be loaded yet. Wait and try again.");
}

// Test 5: Check canvas element
const canvas = document.querySelector('canvas');
if (canvas) {
    console.log("✅ Canvas element found");
    console.log(`   - Canvas size: ${canvas.width}x${canvas.height}`);
    
    // Test event listeners (if getEventListeners is available in dev tools)
    if (typeof getEventListeners === 'function') {
        const listeners = getEventListeners(canvas);
        console.log("Canvas event listeners:", listeners);
    } else {
        console.log("   - Event listener inspection not available");
    }
} else {
    console.log("❌ Canvas element not found!");
}

console.log("\n🧪 MANUAL TESTS TO PERFORM:");
console.log("1. Right-click + drag → Should rotate camera");
console.log("2. Mouse wheel → Should zoom in/out");
console.log("3. Middle-click + drag → Should pan camera (if enabled)");
console.log("4. Left-click building button → Should start placement mode");
console.log("5. Click on map → Should place building (if in placement mode)");
console.log("\n⚠️ If any of these fail, the regression fix needs adjustment!");
