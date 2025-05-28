# Manual Integration Test Guide

## Prerequisites
1. Start the server: `node server.js`
2. Open browser to `http://localhost:3000`
3. Wait for the game to fully load

## Test Steps

### Step 1: Run Automated Test
1. Open browser console (F12 → Console)
2. Copy and paste the contents of `final_integration_test.js`
3. Press Enter to execute
4. Review the test results

### Step 2: Manual Building Placement Test
1. In the game, try to place a new building:
   - Click on a building type from the UI
   - Place it on the map
   - Check console for registration messages like:
     ```
     [CM Update] Registered BuildingName (ID: xxx) with ProductionChainManager
     ```

### Step 3: Verify Registration
1. In console, run:
   ```javascript
   console.log('Registered buildings:', game.productionChainManager.buildings.size);
   for (const [id, building] of game.productionChainManager.buildings) {
       console.log(`- ${building.name} (${building.type})`);
   }
   ```

### Step 4: Test Production Chain UI
1. Look for the ProductionChain UI elements in the game interface
2. In console, verify UI updates:
   ```javascript
   console.log('ProductionChainUI exists:', !!game.uiManager?.productionChainUI);
   ```

### Step 5: Verify Update Loop Integration
1. In console, check that updates are being called:
   ```javascript
   // Check animate method contains our updates
   console.log(game.animate.toString().includes('productionChainManager.update'));
   console.log(game.animate.toString().includes('productionChainUI.update'));
   ```

## Expected Results

### ✅ Success Indicators
- All tests in automated script pass
- Buildings show registration messages when placed
- No console errors related to ProductionChain
- ProductionChainManager.buildings Map contains placed buildings
- ProductionChainUI exists and updates

### ❌ Failure Indicators
- Console errors about missing methods/properties
- Buildings placed but not registered
- ProductionChainManager or ProductionChainUI not found
- Update methods not called in animate loop

## Troubleshooting

### If buildings aren't registering:
1. Check ConstructionManager has game reference:
   ```javascript
   console.log('Game reference:', !!game.constructionManager.game);
   ```

### If ProductionChainManager not found:
1. Check Game.js initialization:
   ```javascript
   console.log('ProductionChainManager:', !!game.productionChainManager);
   ```

### If UI not updating:
1. Check UIManager initialization:
   ```javascript
   console.log('ProductionChainUI:', !!game.uiManager?.productionChainUI);
   ```

## Files Modified for Integration
- `src/core/Game.js` - Added update calls and ConstructionManager.setGame()
- `src/core/constructionManager.js` - Added setGame() method and building registration calls
- Integration is complete when all tests pass and buildings register correctly
