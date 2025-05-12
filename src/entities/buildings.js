import * as THREE from 'three';
import { RESOURCE_TYPES } from '../core/resourceManager.js'; // Added import
import { SERF_PROFESSIONS } from '../core/serfManager.js'; // Added import

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
    BROWN: 0xa52a2a,
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
    baseMesh.position.y = 0; 
    castleGroup.add(baseMesh);
    const keepWidth = baseUnit * 2.5;
    const keepHeight = baseUnit * 3;
    const keepDepth = baseUnit * 2.5;
    const keepGeometry = new THREE.BoxGeometry(keepWidth, keepHeight, keepDepth);
    const keepMesh = createMesh(keepGeometry, COLORS.DARK_GREY, 'CastleKeep');
    keepMesh.position.y = (baseHeight / 2) + (keepHeight / 2) - 0.1; 
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
        towerMeshToAdjust.position.y = (baseHeight / 2) + (towerHeight / 2);
        const pyramidMesh = createMesh(new THREE.ConeGeometry(towerPyramidRadius, towerPyramidHeight, 4), COLORS.RED, `CastleTowerPyramid_${index}`);
        pyramidMesh.position.y = towerHeight / 2 + towerPyramidHeight / 2;
        pyramidMesh.rotation.y = Math.PI / 4; 
        towerMeshToAdjust.add(pyramidMesh); 
        towerGroup.add(towerMeshToAdjust);
        towerGroup.position.set(pos.x, 0, pos.z);
        castleGroup.add(towerGroup);
    });
    const entranceWidth = baseUnit * 1;
    const entranceHeight = baseUnit * 1;
    const entranceDepthVal = baseUnit * 0.2; 
    const entranceGeometry = new THREE.BoxGeometry(entranceWidth, entranceHeight, entranceDepthVal);
    const entranceMesh = createMesh(entranceGeometry, 0x666666, 'CastleEntrance');
    entranceMesh.position.set(0, -baseHeight / 2 + entranceHeight / 2, baseDepth / 2 - entranceDepthVal / 2 + 0.01); 
    castleGroup.add(entranceMesh);
    castleGroup.position.y = baseHeight / 2; 
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
    hutGroup.add(hutMesh);
    const roofWidth = hutWidth * 1.1;
    const roofHeight = baseUnit * 0.4;
    const roofDepth = hutDepth * 1.1;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_BROWN, 'Roof');
    roofMesh.position.y = hutHeight / 2 + roofHeight / 2 - 0.05; 
    hutGroup.add(roofMesh);
    const logRadius = baseUnit * 0.15;
    const logLength = baseUnit * 0.8;
    const logGeometry = new THREE.CylinderGeometry(logRadius, logRadius, logLength, 8);
    const log1 = createMesh(logGeometry, COLORS.LIGHT_BROWN, 'Log1');
    log1.rotation.x = Math.PI / 2; 
    log1.position.set(hutWidth / 2 + logRadius + 0.1, -hutHeight / 2 + logRadius, 0);
    hutGroup.add(log1);
    const log2 = createMesh(logGeometry, COLORS.LIGHT_BROWN, 'Log2');
    log2.rotation.x = Math.PI / 2;
    log2.position.set(hutWidth / 2 + logRadius + 0.1, -hutHeight / 2 + logRadius * 3, 0);
    hutGroup.add(log2);
    hutGroup.position.y = hutHeight / 2;
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
    hutGroup.add(hutMesh);
    const roofRadius = Math.max(hutWidth, hutDepth) / 2 * 1.1; 
    const roofHeight = baseUnit * 0.8;
    const roofGeometry = new THREE.ConeGeometry(roofRadius, roofHeight, 4); 
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_GREEN, 'Roof');
    roofMesh.position.y = hutHeight / 2 + roofHeight / 2 - 0.05;
    roofMesh.rotation.y = Math.PI / 4; 
    hutGroup.add(roofMesh);
    const saplingRadius = baseUnit * 0.1;
    const saplingHeight = baseUnit * 0.4;
    const saplingGeometry = new THREE.ConeGeometry(saplingRadius, saplingHeight, 8);
    const saplingMesh = createMesh(saplingGeometry, COLORS.GREEN, 'Sapling');
    saplingMesh.position.set(hutWidth / 2 + saplingRadius + 0.1, -hutHeight/2 + saplingHeight/2, 0);
    hutGroup.add(saplingMesh);
    hutGroup.position.y = hutHeight / 2;
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
    shelterMesh.position.z = -shelterDepth / 4;
    quarryGroup.add(shelterMesh);
    const terrainPieceGeometry1 = new THREE.BoxGeometry(baseUnit * 0.8, baseUnit * 0.5, baseUnit * 0.7);
    const terrainPiece1 = createMesh(terrainPieceGeometry1, COLORS.LIGHT_GREY, 'Terrain1');
    terrainPiece1.position.set(-baseUnit * 0.5, -shelterHeight / 2 + (baseUnit * 0.5) / 2, shelterDepth / 2 - (baseUnit * 0.7) /2);
    terrainPiece1.rotation.y = Math.PI / 6;
    quarryGroup.add(terrainPiece1);
    const terrainPieceGeometry2 = new THREE.BoxGeometry(baseUnit * 0.6, baseUnit * 0.8, baseUnit * 0.5);
    const terrainPiece2 = createMesh(terrainPieceGeometry2, COLORS.LIGHT_GREY, 'Terrain2');
    terrainPiece2.position.set(baseUnit * 0.3, -shelterHeight / 2 + (baseUnit * 0.8) / 2, shelterDepth / 2 - (baseUnit * 0.5) /2 + 0.1);
    terrainPiece2.rotation.y = -Math.PI / 8;
    quarryGroup.add(terrainPiece2);
    const stoneBlockSize = baseUnit * 0.3;
    const stoneBlockGeometry = new THREE.BoxGeometry(stoneBlockSize, stoneBlockSize, stoneBlockSize);
    const stone1 = createMesh(stoneBlockGeometry, COLORS.LIGHT_GREY, 'StoneBlock1');
    stone1.position.set(shelterWidth / 2 - stoneBlockSize, -shelterHeight / 2 + stoneBlockSize / 2, shelterDepth / 2 + stoneBlockSize);
    quarryGroup.add(stone1);
    const stone2 = createMesh(stoneBlockGeometry, COLORS.LIGHT_GREY, 'StoneBlock2');
    stone2.position.set(shelterWidth / 2 - stoneBlockSize * 2.5, -shelterHeight / 2 + stoneBlockSize / 2, shelterDepth / 2 + stoneBlockSize * 1.2);
    stone2.rotation.y = Math.PI / 5;
    quarryGroup.add(stone2);
    quarryGroup.position.y = shelterHeight / 2;
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
    hutGroup.add(hutMesh);
    const roofRadius = Math.max(hutWidth, hutDepth) / 2 * 1.1;
    const roofHeight = baseUnit * 0.7;
    const roofGeometry = new THREE.ConeGeometry(roofRadius, roofHeight, 4);
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_BLUE, 'Roof');
    roofMesh.position.y = hutHeight / 2 + roofHeight / 2 - 0.05;
    roofMesh.rotation.y = Math.PI / 4;
    hutGroup.add(roofMesh);
    const pierWidth = baseUnit * 0.5;
    const pierHeight = baseUnit * 0.1;
    const pierLength = baseUnit * 2.5;
    const pierGeometry = new THREE.BoxGeometry(pierWidth, pierHeight, pierLength);
    const pierMesh = createMesh(pierGeometry, COLORS.BROWN, 'Pier');
    pierMesh.position.set(0, -hutHeight / 2 + pierHeight / 2, hutDepth / 2 + pierLength / 2);
    hutGroup.add(pierMesh);
    hutGroup.position.y = hutHeight / 2;
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
    farmGroup.add(houseMesh);
    const roofWidth = houseWidth * 1.05;
    const roofHeight = baseUnit * 0.6; 
    const roofDepth = houseDepth * 1.05;
    const mainRoofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const mainRoofMesh = createMesh(mainRoofGeometry, COLORS.RED_BROWN, 'Roof');
    mainRoofMesh.position.y = houseHeight / 2 + roofHeight / 2 - 0.1;
    farmGroup.add(mainRoofMesh);
    const fieldMarkerWidth = baseUnit * 1.5;
    const fieldMarkerHeight = baseUnit * 0.1;
    const fieldMarkerDepth = baseUnit * 3;
    const fieldGeometry = new THREE.BoxGeometry(fieldMarkerWidth, fieldMarkerHeight, fieldMarkerDepth);
    const field1 = createMesh(fieldGeometry, COLORS.YELLOW, 'FieldMarker1'); 
    field1.position.set(houseWidth / 2 + fieldMarkerWidth / 2 + 0.2, -houseHeight / 2 + fieldMarkerHeight / 2, 0);
    farmGroup.add(field1);
    const field2 = createMesh(fieldGeometry, COLORS.GREEN, 'FieldMarker2'); 
    field2.position.set(-houseWidth / 2 - fieldMarkerWidth / 2 - 0.2, -houseHeight / 2 + fieldMarkerHeight / 2, 0);
    farmGroup.add(field2);
    farmGroup.position.y = houseHeight / 2;
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
    hutGroup.add(hutMesh);
    const markerRadius = baseUnit * 0.2;
    const markerHeight = baseUnit * 0.5;
    const markerGeometry = new THREE.ConeGeometry(markerRadius, markerHeight, 8);
    const markerMesh = createMesh(markerGeometry, COLORS.YELLOW, 'Marker');
    markerMesh.position.set(hutWidth / 2 + markerRadius + 0.05, -hutHeight / 2 + markerHeight / 2, 0);
    hutGroup.add(markerMesh);
    hutGroup.position.y = hutHeight / 2;
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
    mineGroup.add(entranceMesh);
    const openingWidth = entranceWidth * 0.4;
    const openingHeight = entranceHeight * 0.6;
    const openingDepthVal = 0.1; 
    const openingGeometry = new THREE.BoxGeometry(openingWidth, openingHeight, openingDepthVal);
    const openingMesh = createMesh(openingGeometry, 0x333333, 'MineOpening'); 
    openingMesh.position.set(0, -entranceHeight / 2 + openingHeight / 2 + baseUnit * 0.1, entranceDepth / 2 - openingDepthVal / 2 + 0.01);
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
    mineGroup.position.y = entranceHeight / 2;
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
    sawmillGroup.add(mainMesh);
    const roofWidth = mainWidth * 1.05;
    const roofHeight = baseUnit * 0.5;
    const roofDepth = mainDepth * 1.05;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth); 
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_BROWN, 'Roof');
    roofMesh.position.y = mainHeight / 2 + roofHeight / 2 - 0.05;
    sawmillGroup.add(roofMesh);
    const procWidth = mainWidth * 0.8;
    const procHeight = mainHeight * 0.7;
    const procDepth = mainDepth * 1.5; 
    const procGeometry = new THREE.BoxGeometry(procWidth, procHeight, procDepth);
    const procMesh = createMesh(procGeometry, COLORS.LIGHT_BROWN, 'ProcessingArea');
    procMesh.position.set(mainWidth / 2 + procWidth / 2, -mainHeight / 2 + procHeight / 2, 0);
    sawmillGroup.add(procMesh);
    const logRadius = baseUnit * 0.1;
    const logLength = mainDepth * 0.4;
    const logGeometry = new THREE.CylinderGeometry(logRadius, logRadius, logLength, 8);
    const inputLog = createMesh(logGeometry, COLORS.DARK_BROWN, 'InputLog');
    inputLog.rotation.x = Math.PI / 2;
    inputLog.position.set(procMesh.position.x, procMesh.position.y - procHeight/2 + logRadius, -procDepth/2 + logLength / 2 + 0.1);
    sawmillGroup.add(inputLog);
    const plankWidth = baseUnit * 0.15;
    const plankHeight = baseUnit * 0.05;
    const plankLength = mainDepth * 0.3;
    const plankGeometry = new THREE.BoxGeometry(plankWidth, plankHeight, plankLength);
    for (let i = 0; i < 3; i++) {
        const plank = createMesh(plankGeometry, COLORS.LIGHT_BROWN, `Plank_${i}`);
        plank.position.set(
            procMesh.position.x,
            procMesh.position.y - procHeight/2 + plankHeight / 2 + (i * (plankHeight + 0.02)),
            procDepth/2 - plankLength / 2 - 0.1
        );
        sawmillGroup.add(plank);
    }
    sawmillGroup.position.y = mainHeight / 2;
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
    windmillGroup.add(baseMesh);
    const capRadius = baseRadiusTop * 1.1;
    const capHeight = baseUnit * 1;
    const capGeometry = new THREE.ConeGeometry(capRadius, capHeight, baseSegments);
    const capMesh = createMesh(capGeometry, COLORS.RED_BROWN, 'Cap');
    capMesh.position.y = baseHeight / 2 + capHeight / 2 - 0.1; 
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
    windmillGroup.position.y = baseHeight / 2; 
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
    bakeryGroup.add(mainMesh);
    const roofWidth = mainWidth * 1.05;
    const roofHeight = baseUnit * 0.5;
    const roofDepth = mainDepth * 1.05;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_BROWN, 'Roof');
    roofMesh.position.y = mainHeight / 2 + roofHeight / 2 - 0.05;
    bakeryGroup.add(roofMesh);
    const chimneyWidth = baseUnit * 0.3;
    const chimneyHeight = baseUnit * 1;
    const chimneyDepth = baseUnit * 0.3;
    const chimneyGeometry = new THREE.BoxGeometry(chimneyWidth, chimneyHeight, chimneyDepth);
    const chimneyMesh = createMesh(chimneyGeometry, COLORS.DARK_GREY, 'Chimney');
    chimneyMesh.position.set(-mainWidth / 2 + chimneyWidth / 2, mainHeight / 2 + chimneyHeight / 2 - roofHeight * 0.2, -mainDepth / 2 + chimneyDepth / 2);
    bakeryGroup.add(chimneyMesh);
    const emberSize = chimneyWidth * 0.3;
    const emberGeometry = new THREE.BoxGeometry(emberSize, emberSize, emberSize);
    const emberMesh = createMesh(emberGeometry, COLORS.RED, 'Embers');
    emberMesh.position.y = chimneyHeight / 2 + emberSize / 2;
    chimneyMesh.add(emberMesh); 
    bakeryGroup.position.y = mainHeight / 2;
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
    farmGroup.add(styMesh);
    const penWidth = styWidth * 0.9;
    const penDepth = styDepth * 2;
    const fenceHeight = baseUnit * 0.5;
    const postSize = baseUnit * 0.05;
    const penGroup = new THREE.Group();
    penGroup.name = 'Pen';
    penGroup.position.set(0, -styHeight / 2 + fenceHeight / 2, styDepth / 2 + penDepth / 2);
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
    pig1.position.set(penWidth * 0.1, -styHeight/2 + pigSize, styDepth / 2 + penDepth * 0.25);
    farmGroup.add(pig1);
    const pig2 = createMesh(pigGeometry, COLORS.PINK, 'Pig2');
    pig2.position.set(-penWidth * 0.25, -styHeight/2 + pigSize, styDepth / 2 + penDepth * 0.6);
    farmGroup.add(pig2);
    farmGroup.position.y = styHeight / 2;
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
    houseGroup.add(bMesh);
    const roofWidth = bWidth * 1.05;
    const roofHeight = baseUnit * 0.4;
    const roofDepth = bDepth * 1.05;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_BROWN, 'Roof');
    roofMesh.position.y = bHeight / 2 + roofHeight / 2 - 0.05;
    houseGroup.add(roofMesh);
    const blockWidth = baseUnit * 0.3;
    const blockHeight = baseUnit * 0.4;
    const blockDepth = baseUnit * 0.3;
    const blockGeometry = new THREE.CylinderGeometry(blockWidth / 2, blockWidth / 2, blockHeight, 8); 
    const blockMesh = createMesh(blockGeometry, COLORS.STONE_GREY, 'ChoppingBlock'); 
    blockMesh.position.set(bWidth / 2 + blockWidth / 2 + 0.1, -bHeight / 2 + blockHeight / 2, 0);
    houseGroup.add(blockMesh);
    houseGroup.position.y = bHeight / 2;
    return houseGroup;
}

export function createIronSmelter() {
    const smelterGroup = new THREE.Group();
    smelterGroup.name = 'Iron Smelter';
    const baseUnit = 0.7;
    const baseWidth = baseUnit * 2;
    const baseHeight = baseUnit * 1;
    const baseDepth = baseUnit * 1.5;
    const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
    const baseMesh = createMesh(baseGeometry, COLORS.DARK_GREY, 'Base');
    smelterGroup.add(baseMesh);
    const furnaceWidth = baseUnit * 0.8;
    const furnaceHeight = baseUnit * 2.5; 
    const furnaceDepth = baseUnit * 0.8;
    const furnaceGeom = new THREE.CylinderGeometry(furnaceWidth / 2 * 0.8, furnaceWidth / 2, furnaceHeight, 8);
    const furnaceMesh = createMesh(furnaceGeom, COLORS.BLACK, 'FurnaceChimney'); 
    furnaceMesh.position.y = baseHeight / 2 + furnaceHeight / 2 - 0.1; 
    smelterGroup.add(furnaceMesh);
    const glowSize = baseUnit * 0.3;
    const glowGeometry = new THREE.BoxGeometry(glowSize, glowSize, glowSize);
    const glowMesh = createMesh(glowGeometry, COLORS.ORANGE, 'Glow');
    glowMesh.position.set(0, baseHeight / 2 + glowSize / 2 - baseHeight * 0.1, furnaceDepth / 2 + glowSize / 2);
    smelterGroup.add(glowMesh);
    smelterGroup.position.y = baseHeight / 2;
    return smelterGroup;
}

export function createToolmakersWorkshop() {
    const workshopGroup = new THREE.Group();
    workshopGroup.name = "Toolmaker's Workshop";
    const baseUnit = 0.6;
    const bWidth = baseUnit * 2.2;
    const bHeight = baseUnit * 1.3;
    const bDepth = baseUnit * 1.8;
    const bGeometry = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
    const bMesh = createMesh(bGeometry, COLORS.BROWN, 'Building');
    workshopGroup.add(bMesh);
    const roofWidth = bWidth * 1.05;
    const roofHeight = baseUnit * 0.5; 
    const roofDepth = bDepth * 1.05;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const roofMesh = createMesh(roofGeometry, COLORS.STONE_GREY, 'Roof'); 
    roofMesh.position.y = bHeight / 2 + roofHeight / 2 - 0.05;
    workshopGroup.add(roofMesh);
    const anvilBaseWidth = baseUnit * 0.2;
    const anvilBaseHeight = baseUnit * 0.3;
    const anvilTopWidth = baseUnit * 0.4;
    const anvilTopHeight = baseUnit * 0.15;
    const anvilBaseGeo = new THREE.BoxGeometry(anvilBaseWidth, anvilBaseHeight, anvilBaseWidth);
    const anvilBase = createMesh(anvilBaseGeo, COLORS.DARK_GREY, 'AnvilBase');
    anvilBase.position.set(bWidth / 2 + anvilBaseWidth / 2 + 0.1, -bHeight / 2 + anvilBaseHeight / 2, 0);
    const anvilTopGeo = new THREE.BoxGeometry(anvilTopWidth, anvilTopHeight, anvilBaseWidth);
    const anvilTop = createMesh(anvilTopGeo, COLORS.DARK_GREY, 'AnvilTop');
    anvilTop.position.y = anvilBaseHeight / 2 + anvilTopHeight / 2;
    anvilBase.add(anvilTop); 
    workshopGroup.add(anvilBase);
    workshopGroup.position.y = bHeight / 2;
    return workshopGroup;
}

export function createGoldsmithsMint() {
    const mintGroup = new THREE.Group();
    mintGroup.name = "Goldsmith's Mint";
    const baseUnit = 0.65;
    const bWidth = baseUnit * 2;
    const bHeight = baseUnit * 1.4;
    const bDepth = baseUnit * 1.6;
    const bGeometry = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
    const bMesh = createMesh(bGeometry, COLORS.BEIGE, 'Building'); 
    mintGroup.add(bMesh);
    const roofWidth = bWidth * 1.05;
    const roofHeight = baseUnit * 0.3; 
    const roofDepth = bDepth * 1.05;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_GREY, 'Roof');
    roofMesh.position.y = bHeight / 2 + roofHeight / 2 - 0.05;
    mintGroup.add(roofMesh);
    const accentSize = baseUnit * 0.3;
    const accentGeometry = new THREE.BoxGeometry(accentSize, accentSize, accentSize); 
    const accentMesh = createMesh(accentGeometry, COLORS.YELLOW, 'Accent');
    accentMesh.position.y = roofHeight / 2 + accentSize / 2; 
    roofMesh.add(accentMesh); 
    mintGroup.position.y = bHeight / 2;
    return mintGroup;
}

export function createBlacksmithArmory() {
    const armoryGroup = new THREE.Group();
    armoryGroup.name = 'Blacksmith / Armory';
    const baseUnit = 0.7;
    const bWidth = baseUnit * 2.5;
    const bHeight = baseUnit * 1.5;
    const bDepth = baseUnit * 2;
    const bGeometry = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
    const bMesh = createMesh(bGeometry, COLORS.DARK_GREY, 'Building'); 
    armoryGroup.add(bMesh);
    const roofWidth = bWidth * 1.05;
    const roofHeight = baseUnit * 0.2;
    const roofDepth = bDepth * 1.05;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const roofMesh = createMesh(roofGeometry, COLORS.BLACK, 'Roof');
    roofMesh.position.y = bHeight / 2 + roofHeight / 2 - 0.02;
    armoryGroup.add(roofMesh);
    const openingWidth = bWidth * 0.4;
    const openingHeight = bHeight * 0.5;
    const openingDepthVal = 0.1;
    const openingGeometry = new THREE.BoxGeometry(openingWidth, openingHeight, openingDepthVal);
    const openingMesh = createMesh(openingGeometry, 0x222222, 'OpeningRecess'); 
    openingMesh.position.set(0, -bHeight / 2 + openingHeight / 2 + baseUnit * 0.1, bDepth / 2 - openingDepthVal / 2 + 0.01);
    armoryGroup.add(openingMesh);
    const glowSize = openingWidth * 0.3;
    const glowGeometry = new THREE.BoxGeometry(glowSize, glowSize, glowSize);
    const glowMesh = createMesh(glowGeometry, COLORS.ORANGE, 'ForgeGlow');
    glowMesh.position.set(0, 0, -openingDepthVal/2 - glowSize/2); 
    openingMesh.add(glowMesh);
    const chimneyWidth = baseUnit * 0.5;
    const chimneyHeight = baseUnit * 0.8;
    const chimneyDepth = baseUnit * 0.5;
    const chimneyGeometry = new THREE.BoxGeometry(chimneyWidth, chimneyHeight, chimneyDepth);
    const chimneyMesh = createMesh(chimneyGeometry, COLORS.BLACK, 'Chimney');
    chimneyMesh.position.set(bWidth / 2 - chimneyWidth, bHeight / 2 + chimneyHeight / 2, -bDepth / 2 + chimneyDepth);
    armoryGroup.add(chimneyMesh);
    armoryGroup.position.y = bHeight / 2;
    return armoryGroup;
}

export function createGuardHut() {
    const hutGroup = new THREE.Group();
    hutGroup.name = 'Guard Hut';
    const baseUnit = 0.5;
    const sWidth = baseUnit * 1.5;
    const sHeight = baseUnit * 1.2;
    const sDepth = baseUnit * 1.5;
    const sGeometry = new THREE.BoxGeometry(sWidth, sHeight, sDepth);
    const sMesh = createMesh(sGeometry, COLORS.DARK_GREY, 'Structure');
    hutGroup.add(sMesh);
    const bannerSize = sWidth * 0.8;
    const bannerHeight = baseUnit * 0.2;
    const bannerGeometry = new THREE.BoxGeometry(bannerSize, bannerHeight, bannerSize);
    const bannerMesh = createMesh(bannerGeometry, COLORS.RED, 'Banner');
    bannerMesh.position.y = sHeight / 2 + bannerHeight / 2;
    hutGroup.add(bannerMesh);
    hutGroup.position.y = sHeight / 2;
    return hutGroup;
}

export function createWatchtower() {
    const towerGroup = new THREE.Group();
    towerGroup.name = 'Watchtower';
    const baseUnit = 0.4; 
    const towerRadius = baseUnit * 1.2;
    const towerHeight = baseUnit * 5;
    const towerSegments = 8; 
    const towerGeometry = new THREE.CylinderGeometry(towerRadius, towerRadius * 0.9, towerHeight, towerSegments); 
    const towerMesh = createMesh(towerGeometry, COLORS.STONE_GREY, 'Tower');
    towerGroup.add(towerMesh);
    const topRadius = towerRadius * 1.2;
    const topHeight = baseUnit * 0.8;
    const topGeometry = new THREE.CylinderGeometry(topRadius, topRadius, topHeight, towerSegments);
    const topMesh = createMesh(topGeometry, COLORS.STONE_GREY, 'TopPlatform');
    topMesh.position.y = towerHeight / 2 + topHeight / 2 - 0.1;
    towerGroup.add(topMesh);
    const crenellationSize = baseUnit * 0.3;
    const numCrenellations = towerSegments;
    for (let i = 0; i < numCrenellations; i++) {
        const angle = (i / numCrenellations) * Math.PI * 2;
        const crenGeo = new THREE.BoxGeometry(crenellationSize, crenellationSize * 1.2, crenellationSize);
        const cren = createMesh(crenGeo, COLORS.STONE_GREY, `Crenellation_${i}`);
        cren.position.set(
            Math.cos(angle) * (topRadius - crenellationSize / 3),
            topHeight / 2 + (crenellationSize * 1.2) / 2,
            Math.sin(angle) * (topRadius - crenellationSize / 3)
        );
        cren.lookAt(0, cren.position.y, 0); 
        topMesh.add(cren); 
    }
    const flagRadius = baseUnit * 0.2;
    const flagHeight = baseUnit * 0.5;
    const flagGeometry = new THREE.ConeGeometry(flagRadius, flagHeight, 4);
    const flagMesh = createMesh(flagGeometry, COLORS.RED, 'Flag');
    flagMesh.position.y = topHeight / 2 + flagHeight / 2;
    flagMesh.rotation.y = Math.PI / 4;
    topMesh.add(flagMesh);
    towerGroup.position.y = towerHeight / 2;
    return towerGroup;
}

export function createBarracksFortress() {
    const fortressGroup = new THREE.Group();
    fortressGroup.name = 'Barracks / Fortress';
    const baseUnit = 0.9;
    const mainWidth = baseUnit * 4.5;
    const mainHeight = baseUnit * 2.2;
    const mainDepth = baseUnit * 3.5;
    const mainGeometry = new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth);
    const mainMesh = createMesh(mainGeometry, COLORS.DARK_GREY, 'MainStructure'); 
    fortressGroup.add(mainMesh);
    const towerWidth = baseUnit * 1;
    const towerHeight = mainHeight * 1.2; 
    const towerDepth = baseUnit * 1;
    const towerPositions = [
        { x: mainWidth / 2 - towerWidth / 2, z: mainDepth / 2 - towerDepth / 2 },
        { x: -mainWidth / 2 + towerWidth / 2, z: mainDepth / 2 - towerDepth / 2 },
        { x: mainWidth / 2 - towerWidth / 2, z: -mainDepth / 2 + towerDepth / 2 },
        { x: -mainWidth / 2 + towerWidth / 2, z: -mainDepth / 2 + towerDepth / 2 },
    ];
    towerPositions.forEach((pos, index) => {
        const towerGeo = new THREE.BoxGeometry(towerWidth, towerHeight, towerDepth);
        const tower = createMesh(towerGeo, COLORS.DARK_GREY, `FortressTower_${index}`);
        tower.position.set(pos.x, -mainHeight/2 + towerHeight/2 , pos.z); 
        const flagRadius = towerWidth * 0.15;
        const flagHeight = towerWidth * 0.4;
        const flagGeo = new THREE.ConeGeometry(flagRadius, flagHeight, 4);
        const flag = createMesh(flagGeo, COLORS.RED, `TowerFlag_${index}`);
        flag.position.y = towerHeight / 2 + flagHeight / 2;
        flag.rotation.y = Math.PI / 4;
        tower.add(flag);
        fortressGroup.add(tower);
    });
    const centralFlagRadius = baseUnit * 0.2;
    const centralFlagHeight = baseUnit * 0.6;
    const centralFlagGeo = new THREE.ConeGeometry(centralFlagRadius, centralFlagHeight, 4);
    const centralFlag = createMesh(centralFlagGeo, COLORS.RED, 'CentralFlag');
    centralFlag.position.y = mainHeight / 2 + centralFlagHeight / 2;
    centralFlag.rotation.y = Math.PI / 4;
    fortressGroup.add(centralFlag);
    fortressGroup.position.y = mainHeight / 2;
    return fortressGroup;
}

export function createWarehouseStorehouse() {
    const warehouseGroup = new THREE.Group();
    warehouseGroup.name = 'Warehouse / Storehouse';
    const baseUnit = 0.8;
    const bWidth = baseUnit * 5;
    const bHeight = baseUnit * 1.8;
    const bDepth = baseUnit * 2.5;
    const bGeometry = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
    const bMesh = createMesh(bGeometry, COLORS.BEIGE, 'Building'); 
    warehouseGroup.add(bMesh);
    const roofWidth = bWidth * 1.02; 
    const roofHeight = baseUnit * 0.4;
    const roofDepth = bDepth * 1.02;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_BROWN, 'Roof'); 
    roofMesh.position.y = bHeight / 2 + roofHeight / 2 - 0.05;
    warehouseGroup.add(roofMesh);
    const doorWidth = baseUnit * 0.8;
    const doorHeight = bHeight * 0.6;
    const doorDepthVal = 0.05; 
    const doorPositions = [
        { x: -bWidth / 4, z: bDepth / 2 - doorDepthVal / 2 + 0.01, side: 'front' },
        { x: bWidth / 4, z: bDepth / 2 - doorDepthVal / 2 + 0.01, side: 'front' },
        { x: -bWidth / 4, z: -bDepth / 2 + doorDepthVal / 2 - 0.01, side: 'back' },
        { x: bWidth / 4, z: -bDepth / 2 + doorDepthVal / 2 - 0.01, side: 'back' },
    ];
    doorPositions.forEach((pos, index) => {
        const doorGeo = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepthVal);
        const door = createMesh(doorGeo, 0x5a3825, `DoorIndentation_${index}`); 
        door.position.set(pos.x, -bHeight / 2 + doorHeight / 2, pos.z);
        warehouseGroup.add(door);
    });
    warehouseGroup.position.y = bHeight / 2;
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
    hutGroup.add(hutMesh);
    const plankWidth = baseUnit * 0.8;
    const plankHeight = baseUnit * 0.1;
    const plankDepth = baseUnit * 0.4;
    const plankGeometry = new THREE.BoxGeometry(plankWidth, plankHeight, plankDepth);
    for (let i = 0; i < 3; i++) {
        const plank = createMesh(plankGeometry, COLORS.LIGHT_BROWN, `Plank_${i}`);
        plank.position.set(
            hutWidth / 2 + plankWidth / 2 + 0.1,
            -hutHeight / 2 + plankHeight / 2 + i * (plankHeight + 0.01),
            0
        );
        hutGroup.add(plank);
    }
    const stoneSize = baseUnit * 0.25;
    const stoneGeometry = new THREE.BoxGeometry(stoneSize, stoneSize, stoneSize);
    const stone1 = createMesh(stoneGeometry, COLORS.STONE_GREY, 'Stone1'); 
    stone1.position.set(
        hutWidth / 2 + stoneSize / 2 + 0.1,
        -hutHeight / 2 + (plankHeight * 3 + 0.02) + stoneSize / 2 + 0.05,
        plankDepth / 2 - stoneSize /2
    );
    hutGroup.add(stone1);
    const stone2 = createMesh(stoneGeometry, COLORS.STONE_GREY, 'Stone2'); 
    stone2.position.set(
        hutWidth / 2 + stoneSize / 2 + 0.1 + stoneSize * 0.5,
         -hutHeight / 2 + (plankHeight * 3 + 0.02) + stoneSize / 2 + 0.05,
        plankDepth / 2 - stoneSize * 1.5
    );
    stone2.rotation.y = Math.PI / 7;
    hutGroup.add(stone2);
    hutGroup.position.y = hutHeight / 2;
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
    harborGroup.add(pierMesh);
    const dockWidth = baseUnit * 1.8;
    const dockHeight = baseUnit * 1.2;
    const dockDepth = baseUnit * 1.2;
    const dockGeometry = new THREE.BoxGeometry(dockWidth, dockHeight, dockDepth);
    const dockMesh = createMesh(dockGeometry, COLORS.LIGHT_BROWN, 'DockBuilding');
    dockMesh.position.set(0, pierHeight / 2 + dockHeight / 2, 0); 
    harborGroup.add(dockMesh);
    const boatWidth = baseUnit * 0.6;
    const boatHeight = baseUnit * 0.4;
    const boatLength = baseUnit * 1.8;
    const boatGeometry = new THREE.BoxGeometry(boatWidth, boatHeight, boatLength);
    const boat1 = createMesh(boatGeometry, COLORS.LIGHT_BLUE, 'Boat1');
    boat1.position.set(pierWidth / 2 + boatWidth / 2 + 0.1, pierHeight / 2 - boatHeight/2 + 0.05, pierLength * 0.3);
    harborGroup.add(boat1);
    const boat2 = createMesh(boatGeometry, COLORS.LIGHT_BLUE, 'Boat2');
    boat2.position.set(-pierWidth / 2 - boatWidth / 2 - 0.1, pierHeight / 2 - boatHeight/2 + 0.05, pierLength * 0.6);
    boat2.rotation.y = -Math.PI / 20; 
    harborGroup.add(boat2);
    harborGroup.position.y = pierHeight / 2;
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
        jobProfession: SERF_PROFESSIONS.WOODCUTTER,
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
        jobProfession: SERF_PROFESSIONS.FORESTER,
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
        jobProfession: SERF_PROFESSIONS.STONEMASON, 
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
        jobProfession: SERF_PROFESSIONS.FISHERMAN,
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
        jobProfession: SERF_PROFESSIONS.FARMER,
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
        jobProfession: SERF_PROFESSIONS.GEOLOGIST,
        // Geologists find new resource spots, don't produce directly
        gridSize: { width: 1, height: 1 },
        color: COLORS.DARK_BROWN,
    },
    IRON_MINE: {
        name: "Iron Mine",
        key: 'IRON_MINE',
        cost: { WOOD: 40, STONE: 20 },
        jobSlots: 3,
        jobProfession: SERF_PROFESSIONS.MINER,
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
        jobProfession: SERF_PROFESSIONS.MINER,
        produces: [{ resource: RESOURCE_TYPES.COAL_ORE, quantity: 1, interval: 18000 }],
        requiredTool: RESOURCE_TYPES.TOOLS_PICKAXE,
        gridSize: { width: 2, height: 1 },
        color: COLORS.BLACK,
        mineType: 'coal'
    },
    GOLD_MINE: {
        name: "Gold Mine",
        key: 'GOLD_MINE',
        cost: { WOOD: 50, STONE: 25 },
        jobSlots: 2, // Gold is rarer
        jobProfession: SERF_PROFESSIONS.MINER,
        produces: [{ resource: RESOURCE_TYPES.GOLD_ORE, quantity: 1, interval: 30000 }],
        requiredTool: RESOURCE_TYPES.TOOLS_PICKAXE,
        gridSize: { width: 2, height: 1 },
        color: COLORS.YELLOW,
        mineType: 'gold'
    },
    SAWMILL: {
        name: "Sawmill",
        key: 'SAWMILL',
        cost: { WOOD: 20, STONE: 10 },
        jobSlots: 2,
        jobProfession: SERF_PROFESSIONS.SAWMILL_WORKER,
        consumes: [{ resource: RESOURCE_TYPES.WOOD, quantity: 2 }], // Consumes 2 wood to make 1 plank
        produces: [{ resource: RESOURCE_TYPES.PLANKS, quantity: 1, interval: 15000 }],
        gridSize: { width: 3, height: 2 },
        color: COLORS.BROWN,
    },
    WINDMILL: {
        name: "Windmill",
        key: 'WINDMILL',
        cost: { WOOD: 30, STONE: 15 },
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.MILLER,
        consumes: [{ resource: RESOURCE_TYPES.GRAIN, quantity: 1 }],
        produces: [{ resource: RESOURCE_TYPES.FLOUR, quantity: 1, interval: 12000 }],
        gridSize: { width: 2, height: 2 }, // Tower base
        color: COLORS.BEIGE,
    },
    BAKERY: {
        name: "Bakery",
        key: 'BAKERY',
        cost: { WOOD: 20, STONE: 20 },
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.BAKER,
        consumes: [{ resource: RESOURCE_TYPES.FLOUR, quantity: 1 }], // Optional: add WOOD for fuel
        produces: [{ resource: RESOURCE_TYPES.BREAD, quantity: 1, interval: 10000 }],
        gridSize: { width: 2, height: 2 },
        color: COLORS.TERRACOTTA,
    },
    PIG_FARM: {
        name: "Pig Farm",
        key: 'PIG_FARM',
        cost: { WOOD: 25 },
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.PIG_FARMER,
        // Pig farms grow pigs over time, not direct resource production in same way
        // Could "produce" PIG_RESOURCE (live animal) or this is handled by task
        produces: [{ resource: RESOURCE_TYPES.PIG, quantity: 1, interval: 45000 }], // Long interval for live animal
        gridSize: { width: 3, height: 3 },
        color: COLORS.PINK,
    },
    SLAUGHTERHOUSE: {
        name: "Slaughterhouse",
        key: 'SLAUGHTERHOUSE',
        cost: { WOOD: 15, STONE: 10 },
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.BUTCHER,
        consumes: [{ resource: RESOURCE_TYPES.PIG, quantity: 1 }],
        produces: [{ resource: RESOURCE_TYPES.MEAT, quantity: 2, interval: 10000 }], // 1 pig -> 2 meat
        gridSize: { width: 2, height: 2 },
        color: COLORS.MAROON,
    },
    IRON_SMELTER: {
        name: "Iron Smelter",
        key: 'IRON_SMELTER',
        cost: { STONE: 30 },
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.SMELTER_WORKER,
        consumes: [
            { resource: RESOURCE_TYPES.IRON_ORE, quantity: 1 },
            { resource: RESOURCE_TYPES.COAL_ORE, quantity: 1 } // Fuel
        ],
        produces: [{ resource: RESOURCE_TYPES.IRON_BARS, quantity: 1, interval: 20000 }],
        gridSize: { width: 2, height: 2 },
        color: COLORS.DARK_GREY,
    },
    TOOLMAKERS_WORKSHOP: {
        name: "Toolmaker's Workshop",
        key: 'TOOLMAKERS_WORKSHOP',
        cost: { WOOD: 25, STONE: 15 },
        jobSlots: 1,
        jobProfession: SERF_PROFESSIONS.TOOLMAKER,
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
        jobProfession: SERF_PROFESSIONS.GOLDSMITH,
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
        jobProfession: SERF_PROFESSIONS.BLACKSMITH,
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
        jobSlots: 1,
        // jobProfession: SERF_PROFESSIONS.GUARD,
        gridSize: { width: 1, height: 1 }, // Small footprint, tall model
        color: COLORS.STONE_GREY,
    },
    BARRACKS_FORTRESS: {
        name: "Barracks / Fortress",
        key: 'BARRACKS_FORTRESS',
        cost: { STONE: 100, WOOD: 50 },
        jobSlots: 5, // For training/housing soldiers
        // jobProfession: SERF_PROFESSIONS.SOLDIER_TRAINER, // Or similar
        gridSize: { width: 4, height: 3 },
        color: COLORS.DARK_GREY,
    },
    WAREHOUSE_STOREHOUSE: {
        name: "Warehouse / Storehouse",
        key: 'WAREHOUSE_STOREHOUSE',
        cost: { WOOD: 50, STONE: 20 },
        // No job slots, passive storage increase (handled elsewhere)
        gridSize: { width: 4, height: 2 },
        color: COLORS.BEIGE,
    },
    BUILDERS_HUT: {
        name: "Builder's Hut",
        key: 'BUILDERS_HUT',
        cost: { WOOD: 5 },
        jobSlots: 3, // Can support multiple builders
        jobProfession: SERF_PROFESSIONS.BUILDER,
        // Builders don't produce resources, they consume them for construction tasks
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
    // STONE_MINE: () => createMine('stone'), // If stone is mined, not just from Quarry
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
