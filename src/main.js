import Game from './core/Game.js';

console.log('Feudal Realm Manager - Main Entry Point');

const appContainer = document.getElementById('app');
if (!appContainer) {
    console.error('Error: Root container #app not found in HTML. Game cannot start.');
} else {
    const gameCanvas = document.getElementById('game-canvas');
    const uiOverlay = document.getElementById('ui-overlay');

    if (!gameCanvas) {
        console.error('Error: #game-canvas not found. Game cannot start.');
    } else if (!uiOverlay) {
        console.error('Error: #ui-overlay not found. Game cannot start.');
    } else {
        // All essential DOM elements are present, proceed with game initialization
        const game = new Game();
        game.init(); // Initialize all game components
        game.start(); // Start the game loop

        console.log('Game instance created, initialized, and started.');
    }
}