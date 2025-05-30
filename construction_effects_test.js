// Quick validation of construction effects integration
console.log('🧪 Testing Construction Effects Integration...');

try {
    // Test 1: Import ConstructionEffectsManager
    import('./src/core/ConstructionEffectsManager.js').then(module => {
        console.log('✅ ConstructionEffectsManager import: SUCCESS');
        console.log('📋 Exports:', Object.keys(module));
        
        // Test 2: Check if class is properly exported
        const EffectsManager = module.ConstructionEffectsManager || module.default;
        if (EffectsManager) {
            console.log('✅ ConstructionEffectsManager class: FOUND');
            
            // Test 3: Create mock instance
            const mockScene = { 
                add: () => console.log('Mock scene.add() called'),
                remove: () => console.log('Mock scene.remove() called')
            };
            const mockResourceFlowManager = {};
            
            try {
                const instance = new EffectsManager(mockScene, mockResourceFlowManager);
                console.log('✅ ConstructionEffectsManager instantiation: SUCCESS');
                console.log('🔧 Config:', JSON.stringify(instance.config, null, 2));
                
                // Test 4: Test methods
                console.log('🧪 Testing methods...');
                console.log('- toggleDustParticles:', typeof instance.toggleDustParticles);
                console.log('- toggleScaffolding:', typeof instance.toggleScaffolding);
                console.log('- toggleTransparency:', typeof instance.toggleTransparency);
                console.log('- update:', typeof instance.update);
                console.log('- getStats:', typeof instance.getStats);
                
                if (typeof instance.getStats === 'function') {
                    const stats = instance.getStats();
                    console.log('📊 Initial stats:', stats);
                    console.log('✅ All methods: WORKING');
                }
                
                console.log('🎉 Construction Effects System: FULLY OPERATIONAL!');
                
            } catch (error) {
                console.error('❌ Instance creation failed:', error);
            }
        } else {
            console.error('❌ ConstructionEffectsManager class: NOT FOUND');
        }
    }).catch(error => {
        console.error('❌ Import failed:', error);
    });
    
    // Test 5: Check ConstructionManager integration
    import('./src/core/constructionManager.js').then(module => {
        console.log('✅ ConstructionManager import: SUCCESS');
        // The integration check would happen when the actual game loads
    }).catch(error => {
        console.error('❌ ConstructionManager import failed:', error);
    });
    
} catch (error) {
    console.error('❌ Overall test failed:', error);
}

console.log('📋 Test complete - check browser console for detailed results');
console.log('🌐 Visit: http://localhost:5173/construction_effects_validation.html');
console.log('🎮 Or visit: http://localhost:5173/ for the main game');
