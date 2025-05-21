import * as THREE from 'three';
import { RESOURCE_TYPES } from '../config/resourceTypes.js'; // Updated import
// import { SERF_PROFESSIONS } from '../core/serfManager.js'; // Removed to break circular dependency

// Helper function to create a mesh with a specific geometry and color
function createMesh(geometry, color, name = '') {
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    return mesh;
}

// Color definitions (approximations)
const COLORS = {
    MEDIUM_GREY: 0x808080,
    DARK_GREY: 0xa9a9a9, 
    LIGHT_GREY: 0xd3d3d3,
    RED: 0xff0000,
    BROWN: 0xa5572a,
    DARK_BROWN: 0x654321,
    LIGHT_BROWN: 0xdeb887,
    DARK_GREEN: 0x006400,
    GREEN: 0x008000,
    LIGHT_BLUE: 0xadd8e6,
    DARK_BLUE: 0x00008b,
    BEIGE: 0xf5f5dc,
    RED_BROWN: 0x8b4513,
    YELLOW: 0xffff00,
    BLACK: 0x000000,
    ORANGE: 0xffa500,
    TERRACOTTA: 0xe2725b,
    PINK: 0xffc0cb,
    MAROON: 0x800000,
    STONE_GREY: 0x778899, 
    WHITE: 0xffffff,
};

// --- Building Creation Functions ---

export function createCastle() {
    const castleGroup = new THREE.Group();
    castleGroup.name = 'Castle';
    const baseUnit = 1; 
    const baseWidth = baseUnit * 4;
    const baseHeight = baseUnit * 2;
    const baseDepth = baseUnit * 4;
    const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
    const baseMesh = createMesh(baseGeometry, COLORS.MEDIUM_GREY, 'CastleBase');
    baseMesh.position.y = baseHeight / 2; // Adjusted: Base of mesh at y=0 of group
    castleGroup.add(baseMesh);
    const keepWidth = baseUnit * 2.5;
    const keepHeight = baseUnit * 3;
    const keepDepth = baseUnit * 2.5;
    const keepGeometry = new THREE.BoxGeometry(keepWidth, keepHeight, keepDepth);
    const keepMesh = createMesh(keepGeometry, COLORS.DARK_GREY, 'CastleKeep');
    keepMesh.position.y = baseHeight + (keepHeight / 2) - 0.1; // Adjusted: Position relative to base mesh
    castleGroup.add(keepMesh);
    const towerWidth = baseUnit * 0.8;
    const towerHeight = baseUnit * 2.5;
    const towerDepth = baseUnit * 0.8;
    const towerPyramidHeight = baseUnit * 0.5;
    const towerPyramidRadius = towerWidth / 2;
    const towerPositions = [
        { x: baseWidth / 2 - towerWidth / 2, z: baseDepth / 2 - towerDepth / 2 },
        { x: -baseWidth / 2 + towerWidth / 2, z: baseDepth / 2 - towerDepth / 2 },
        { x: baseWidth / 2 - towerWidth / 2, z: -baseDepth / 2 + towerDepth / 2 },
        { x: -baseWidth / 2 + towerWidth / 2, z: -baseDepth / 2 + towerDepth / 2 },
    ];
    towerPositions.forEach((pos, index) => {
        const towerGroup = new THREE.Group();
        towerGroup.name = `CastleTowerGroup_${index}`;
        const towerMeshToAdjust = createMesh(new THREE.BoxGeometry(towerWidth, towerHeight, towerDepth), COLORS.LIGHT_GREY, `CastleTower_${index}`);
        towerMeshToAdjust.position.y = towerHeight / 2; // Adjusted: Base of tower mesh at y=0 of towerGroup
        const pyramidMesh = createMesh(new THREE.ConeGeometry(towerPyramidRadius, towerPyramidHeight, 4), COLORS.RED, `CastleTowerPyramid_${index}`);
        pyramidMesh.position.y = towerHeight / 2 + towerPyramidHeight / 2;
        pyramidMesh.rotation.y = Math.PI / 4; 
        towerMeshToAdjust.add(pyramidMesh); 
        towerGroup.add(towerMeshToAdjust);
        towerGroup.position.set(pos.x, baseHeight, pos.z); // Adjusted: Position relative to base mesh top
        castleGroup.add(towerGroup);
    });
    const entranceWidth = baseUnit * 1;
    const entranceHeight = baseUnit * 1;
    const entranceDepthVal = baseUnit * 0.2; 
    const entranceGeometry = new THREE.BoxGeometry(entranceWidth, entranceHeight, entranceDepthVal);
    const entranceMesh = createMesh(entranceGeometry, 0x666666, 'CastleEntrance');
    entranceMesh.position.set(0, entranceHeight / 2, baseDepth / 2 - entranceDepthVal / 2 + 0.01); // Adjusted: Position relative to base mesh bottom
    castleGroup.add(entranceMesh);
    return castleGroup;
}

export function createWoodcuttersHut() {
    const hutGroup = new THREE.Group();
    hutGroup.name = "Woodcutter's Hut";
    const baseUnit = 0.5; 
    const hutWidth = baseUnit * 2;
    const hutHeight = baseUnit * 1;
    const hutDepth = baseUnit * 1.5;
    const hutGeometry = new THREE.BoxGeometry(hutWidth, hutHeight, hutDepth);
    const hutMesh = createMesh(hutGeometry, COLORS.BROWN, 'Hut');
    hutMesh.position.y = hutHeight / 2; // Adjusted: Base of mesh at y=0 of group
    hutGroup.add(hutMesh);
    const roofWidth = hutWidth * 1.1;
    const roofHeight = baseUnit * 0.4;
    const roofDepth = hutDepth * 1.1;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_BROWN, 'Roof');
    roofMesh.position.y = hutHeight + roofHeight / 2 - 0.05; // Adjusted: Position relative to hut mesh top
    hutGroup.add(roofMesh);
    const logRadius = baseUnit * 0.15;
    const logLength = baseUnit * 0.8;
    const logGeometry = new THREE.CylinderGeometry(logRadius, logRadius, logLength, 8);
    const log1 = createMesh(logGeometry, COLORS.LIGHT_BROWN, 'Log1');
    log1.rotation.x = Math.PI / 2; 
    log1.position.set(hutWidth / 2 + logRadius + 0.1, logRadius, 0); // Adjusted: Position relative to hut base
    hutGroup.add(log1);
    const log2 = createMesh(logGeometry, COLORS.LIGHT_BROWN, 'Log2');
    log2.rotation.x = Math.PI / 2;
    log2.position.set(hutWidth / 2 + logRadius + 0.1, logRadius * 3, 0); // Adjusted: Position relative to hut base
    hutGroup.add(log2);
    return hutGroup;
}

export function createForestersHut() {
    const hutGroup = new THREE.Group();
    hutGroup.name = "Forester's Hut";
    const baseUnit = 0.5;
    const hutWidth = baseUnit * 1.8;
    const hutHeight = baseUnit * 1;
    const hutDepth = baseUnit * 1.3;
    const hutGeometry = new THREE.BoxGeometry(hutWidth, hutHeight, hutDepth);
    const hutMesh = createMesh(hutGeometry, COLORS.BROWN, 'Hut');
    hutMesh.position.y = hutHeight / 2; // Adjusted
    hutGroup.add(hutMesh);
    const roofRadius = Math.max(hutWidth, hutDepth) / 2 * 1.1; 
    const roofHeight = baseUnit * 0.8;
    const roofGeometry = new THREE.ConeGeometry(roofRadius, roofHeight, 4); 
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_GREEN, 'Roof');
    roofMesh.position.y = hutHeight + roofHeight / 2 - 0.05; // Adjusted
    roofMesh.rotation.y = Math.PI / 4; 
    hutGroup.add(roofMesh);
    const saplingRadius = baseUnit * 0.1;
    const saplingHeight = baseUnit * 0.4;
    const saplingGeometry = new THREE.ConeGeometry(saplingRadius, saplingHeight, 8);
    const saplingMesh = createMesh(saplingGeometry, COLORS.GREEN, 'Sapling');
    saplingMesh.position.set(hutWidth / 2 + saplingRadius + 0.1, saplingHeight/2, 0); // Adjusted
    hutGroup.add(saplingMesh);
    return hutGroup;
}

export function createQuarry() {
    const quarryGroup = new THREE.Group();
    quarryGroup.name = 'Quarry';
    const baseUnit = 0.6;
    const shelterWidth = baseUnit * 2.5;
    const shelterHeight = baseUnit * 1.2;
    const shelterDepth = baseUnit * 1.5;
    const shelterGeometry = new THREE.BoxGeometry(shelterWidth, shelterHeight, shelterDepth);
    const shelterMesh = createMesh(shelterGeometry, COLORS.STONE_GREY, 'Shelter'); 
    shelterMesh.position.y = shelterHeight / 2; // Adjusted
    shelterMesh.position.z = -shelterDepth / 4;
    quarryGroup.add(shelterMesh);
    const terrainPieceGeometry1 = new THREE.BoxGeometry(baseUnit * 0.8, baseUnit * 0.5, baseUnit * 0.7);
    const terrainPiece1 = createMesh(terrainPieceGeometry1, COLORS.LIGHT_GREY, 'Terrain1');
    terrainPiece1.position.set(-baseUnit * 0.5, (baseUnit * 0.5) / 2, shelterDepth / 2 - (baseUnit * 0.7) /2); // Adjusted
    terrainPiece1.rotation.y = Math.PI / 6;
    quarryGroup.add(terrainPiece1);
    const terrainPieceGeometry2 = new THREE.BoxGeometry(baseUnit * 0.6, baseUnit * 0.8, baseUnit * 0.5);
    const terrainPiece2 = createMesh(terrainPieceGeometry2, COLORS.LIGHT_GREY, 'Terrain2');
    terrainPiece2.position.set(baseUnit * 0.3, (baseUnit * 0.8) / 2, shelterDepth / 2 - (baseUnit * 0.5) /2 + 0.1); // Adjusted
    terrainPiece2.rotation.y = -Math.PI / 8;
    quarryGroup.add(terrainPiece2);
    const stoneBlockSize = baseUnit * 0.3;
    const stoneBlockGeometry = new THREE.BoxGeometry(stoneBlockSize, stoneBlockSize, stoneBlockSize);
    const stone1 = createMesh(stoneBlockGeometry, COLORS.LIGHT_GREY, 'StoneBlock1');
    stone1.position.set(shelterWidth / 2 - stoneBlockSize, stoneBlockSize / 2, shelterDepth / 2 + stoneBlockSize); // Adjusted
    quarryGroup.add(stone1);
    const stone2 = createMesh(stoneBlockGeometry, COLORS.LIGHT_GREY, 'StoneBlock2');
    stone2.position.set(shelterWidth / 2 - stoneBlockSize * 2.5, stoneBlockSize / 2, shelterDepth / 2 + stoneBlockSize * 1.2); // Adjusted
    stone2.rotation.y = Math.PI / 5;
    quarryGroup.add(stone2);
    return quarryGroup;
}

export function createFishermansHut() {
    const hutGroup = new THREE.Group();
    hutGroup.name = "Fisherman's Hut";
    const baseUnit = 0.5;
    const hutWidth = baseUnit * 1.5;
    const hutHeight = baseUnit * 1;
    const hutDepth = baseUnit * 1.2;
    const hutGeometry = new THREE.BoxGeometry(hutWidth, hutHeight, hutDepth);
    const hutMesh = createMesh(hutGeometry, COLORS.LIGHT_BLUE, 'Hut');
    hutMesh.position.y = hutHeight / 2; // Adjusted
    hutGroup.add(hutMesh);
    const roofRadius = Math.max(hutWidth, hutDepth) / 2 * 1.1;
    const roofHeight = baseUnit * 0.7;
    const roofGeometry = new THREE.ConeGeometry(roofRadius, roofHeight, 4);
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_BLUE, 'Roof');
    roofMesh.position.y = hutHeight + roofHeight / 2 - 0.05; // Adjusted
    roofMesh.rotation.y = Math.PI / 4;
    hutGroup.add(roofMesh);
    const pierWidth = baseUnit * 0.5;
    const pierHeight = baseUnit * 0.1;
    const pierLength = baseUnit * 2.5;
    const pierGeometry = new THREE.BoxGeometry(pierWidth, pierHeight, pierLength);
    const pierMesh = createMesh(pierGeometry, COLORS.BROWN, 'Pier');
    pierMesh.position.set(0, pierHeight / 2, hutDepth / 2 + pierLength / 2); // Adjusted
    hutGroup.add(pierMesh);
    return hutGroup;
}

export function createFarm() {
    const farmGroup = new THREE.Group();
    farmGroup.name = 'Farm';
    const baseUnit = 0.7;
    const houseWidth = baseUnit * 2.5;
    const houseHeight = baseUnit * 1;
    const houseDepth = baseUnit * 1.2;
    const houseGeometry = new THREE.BoxGeometry(houseWidth, houseHeight, houseDepth);
    const houseMesh = createMesh(houseGeometry, COLORS.BEIGE, 'Farmhouse');
    houseMesh.position.y = houseHeight / 2; // Adjusted
    farmGroup.add(houseMesh);
    const roofWidth = houseWidth * 1.05;
    const roofHeight = baseUnit * 0.6; 
    const roofDepth = houseDepth * 1.05;
    const mainRoofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const mainRoofMesh = createMesh(mainRoofGeometry, COLORS.RED_BROWN, 'Roof');
    mainRoofMesh.position.y = houseHeight + roofHeight / 2 - 0.1; // Adjusted
    farmGroup.add(mainRoofMesh);
    const fieldMarkerWidth = baseUnit * 1.5;
    const fieldMarkerHeight = baseUnit * 0.1;
    const fieldMarkerDepth = baseUnit * 3;
    const fieldGeometry = new THREE.BoxGeometry(fieldMarkerWidth, fieldMarkerHeight, fieldMarkerDepth);
    const field1 = createMesh(fieldGeometry, COLORS.YELLOW, 'FieldMarker1'); 
    field1.position.set(houseWidth / 2 + fieldMarkerWidth / 2 + 0.2, fieldMarkerHeight / 2, 0); // Adjusted
    farmGroup.add(field1);
    const field2 = createMesh(fieldGeometry, COLORS.GREEN, 'FieldMarker2'); 
    field2.position.set(-houseWidth / 2 - fieldMarkerWidth / 2 - 0.2, fieldMarkerHeight / 2, 0); // Adjusted
    farmGroup.add(field2);
    return farmGroup;
}

export function createGeologistsHut() {
    const hutGroup = new THREE.Group();
    hutGroup.name = "Geologist's Hut";
    const baseUnit = 0.4; 
    const hutWidth = baseUnit * 1.5;
    const hutHeight = baseUnit * 0.8;
    const hutDepth = baseUnit * 1.5;
    const hutGeometry = new THREE.BoxGeometry(hutWidth, hutHeight, hutDepth);
    const hutMesh = createMesh(hutGeometry, COLORS.DARK_BROWN, 'Hut');
    hutMesh.position.y = hutHeight / 2; // Adjusted
    hutGroup.add(hutMesh);
    const markerRadius = baseUnit * 0.2;
    const markerHeight = baseUnit * 0.5;
    const markerGeometry = new THREE.ConeGeometry(markerRadius, markerHeight, 8);
    const markerMesh = createMesh(markerGeometry, COLORS.YELLOW, 'Marker');
    markerMesh.position.set(hutWidth / 2 + markerRadius + 0.05, markerHeight / 2, 0); // Adjusted
    hutGroup.add(markerMesh);
    return hutGroup;
}

export function createMine(mineType = 'iron') { 
    const mineGroup = new THREE.Group();
    mineGroup.name = `${mineType.charAt(0).toUpperCase() + mineType.slice(1)} Mine`;
    const baseUnit = 0.8;
    const entranceWidth = baseUnit * 2;
    const entranceHeight = baseUnit * 1.5;
    const entranceDepth = baseUnit * 1;
    const entranceGeometry = new THREE.BoxGeometry(entranceWidth, entranceHeight, entranceDepth);
    const entranceMesh = createMesh(entranceGeometry, COLORS.DARK_GREY, 'MineEntrance');
    entranceMesh.position.y = entranceHeight / 2; // Adjusted
    mineGroup.add(entranceMesh);
    const openingWidth = entranceWidth * 0.4;
    const openingHeight = entranceHeight * 0.6;
    const openingDepthVal = 0.1; 
    const openingGeometry = new THREE.BoxGeometry(openingWidth, openingHeight, openingDepthVal);
    const openingMesh = createMesh(openingGeometry, 0x333333, 'MineOpening'); 
    openingMesh.position.set(0, openingHeight / 2 + baseUnit * 0.1, entranceDepth / 2 - openingDepthVal / 2 + 0.01); // Adjusted
    mineGroup.add(openingMesh);
    let indicatorGeometry;
    let indicatorColor;
    let indicatorName = 'OreIndicator';
    const indicatorSize = baseUnit * 0.25;
    switch (mineType.toLowerCase()) {
        case 'iron':
            indicatorGeometry = new THREE.BoxGeometry(indicatorSize, indicatorSize, indicatorSize);
            indicatorColor = COLORS.RED;
            indicatorName = 'IronIndicator';
            break;
        case 'coal':
            indicatorGeometry = new THREE.SphereGeometry(indicatorSize / 2, 8, 8);
            indicatorColor = COLORS.BLACK;
            indicatorName = 'CoalIndicator';
            break;
        case 'gold':
            indicatorGeometry = new THREE.SphereGeometry(indicatorSize / 2, 8, 8);
            indicatorColor = COLORS.YELLOW;
            indicatorName = 'GoldIndicator';
            break;
        case 'stone':
            indicatorGeometry = new THREE.BoxGeometry(indicatorSize, indicatorSize, indicatorSize);
            indicatorColor = COLORS.LIGHT_GREY;
            indicatorName = 'StoneIndicator';
            break;
        default: 
            indicatorGeometry = new THREE.BoxGeometry(indicatorSize, indicatorSize, indicatorSize);
            indicatorColor = COLORS.RED;
    }
    const indicatorMesh = createMesh(indicatorGeometry, indicatorColor, indicatorName);
    indicatorMesh.position.set(entranceWidth / 2 - indicatorSize / 1.5, -entranceHeight / 2 + indicatorSize / 2, entranceDepth / 2 + indicatorSize / 2);
    mineGroup.add(indicatorMesh);
    return mineGroup;
}

export function createSawmill() {
    const sawmillGroup = new THREE.Group();
    sawmillGroup.name = 'Sawmill';
    const baseUnit = 0.7;
    const mainWidth = baseUnit * 2.5;
    const mainHeight = baseUnit * 1.5;
    const mainDepth = baseUnit * 1.8;
    const mainGeometry = new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth);
    const mainMesh = createMesh(mainGeometry, COLORS.BROWN, 'MainBuilding');
    mainMesh.position.y = mainHeight / 2; // Adjusted
    sawmillGroup.add(mainMesh);
    const roofWidth = mainWidth * 1.05;
    const roofHeight = baseUnit * 0.5;
    const roofDepth = mainDepth * 1.05;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth); 
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_BROWN, 'Roof');
    roofMesh.position.y = mainHeight + roofHeight / 2 - 0.05; // Adjusted
    sawmillGroup.add(roofMesh);
    const procWidth = mainWidth * 0.8;
    const procHeight = mainHeight * 0.7;
    const procDepth = mainDepth * 1.5; 
    const procGeometry = new THREE.BoxGeometry(procWidth, procHeight, procDepth);
    const procMesh = createMesh(procGeometry, COLORS.LIGHT_BROWN, 'ProcessingArea');
    procMesh.position.set(mainWidth / 2 + procWidth / 2, procHeight / 2, 0); // Adjusted
    sawmillGroup.add(procMesh);
    const logRadius = baseUnit * 0.1;
    const logLength = mainDepth * 0.4;
    const logGeometry = new THREE.CylinderGeometry(logRadius, logRadius, logLength, 8);
    const inputLog = createMesh(logGeometry, COLORS.DARK_BROWN, 'InputLog');
    inputLog.rotation.x = Math.PI / 2;
    inputLog.position.set(procMesh.position.x, logRadius, -procDepth/2 + logLength / 2 + 0.1); // Adjusted
    sawmillGroup.add(inputLog);
    const plankWidth = baseUnit * 0.15;
    const plankHeight = baseUnit * 0.05;
    const plankLength = mainDepth * 0.3;
    const plankGeometry = new THREE.BoxGeometry(plankWidth, plankHeight, plankLength);
    for (let i = 0; i < 3; i++) {
        const plank = createMesh(plankGeometry, COLORS.LIGHT_BROWN, `Plank_${i}`);
        plank.position.set(
            procMesh.position.x,
            plankHeight / 2 + (i * (plankHeight + 0.02)), // Adjusted
            procDepth/2 - plankLength / 2 - 0.1
        );
        sawmillGroup.add(plank);
    }
    return sawmillGroup;
}

export function createWindmill() {
    const windmillGroup = new THREE.Group();
    windmillGroup.name = 'Windmill';
    const baseUnit = 0.6;
    const baseRadiusTop = baseUnit * 1;
    const baseRadiusBottom = baseUnit * 1.2;
    const baseHeight = baseUnit * 3.5;
    const baseSegments = 8; 
    const baseGeometry = new THREE.CylinderGeometry(baseRadiusTop, baseRadiusBottom, baseHeight, baseSegments);
    const baseMesh = createMesh(baseGeometry, COLORS.BEIGE, 'Base');
    baseMesh.position.y = baseHeight / 2; // Adjusted
    windmillGroup.add(baseMesh);
    const capRadius = baseRadiusTop * 1.1;
    const capHeight = baseUnit * 1;
    const capGeometry = new THREE.ConeGeometry(capRadius, capHeight, baseSegments);
    const capMesh = createMesh(capGeometry, COLORS.RED_BROWN, 'Cap');
    capMesh.position.y = baseHeight + capHeight / 2 - 0.1; // Adjusted
    windmillGroup.add(capMesh);
    const sailLength = baseUnit * 2.8; 
    const sailWidth = baseUnit * 0.3;
    const sailDepth = baseUnit * 0.05;
    const sailGeometry = new THREE.BoxGeometry(sailWidth, sailLength, sailDepth); 
    const sailHubYOffset = baseHeight * 0.30; 
    const axleProtrusion = baseRadiusTop * 0.5; 
    const axleTilt = -Math.PI / 18;      
    const sailPitch = Math.PI / 15;      
    const sailMountRadiusOnHub = baseRadiusTop * 0.1; 
    const axleGroup = new THREE.Group();
    axleGroup.name = "WindmillAxleAssembly";
    axleGroup.position.set(0, sailHubYOffset, baseRadiusTop + axleProtrusion / 2); 
    axleGroup.rotation.x = axleTilt; 
    windmillGroup.add(axleGroup);
    const hubVisualRadius = baseRadiusTop * 0.20;
    const hubVisualLength = axleProtrusion * 0.8; 
    const hubVisualGeometry = new THREE.CylinderGeometry(hubVisualRadius, hubVisualRadius, hubVisualLength, 12);
    const hubVisualMesh = createMesh(hubVisualGeometry, COLORS.DARK_BROWN, 'SailHubVisual');
    hubVisualMesh.rotation.x = Math.PI / 2; 
    axleGroup.add(hubVisualMesh);
    for (let i = 0; i < 4; i++) {
        const sailMesh = createMesh(sailGeometry, COLORS.WHITE, `Sail_${i}`);
        sailMesh.position.y = sailLength / 2; 
        sailMesh.rotation.x = sailPitch;
        const sailArm = new THREE.Group();
        sailArm.add(sailMesh);
        const angle = (i * Math.PI) / 2; 
        sailArm.position.set(
            Math.cos(angle) * sailMountRadiusOnHub,  
            Math.sin(angle) * sailMountRadiusOnHub,  
            hubVisualLength / 2 + sailDepth / 2      
        );
        sailArm.rotation.z = angle;
        axleGroup.add(sailArm);
    }
    return windmillGroup;
}

export function createBakery() {
    const bakeryGroup = new THREE.Group();
    bakeryGroup.name = 'Bakery';
    const baseUnit = 0.65;
    const mainWidth = baseUnit * 2.2;
    const mainHeight = baseUnit * 1.3;
    const mainDepth = baseUnit * 1.7;
    const mainGeometry = new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth);
    const mainMesh = createMesh(mainGeometry, COLORS.TERRACOTTA, 'MainBuilding'); 
    mainMesh.position.y = mainHeight / 2; // Adjusted
    bakeryGroup.add(mainMesh);
    const roofWidth = mainWidth * 1.05;
    const roofHeight = baseUnit * 0.5;
    const roofDepth = mainDepth * 1.05;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_BROWN, 'Roof');
    roofMesh.position.y = mainHeight + roofHeight / 2 - 0.05; // Adjusted
    bakeryGroup.add(roofMesh);
    const chimneyWidth = baseUnit * 0.3;
    const chimneyHeight = baseUnit * 1;
    const chimneyDepth = baseUnit * 0.3;
    const chimneyGeometry = new THREE.BoxGeometry(chimneyWidth, chimneyHeight, chimneyDepth);
    const chimneyMesh = createMesh(chimneyGeometry, COLORS.DARK_GREY, 'Chimney');
    chimneyMesh.position.set(-mainWidth / 2 + chimneyWidth / 2, mainHeight + chimneyHeight / 2 - roofHeight * 0.2, -mainDepth / 2 + chimneyDepth / 2); // Adjusted
    bakeryGroup.add(chimneyMesh);
    const emberSize = chimneyWidth * 0.3;
    const emberGeometry = new THREE.BoxGeometry(emberSize, emberSize, emberSize);
    const emberMesh = createMesh(emberGeometry, COLORS.RED, 'Embers');
    emberMesh.position.y = chimneyHeight / 2 + emberSize / 2;
    chimneyMesh.add(emberMesh); 
    return bakeryGroup;
}

export function createPigFarm() {
    const farmGroup = new THREE.Group();
    farmGroup.name = 'Pig Farm';
    const baseUnit = 0.7;
    const styWidth = baseUnit * 3;
    const styHeight = baseUnit * 0.8;
    const styDepth = baseUnit * 1.2;
    const styGeometry = new THREE.BoxGeometry(styWidth, styHeight, styDepth);
    const styMesh = createMesh(styGeometry, COLORS.LIGHT_BROWN, 'Sty');
    styMesh.position.y = styHeight / 2; // Adjusted
    farmGroup.add(styMesh);
    const penWidth = styWidth * 0.9;
    const penDepth = styDepth * 2;
    const fenceHeight = baseUnit * 0.5;
    const postSize = baseUnit * 0.05;
    const penGroup = new THREE.Group();
    penGroup.name = 'Pen';
    penGroup.position.set(0, fenceHeight / 2, styDepth / 2 + penDepth / 2); // Adjusted
    const numPostsZ = 5; 
    const numPostsX = 3; 
    for (let i = 0; i <= numPostsZ; i++) { 
        const z = -penDepth / 2 + i * (penDepth / numPostsZ);
        [-penWidth / 2, penWidth / 2].forEach(x => {
            const postGeo = new THREE.BoxGeometry(postSize, fenceHeight, postSize);
            const post = createMesh(postGeo, COLORS.DARK_BROWN, `Post_Z_${x}_${i}`);
            post.position.set(x, 0, z);
            penGroup.add(post);
        });
    }
    for (let i = 1; i < numPostsX; i++) { 
         const x = -penWidth / 2 + i * (penWidth / numPostsX);
        [-penDepth / 2, penDepth / 2].forEach(z => {
            const postGeo = new THREE.BoxGeometry(postSize, fenceHeight, postSize);
            const post = createMesh(postGeo, COLORS.DARK_BROWN, `Post_X_${z}_${i}`);
            post.position.set(x, 0, z);
            penGroup.add(post);
        });
    }
    const railGeoH = new THREE.BoxGeometry(penWidth, postSize, postSize);
    const railFront = createMesh(railGeoH, COLORS.DARK_BROWN, 'RailFront');
    railFront.position.set(0, fenceHeight/2 - postSize/2, -penDepth/2);
    penGroup.add(railFront);
    const railBack = createMesh(railGeoH, COLORS.DARK_BROWN, 'RailBack');
    railBack.position.set(0, fenceHeight/2 - postSize/2, penDepth/2);
    penGroup.add(railBack);
    const railGeoV = new THREE.BoxGeometry(postSize, postSize, penDepth);
    const railLeft = createMesh(railGeoV, COLORS.DARK_BROWN, 'RailLeft');
    railLeft.position.set(-penWidth/2, fenceHeight/2 - postSize/2, 0);
    penGroup.add(railLeft);
    const railRight = createMesh(railGeoV, COLORS.DARK_BROWN, 'RailRight');
    railRight.position.set(penWidth/2, fenceHeight/2 - postSize/2, 0);
    penGroup.add(railRight);
    farmGroup.add(penGroup);
    const pigSize = baseUnit * 0.2;
    const pigGeometry = new THREE.SphereGeometry(pigSize, 8, 6);
    const pig1 = createMesh(pigGeometry, COLORS.PINK, 'Pig1');
    pig1.position.set(penWidth * 0.1, pigSize, styDepth / 2 + penDepth * 0.25); // Adjusted
    farmGroup.add(pig1);
    const pig2 = createMesh(pigGeometry, COLORS.PINK, 'Pig2');
    pig2.position.set(-penWidth * 0.25, pigSize, styDepth / 2 + penDepth * 0.6); // Adjusted
    farmGroup.add(pig2);
    return farmGroup;
}

export function createSlaughterhouse() {
    const houseGroup = new THREE.Group();
    houseGroup.name = 'Slaughterhouse';
    const baseUnit = 0.6;
    const bWidth = baseUnit * 2;
    const bHeight = baseUnit * 1.4;
    const bDepth = baseUnit * 1.6;
    const bGeometry = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
    const bMesh = createMesh(bGeometry, COLORS.MAROON, 'Building'); 
    bMesh.position.y = bHeight / 2; // Adjusted
    houseGroup.add(bMesh);
    const roofWidth = bWidth * 1.05;
    const roofHeight = baseUnit * 0.4;
    const roofDepth = bDepth * 1.05;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_BROWN, 'Roof');
    roofMesh.position.y = bHeight + roofHeight / 2 - 0.05; // Adjusted
    houseGroup.add(roofMesh);
    const blockWidth = baseUnit * 0.3;
    const blockHeight = baseUnit * 0.4;
    const blockDepth = baseUnit * 0.3;
    const blockGeometry = new THREE.CylinderGeometry(blockWidth / 2, blockWidth / 2, blockHeight, 8); 
    const blockMesh = createMesh(blockGeometry, COLORS.STONE_GREY, 'ChoppingBlock'); 
    blockMesh.position.set(bWidth / 2 + blockWidth / 2 + 0.1, blockHeight / 2, 0); // Adjusted
    houseGroup.add(blockMesh);
    return houseGroup;
}

export function createIronSmelter() {
    const group = new THREE.Group();
    group.name = 'Iron Smelter';
    const baseUnit = 0.7;

    // Base
    const baseWidth = baseUnit * 1.8;
    const baseHeight = baseUnit * 1.2;
    const baseDepth = baseUnit * 1.8;
    const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
    const baseMesh = createMesh(baseGeometry, COLORS.DARK_GREY, 'SmelterBase');
    baseMesh.position.y = baseHeight / 2; // Adjusted
    group.add(baseMesh);

    // Furnace/Chimney (taller, slightly tapering square or cylindrical cuboid)
    const chimneyWidth = baseUnit * 0.8;
    const chimneyHeight = baseUnit * 2.5;
    const chimneyDepth = baseUnit * 0.8;
    // Approximating taper by making top slightly smaller if using Cylinder, or just use Box for simplicity
    const chimneyGeometry = new THREE.BoxGeometry(chimneyWidth, chimneyHeight, chimneyDepth);
    const chimneyMesh = createMesh(chimneyGeometry, COLORS.BLACK, 'FurnaceChimney');
    // Position it on top and slightly to one side/rear of the base
    chimneyMesh.position.set(0, baseHeight + chimneyHeight / 2 - 0.1, -baseDepth / 4); // Adjusted
    group.add(chimneyMesh);

    // Glow (small bright orange or red cube at the base of the furnace/chimney)
    const glowSize = baseUnit * 0.3;
    const glowGeometry = new THREE.BoxGeometry(glowSize, glowSize, glowSize);
    const glowMesh = createMesh(glowGeometry, COLORS.ORANGE, 'FurnaceGlow');
    // Position at the front-bottom of the chimney
    glowMesh.position.set(chimneyMesh.position.x, glowSize / 2, chimneyMesh.position.z + chimneyDepth / 2); // Adjusted
    group.add(glowMesh);

    return group;
}

export function createToolmakersWorkshop() {
    const group = new THREE.Group();
    group.name = "Toolmaker's Workshop";
    const baseUnit = 0.6;

    // Building
    const buildingWidth = baseUnit * 2.0;
    const buildingHeight = baseUnit * 1.3;
    const buildingDepth = baseUnit * 1.6;
    const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
    const buildingMesh = createMesh(buildingGeometry, COLORS.BROWN, 'WorkshopBuilding');
    buildingMesh.position.y = buildingHeight / 2; // Adjusted
    group.add(buildingMesh);

    // Roof
    const roofWidth = buildingWidth * 1.1;
    const roofHeight = baseUnit * 0.5;
    const roofDepth = buildingDepth * 1.1;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth); // Sloped cuboid roof
    const roofMesh = createMesh(roofGeometry, COLORS.STONE_GREY, 'WorkshopRoof'); // Changed to STONE_GREY from Grey
    roofMesh.position.y = buildingHeight + roofHeight / 2 - 0.05; // Adjusted
    group.add(roofMesh);

    // Anvil (Optional: T-shaped structure of two grey cuboids)
    const anvilBaseHeight = baseUnit * 0.3;
    const anvilBaseSize = baseUnit * 0.2;
    const anvilTopHeight = baseUnit * 0.15;
    const anvilTopWidth = baseUnit * 0.4;
    const anvilTopDepth = baseUnit * 0.2;

    const anvilBaseGeom = new THREE.BoxGeometry(anvilBaseSize, anvilBaseHeight, anvilBaseSize);
    const anvilBaseMesh = createMesh(anvilBaseGeom, COLORS.DARK_GREY, 'AnvilBase');
    anvilBaseMesh.position.set(buildingWidth / 2 + anvilTopWidth / 2, anvilBaseHeight / 2, 0); // Adjusted
    group.add(anvilBaseMesh);

    const anvilTopGeom = new THREE.BoxGeometry(anvilTopWidth, anvilTopHeight, anvilTopDepth);
    const anvilTopMesh = createMesh(anvilTopGeom, COLORS.DARK_GREY, 'AnvilTop');
    anvilTopMesh.position.set(0, anvilBaseHeight / 2 + anvilTopHeight / 2, 0);
    anvilBaseMesh.add(anvilTopMesh);

    return group;
}

export function createGoldsmithsMint() {
    const group = new THREE.Group();
    group.name = "Goldsmith / Mint"; // Adjusted name to match markdown
    const baseUnit = 0.65;

    // Building (sturdy, medium-sized cuboid)
    const buildingWidth = baseUnit * 2.0;
    const buildingHeight = baseUnit * 1.4;
    const buildingDepth = baseUnit * 1.6;
    const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
    const buildingMesh = createMesh(buildingGeometry, COLORS.BEIGE, 'MintBuilding'); // Light Grey or Beige
    buildingMesh.position.y = buildingHeight / 2; // Adjusted
    group.add(buildingMesh);

    // Roof (flat or slightly sloped cuboid)
    const roofWidth = buildingWidth * 1.05;
    const roofHeight = baseUnit * 0.3; // Flat or slightly sloped
    const roofDepth = buildingDepth * 1.05;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_GREY, 'MintRoof');
    roofMesh.position.y = buildingHeight + roofHeight / 2 - 0.02; // Adjusted for slight slope if needed
    group.add(roofMesh);

    // Accent (prominent bright yellow cube or small pyramid on roof or above entrance)
    const accentSize = baseUnit * 0.3;
    // Using a cube for simplicity as per description "yellow cube or small pyramid"
    const accentGeometry = new THREE.BoxGeometry(accentSize, accentSize, accentSize);
    const accentMesh = createMesh(accentGeometry, COLORS.YELLOW, 'MintAccent');
    // Position on the center of the roof
    accentMesh.position.y = roofHeight / 2 + accentSize / 2; 
    roofMesh.add(accentMesh); // Add to roof so it moves with it

    return group;
}

export function createBlacksmithArmory() {
    const group = new THREE.Group();
    group.name = 'Blacksmith / Armory';
    const baseUnit = 0.7;

    // Building (dark grey or black cuboid)
    const buildingWidth = baseUnit * 2.5;
    const buildingHeight = baseUnit * 1.5;
    const buildingDepth = baseUnit * 2.0;
    const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
    const buildingMesh = createMesh(buildingGeometry, COLORS.DARK_GREY, 'ArmoryBuilding');
    buildingMesh.position.y = buildingHeight / 2; // Adjusted
    group.add(buildingMesh);

    // Forge Glow (orange or red glow represented by a colored cube visible from an opening)
    // Create an opening first (indentation)
    const openingWidth = buildingWidth * 0.4;
    const openingHeight = buildingHeight * 0.5;
    const openingDepth = baseUnit * 0.2; // Depth of the opening itself
    const openingGeometry = new THREE.BoxGeometry(openingWidth, openingHeight, openingDepth);
    const openingMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 }); // Darker interior for opening
    const openingMesh = new THREE.Mesh(openingGeometry, openingMaterial);
    openingMesh.name = 'ArmoryOpening';
    // Position opening on the front face, slightly recessed
    openingMesh.position.set(0, -buildingHeight / 2 + openingHeight / 2, buildingDepth / 2 - openingDepth / 2 + 0.01);
    group.add(openingMesh);

    const glowSize = openingWidth * 0.3;
    const glowGeometry = new THREE.BoxGeometry(glowSize, glowSize, glowSize);
    const glowMesh = createMesh(glowGeometry, COLORS.ORANGE, 'ForgeGlow');
    // Position glow inside the opening
    glowMesh.position.set(0, 0, -openingDepth / 2 + glowSize / 2 + 0.05); // Slightly forward within opening
    openingMesh.add(glowMesh);

    // Chimney (short, wide, black cuboid chimney)
    const chimneyWidth = baseUnit * 0.6;
    const chimneyHeight = baseUnit * 0.8;
    const chimneyDepth = baseUnit * 0.6;
    const chimneyGeometry = new THREE.BoxGeometry(chimneyWidth, chimneyHeight, chimneyDepth);
    const chimneyMesh = createMesh(chimneyGeometry, COLORS.BLACK, 'ArmoryChimney');
    // Position chimney on the roof, towards the back
    chimneyMesh.position.set(0, buildingHeight + chimneyHeight / 2, -buildingDepth / 4); // Adjusted
    group.add(chimneyMesh);

    return group;
}

export function createGuardHut() {
    const group = new THREE.Group();
    group.name = 'Guard Hut';
    const baseUnit = 0.5;

    // Structure (small, robust-looking square cuboid)
    const structureWidth = baseUnit * 1.8; // Square base
    const structureHeight = baseUnit * 1.5;
    const structureDepth = baseUnit * 1.8;
    const structureGeometry = new THREE.BoxGeometry(structureWidth, structureHeight, structureDepth);
    const structureMesh = createMesh(structureGeometry, COLORS.DARK_GREY, 'GuardHutStructure');
    structureMesh.position.y = structureHeight / 2; // Adjusted
    group.add(structureMesh);

    // Roof/Banner (slightly smaller, flat red cuboid or a small red pyramid on top)
    // Using a flat red cuboid as a simpler banner/roof accent
    const bannerWidth = structureWidth * 0.8;
    const bannerHeight = baseUnit * 0.25;
    const bannerDepth = structureDepth * 0.8;
    const bannerGeometry = new THREE.BoxGeometry(bannerWidth, bannerHeight, bannerDepth);
    const bannerMesh = createMesh(bannerGeometry, COLORS.RED, 'GuardHutBanner');
    bannerMesh.position.y = structureHeight + bannerHeight / 2; // Adjusted
    group.add(bannerMesh);

    return group;
}

export function createWatchtower() {
    const group = new THREE.Group();
    group.name = 'Watchtower';
    const baseUnit = 0.4; // As per markdown

    // Tower (tall, relatively thin cylinder or square prism)
    const towerRadius = baseUnit * 1.2;
    const towerHeight = baseUnit * 7; // Adjusted for "very tall" perception, was 5
    const towerSegments = 8; // For cylinder or square prism approximation
    const towerGeometry = new THREE.CylinderGeometry(towerRadius * 0.9, towerRadius, towerHeight, towerSegments); // Slightly tapered
    const towerMesh = createMesh(towerGeometry, COLORS.STONE_GREY, 'WatchtowerTower');
    towerMesh.position.y = towerHeight / 2; // Adjusted
    group.add(towerMesh);

    // Top (slightly wider cylinder or square prism on top)
    const topPlatformRadius = towerRadius * 1.3;
    const topPlatformHeight = baseUnit * 1.0;
    const topPlatformGeometry = new THREE.CylinderGeometry(topPlatformRadius, topPlatformRadius, topPlatformHeight, towerSegments);
    const topPlatformMesh = createMesh(topPlatformGeometry, COLORS.STONE_GREY, 'WatchtowerTopPlatform');
    topPlatformMesh.position.y = towerHeight + topPlatformHeight / 2 - 0.05; // Adjusted
    group.add(topPlatformMesh);

    // Crenellations (small cubes around its upper edge)
    const crenellationSize = baseUnit * 0.4;
    const numCrenellations = towerSegments; // Match tower segments for a consistent look
    for (let i = 0; i < numCrenellations; i++) {
        const angle = (i / numCrenellations) * Math.PI * 2;
        // Make crenellations cuboid as per "small cubes"
        const crenGeo = new THREE.BoxGeometry(crenellationSize, crenellationSize * 1.2, crenellationSize * 0.8);
        const cren = createMesh(crenGeo, COLORS.STONE_GREY, `Crenellation_${i}`);
        cren.position.set(
            Math.cos(angle) * (topPlatformRadius - crenellationSize / 3), 
            topPlatformHeight / 2 + (crenellationSize * 1.2) / 2 - 0.05, 
            Math.sin(angle) * (topPlatformRadius - crenellationSize / 3)
        );
        // Orient crenellations to face outwards, aligning with the circular platform edge
        cren.lookAt(new THREE.Vector3(0, cren.position.y, 0)); // Simple lookAt center
        cren.rotation.y += Math.PI; // Correct orientation after lookAt if needed
        topPlatformMesh.add(cren);
    }

    // Flag (small red pyramid on the very top)
    const flagBaseRadius = baseUnit * 0.15;
    const flagHeight = baseUnit * 0.6;
    const flagGeometry = new THREE.ConeGeometry(flagBaseRadius, flagHeight, 4); // Pyramid shape
    const flagMesh = createMesh(flagGeometry, COLORS.RED, 'WatchtowerFlag');
    flagMesh.position.y = topPlatformHeight / 2 + flagHeight / 2; // On top of the platform
    flagMesh.rotation.y = Math.PI / 4; // Align one face of pyramid
    topPlatformMesh.add(flagMesh); // Add to top platform

    return group;
}

export function createBarracksFortress() {
    const fortressGroup = new THREE.Group();
    fortressGroup.name = 'Barracks / Fortress';
    const baseUnit = 0.9; // As per markdown: Large footprint

    // Main Structure (large, wide, medium-height cuboid)
    const mainWidth = baseUnit * 4.5; // "wide"
    const mainHeight = baseUnit * 2.2; // "medium-height"
    const mainDepth = baseUnit * 3.5; // "wide"
    const mainGeometry = new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth);
    const mainMesh = createMesh(mainGeometry, COLORS.DARK_GREY, 'MainStructure'); // Dark Grey or Black
    mainMesh.position.y = mainHeight / 2; // Adjusted
    fortressGroup.add(mainMesh);

    // Towers (Optional: Smaller square cuboids at the corners, slightly taller)
    const numTowers = 4; // Standard four corner towers
    const towerWidth = baseUnit * 1.0; // "Smaller square cuboids"
    const towerHeight = mainHeight * 1.2; // "slightly taller than the main structure"
    const towerDepth = baseUnit * 1.0;
    const towerGeometry = new THREE.BoxGeometry(towerWidth, towerHeight, towerDepth);

    const towerPositions = [
        { x: mainWidth / 2 - towerWidth / 2, z: mainDepth / 2 - towerDepth / 2 },
        { x: -mainWidth / 2 + towerWidth / 2, z: mainDepth / 2 - towerDepth / 2 },
        { x: mainWidth / 2 - towerWidth / 2, z: -mainDepth / 2 + towerDepth / 2 },
        { x: -mainWidth / 2 + towerWidth / 2, z: -mainDepth / 2 + towerDepth / 2 },
    ];

    towerPositions.forEach((pos, index) => {
        const tower = createMesh(towerGeometry, COLORS.DARK_GREY, `FortressTower_${index}`);
        // Towers should be grounded relative to the main structure's base, then rise up.
        // The main structure's center is at y=0 for the group before final y adjustment.
        // So, tower base should align with main structure base (-mainHeight/2)
        // And its center will be at -mainHeight/2 + towerHeight/2.
        tower.position.set(pos.x, -mainHeight / 2 + towerHeight / 2, pos.z);
        fortressGroup.add(tower);

        // Accents: Red pyramidal flags on any towers
        const flagRadius = towerWidth * 0.15;
        const flagHeight = towerWidth * 0.4;
        const flagGeo = new THREE.ConeGeometry(flagRadius, flagHeight, 4); // Pyramid
        const flag = createMesh(flagGeo, COLORS.RED, `TowerFlag_${index}`);
        flag.position.y = towerHeight / 2 + flagHeight / 2; // Position flag on top of the tower
        flag.rotation.y = Math.PI / 4; // Align pyramid face
        tower.add(flag); // Add flag to the tower
    });
    
    // Central Flag (Optional, but good for "prominent points")
    const centralFlagRadius = baseUnit * 0.2;
    const centralFlagHeight = baseUnit * 0.6;
    const centralFlagGeo = new THREE.ConeGeometry(centralFlagRadius, centralFlagHeight, 4);
    const centralFlag = createMesh(centralFlagGeo, COLORS.RED, 'CentralFlag');
    // Position on top of the main structure's roof
    centralFlag.position.y = mainHeight / 2 + centralFlagHeight / 2;
    centralFlag.rotation.y = Math.PI / 4;
    mainMesh.add(centralFlag); // Add to mainMesh so it's centered on the roof

    return fortressGroup;
}

export function createWarehouseStorehouse() {
    const warehouseGroup = new THREE.Group();
    warehouseGroup.name = 'Warehouse / Storehouse';
    const baseUnit = 0.8; // "Large footprint"

    // Building (long, wide, plain cuboid)
    const bWidth = baseUnit * 5; // "long, wide"
    const bHeight = baseUnit * 1.8; // "medium height"
    const bDepth = baseUnit * 2.5; // "long, wide"
    const bGeometry = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
    const bMesh = createMesh(bGeometry, COLORS.BEIGE, 'Building'); // Light Brown or Beige
    bMesh.position.y = bHeight / 2; // Adjusted
    warehouseGroup.add(bMesh);

    // Roof (simple, large, slightly sloped cuboid)
    const roofWidth = bWidth * 1.02; // Slightly overhang
    const roofHeight = baseUnit * 0.4; // "slightly sloped" - represented by flat cuboid for simplicity
    const roofDepth = bDepth * 1.02; // Slightly overhang
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_BROWN, 'Roof'); // Darker Brown or Grey
    roofMesh.position.y = bHeight + roofHeight / 2 - 0.05; // Sit on top, slight sink to ensure no gap
    warehouseGroup.add(roofMesh);

    // Doors (several wide, darker rectangular indentations)
    const doorWidth = baseUnit * 0.8; // "wide"
    const doorHeight = bHeight * 0.6; // Proportionate height
    const doorDepthVal = 0.05; // Indentation depth

    // Define positions for doors along the longer sides (width)
    const numDoorsPerSide = 2; // "several"
    const doorSpacingX = bWidth / (numDoorsPerSide + 1);

    for (let i = 0; i < numDoorsPerSide; i++) {
        const xPos = -bWidth / 2 + doorSpacingX * (i + 1);

        // Front doors
        const doorFrontGeo = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepthVal);
        // Darker material for indentation
        const doorMaterial = new THREE.MeshStandardMaterial({ color: COLORS.DARK_GREY }); 
        const doorFrontMesh = new THREE.Mesh(doorFrontGeo, doorMaterial);
        doorFrontMesh.name = `WarehouseDoor_Front_${i}`;
        // Position on the front face (positive Z), slightly indented
        doorFrontMesh.position.set(xPos, doorHeight / 2, bDepth / 2 - doorDepthVal / 2 + 0.01);
        warehouseGroup.add(doorFrontMesh);

        // Back doors (optional, but good for symmetry)
        const doorBackMesh = new THREE.Mesh(doorFrontGeo, doorMaterial); // Reuse geometry and material
        doorBackMesh.name = `WarehouseDoor_Back_${i}`;
        // Position on the back face (negative Z), slightly indented
        doorBackMesh.position.set(xPos, doorHeight / 2, -bDepth / 2 + doorDepthVal / 2 - 0.01);
        warehouseGroup.add(doorBackMesh);
    }
    
    return warehouseGroup;
}

export function createBuildersHut() {
    const hutGroup = new THREE.Group();
    hutGroup.name = "Builder's Hut";
    const baseUnit = 0.4; 
    const hutWidth = baseUnit * 1.5;
    const hutHeight = baseUnit * 1;
    const hutDepth = baseUnit * 1.2;
    const hutGeometry = new THREE.BoxGeometry(hutWidth, hutHeight, hutDepth);
    const hutMesh = createMesh(hutGeometry, COLORS.BROWN, 'Hut');
    hutMesh.position.y = hutHeight / 2; // Adjusted
    hutGroup.add(hutMesh);
    const plankWidth = baseUnit * 0.8;
    const plankHeight = baseUnit * 0.1;
    const plankDepth = baseUnit * 0.4;
    const plankGeometry = new THREE.BoxGeometry(plankWidth, plankHeight, plankDepth);
    for (let i = 0; i < 3; i++) {
        const plank = createMesh(plankGeometry, COLORS.LIGHT_BROWN, `Plank_${i}`);
        plank.position.set(
            hutWidth / 2 + plankWidth / 2 + 0.1,
            plankHeight / 2 + i * (plankHeight + 0.01), // Adjusted
            0
        );
        hutGroup.add(plank);
    }
    const stoneSize = baseUnit * 0.25;
    const stoneGeometry = new THREE.BoxGeometry(stoneSize, stoneSize, stoneSize);
    const stone1 = createMesh(stoneGeometry, COLORS.STONE_GREY, 'Stone1'); 
    stone1.position.set(
        hutWidth / 2 + stoneSize / 2 + 0.1,
        (plankHeight * 3 + 0.02) + stoneSize / 2 + 0.05, // Adjusted
        plankDepth / 2 - stoneSize /2
    );
    hutGroup.add(stone1);
    const stone2 = createMesh(stoneGeometry, COLORS.STONE_GREY, 'Stone2'); 
    stone2.position.set(
        hutWidth / 2 + stoneSize / 2 + 0.1 + stoneSize * 0.5,
        (plankHeight * 3 + 0.02) + stoneSize / 2 + 0.05, // Adjusted
        plankDepth / 2 - stoneSize * 1.5
    );
    stone2.rotation.y = Math.PI / 7;
    hutGroup.add(stone2);
    return hutGroup;
}

export function createTransportersHut() {
    const hutGroup = new THREE.Group();
    hutGroup.name = "Transporter's Hut";
    const baseUnit = 0.8; 
    const hutWidth = baseUnit * 1.5;
    const hutHeight = baseUnit * 1;
    const hutDepth = baseUnit * 1.2;
    const hutGeometry = new THREE.BoxGeometry(hutWidth, hutHeight, hutDepth);
    const hutMesh = createMesh(hutGeometry, COLORS.BEIGE, 'Hut');
    hutMesh.position.y = hutHeight / 2; // Adjusted
    hutGroup.add(hutMesh);

    // Add a wooden cabin roof
    const roofWidth = hutWidth * 1.2; // Slight overhang
    const roofDepth = hutDepth * 1.2; // Slight overhang
    const roofBlockHeight = baseUnit * 0.5; // Height of the roof block
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofBlockHeight, roofDepth);
    const roofMesh = createMesh(roofGeometry, COLORS.BROWN, 'Roof'); // Assuming COLORS.BROWN is available
    roofMesh.position.y = hutHeight + roofBlockHeight / 2; // Position on top of the hut
    hutGroup.add(roofMesh);

    const plankWidth = baseUnit * 0.8;
    const plankHeight = baseUnit * 0.1;
    const plankDepth = baseUnit * 0.4;
    const plankGeometry = new THREE.BoxGeometry(plankWidth, plankHeight, plankDepth);
    for (let i = 0; i < 3; i++) {
        const plank = createMesh(plankGeometry, COLORS.LIGHT_BROWN, `Plank_${i}`);
        plank.position.set(
            hutWidth / 2 + plankWidth / 2 + 0.1,
            plankHeight / 2 + i * (plankHeight + 0.01), // Adjusted
            0
        );
        hutGroup.add(plank);
    }
    const stoneSize = baseUnit * 0.25;
    const stoneGeometry = new THREE.BoxGeometry(stoneSize, stoneSize, stoneSize);
    const stone1 = createMesh(stoneGeometry, COLORS.STONE_GREY, 'Stone1'); 
    stone1.position.set(
        hutWidth / 2 + stoneSize / 2 + 0.1,
        (plankHeight * 3 + 0.02) + stoneSize / 2 + 0.05, // Adjusted
        plankDepth / 2 - stoneSize /2
    );
    hutGroup.add(stone1);
    const stone2 = createMesh(stoneGeometry, COLORS.STONE_GREY, 'Stone2'); 
    stone2.position.set(
        hutWidth / 2 + stoneSize / 2 + 0.1 + stoneSize * 0.5,
        (plankHeight * 3 + 0.02) + stoneSize / 2 + 0.05, // Adjusted
        plankDepth / 2 - stoneSize * 1.5
    );
    stone2.rotation.y = Math.PI / 7;
    hutGroup.add(stone2);
    return hutGroup;
}

export function createHarbor() {
    const harborGroup = new THREE.Group();
    harborGroup.name = 'Harbor';
    const baseUnit = 0.7;
    const pierWidth = baseUnit * 1.5;
    const pierHeight = baseUnit * 0.2;
    const pierLength = baseUnit * 5; 
    const pierGeometry = new THREE.BoxGeometry(pierWidth, pierHeight, pierLength);
    const pierMesh = createMesh(pierGeometry, COLORS.DARK_BROWN, 'Pier');
    pierMesh.position.z = pierLength / 2;
    pierMesh.position.y = pierHeight / 2; // Adjusted
    harborGroup.add(pierMesh);
    const dockWidth = baseUnit * 1.8;
    const dockHeight = baseUnit * 1.2;
    const dockDepth = baseUnit * 1.2;
    const dockGeometry = new THREE.BoxGeometry(dockWidth, dockHeight, dockDepth);
    const dockMesh = createMesh(dockGeometry, COLORS.LIGHT_BROWN, 'DockBuilding');
    dockMesh.position.set(0, pierHeight + dockHeight / 2, 0); // Adjusted
    harborGroup.add(dockMesh);
    const boatWidth = baseUnit * 0.6;
    const boatHeight = baseUnit * 0.4;
    const boatLength = baseUnit * 1.8;
    const boatGeometry = new THREE.BoxGeometry(boatWidth, boatHeight, boatLength);
    const boat1 = createMesh(boatGeometry, COLORS.LIGHT_BLUE, 'Boat1');
    boat1.position.set(pierWidth / 2 + boatWidth / 2 + 0.1, pierHeight / 2 - boatHeight/2 + 0.05, pierLength * 0.3); // Adjusted
    harborGroup.add(boat1);
    const boat2 = createMesh(boatGeometry, COLORS.LIGHT_BLUE, 'Boat2');
    boat2.position.set(-pierWidth / 2 - boatWidth / 2 - 0.1, pierHeight / 2 - boatHeight/2 + 0.05, pierLength * 0.6); // Adjusted
    boat2.rotation.y = -Math.PI / 20; 
    harborGroup.add(boat2);
    return harborGroup;
}

// Building Information (costs, production, etc.)
export const BUILDING_INFO = {
    CASTLE: { name: "Castle", key: 'CASTLE', cost: {}, gridSize: { width: 4, height: 4 }, color: COLORS.MEDIUM_GREY }, // No cost for initial castle
    WOODCUTTERS_HUT: { 
        name: "Woodcutter's Hut", 
        key: 'WOODCUTTERS_HUT', 
        cost: { WOOD: 10 }, 
        jobSlots: 1, 
        jobProfession: 'WOODCUTTER',
        produces: [{ resource: RESOURCE_TYPES.WOOD, quantity: 1, interval: 10000 }], // 1 wood every 10s
        requiredTool: RESOURCE_TYPES.TOOLS_AXE,
        gridSize: { width: 2, height: 2 }, 
        color: COLORS.BROWN 
    },
    FORESTERS_HUT: { 
        name: "Forester's Hut", 
        key: 'FORESTERS_HUT', 
        cost: { WOOD: 15 }, 
        jobSlots: 1,
        jobProfession: 'FORESTER',
        // Foresters don't "produce" a resource from nothing, they plant trees (map change)
        // This might be handled differently, e.g., a task completion rather than resource production.
        // For now, let's say they slowly "produce" saplings if needed, or this is handled by their task logic.
        // Foresters plant trees; their "production" is a map change, not direct resource generation.
        // This will be handled by their specific task logic in SerfManager.
        gridSize: { width: 2, height: 1 },
        color: COLORS.DARK_GREEN
    },
    QUARRY: {
        name: "Quarry",
        key: 'QUARRY',
        cost: { WOOD: 25 }, 
        jobSlots: 2, 
        jobProfession: 'STONEMASON', 
        produces: [{ resource: RESOURCE_TYPES.STONE, quantity: 1, interval: 12000 }],
        requiredTool: RESOURCE_TYPES.TOOLS_PICKAXE, 
        gridSize: { width: 2, height: 2 },
        color: 0xAAAAAA, 
    },
    FISHERMANS_HUT: {
        name: "Fisherman's Hut",
        key: 'FISHERMANS_HUT',
        cost: { WOOD: 15 },
        jobSlots: 1,
        jobProfession: 'FISHERMAN',
        produces: [{ resource: RESOURCE_TYPES.FISH, quantity: 1, interval: 18000 }],
        requiredTool: RESOURCE_TYPES.TOOLS_FISHING_ROD,
        gridSize: { width: 1, height: 3 }, // Thin and long for pier
        color: COLORS.LIGHT_BLUE,
    },
    FARM: {
        name: "Farm",
        key: 'FARM',
        cost: { WOOD: 30, STONE: 10 },
        jobSlots: 2,
        jobProfession: 'FARMER',
        produces: [{ resource: RESOURCE_TYPES.GRAIN, quantity: 2, interval: 25000 }], // More quantity, longer interval
        requiredTool: RESOURCE_TYPES.TOOLS_SCYTHE,
        gridSize: { width: 3, height: 3 }, // Represents farmhouse + some field space
        color: COLORS.YELLOW,
    },
    GEOLOGISTS_HUT: {
        name: "Geologist's Hut",
        key: 'GEOLOGISTS_HUT',
        cost: { WOOD: 20, STONE: 5 },
        jobSlots: 1,
        jobProfession: 'GEOLOGIST',
        // Geologists find new resource spots, don't produce directly
        gridSize: { width: 1, height: 1 },
        color: COLORS.DARK_BROWN,
    },
    IRON_MINE: {
        name: "Iron Mine",
        key: 'IRON_MINE',
        cost: { WOOD: 40, STONE: 20 },
        jobSlots: 3,
        jobProfession: 'MINER',
        produces: [{ resource: RESOURCE_TYPES.IRON_ORE, quantity: 1, interval: 20000 }],
        requiredTool: RESOURCE_TYPES.TOOLS_PICKAXE,
        gridSize: { width: 2, height: 1 }, // Entrance against mountain
        color: COLORS.DARK_GREY,
        mineType: 'iron'
    },
    COAL_MINE: {
        name: "Coal Mine",
        key: 'COAL_MINE',
        cost: { WOOD: 35, STONE: 15 },
        jobSlots: 3,
        jobProfession: 'MINER',
        produces: [{ resource: RESOURCE_TYPES.COAL_ORE, quantity: 1, interval: 18000 }],
        requiredTool: RESOURCE_TYPES.TOOLS_PICKAXE,
        gridSize: { width: 2, height: 1 },
        color: COLORS.BLACK,
        mineType: 'coal' // Added to match iron_mine structure
    },
    GOLD_MINE: { // Assuming Gold Mine would be next, based on pattern
        name: "Gold Mine",
        key: 'GOLD_MINE',
        cost: { WOOD: 50, STONE: 25 }, // Example cost
        jobSlots: 3,
        jobProfession: 'MINER',
        produces: [{ resource: RESOURCE_TYPES.GOLD_ORE, quantity: 1, interval: 30000 }], // Example production
        requiredTool: RESOURCE_TYPES.TOOLS_PICKAXE,
        gridSize: { width: 2, height: 1 },
        color: COLORS.YELLOW,
        mineType: 'gold'
    },
    STONE_MINE: { // Assuming Stone Mine would also be a variant
        name: "Stone Mine",
        key: 'STONE_MINE',
        cost: { WOOD: 30, STONE: 10 }, // Example cost
        jobSlots: 3,
        jobProfession: 'MINER',
        produces: [{ resource: RESOURCE_TYPES.STONE, quantity: 2, interval: 15000 }], // Example production
        requiredTool: RESOURCE_TYPES.TOOLS_PICKAXE,
        gridSize: { width: 2, height: 1 },
        color: COLORS.LIGHT_GREY,
        mineType: 'stone'
    },
    SAWMILL: {
        name: "Sawmill",
        key: 'SAWMILL',
        cost: { WOOD: 25, STONE: 5 },
        jobSlots: 2,
        jobProfession: 'SAWMILL_WORKER',
        consumes: [{ resource: RESOURCE_TYPES.WOOD, quantity: 1 }],
        produces: [{ resource: RESOURCE_TYPES.PLANKS, quantity: 2, interval: 15000 }], // 2 planks from 1 wood
        gridSize: { width: 3, height: 2 },
        color: COLORS.BROWN,
    },
    WINDMILL: {
        name: "Windmill",
        key: 'WINDMILL',
        cost: { WOOD: 30, STONE: 20 },
        jobSlots: 1,
        jobProfession: 'MILLER',
        consumes: [{ resource: RESOURCE_TYPES.GRAIN, quantity: 2 }],
        produces: [{ resource: RESOURCE_TYPES.FLOUR, quantity: 1, interval: 18000 }], // 1 flour from 2 grain
        gridSize: { width: 2, height: 2 },
        color: COLORS.BEIGE,
    },
    BAKERY: {
        name: "Bakery",
        key: 'BAKERY',
        cost: { WOOD: 20, STONE: 15, [RESOURCE_TYPES.COAL_ORE]: 5 }, // Requires coal
        jobSlots: 1,
        jobProfession: 'BAKER',
        consumes: [{ resource: RESOURCE_TYPES.FLOUR, quantity: 1 }, { resource: RESOURCE_TYPES.COAL_ORE, quantity: 1 }],
        produces: [{ resource: RESOURCE_TYPES.BREAD, quantity: 3, interval: 20000 }], // 3 bread from 1 flour
        gridSize: { width: 2, height: 2 },
        color: COLORS.TERRACOTTA,
    },
    PIG_FARM: {
        name: "Pig Farm",
        key: 'PIG_FARM',
        cost: { WOOD: 40, [RESOURCE_TYPES.GRAIN]: 10 }, // Initial grain to start
        jobSlots: 1,
        jobProfession: 'PIG_FARMER',
        consumes: [{ resource: RESOURCE_TYPES.GRAIN, quantity: 1 }], // Consumes grain to feed pigs
        produces: [{ resource: RESOURCE_TYPES.PIG, quantity: 1, interval: 35000 }], // Produces a pig
        gridSize: { width: 3, height: 2 },
        color: COLORS.LIGHT_BROWN,
    },
    SLAUGHTERHOUSE: {
        name: "Slaughterhouse",
        key: 'SLAUGHTERHOUSE',
        cost: { WOOD: 25, STONE: 10 },
        jobSlots: 1,
        jobProfession: 'BUTCHER',
        consumes: [{ resource: RESOURCE_TYPES.PIG, quantity: 1 }],
        produces: [{ resource: RESOURCE_TYPES.MEAT, quantity: 2, interval: 12000 }], // 2 meat from 1 pig
        gridSize: { width: 2, height: 2 },
        color: COLORS.MAROON,
    },
    IRON_SMELTER: {
        name: "Iron Smelter",
        key: 'IRON_SMELTER',
        cost: { STONE: 50, WOOD: 20 },
        jobSlots: 2,
        jobProfession: 'SMELTER_WORKER',
        consumes: [{ resource: RESOURCE_TYPES.IRON_ORE, quantity: 2 }, { resource: RESOURCE_TYPES.COAL_ORE, quantity: 1 }],
        produces: [{ resource: RESOURCE_TYPES.IRON_BAR, quantity: 1, interval: 22000 }],
        // requiredTool: SERF_PROFESSIONS.SMELTER_WORKER.tool, // Smelter worker might have a tool
        gridSize: { width: 2, height: 2 },
        color: COLORS.DARK_GREY,
    },
    TOOLMAKERS_WORKSHOP: {
        name: "Toolmaker's Workshop",
        key: 'TOOLMAKERS_WORKSHOP',
        cost: { WOOD: 25, STONE: 15 },
        jobSlots: 1,
        jobProfession: 'TOOLMAKER',
        // Consumes based on tool being made, handled by specific UI action later
        // Produces various tools
        gridSize: { width: 2, height: 2 },
        color: COLORS.BROWN,
    },
    GOLDSMITHS_MINT: {
        name: "Goldsmith's Mint",
        key: 'GOLDSMITHS_MINT',
        cost: { STONE: 40, WOOD: 10 },
        jobSlots: 1,
        jobProfession: 'GOLDSMITH',
        consumes: [
            { resource: RESOURCE_TYPES.GOLD_ORE, quantity: 1 },
            { resource: RESOURCE_TYPES.COAL_ORE, quantity: 1 } // Fuel
        ],
        produces: [{ resource: RESOURCE_TYPES.GOLD_BARS, quantity: 1, interval: 25000 }], // Or coins
        gridSize: { width: 2, height: 2 },
        color: COLORS.BEIGE,
    },
    BLACKSMITH_ARMORY: {
        name: "Blacksmith / Armory",
        key: 'BLACKSMITH_ARMORY',
        cost: { STONE: 35, WOOD: 20 },
        jobSlots: 1,
        jobProfession: 'BLACKSMITH',
        // Consumes based on item being made (e.g., iron bars for swords)
        // Produces swords, shields
        gridSize: { width: 3, height: 2 },
        color: COLORS.DARK_GREY,
    },
    GUARD_HUT: {
        name: "Guard Hut",
        key: 'GUARD_HUT',
        cost: { WOOD: 10, STONE: 5 },
        jobSlots: 1, // For a guard
        // jobProfession: SERF_PROFESSIONS.GUARD, // Need to define Guard profession
        gridSize: { width: 1, height: 1 },
        color: COLORS.DARK_GREY,
    },
    WATCHTOWER: {
        name: "Watchtower",
        key: 'WATCHTOWER',
        cost: { WOOD: 20, STONE: 15 },
        jobSlots: 1, // For a guard/watchman
        // jobProfession: SERF_PROFESSIONS.GUARD, // Assuming a Guard profession exists
        territoryIncrease: 5, // Example value for territory expansion
        gridSize: { width: 1, height: 1 }, // Small footprint, tall model
        color: COLORS.STONE_GREY,
    },
    BARRACKS_FORTRESS: {
        name: "Barracks / Fortress",
        key: 'BARRACKS_FORTRESS',
        cost: { STONE: 100, WOOD: 50, [RESOURCE_TYPES.IRON_BAR]: 10 }, // Added Iron Bars to cost
        jobSlots: 5, // For training/housing soldiers/knights
        // jobProfession: SERF_PROFESSIONS.KNIGHT, // Or a trainer profession
        canTrain: ['KNIGHT'], // Example: Can train Knights
        territoryIncrease: 10, // Example value for significant territory expansion
        gridSize: { width: 4, height: 3 }, // Matches visual description (large footprint)
        color: COLORS.DARK_GREY,
    },
    WAREHOUSE_STOREHOUSE: {
        name: "Warehouse / Storehouse",
        key: 'WAREHOUSE_STOREHOUSE',
        cost: { WOOD: 50, STONE: 20 },
        // No job slots, passive storage increase
        storageCapacityIncrease: { // Example: Increases capacity for all resources by a certain amount
            [RESOURCE_TYPES.WOOD]: 200,
            [RESOURCE_TYPES.STONE]: 200,
            [RESOURCE_TYPES.IRON_ORE]: 100,
            [RESOURCE_TYPES.COAL_ORE]: 100,
            [RESOURCE_TYPES.GOLD_ORE]: 50,
            [RESOURCE_TYPES.PLANKS]: 150,
            [RESOURCE_TYPES.IRON_BAR]: 100,
            [RESOURCE_TYPES.GOLD_BARS]: 50,
            [RESOURCE_TYPES.TOOLS_AXE]: 20,
            [RESOURCE_TYPES.TOOLS_PICKAXE]: 20,
            // ... other storable resources
            [RESOURCE_TYPES.GRAIN]: 100,
            [RESOURCE_TYPES.FLOUR]: 80,
            [RESOURCE_TYPES.BREAD]: 100,
            [RESOURCE_TYPES.FISH]: 100,
            [RESOURCE_TYPES.PIG]: 30,
            [RESOURCE_TYPES.MEAT]: 80,
            [RESOURCE_TYPES.SWORD]: 20,
            [RESOURCE_TYPES.SHIELD]: 20,
        },
        gridSize: { width: 4, height: 2 }, // Matches visual description (large footprint)
        color: COLORS.BEIGE,
    },
    BUILDERS_HUT: {
        name: "Builder's Hut",
        key: 'BUILDERS_HUT',
        cost: { WOOD: 5 },
        jobSlots: 3, // Can support multiple builders
        jobProfession: 'BUILDER',
        // Builders don't produce resources, they consume them for construction tasks
        gridSize: { width: 1, height: 1 },
        color: COLORS.BROWN,
    },
    TRANSPORTER_HUT: {
        name: "Transporter's Hut",
        key: 'TRANSPORTER_HUT',
        cost: { WOOD: 5 },
        jobSlots: 5, // Can support multiple builders
        jobProfession: 'TRANSPORTER',
        // Transporter don't produce resources, they consume them for transport tasks
        gridSize: { width: 1, height: 1 },
        color: COLORS.BROWN,
    },
    HARBOR: {
        name: "Harbor",
        key: 'HARBOR',
        cost: { WOOD: 75, STONE: 25 },
        jobSlots: 2, // e.g., for traders or shipwrights
        // jobProfession: SERF_PROFESSIONS.TRADER, // etc.
        gridSize: { width: 2, height: 4 }, // Pier might extend
        color: COLORS.DARK_BROWN,
    }
};

// Function to get building info by key
export function getBuildingInfo(key) {
    return BUILDING_INFO[key];
}

// Function to get a list of all placeable building types
export function getPlaceableBuildingTypes() {
    return Object.keys(BUILDING_INFO).filter(key => key !== 'CASTLE'); // Castle is usually pre-placed
}

// Map building keys to their creation functions
export const BUILDING_CREATORS = {
    CASTLE: createCastle,
    WOODCUTTERS_HUT: createWoodcuttersHut,
    FORESTERS_HUT: createForestersHut,
    QUARRY: createQuarry,
    FISHERMANS_HUT: createFishermansHut,
    FARM: createFarm,
    GEOLOGISTS_HUT: createGeologistsHut,
    IRON_MINE: () => createMine('iron'),
    COAL_MINE: () => createMine('coal'),
    GOLD_MINE: () => createMine('gold'),
    STONE_MINE: () => createMine('stone'), // If stone is mined, not just from Quarry
    SAWMILL: createSawmill,
    WINDMILL: createWindmill,
    BAKERY: createBakery,
    PIG_FARM: createPigFarm,
    SLAUGHTERHOUSE: createSlaughterhouse,
    IRON_SMELTER: createIronSmelter,
    TOOLMAKERS_WORKSHOP: createToolmakersWorkshop,
    GOLDSMITHS_MINT: createGoldsmithsMint,
    BLACKSMITH_ARMORY: createBlacksmithArmory,
    GUARD_HUT: createGuardHut,
    WATCHTOWER: createWatchtower,
    BARRACKS_FORTRESS: createBarracksFortress,
    WAREHOUSE_STOREHOUSE: createWarehouseStorehouse,
    BUILDERS_HUT: createBuildersHut,
    HARBOR: createHarbor,
};

// ---- START DEBUG LOG ----
console.log("[Buildings.js] Module loaded. Exported functions:");
console.log("createCastle:", typeof createCastle);
console.log("createWoodcuttersHut:", typeof createWoodcuttersHut);
console.log("createForestersHut:", typeof createForestersHut);
console.log("createQuarry:", typeof createQuarry);
console.log("createFishermansHut:", typeof createFishermansHut);
console.log("createFarm:", typeof createFarm);
console.log("createGeologistsHut:", typeof createGeologistsHut);
console.log("createMine:", typeof createMine);
console.log("createSawmill:", typeof createSawmill);
console.log("createWindmill:", typeof createWindmill);
console.log("createBakery:", typeof createBakery);
console.log("createPigFarm:", typeof createPigFarm);
console.log("createSlaughterhouse:", typeof createSlaughterhouse);
console.log("createIronSmelter:", typeof createIronSmelter);
console.log("createToolmakersWorkshop:", typeof createToolmakersWorkshop);
console.log("createGoldsmithsMint:", typeof createGoldsmithsMint);
console.log("createBlacksmithArmory:", typeof createBlacksmithArmory);
console.log("createGuardHut:", typeof createGuardHut);
console.log("createWatchtower:", typeof createWatchtower);
console.log("createBarracksFortress:", typeof createBarracksFortress);
console.log("createWarehouseStorehouse:", typeof createWarehouseStorehouse);
console.log("createBuildersHut:", typeof createBuildersHut);
console.log("createTransportersHut:", typeof createTransportersHut);
console.log("createHarbor:", typeof createHarbor);
// ---- END DEBUG LOG ----
