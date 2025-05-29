// EMERGENCY HOTFIX - Minimal InputManager that doesn't interfere with OrbitControls
// This replaces the current implementation temporarily to restore camera controls

/**
 * @class InputManager
 * @classdesc EMERGENCY VERSION - Minimal interference with OrbitControls
 */
class InputManager {
    constructor(gameCanvas) {
        this.gameCanvas = gameCanvas;
        this.mousePosition = { x: 0, y: 0 };
        
        this.clickCallbacks = [];
        this.mouseMoveCallbacks = [];
        this.keyDownCallbacks = [];

        this._setupMinimalEventListeners();
    }

    _setupMinimalEventListeners() {
        if (!this.gameCanvas) {
            console.error("InputManager: gameCanvas is not provided. Event listeners not attached.");
            return;
        }

        // EMERGENCY: Only listen to keyboard events and window mouse move
        // Do NOT interfere with canvas mouse events at all
        window.addEventListener('keydown', this._handleKeyDown.bind(this), false);
        window.addEventListener('mousemove', this._handleMouseMove.bind(this), false);
        
        // For clicks, use a very passive approach - only when callbacks are registered
        this._lastClickTime = 0;
        this.gameCanvas.addEventListener('click', this._handleMinimalClick.bind(this), false);
        
        console.log("InputManager: EMERGENCY MODE - Minimal interference with OrbitControls");
    }

    _handleMinimalClick(event) {
        // Only process if we have click callbacks (building placement mode)
        if (this.clickCallbacks.length === 0) {
            // No building placement active, let OrbitControls handle everything
            return;
        }

        // Prevent rapid-fire clicks that might interfere with camera
        const now = Date.now();
        if (now - this._lastClickTime < 200) {
            console.log("InputManager: Ignoring rapid click - camera control");
            return;
        }
        this._lastClickTime = now;

        // Process as building placement click
        const rect = this.gameCanvas.getBoundingClientRect();
        const clickData = {
            rawEvent: event,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            normalizedX: (event.clientX - rect.left) / rect.width * 2 - 1,
            normalizedY: -((event.clientY - rect.top) / rect.height) * 2 + 1,
        };
        
        console.log("InputManager: Processing building placement click", clickData);
        this.clickCallbacks.forEach(callback => callback(clickData));
    }

    _handleMouseMove(event) {
        // Only track mouse position for building placement, don't interfere with camera
        if (!this.gameCanvas) return;
        
        const rect = this.gameCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
            this.mousePosition.x = x;
            this.mousePosition.y = y;
            
            // Only call callbacks if we have them (building placement mode)
            if (this.mouseMoveCallbacks.length > 0) {
                const moveData = {
                    rawEvent: event,
                    x: this.mousePosition.x,
                    y: this.mousePosition.y,
                    normalizedX: x / rect.width * 2 - 1,
                    normalizedY: -(y / rect.height) * 2 + 1,
                };
                this.mouseMoveCallbacks.forEach(callback => callback(moveData));
            }
        }
    }

    _handleKeyDown(event) {
        this.keyDownCallbacks.forEach(callback => callback(event));
    }

    // Standard API methods
    onClick(callback) {
        this.clickCallbacks.push(callback);
    }

    onMouseMove(callback) {
        this.mouseMoveCallbacks.push(callback);
    }

    onKeyDown(callback) {
        this.keyDownCallbacks.push(callback);
    }

    offClick(callback) {
        this.clickCallbacks = this.clickCallbacks.filter(cb => cb !== callback);
    }

    offMouseMove(callback) {
        this.mouseMoveCallbacks = this.mouseMoveCallbacks.filter(cb => cb !== callback);
    }

    offKeyDown(callback) {
        this.keyDownCallbacks = this.keyDownCallbacks.filter(cb => cb !== callback);
    }
}

export default InputManager;
