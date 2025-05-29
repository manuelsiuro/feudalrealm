// Emergency diagnostic script to verify the InputManager fix
// Run this in browser console: copy and paste this entire script

console.log("🚨 EMERGENCY REGRESSION DIAGNOSTIC");
console.log("=".repeat(50));

// Check if game is loaded
if (window.game) {
    console.log("✅ Game instance found");
    
    // Check InputManager
    if (window.game.inputManager) {
        console.log("✅ InputManager instance found");
        console.log("InputManager callbacks:", {
            clickCallbacks: window.game.inputManager.clickCallbacks.length,
            mouseMoveCallbacks: window.game.inputManager.mouseMoveCallbacks.length,
            keyDownCallbacks: window.game.inputManager.keyDownCallbacks.length
        });
    } else {
        console.log("❌ InputManager NOT found in game");
    }
    
    // Check OrbitControls
    if (window.game.renderer && window.game.renderer.controls) {
        console.log("✅ OrbitControls found");
        console.log("Controls enabled:", window.game.renderer.controls.enabled);
        console.log("Controls dom element:", window.game.renderer.controls.domElement);
    } else {
        console.log("❌ OrbitControls NOT found");
    }
    
    // Test building placement mode
    console.log("\n🏠 BUILDING PLACEMENT TEST:");
    console.log("Type this to enter building placement mode:");
    console.log("window.game.constructionManager.startPlacement('house')");
    
} else {
    console.log("❌ Game not loaded yet - wait for game to initialize");
}

console.log("\n🔧 MANUAL TESTS TO PERFORM:");
console.log("1. Right-click + drag = Camera rotation");
console.log("2. Mouse wheel = Camera zoom");
console.log("3. Click building button + click map = Building placement");

console.log("\nIf any test fails, report immediately!");
