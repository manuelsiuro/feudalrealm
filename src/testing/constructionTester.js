// Construction Cycle Test Script
// This script provides comprehensive testing of the construction cycle

class ConstructionTester {
    constructor(game) {
        this.game = game;
        this.testResults = [];
        this.isRunning = false;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const result = { timestamp, message, type };
        this.testResults.push(result);
        console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
        return result;
    }

    async testCompleteConstructionCycle() {
        if (this.isRunning) {
            this.log('Test already running', 'warning');
            return;
        }

        this.isRunning = true;
        this.testResults = [];
        this.log('Starting complete construction cycle test');

        try {
            // Test 1: Verify initial state
            this.log(`Initial state check:`);
            this.log(`- Placed buildings: ${this.game.constructionManager.placedBuildings.length}`);
            this.log(`- Construction queue: ${this.game.constructionManager.constructionQueue.length}`);
            this.log(`- Active constructions: ${this.game.constructionManager.activeConstructions.length}`);
            
            const builders = this.game.serfManager.getAvailableSerfsByProfession('BUILDER');
            this.log(`- Available builders: ${builders.length}`);

            // Test 2: Check resources
            const woodCount = this.game.resourceManager.getResourceCount('WOOD');
            this.log(`- Wood resources: ${woodCount}`);
            
            if (woodCount < 20) {
                this.game.resourceManager.addResource('WOOD', 50);
                this.log('Added 50 wood for testing');
            }

            // Test 3: Start building placement
            this.log('Testing building placement...');
            this.game.constructionManager.startPlacement('WOODCUTTERS_HUT');
            
            if (this.game.constructionManager.isPlacing) {
                this.log('Placement mode activated successfully');
            } else {
                this.log('Failed to activate placement mode', 'error');
                return;
            }

            // Test 4: Confirm placement at a valid location
            const mapCenter = Math.floor(this.game.gameMap.width / 2);
            const offset = 5; // Place away from existing buildings
            const worldPos = {
                x: (mapCenter + offset) * 10, // Assuming TILE_SIZE = 10
                z: mapCenter * 10
            };

            this.log(`Attempting to place building at world position (${worldPos.x}, ${worldPos.z})`);
            const placementSuccess = this.game.constructionManager.confirmPlacement(worldPos);

            if (placementSuccess) {
                this.log('Building placement confirmed', 'success');
            } else {
                this.log('Building placement failed', 'error');
                this.isRunning = false;
                return;
            }

            // Test 5: Monitor construction process
            this.log('Monitoring construction process...');
            await this.monitorConstruction();

        } catch (error) {
            this.log(`Test error: ${error.message}`, 'error');
        } finally {
            this.isRunning = false;
        }
    }

    async monitorConstruction() {
        return new Promise((resolve) => {
            let checkCount = 0;
            const maxChecks = 60; // Check for 60 seconds max
            
            const checkInterval = setInterval(() => {
                checkCount++;
                
                const queue = this.game.constructionManager.constructionQueue;
                const active = this.game.constructionManager.activeConstructions;
                const placed = this.game.constructionManager.placedBuildings;

                this.log(`Monitor ${checkCount}: Queue=${queue.length}, Active=${active.length}, Placed=${placed.length}`);

                // Check if builder was assigned
                if (active.length > 0) {
                    const building = active[0];
                    const progress = (building.currentConstructionProgress / building.constructionRequiredTime * 100).toFixed(1);
                    this.log(`Construction progress: ${progress}% (Builder: ${building.assignedBuilderId || 'None'})`);

                    // Check if progress bar is visible
                    if (building.progressBarGroup && building.progressBarGroup.visible) {
                        this.log('Progress bar is visible');
                    }
                }

                // Check for completion
                const woodcutterHuts = placed.filter(b => b.type === 'WOODCUTTERS_HUT');
                if (woodcutterHuts.length > 0) {
                    this.log('Construction completed successfully!', 'success');
                    this.log(`Total buildings now: ${placed.length}`);
                    
                    // Verify building state
                    const completedBuilding = woodcutterHuts[woodcutterHuts.length - 1];
                    this.log(`Completed building state: ${completedBuilding.currentConstructionState}`);
                    this.log(`Building is constructed: ${completedBuilding.isConstructed}`);
                    
                    clearInterval(checkInterval);
                    resolve();
                    return;
                }

                // Check for timeout
                if (checkCount >= maxChecks) {
                    this.log('Test timed out - construction taking too long', 'error');
                    clearInterval(checkInterval);
                    resolve();
                }

                // Check for errors
                if (queue.length === 0 && active.length === 0) {
                    this.log('No buildings in queue or active - checking if completed', 'warning');
                }

            }, 1000); // Check every second
        });
    }

    testPriorityQueue() {
        this.log('Testing priority queue functionality...');
        
        // Add resources for multiple buildings
        this.game.resourceManager.addResource('WOOD', 100);
        this.game.resourceManager.addResource('STONE', 50);

        const initialQueueSize = this.game.constructionManager.constructionQueue.length;
        
        // Add buildings with different tiers/priorities
        const testBuildings = [
            { type: 'WOODCUTTERS_HUT', pos: { x: 30, z: 30 } },
            { type: 'QUARRY', pos: { x: 50, z: 30 } },
            { type: 'BUILDERS_HUT', pos: { x: 70, z: 30 } }
        ];

        testBuildings.forEach((building, index) => {
            this.game.constructionManager.startPlacement(building.type);
            const success = this.game.constructionManager.confirmPlacement(building.pos);
            this.log(`Queued ${building.type}: ${success ? 'Success' : 'Failed'}`);
        });

        const finalQueueSize = this.game.constructionManager.constructionQueue.length;
        this.log(`Queue size changed from ${initialQueueSize} to ${finalQueueSize}`);

        // Check if queue is sorted by priority
        const queue = this.game.constructionManager.constructionQueue;
        if (queue.length > 1) {
            this.log('Queue order by tier:');
            queue.forEach((building, index) => {
                this.log(`  ${index}: ${building.name} (tier ${building.info.tier})`);
            });
        }
    }

    getTestResults() {
        return this.testResults;
    }

    printResults() {
        console.log('\n=== Construction Test Results ===');
        this.testResults.forEach(result => {
            console.log(`[${result.timestamp}] ${result.type.toUpperCase()}: ${result.message}`);
        });
        console.log('================================\n');
    }
}

// Make the tester available globally
if (typeof window !== 'undefined' && window.game) {
    window.constructionTester = new ConstructionTester(window.game);
    console.log('Construction tester initialized. Use window.constructionTester.testCompleteConstructionCycle() to run tests.');
} else {
    console.log('Game instance not found. Construction tester not initialized.');
}

export default ConstructionTester;
