import Game from './core/Game.js';

console.log('Feudal Realm Manager - Main Entry Point');

const appContainer = document.getElementById('app');
if (!appContainer) {
    console.error('Error: Root container #app not found in HTML. Game cannot start.');
} else {
    const gameCanvas = document.getElementById('game-canvas');

    if (!gameCanvas) {
        console.error('Error: #game-canvas not found. Game cannot start.');
    } else {
        // All essential DOM elements are present, proceed with game initialization
        const game = new Game();
        game.init(); // Initialize all game components
        game.start(); // Start the game loop

        // Expose game instance globally for testing
        window.game = game;

        // Initialize construction tester for debugging
        import('./testing/constructionTester.js').then(module => {
            const ConstructionTester = module.default;
            window.constructionTester = new ConstructionTester(game);
            console.log('Construction tester loaded. Use window.constructionTester.testCompleteConstructionCycle() to run tests.');
        }).catch(err => {
            console.log('Construction tester not loaded:', err.message);
        });

        console.log('Game instance created, initialized, and started.');
    }
}