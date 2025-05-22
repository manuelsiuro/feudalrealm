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

        this.gameCanvas.addEventListener('click', this._handleCanvasClick.bind(this), false);
        window.addEventListener('mousemove', this._handleMouseMove.bind(this), false);
        window.addEventListener('keydown', this._handleKeyDown.bind(this), false);
        // Add other event listeners as needed (e.g., mousedown, mouseup)
    }

    /**
     * @private
     * Handles canvas click events, processes click data, and invokes registered callbacks.
     * @param {MouseEvent} event - The raw mouse event.
     */
    _handleCanvasClick(event) {
        // Basic click position, might need adjustment based on canvas offset
        const rect = this.gameCanvas.getBoundingClientRect();
        const clickData = {
            rawEvent: event,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            normalizedX: (event.clientX - rect.left) / rect.width * 2 - 1,
            normalizedY: -((event.clientY - rect.top) / rect.height) * 2 + 1,
        };
        this.clickCallbacks.forEach(callback => callback(clickData));
    }

    _handleMouseMove(event) {
        const rect = this.gameCanvas.getBoundingClientRect();
        this.mousePosition.x = event.clientX - rect.left;
        this.mousePosition.y = event.clientY - rect.top;
        const moveData = {
            rawEvent: event,
            x: this.mousePosition.x,
            y: this.mousePosition.y,
            normalizedX: (event.clientX - rect.left) / rect.width * 2 - 1,
            normalizedY: -((event.clientY - rect.top) / rect.height) * 2 + 1,
        };
        this.mouseMoveCallbacks.forEach(callback => callback(moveData));
    }

    /**
     * @private
     * Handles window mouse move events, updates internal mouse position, and invokes registered callbacks.
     * @param {MouseEvent} event - The raw mouse event.
     */
    _handleMouseMove(event) {
        const rect = this.gameCanvas.getBoundingClientRect();
        this.mousePosition.x = event.clientX - rect.left;
        this.mousePosition.y = event.clientY - rect.top;
        const moveData = {
            rawEvent: event,
            x: this.mousePosition.x,
            y: this.mousePosition.y,
            normalizedX: (event.clientX - rect.left) / rect.width * 2 - 1,
            normalizedY: -((event.clientY - rect.top) / rect.height) * 2 + 1,
        };
        this.mouseMoveCallbacks.forEach(callback => callback(moveData));
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
