#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Castle.js Fix Validation');
console.log('==========================');

// Check if Building.js has the update method
const buildingPath = path.join(__dirname, 'src/entities/Building.js');
const buildingContent = fs.readFileSync(buildingPath, 'utf8');

if (buildingContent.includes('update(deltaTime, currentTime)')) {
    console.log('✅ Building.js has the update() method');
} else {
    console.log('❌ Building.js is missing the update() method');
    process.exit(1);
}

// Check if Castle.js calls super.update()
const castlePath = path.join(__dirname, 'src/entities/buildings/Castle.js');
const castleContent = fs.readFileSync(castlePath, 'utf8');

if (castleContent.includes('super.update(deltaTime, currentTime)')) {
    console.log('✅ Castle.js calls super.update() correctly');
} else {
    console.log('❌ Castle.js does not call super.update()');
    process.exit(1);
}

// Check other affected buildings
const buildingsToCheck = [
    'Blacksmith.js',
    'IronSmelter.js', 
    'Windmill.js',
    'TransportersHut.js',
    'WoodcuttersHut.js',
    'Sawmill.js'
];

let allBuildingsOk = true;

buildingsToCheck.forEach(building => {
    const buildingFilePath = path.join(__dirname, 'src/entities/buildings', building);
    if (fs.existsSync(buildingFilePath)) {
        const content = fs.readFileSync(buildingFilePath, 'utf8');
        if (content.includes('super.update(')) {
            console.log(`✅ ${building} calls super.update() correctly`);
        } else {
            console.log(`ℹ️  ${building} does not call super.update() (may not need it)`);
        }
    } else {
        console.log(`⚠️  ${building} not found`);
    }
});

console.log('\n🎉 Castle.js fix validation completed successfully!');
console.log('🌐 The game should now work at http://localhost:5173');
console.log('📋 Next: Open the browser and check the console for any remaining errors');
