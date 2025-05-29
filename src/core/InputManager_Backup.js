// src/core/InputManager.js

/**
 * @class InputManager
 * @classdesc Manages raw browser input events (mouse, keyboard) for the game canvas,
 * processes them, and provides callbacks for other modules to subscribe to.
 */
class InputManager {
    /**
     * Creates an instance of InputManager.
     * @param {HTMLCanvasElement} gameCanvas - The main canvas element for the game.
     */
    constructor(gameCanvas) {
        this.gameCanvas = gameCanvas;
        /** 
         * @property {object} mousePosition - Current mouse position relative to the canvas.
         * @property {number} mousePosition.x
         * @property {number} mousePosition.y
         */
        this.mousePosition = { x: 0, y: 0 };
        
        /** @private @type {Array<Function>} */
        this.clickCallbacks = [];
        /** @private @type {Array<Function>} */
        this.mouseMoveCallbacks = [];
        /** @private @type {Array<Function>} */
        this.keyDownCallbacks = [];

        this._setupEventListeners();
    }

    /**
     * @private
     * Sets up the necessary event listeners on the game canvas and window.
     */
    _setupEventListeners() {
        if (!this.gameCanvas) {
            console.error("InputManager: gameCanvas is not provided. Event listeners not attached.");
            return;
        }

        // Track mouse state for click vs drag detection
        this.mouseDownTime = 0;
        this.mouseDownPosition = { x: 0, y: 0 };
        this.isDragging = false;
        
        // CRITICAL FIX: Only listen to specific events, don't interfere with OrbitControls
        // Use capture phase (true) to detect events before OrbitControls, but don't prevent them
        this.gameCanvas.addEventListener('mousedown', this._handleMouseDown.bind(this), true);
        this.gameCanvas.addEventListener('mouseup', this._handleMouseUp.bind(this), true);
        
        // ONLY listen to window-level mousemove for drag detection, not canvas
        window.addEventListener('mousemove', this._handleMouseMove.bind(this), false);
        window.addEventListener('keydown', this._handleKeyDown.bind(this), false);
        
        // For clicks, use a delayed approach to avoid interfering with camera controls
        this.gameCanvas.addEventListener('click', this._handleCanvasClick.bind(this), true);
    }

    /**
     * @private
     * Handles canvas mousedown events.
     * @param {MouseEvent} event - The raw mouse event.
     */
    _handleMouseDown(event) {
        // Record mouse down for drag detection, but DON'T prevent default or stop propagation
        this.mouseDownTime = Date.now();
        const rect = this.gameCanvas.getBoundingClientRect();
        this.mouseDownPosition = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
        this.isDragging = false;
        
        // Let the event continue to OrbitControls - do NOT call preventDefault or stopPropagation
    }

    /**
     * @private
     * Handles canvas mouseup events.
     * @param {MouseEvent} event - The raw mouse event.
     */
    _handleMouseUp(event) {
        // Reset dragging state, but don't interfere with OrbitControls
        // Let the event continue to OrbitControls
        this.isDragging = false;
    }

    /**
     * @private
     * Handles canvas click events, processes click data, and invokes registered callbacks.
     * @param {MouseEvent} event - The raw mouse event.
     */
    _handleCanvasClick(event) {
        // CRITICAL: Only process clicks if they are definitely building placement clicks
        // Check if we were dragging - if so, this is a camera control, ignore it
        if (this.isDragging) {
            console.log("InputManager: Ignoring click - camera drag detected");
            return;
        }

        // Check timing - if very quick, might be a camera control double-click
        const timeDiff = Date.now() - this.mouseDownTime;
        if (timeDiff < 50) {
            console.log("InputManager: Ignoring very quick click - likely camera control");
            return;
        }

        // Only process if we have click callbacks registered (building placement mode)
        if (this.clickCallbacks.length === 0) {
            console.log("InputManager: No click callbacks - letting event pass through");
            return;
        }

        // Process as genuine building placement click
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

    /**
     * @private
     * Handles window mouse move events, updates internal mouse position, and invokes registered callbacks.
     * @param {MouseEvent} event - The raw mouse event.
     */
    _handleMouseMove(event) {
        // Track dragging for click detection
        if (this.mouseDownTime > 0) {
            const rect = this.gameCanvas.getBoundingClientRect();
            const currentPosition = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
            
            const distance = Math.sqrt(
                Math.pow(currentPosition.x - this.mouseDownPosition.x, 2) +
                Math.pow(currentPosition.y - this.mouseDownPosition.y, 2)
            );
            
            // If mouse moved more than 5 pixels, consider it dragging
            if (distance > 5) {
                this.isDragging = true;
            }
        }

        // Only process mouse move callbacks if mouse is over the canvas
        if (!this.gameCanvas) return;
        
        const rect = this.gameCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Check if mouse is within canvas bounds
        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
            this.mousePosition.x = x;
            this.mousePosition.y = y;
            
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

    /**
     * @private
     * Handles window key down events and invokes registered callbacks.
     * @param {KeyboardEvent} event - The raw keyboard event.
     */
    _handleKeyDown(event) {
        this.keyDownCallbacks.forEach(callback => callback(event));
    }

    /**
     * Registers a callback for click events.
     * @param {Function} callback - Function to be called on a click event. 
     *                              It receives clickData: {rawEvent, x, y, normalizedX, normalizedY}.
     */
    onClick(callback) {
        this.clickCallbacks.push(callback);
    }

    /**
     * Registers a callback for mouse move events.
     * @param {Function} callback - Function to be called on a mouse move event.
     *                              It receives moveData: {rawEvent, x, y, normalizedX, normalizedY}.
     */
    onMouseMove(callback) {
        this.mouseMoveCallbacks.push(callback);
    }

    /**
     * Registers a callback for key down events.
     * @param {Function} callback - Function to be called on a key down event.
     *                              It receives the raw KeyboardEvent.
     */
    onKeyDown(callback) {
        this.keyDownCallbacks.push(callback);
    }

    /**
     * Unregisters a callback for click events.
     * @param {Function} callback - The callback function to remove.
     */
    offClick(callback) {
        this.clickCallbacks = this.clickCallbacks.filter(cb => cb !== callback);
    }

    /**
     * Unregisters a callback for mouse move events.
     * @param {Function} callback - The callback function to remove.
     */
    offMouseMove(callback) {
        this.mouseMoveCallbacks = this.mouseMoveCallbacks.filter(cb => cb !== callback);
    }

    /**
     * Unregisters a callback for key down events.
     * @param {Function} callback - The callback function to remove.
     */
    offKeyDown(callback) {
        this.keyDownCallbacks = this.keyDownCallbacks.filter(cb => cb !== callback);
    }
}

export default InputManager;
