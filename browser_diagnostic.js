// Quick diagnostic script for browser console
// Run this in the browser console at http://localhost:5173

console.log("=== REGRESSION FIX DIAGNOSTIC ===");

// Check if game is loaded
if (typeof window.game !== 'undefined') {
    console.log("✓ Game object exists");
    
    // Check InputManager
    if (window.game.inputManager) {
        console.log("✓ InputManager exists");
        console.log("InputManager callbacks:", {
            clickCallbacks: window.game.inputManager.clickCallbacks.length,
            mouseMoveCallbacks: window.game.inputManager.mouseMoveCallbacks.length
        });
    } else {
        console.log("✗ InputManager missing");
    }
    
    // Check Renderer and Controls
    if (window.game.renderer) {
        console.log("✓ Renderer exists");
        if (window.game.renderer.controls) {
            console.log("✓ OrbitControls exists");
            console.log("Controls enabled:", window.game.renderer.controls.enabled);
        } else {
            console.log("✗ OrbitControls missing");
        }
    } else {
        console.log("✗ Renderer missing");
    }
    
    // Check BuildingManager
    if (window.game.buildingManager) {
        console.log("✓ BuildingManager exists");
    } else {
        console.log("✗ BuildingManager missing");
    }
    
} else {
    console.log("✗ Game object not found - game may not be loaded yet");
}

// Test mouse event flow
console.log("\n=== TESTING EVENT FLOW ===");
const canvas = document.querySelector('canvas');
if (canvas) {
    console.log("✓ Canvas found");
    
    // Check event listeners
    let eventListeners = getEventListeners ? getEventListeners(canvas) : "getEventListeners not available";
    console.log("Canvas event listeners:", eventListeners);
    
    // Add temporary test listeners
    const testMouseDown = (e) => console.log("TEST: mousedown received");
    const testClick = (e) => console.log("TEST: click received");
    
    canvas.addEventListener('mousedown', testMouseDown);
    canvas.addEventListener('click', testClick);
    
    console.log("Added test listeners - try clicking on the canvas");
    
    // Remove after 5 seconds
    setTimeout(() => {
        canvas.removeEventListener('mousedown', testMouseDown);
        canvas.removeEventListener('click', testClick);
        console.log("Test listeners removed");
    }, 5000);
    
} else {
    console.log("✗ Canvas not found");
}

console.log("\n=== MANUAL TEST INSTRUCTIONS ===");
console.log("1. Right-click + drag = rotate camera");
console.log("2. Mouse wheel = zoom");
console.log("3. Left-click = place building");
console.log("4. Middle-click + drag = pan camera");
console.log("\nIf any of these don't work, the regression is not fixed.");
