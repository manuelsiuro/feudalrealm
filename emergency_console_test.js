// EMERGENCY CAMERA CONTROLS TEST
// Run this in browser console at http://localhost:5173

console.log("🚨 EMERGENCY CAMERA CONTROLS TEST");
console.log("=================================");

// Wait for game to load
function testCameraControls() {
    if (typeof window.game === 'undefined') {
        console.log("⏳ Game not loaded yet, retrying in 1 second...");
        setTimeout(testCameraControls, 1000);
        return;
    }

    console.log("✅ Game object found");

    // Test OrbitControls
    if (window.game.renderer && window.game.renderer.controls) {
        const controls = window.game.renderer.controls;
        console.log("✅ OrbitControls found");
        
        // Test if controls are enabled
        console.log(`Controls enabled: ${controls.enabled}`);
        console.log(`Enable rotate: ${controls.enableRotate}`);
        console.log(`Enable zoom: ${controls.enableZoom}`);
        console.log(`Enable pan: ${controls.enablePan}`);
        
        // Test controls update
        try {
            controls.update();
            console.log("✅ Controls update() works");
        } catch (error) {
            console.log("❌ Controls update() failed:", error);
        }
        
        // Test manual camera movement
        console.log("\n🧪 Testing manual camera movement...");
        const originalPosition = {
            x: window.game.camera.position.x,
            y: window.game.camera.position.y,
            z: window.game.camera.position.z
        };
        
        // Move camera slightly
        window.game.camera.position.x += 5;
        controls.update();
        
        console.log(`Camera moved from (${originalPosition.x.toFixed(2)}, ${originalPosition.y.toFixed(2)}, ${originalPosition.z.toFixed(2)}) to (${window.game.camera.position.x.toFixed(2)}, ${window.game.camera.position.y.toFixed(2)}, ${window.game.camera.position.z.toFixed(2)})`);
        
        // Restore position
        window.game.camera.position.set(originalPosition.x, originalPosition.y, originalPosition.z);
        controls.update();
        
        console.log("✅ Manual camera movement test completed");
        
    } else {
        console.log("❌ CRITICAL: OrbitControls not found!");
        return;
    }

    // Test InputManager
    if (window.game.inputManager) {
        console.log("✅ InputManager found");
        console.log(`Click callbacks: ${window.game.inputManager.clickCallbacks.length}`);
        console.log(`Mouse move callbacks: ${window.game.inputManager.mouseMoveCallbacks.length}`);
    } else {
        console.log("❌ InputManager not found");
    }

    // Test canvas element
    const canvas = document.querySelector('canvas');
    if (canvas) {
        console.log("✅ Canvas found");
        
        // Test manual event simulation
        console.log("\n🧪 Simulating mouse events...");
        
        // Simulate mousedown (right-click for rotation)
        const mouseDownEvent = new MouseEvent('mousedown', {
            button: 2, // Right mouse button
            clientX: canvas.width / 2,
            clientY: canvas.height / 2,
            bubbles: true
        });
        
        canvas.dispatchEvent(mouseDownEvent);
        console.log("Simulated right mousedown");
        
        // Simulate mousemove
        const mouseMoveEvent = new MouseEvent('mousemove', {
            clientX: canvas.width / 2 + 10,
            clientY: canvas.height / 2 + 10,
            bubbles: true
        });
        
        canvas.dispatchEvent(mouseMoveEvent);
        console.log("Simulated mousemove");
        
        // Simulate mouseup
        const mouseUpEvent = new MouseEvent('mouseup', {
            button: 2,
            clientX: canvas.width / 2 + 10,
            clientY: canvas.height / 2 + 10,
            bubbles: true
        });
        
        canvas.dispatchEvent(mouseUpEvent);
        console.log("Simulated right mouseup");
        
        console.log("✅ Event simulation completed");
        
    } else {
        console.log("❌ Canvas not found");
    }

    console.log("\n📋 MANUAL TEST CHECKLIST:");
    console.log("1. Try right-clicking and dragging on the game");
    console.log("2. Try using the mouse wheel to zoom");
    console.log("3. Try clicking a building button and then clicking the map");
    console.log("\n⚠️ If any fail, report immediately!");
}

// Start the test
testCameraControls();
