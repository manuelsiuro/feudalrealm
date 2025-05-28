// Simple Node.js test to validate Game.js imports
import('./src/core/Game.js')
  .then(module => {
    console.log('✅ Game.js imported successfully');
    console.log('Default export:', !!module.default);
    console.log('Game constructor:', typeof module.default);
  })
  .catch(error => {
    console.error('❌ Import failed:', error.message);
    console.error('Stack:', error.stack);
  });
