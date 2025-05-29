// Quick validation script for ProductionChainUI integration
console.log('=== ProductionChainUI Integration Validation ===');

function validateProductionChainUI() {
    const results = {
        canvasExists: false,
        uiContainerExists: false,
        gameLoaded: false,
        uiManagerExists: false,
        productionChainUIExists: false,
        updateMethodWorks: false
    };

    // Check canvas
    const canvas = document.getElementById('game-canvas');
    results.canvasExists = !!canvas;
    console.log('Canvas exists:', results.canvasExists);

    // Check UI container
    const uiContainer = document.getElementById('ui-container');
    results.uiContainerExists = !!uiContainer;
    console.log('UI Container exists:', results.uiContainerExists);

    // Check game instance
    results.gameLoaded = !!(window.game);
    console.log('Game loaded:', results.gameLoaded);

    if (window.game) {
        // Check UIManager
        results.uiManagerExists = !!(window.game.uiManager);
        console.log('UIManager exists:', results.uiManagerExists);

        if (window.game.uiManager) {
            // Check ProductionChainUI
            results.productionChainUIExists = !!(window.game.uiManager.productionChainUI);
            console.log('ProductionChainUI exists:', results.productionChainUIExists);

            if (window.game.uiManager.productionChainUI) {
                // Test update method
                try {
                    window.game.uiManager.productionChainUI.update();
                    results.updateMethodWorks = true;
                    console.log('ProductionChainUI.update() works: true');
                } catch (error) {
                    console.error('ProductionChainUI.update() failed:', error);
                    results.updateMethodWorks = false;
                }
            }
        }
    }

    // Summary
    const allPassed = Object.values(results).every(result => result === true);
    console.log('\n=== SUMMARY ===');
    console.log('All tests passed:', allPassed);
    console.log('Results:', results);

    if (allPassed) {
        console.log('✅ ProductionChainUI integration issue is RESOLVED!');
    } else {
        console.log('❌ ProductionChainUI integration issue still exists');
        console.log('Failed checks:', Object.entries(results).filter(([key, value]) => !value).map(([key]) => key));
    }

    return results;
}

// Auto-run validation after game loads
if (window.game) {
    validateProductionChainUI();
} else {
    // Wait for game to load
    let attempts = 0;
    const checkInterval = setInterval(() => {
        attempts++;
        if (window.game) {
            clearInterval(checkInterval);
            setTimeout(validateProductionChainUI, 1000); // Wait a bit more for full initialization
        } else if (attempts > 50) { // 5 seconds
            clearInterval(checkInterval);
            console.log('❌ Game did not load within timeout period');
            validateProductionChainUI(); // Run anyway to see partial results
        }
    }, 100);
}

// Expose validation function globally
window.validateProductionChainUI = validateProductionChainUI;
