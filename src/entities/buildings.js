import * as THREE from 'three';

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
    DARK_GREY: 0xa9a9a9, // Corrected from buildings.md which had dark grey lighter than medium
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
    STONE_GREY: 0x778899, // Generic stone grey
    WHITE: 0xffffff,
};

// --- Building Creation Functions ---

export function createCastle() {
    const castleGroup = new THREE.Group();
    castleGroup.name = 'Castle';

    const baseUnit = 1; // Base unit for scaling

    // Base
    const baseWidth = baseUnit * 4;
    const baseHeight = baseUnit * 2;
    const baseDepth = baseUnit * 4;
    const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
    const baseMesh = createMesh(baseGeometry, COLORS.MEDIUM_GREY, 'CastleBase');
    castleGroup.add(baseMesh);

    // Keep
    const keepWidth = baseUnit * 2.5;
    const keepHeight = baseUnit * 3;
    const keepDepth = baseUnit * 2.5;
    const keepGeometry = new THREE.BoxGeometry(keepWidth, keepHeight, keepDepth);
    const keepMesh = createMesh(keepGeometry, COLORS.DARK_GREY, 'CastleKeep');
    keepMesh.position.y = baseHeight / 2 + keepHeight / 2 - 0.1; // -0.1 to ensure it sits firmly
    castleGroup.add(keepMesh);

    // Towers
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

        const towerGeometry = new THREE.BoxGeometry(towerWidth, towerHeight, towerDepth);
        const towerMesh = createMesh(towerGeometry, COLORS.LIGHT_GREY, `CastleTower_${index}`);
        // The castleGroup's origin is at the bottom-center of the baseMesh.
        // The baseMesh's top surface is at y = baseHeight.
        // So, the tower's center should be at baseHeight + towerHeight / 2, relative to castleGroup's origin.
        // However, the castleGroup itself is already translated up by baseHeight / 2.
        // The baseMesh is centered at y=0 within castleGroup. Its top is at y = baseHeight / 2.
        // The tower should sit on this, so its center is at (baseHeight / 2) + (towerHeight / 2).
        towerMesh.position.y = (baseHeight / 2) + (towerHeight / 2);
        towerGroup.add(towerMesh);

        const pyramidGeometry = new THREE.ConeGeometry(towerPyramidRadius, towerPyramidHeight, 4); // 4 sides for pyramid
        const pyramidMesh = createMesh(pyramidGeometry, COLORS.RED, `CastleTowerPyramid_${index}`);
        // Position pyramid on top of the towerMesh
        pyramidMesh.position.y = towerHeight / 2 + towerPyramidHeight / 2;
        pyramidMesh.rotation.y = Math.PI / 4; // Align pyramid faces
        towerMesh.add(pyramidMesh); // Add pyramid as child of towerMesh for easier relative positioning

        towerGroup.position.set(pos.x, 0, pos.z);
        castleGroup.add(towerGroup);
    });

    // Entrance (simple indentation - using a darker box slightly inside)
    const entranceWidth = baseUnit * 1;
    const entranceHeight = baseUnit * 1;
    const entranceDepth = baseUnit * 0.2; // How much it's indented
    const entranceGeometry = new THREE.BoxGeometry(entranceWidth, entranceHeight, entranceDepth);
    // Use a slightly darker grey than the base for the entrance material itself
    const entranceMesh = createMesh(entranceGeometry, 0x666666, 'CastleEntrance');
    // Position it on the front face of the base, slightly recessed
    entranceMesh.position.set(0, -baseHeight / 2 + entranceHeight / 2, baseDepth / 2 - entranceDepth / 2 + 0.01); // +0.01 to avoid z-fighting
    castleGroup.add(entranceMesh);


    // The castleGroup's origin is already effectively at the bottom of the baseMesh.
    // No further y-translation needed for the group itself if children are positioned relative to its origin.
    // However, if the scene expects the castle to be placed with its absolute bottom at y=0,
    // and baseMesh is at y=0 within castleGroup, then castleGroup.position.y should be baseHeight/2.
    // The current setup:
    // baseMesh is at y=0 in castleGroup.
    // keepMesh is at y = baseHeight/2 + keepHeight/2 - 0.1 in castleGroup.
    // towerMesh is at y = (baseHeight / 2) + (towerHeight / 2) in towerGroup, and towerGroup is added to castleGroup.
    // This means the castleGroup's logical base is at y = -baseHeight/2 if baseMesh is at y=0.
    // To make y=0 the absolute bottom of the castle:
    castleGroup.position.y = baseHeight / 2; 
    // And adjust children relative to the castleGroup's new origin (which is now the center of the baseMesh before this group translation)
    // Let's re-evaluate positioning of children assuming castleGroup origin is at the very bottom of the castle.
    // If castleGroup.position.y = 0 is the desired ground level for the castle:
    // Then baseMesh should be at y = baseHeight / 2.
    // Keep should be at y = baseHeight + keepHeight / 2 - 0.1.
    // Towers should be at y = baseHeight + towerHeight / 2.

    // Re-adjusting with castleGroup.position.y = 0 as the target ground level for the castle.
    // All children's y positions are relative to this.
    baseMesh.position.y = baseHeight / 2;
    keepMesh.position.y = baseHeight + keepHeight / 2 - 0.1;
    
    // For towers, towerGroup is added to castleGroup. towerMesh is child of towerGroup.
    // towerMesh.position.y was (baseHeight / 2) + (towerHeight / 2) relative to towerGroup.
    // towerGroup itself is at y=0 relative to castleGroup.
    // So, towerMesh's y position within towerGroup should be towerHeight / 2.
    // And towerGroup's y position within castleGroup should be baseHeight.

    // Let's simplify: castleGroup origin is at the center of the base of the baseMesh.
    // baseMesh.position.y = 0; // Center of baseMesh is at origin of castleGroup
    // keepMesh.position.y = keepHeight / 2; // Sits on top of baseMesh
    // towerMesh.position.y = towerHeight / 2; // Sits on top of baseMesh
    // Then, finally: castleGroup.position.y = baseHeight / 2; to lift the whole thing.

    // Back to the previous logic which was almost correct, just tower y was off.
    // castleGroup.position.y = baseHeight / 2; // This lifts the whole group.
    // baseMesh is at y=0 within this group.
    // keepMesh is at y = baseHeight/2 + keepHeight/2 -0.1 relative to baseMesh's center. This is wrong.
    // keepMesh should be at y = (keepHeight/2) relative to baseMesh's top surface.
    // BaseMesh top is at baseHeight/2 from its center.
    
    // Let's reset castle children positioning for clarity, assuming castleGroup.position.y will be baseHeight/2
    // This means castleGroup's origin (0,0,0) is at the center of the base of the baseMesh.
    baseMesh.position.y = 0; // Centered within the group before the group is lifted.
    
    // Keep sits on top of the base. Base top is at baseMesh.position.y + baseHeight/2 = 0 + baseHeight/2.
    // Keep's center will be at (baseMesh top) + keepHeight/2.
    keepMesh.position.y = (baseHeight / 2) + (keepHeight / 2) - 0.1; // -0.1 to ensure it sits firmly

    // Towers sit on top of the base.
    // towerMesh.position.y within towerGroup should be 0 if towerGroup is positioned correctly.
    // towerGroup.position.y should be baseHeight / 2 (top of base).
    // Then towerMesh itself is centered in towerGroup.
    
    towerPositions.forEach((pos, index) => {
        const towerGroupToAdjust = castleGroup.children.find(c => c.name === `CastleTowerGroup_${index}`);
        if (towerGroupToAdjust) {
            const towerMeshToAdjust = towerGroupToAdjust.children.find(c => c.name === `CastleTower_${index}`);
            if (towerMeshToAdjust) {
                // Tower group is at corner of base. Tower mesh is child of tower group.
                // Tower mesh should be positioned so its base is on top of the castle's base.
                // Castle base's top surface is at y = baseHeight / 2 (relative to castleGroup's origin before lifting)
                // Tower mesh's center should be at y = (baseHeight / 2) + (towerHeight / 2)
                towerMeshToAdjust.position.y = (baseHeight / 2) + (towerHeight / 2);
                // Pyramid is child of towerMesh, its y is relative to towerMesh's center.
                const pyramidToAdjust = towerMeshToAdjust.children.find(c => c.name === `CastleTowerPyramid_${index}`);
                if(pyramidToAdjust) {
                    pyramidToAdjust.position.y = towerHeight / 2 + towerPyramidHeight / 2;
                }
            }
        }
    });
    
    // Entrance position relative to baseMesh center (which is at castleGroup y=0 before lifting)
    entranceMesh.position.set(0, -baseHeight / 2 + entranceHeight / 2, baseDepth / 2 - entranceDepth / 2 + 0.01);


    // Final lift of the entire castle so its bottom is at y=0 in the world.
    // Since baseMesh is at y=0 in the group, and its height is baseHeight, its bottom is at -baseHeight/2.
    // So, lift the group by baseHeight/2.
    castleGroup.position.y = baseHeight / 2; 

    return castleGroup;
}

export function createWoodcuttersHut() {
    const hutGroup = new THREE.Group();
    hutGroup.name = "Woodcutter's Hut";

    const baseUnit = 0.5; // Smaller scale for huts

    // Hut
    const hutWidth = baseUnit * 2;
    const hutHeight = baseUnit * 1;
    const hutDepth = baseUnit * 1.5;
    const hutGeometry = new THREE.BoxGeometry(hutWidth, hutHeight, hutDepth);
    const hutMesh = createMesh(hutGeometry, COLORS.BROWN, 'Hut');
    hutGroup.add(hutMesh);

    // Roof
    const roofWidth = hutWidth * 1.1;
    const roofHeight = baseUnit * 0.4;
    const roofDepth = hutDepth * 1.1;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_BROWN, 'Roof');
    roofMesh.position.y = hutHeight / 2 + roofHeight / 2 - 0.05; // Slightly overlap
    hutGroup.add(roofMesh);

    // Logs
    const logRadius = baseUnit * 0.15;
    const logLength = baseUnit * 0.8;
    const logGeometry = new THREE.CylinderGeometry(logRadius, logRadius, logLength, 8);

    const log1 = createMesh(logGeometry, COLORS.LIGHT_BROWN, 'Log1');
    log1.rotation.x = Math.PI / 2; // Lay flat
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

    // Hut
    const hutWidth = baseUnit * 1.8;
    const hutHeight = baseUnit * 1;
    const hutDepth = baseUnit * 1.3;
    const hutGeometry = new THREE.BoxGeometry(hutWidth, hutHeight, hutDepth);
    const hutMesh = createMesh(hutGeometry, COLORS.BROWN, 'Hut');
    hutGroup.add(hutMesh);

    // Roof (Pyramid)
    const roofRadius = Math.max(hutWidth, hutDepth) / 2 * 1.1; // Slightly larger than hut base
    const roofHeight = baseUnit * 0.8;
    const roofGeometry = new THREE.ConeGeometry(roofRadius, roofHeight, 4); // 4 sides for pyramid
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_GREEN, 'Roof');
    roofMesh.position.y = hutHeight / 2 + roofHeight / 2 - 0.05;
    roofMesh.rotation.y = Math.PI / 4; // Align pyramid faces
    hutGroup.add(roofMesh);

    // Sapling
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

    // Shelter
    const shelterWidth = baseUnit * 2.5;
    const shelterHeight = baseUnit * 1.2;
    const shelterDepth = baseUnit * 1.5;
    const shelterGeometry = new THREE.BoxGeometry(shelterWidth, shelterHeight, shelterDepth);
    const shelterMesh = createMesh(shelterGeometry, COLORS.STONE_GREY, 'Shelter'); // Changed from COLORS.GREY
    // Make it open-fronted by positioning it back a bit and having "terrain" in front
    shelterMesh.position.z = -shelterDepth / 4;
    quarryGroup.add(shelterMesh);

    // Rough Terrain (jagged cuboids)
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

    // Stone Blocks (output)
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

    // Hut
    const hutWidth = baseUnit * 1.5;
    const hutHeight = baseUnit * 1;
    const hutDepth = baseUnit * 1.2;
    const hutGeometry = new THREE.BoxGeometry(hutWidth, hutHeight, hutDepth);
    const hutMesh = createMesh(hutGeometry, COLORS.LIGHT_BLUE, 'Hut');
    hutGroup.add(hutMesh);

    // Roof (Pyramid)
    const roofRadius = Math.max(hutWidth, hutDepth) / 2 * 1.1;
    const roofHeight = baseUnit * 0.7;
    const roofGeometry = new THREE.ConeGeometry(roofRadius, roofHeight, 4);
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_BLUE, 'Roof');
    roofMesh.position.y = hutHeight / 2 + roofHeight / 2 - 0.05;
    roofMesh.rotation.y = Math.PI / 4;
    hutGroup.add(roofMesh);

    // Pier (Optional)
    const pierWidth = baseUnit * 0.5;
    const pierHeight = baseUnit * 0.1;
    const pierLength = baseUnit * 2.5;
    const pierGeometry = new THREE.BoxGeometry(pierWidth, pierHeight, pierLength);
    const pierMesh = createMesh(pierGeometry, COLORS.BROWN, 'Pier');
    // Position it extending from one side of the hut
    pierMesh.position.set(0, -hutHeight / 2 + pierHeight / 2, hutDepth / 2 + pierLength / 2);
    hutGroup.add(pierMesh);

    hutGroup.position.y = hutHeight / 2;
    return hutGroup;
}

export function createFarm() {
    const farmGroup = new THREE.Group();
    farmGroup.name = 'Farm';
    const baseUnit = 0.7;

    // Farmhouse
    const houseWidth = baseUnit * 2.5;
    const houseHeight = baseUnit * 1;
    const houseDepth = baseUnit * 1.2;
    const houseGeometry = new THREE.BoxGeometry(houseWidth, houseHeight, houseDepth);
    const houseMesh = createMesh(houseGeometry, COLORS.BEIGE, 'Farmhouse');
    farmGroup.add(houseMesh);

    // Roof
    const roofWidth = houseWidth * 1.05;
    const roofHeight = baseUnit * 0.6; // Sloped roof, so height is part of the slope
    const roofDepth = houseDepth * 1.05;
    // Simple sloped cuboid roof: make a box and rotate it, or use a wedge shape if simple
    // For simplicity, using a slightly taller box for the main roof part
    const mainRoofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const mainRoofMesh = createMesh(mainRoofGeometry, COLORS.RED_BROWN, 'Roof');
    mainRoofMesh.position.y = houseHeight / 2 + roofHeight / 2 - 0.1;
    farmGroup.add(mainRoofMesh);

    // Fields (adjacent flat area demarcated by very low, flat cuboids)
    // This part is more about map decoration than the building itself.
    // For the building model, we'll just add a couple of representative "field" markers.
    const fieldMarkerWidth = baseUnit * 1.5;
    const fieldMarkerHeight = baseUnit * 0.1;
    const fieldMarkerDepth = baseUnit * 3;
    const fieldGeometry = new THREE.BoxGeometry(fieldMarkerWidth, fieldMarkerHeight, fieldMarkerDepth);

    const field1 = createMesh(fieldGeometry, COLORS.YELLOW, 'FieldMarker1'); // Ripe grain
    field1.position.set(houseWidth / 2 + fieldMarkerWidth / 2 + 0.2, -houseHeight / 2 + fieldMarkerHeight / 2, 0);
    farmGroup.add(field1);

    const field2 = createMesh(fieldGeometry, COLORS.GREEN, 'FieldMarker2'); // Growing grain
    field2.position.set(-houseWidth / 2 - fieldMarkerWidth / 2 - 0.2, -houseHeight / 2 + fieldMarkerHeight / 2, 0);
    farmGroup.add(field2);

    farmGroup.position.y = houseHeight / 2;
    return farmGroup;
}

export function createGeologistsHut() {
    const hutGroup = new THREE.Group();
    hutGroup.name = "Geologist's Hut";
    const baseUnit = 0.4; // Very small

    // Hut
    const hutWidth = baseUnit * 1.5;
    const hutHeight = baseUnit * 0.8;
    const hutDepth = baseUnit * 1.5;
    const hutGeometry = new THREE.BoxGeometry(hutWidth, hutHeight, hutDepth);
    const hutMesh = createMesh(hutGeometry, COLORS.DARK_BROWN, 'Hut');
    // Flat roof is implied by not adding a separate roof mesh on top
    hutGroup.add(hutMesh);

    // Marker (small, bright yellow cone)
    const markerRadius = baseUnit * 0.2;
    const markerHeight = baseUnit * 0.5;
    const markerGeometry = new THREE.ConeGeometry(markerRadius, markerHeight, 8);
    const markerMesh = createMesh(markerGeometry, COLORS.YELLOW, 'Marker');
    // Position on top of the roof or beside the hut. Let's put it beside.
    markerMesh.position.set(hutWidth / 2 + markerRadius + 0.05, -hutHeight / 2 + markerHeight / 2, 0);
    hutGroup.add(markerMesh);

    hutGroup.position.y = hutHeight / 2;
    return hutGroup;
}

export function createMine(mineType = 'iron') { // mineType: 'iron', 'coal', 'gold', 'stone'
    const mineGroup = new THREE.Group();
    mineGroup.name = `${mineType.charAt(0).toUpperCase() + mineType.slice(1)} Mine`;
    const baseUnit = 0.8;

    // Entrance (dark grey cuboid)
    const entranceWidth = baseUnit * 2;
    const entranceHeight = baseUnit * 1.5;
    const entranceDepth = baseUnit * 1;
    const entranceGeometry = new THREE.BoxGeometry(entranceWidth, entranceHeight, entranceDepth);
    const entranceMesh = createMesh(entranceGeometry, COLORS.DARK_GREY, 'MineEntrance');
    mineGroup.add(entranceMesh);

    // Opening (darker square/rectangle)
    const openingWidth = entranceWidth * 0.4;
    const openingHeight = entranceHeight * 0.6;
    const openingDepth = 0.1; // Very thin, just for visual effect
    const openingGeometry = new THREE.BoxGeometry(openingWidth, openingHeight, openingDepth);
    const openingMesh = createMesh(openingGeometry, 0x333333, 'MineOpening'); // Darker than entrance
    openingMesh.position.set(0, -entranceHeight / 2 + openingHeight / 2 + baseUnit * 0.1, entranceDepth / 2 - openingDepth / 2 + 0.01);
    mineGroup.add(openingMesh);

    // Ore Indicator
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
        default: // Default to iron if type is unknown
            indicatorGeometry = new THREE.BoxGeometry(indicatorSize, indicatorSize, indicatorSize);
            indicatorColor = COLORS.RED;
    }

    const indicatorMesh = createMesh(indicatorGeometry, indicatorColor, indicatorName);
    // Position near the entrance
    indicatorMesh.position.set(entranceWidth / 2 - indicatorSize / 1.5, -entranceHeight / 2 + indicatorSize / 2, entranceDepth / 2 + indicatorSize / 2);
    mineGroup.add(indicatorMesh);

    // This model would typically be placed against a "mountain" mesh in the game scene.
    // For standalone viewing, its origin is at its base.
    mineGroup.position.y = entranceHeight / 2;
    return mineGroup;
}

export function createSawmill() {
    const sawmillGroup = new THREE.Group();
    sawmillGroup.name = 'Sawmill';
    const baseUnit = 0.7;

    // Main Building
    const mainWidth = baseUnit * 2.5;
    const mainHeight = baseUnit * 1.5;
    const mainDepth = baseUnit * 1.8;
    const mainGeometry = new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth);
    const mainMesh = createMesh(mainGeometry, COLORS.BROWN, 'MainBuilding');
    sawmillGroup.add(mainMesh);

    // Roof
    const roofWidth = mainWidth * 1.05;
    const roofHeight = baseUnit * 0.5;
    const roofDepth = mainDepth * 1.05;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth); // Simple sloped cuboid
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_BROWN, 'Roof');
    roofMesh.position.y = mainHeight / 2 + roofHeight / 2 - 0.05;
    sawmillGroup.add(roofMesh);

    // Processing Area (open-sided extension)
    const procWidth = mainWidth * 0.8;
    const procHeight = mainHeight * 0.7;
    const procDepth = mainDepth * 1.5; // Longer for logs/planks
    const procGeometry = new THREE.BoxGeometry(procWidth, procHeight, procDepth);
    const procMesh = createMesh(procGeometry, COLORS.LIGHT_BROWN, 'ProcessingArea');
    procMesh.position.set(mainWidth / 2 + procWidth / 2, -mainHeight / 2 + procHeight / 2, 0);
    sawmillGroup.add(procMesh);

    // Logs (input indicator)
    const logRadius = baseUnit * 0.1;
    const logLength = mainDepth * 0.4;
    const logGeometry = new THREE.CylinderGeometry(logRadius, logRadius, logLength, 8);
    const inputLog = createMesh(logGeometry, COLORS.DARK_BROWN, 'InputLog');
    inputLog.rotation.x = Math.PI / 2;
    inputLog.position.set(procMesh.position.x, procMesh.position.y - procHeight/2 + logRadius, -procDepth/2 + logLength / 2 + 0.1);
    sawmillGroup.add(inputLog);

    // Planks (output indicator)
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

    // Base (tall, slightly tapering cylinder or octagonal prism)
    const baseRadiusTop = baseUnit * 1;
    const baseRadiusBottom = baseUnit * 1.2;
    const baseHeight = baseUnit * 3.5;
    const baseSegments = 8; // For octagonal prism look
    const baseGeometry = new THREE.CylinderGeometry(baseRadiusTop, baseRadiusBottom, baseHeight, baseSegments);
    const baseMesh = createMesh(baseGeometry, COLORS.BEIGE, 'Base');
    windmillGroup.add(baseMesh);

    // Cap/Roof (conical or domed) - This is just a roof, sails attach to tower base.
    const capRadius = baseRadiusTop * 1.1;
    const capHeight = baseUnit * 1;
    const capGeometry = new THREE.ConeGeometry(capRadius, capHeight, baseSegments);
    const capMesh = createMesh(capGeometry, COLORS.RED_BROWN, 'Cap');
    capMesh.position.y = baseHeight / 2 + capHeight / 2 - 0.1; // Sits on top of the base cylinder
    windmillGroup.add(capMesh);

    // Sails and Axle Assembly
    const sailLength = baseUnit * 2.8; // Increased length slightly
    const sailWidth = baseUnit * 0.3;
    const sailDepth = baseUnit * 0.05;
    const sailGeometry = new THREE.BoxGeometry(sailWidth, sailLength, sailDepth); // sailLength is Y-dimension of the Box

    const sailHubYOffset = baseHeight * 0.30; // Y position on the tower base for the hub center
    const axleProtrusion = baseRadiusTop * 0.5; // How much the axle/hub sticks out from tower surface
    const axleTilt = -Math.PI / 18;      // Slight upward tilt of the axle (approx -10 degrees)
    const sailPitch = Math.PI / 15;      // Pitch of the individual sails relative to the arm
    const sailMountRadiusOnHub = baseRadiusTop * 0.1; // Radius on the hub face where sails attach

    // Axle group - this is what would rotate if animated
    const axleGroup = new THREE.Group();
    axleGroup.name = "WindmillAxleAssembly";
    // Position axle center on the tower surface (at radius), sticking out along Z (front)
    axleGroup.position.set(0, sailHubYOffset, baseRadiusTop + axleProtrusion / 2); 
    axleGroup.rotation.x = axleTilt; // Tilt the entire axle assembly
    windmillGroup.add(axleGroup);

    // Hub Visual (cylinder around the axle's local Z axis)
    const hubVisualRadius = baseRadiusTop * 0.20;
    const hubVisualLength = axleProtrusion * 0.8; // Length of the hub cylinder part
    const hubVisualGeometry = new THREE.CylinderGeometry(hubVisualRadius, hubVisualRadius, hubVisualLength, 12);
    const hubVisualMesh = createMesh(hubVisualGeometry, COLORS.DARK_BROWN, 'SailHubVisual');
    hubVisualMesh.rotation.x = Math.PI / 2; // Align cylinder length with axle's local Z
    // hubVisualMesh.position.z = 0; // Centered on axleGroup origin, so it protrudes correctly
    axleGroup.add(hubVisualMesh);

    for (let i = 0; i < 4; i++) {
        const sailMesh = createMesh(sailGeometry, COLORS.WHITE, `Sail_${i}`);
        
        // The sail's BoxGeometry has its length along its local Y.
        // Position sail so its base (pivot) is at its local origin.
        sailMesh.position.y = sailLength / 2; 
        // Apply pitch to the sail (around its local X-axis, which is its width).
        sailMesh.rotation.x = sailPitch;

        // Create an arm to hold the sail. This arm will be rotated around the axle.
        const sailArm = new THREE.Group();
        sailArm.add(sailMesh);

        const angle = (i * Math.PI) / 2; // 0, 90, 180, 270 degrees for radial distribution

        // Position the arm (and thus the sail's base) on the front face of the hub, offset radially.
        // The hub's front face is at axleGroup's local z = hubVisualLength / 2.
        // The sailArm's X and Y positions are on this face, arranged in a circle.
        sailArm.position.set(
            Math.cos(angle) * sailMountRadiusOnHub,  // X offset on hub face
            Math.sin(angle) * sailMountRadiusOnHub,  // Y offset on hub face
            hubVisualLength / 2 + sailDepth / 2      // Z offset to be just in front of hub face
        );
        
        // Rotate the arm around the axle's local Z-axis to distribute sails.
        sailArm.rotation.z = angle;
        
        axleGroup.add(sailArm);
    }
    windmillGroup.position.y = baseHeight / 2; // Set the whole windmill group origin at its base
    return windmillGroup;
}

export function createBakery() {
    const bakeryGroup = new THREE.Group();
    bakeryGroup.name = 'Bakery';
    const baseUnit = 0.65;

    // Main Building
    const mainWidth = baseUnit * 2.2;
    const mainHeight = baseUnit * 1.3;
    const mainDepth = baseUnit * 1.7;
    const mainGeometry = new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth);
    const mainMesh = createMesh(mainGeometry, COLORS.TERRACOTTA, 'MainBuilding'); // Orange or Terracotta
    bakeryGroup.add(mainMesh);

    // Roof
    const roofWidth = mainWidth * 1.05;
    const roofHeight = baseUnit * 0.5;
    const roofDepth = mainDepth * 1.05;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_BROWN, 'Roof');
    roofMesh.position.y = mainHeight / 2 + roofHeight / 2 - 0.05;
    bakeryGroup.add(roofMesh);

    // Chimney
    const chimneyWidth = baseUnit * 0.3;
    const chimneyHeight = baseUnit * 1;
    const chimneyDepth = baseUnit * 0.3;
    const chimneyGeometry = new THREE.BoxGeometry(chimneyWidth, chimneyHeight, chimneyDepth);
    const chimneyMesh = createMesh(chimneyGeometry, COLORS.DARK_GREY, 'Chimney');
    chimneyMesh.position.set(-mainWidth / 2 + chimneyWidth / 2, mainHeight / 2 + chimneyHeight / 2 - roofHeight * 0.2, -mainDepth / 2 + chimneyDepth / 2);
    bakeryGroup.add(chimneyMesh);

    // Embers (tiny red cube on chimney)
    const emberSize = chimneyWidth * 0.3;
    const emberGeometry = new THREE.BoxGeometry(emberSize, emberSize, emberSize);
    const emberMesh = createMesh(emberGeometry, COLORS.RED, 'Embers');
    emberMesh.position.y = chimneyHeight / 2 + emberSize / 2;
    chimneyMesh.add(emberMesh); // Add to chimney group for relative positioning

    bakeryGroup.position.y = mainHeight / 2;
    return bakeryGroup;
}

export function createPigFarm() {
    const farmGroup = new THREE.Group();
    farmGroup.name = 'Pig Farm';
    const baseUnit = 0.7;

    // Sty (long, low cuboid building)
    const styWidth = baseUnit * 3;
    const styHeight = baseUnit * 0.8;
    const styDepth = baseUnit * 1.2;
    const styGeometry = new THREE.BoxGeometry(styWidth, styHeight, styDepth);
    const styMesh = createMesh(styGeometry, COLORS.LIGHT_BROWN, 'Sty');
    farmGroup.add(styMesh);

    // Pen (enclosed area)
    const penWidth = styWidth * 0.9;
    const penDepth = styDepth * 2;
    const fenceHeight = baseUnit * 0.5;
    const postSize = baseUnit * 0.05;

    const penGroup = new THREE.Group();
    penGroup.name = 'Pen';
    penGroup.position.set(0, -styHeight / 2 + fenceHeight / 2, styDepth / 2 + penDepth / 2);

    // Create fence posts and rails
    const numPostsZ = 5; // Along depth
    const numPostsX = 3; // Along width (excluding shared corners)

    for (let i = 0; i <= numPostsZ; i++) { // Front and back rails
        const z = -penDepth / 2 + i * (penDepth / numPostsZ);
        [-penWidth / 2, penWidth / 2].forEach(x => {
            const postGeo = new THREE.BoxGeometry(postSize, fenceHeight, postSize);
            const post = createMesh(postGeo, COLORS.DARK_BROWN, `Post_Z_${x}_${i}`);
            post.position.set(x, 0, z);
            penGroup.add(post);
        });
    }
    for (let i = 1; i < numPostsX; i++) { // Side rails (not duplicating corners)
         const x = -penWidth / 2 + i * (penWidth / numPostsX);
        [-penDepth / 2, penDepth / 2].forEach(z => {
            const postGeo = new THREE.BoxGeometry(postSize, fenceHeight, postSize);
            const post = createMesh(postGeo, COLORS.DARK_BROWN, `Post_X_${z}_${i}`);
            post.position.set(x, 0, z);
            penGroup.add(post);
        });
    }
    // Simplified rails (top only for visual cue)
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

    // Pigs (optional tiny pinkish spheres or rounded cuboids) - Add 1-2 for representation
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

    // Building
    const bWidth = baseUnit * 2;
    const bHeight = baseUnit * 1.4;
    const bDepth = baseUnit * 1.6;
    const bGeometry = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
    const bMesh = createMesh(bGeometry, COLORS.MAROON, 'Building'); // Dark Red or Maroon
    houseGroup.add(bMesh);

    // Roof
    const roofWidth = bWidth * 1.05;
    const roofHeight = baseUnit * 0.4;
    const roofDepth = bDepth * 1.05;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_BROWN, 'Roof');
    roofMesh.position.y = bHeight / 2 + roofHeight / 2 - 0.05;
    houseGroup.add(roofMesh);

    // Accent (chopping block)
    const blockWidth = baseUnit * 0.3;
    const blockHeight = baseUnit * 0.4;
    const blockDepth = baseUnit * 0.3;
    const blockGeometry = new THREE.CylinderGeometry(blockWidth / 2, blockWidth / 2, blockHeight, 8); // Cylinder for a round block
    const blockMesh = createMesh(blockGeometry, COLORS.STONE_GREY, 'ChoppingBlock'); // Changed from COLORS.GREY
    blockMesh.position.set(bWidth / 2 + blockWidth / 2 + 0.1, -bHeight / 2 + blockHeight / 2, 0);
    houseGroup.add(blockMesh);

    houseGroup.position.y = bHeight / 2;
    return houseGroup;
}

export function createIronSmelter() {
    const smelterGroup = new THREE.Group();
    smelterGroup.name = 'Iron Smelter';
    const baseUnit = 0.7;

    // Base (sturdy, dark grey cuboid)
    const baseWidth = baseUnit * 2;
    const baseHeight = baseUnit * 1;
    const baseDepth = baseUnit * 1.5;
    const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
    const baseMesh = createMesh(baseGeometry, COLORS.DARK_GREY, 'Base');
    smelterGroup.add(baseMesh);

    // Furnace/Chimney (taller, slightly tapering square or cylindrical cuboid)
    const furnaceWidth = baseUnit * 0.8;
    const furnaceHeight = baseUnit * 2.5; // Prominent
    const furnaceDepth = baseUnit * 0.8;
    // Using a cylinder that tapers slightly
    const furnaceGeom = new THREE.CylinderGeometry(furnaceWidth / 2 * 0.8, furnaceWidth / 2, furnaceHeight, 8);
    const furnaceMesh = createMesh(furnaceGeom, COLORS.BLACK, 'FurnaceChimney'); // Black or Very Dark Grey
    furnaceMesh.position.y = baseHeight / 2 + furnaceHeight / 2 - 0.1; // Sits on top of base
    smelterGroup.add(furnaceMesh);

    // Glow (small bright orange or red cube at the base of the furnace/chimney)
    const glowSize = baseUnit * 0.3;
    const glowGeometry = new THREE.BoxGeometry(glowSize, glowSize, glowSize);
    const glowMesh = createMesh(glowGeometry, COLORS.ORANGE, 'Glow');
    // Position it at the front base of the furnace
    glowMesh.position.set(0, baseHeight / 2 + glowSize / 2 - baseHeight * 0.1, furnaceDepth / 2 + glowSize / 2);
    smelterGroup.add(glowMesh);

    smelterGroup.position.y = baseHeight / 2;
    return smelterGroup;
}

export function createToolmakersWorkshop() {
    const workshopGroup = new THREE.Group();
    workshopGroup.name = "Toolmaker's Workshop";
    const baseUnit = 0.6;

    // Building
    const bWidth = baseUnit * 2.2;
    const bHeight = baseUnit * 1.3;
    const bDepth = baseUnit * 1.8;
    const bGeometry = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
    const bMesh = createMesh(bGeometry, COLORS.BROWN, 'Building');
    workshopGroup.add(bMesh);

    // Roof
    const roofWidth = bWidth * 1.05;
    const roofHeight = baseUnit * 0.5; // Sloped cuboid roof
    const roofDepth = bDepth * 1.05;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const roofMesh = createMesh(roofGeometry, COLORS.STONE_GREY, 'Roof'); // Changed from COLORS.GREY
    roofMesh.position.y = bHeight / 2 + roofHeight / 2 - 0.05;
    workshopGroup.add(roofMesh);

    // Anvil (Optional: T-shaped structure)
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
    anvilBase.add(anvilTop); // Add top to base for easier positioning

    workshopGroup.add(anvilBase);

    workshopGroup.position.y = bHeight / 2;
    return workshopGroup;
}

export function createGoldsmithsMint() {
    const mintGroup = new THREE.Group();
    mintGroup.name = "Goldsmith's Mint";
    const baseUnit = 0.65;

    // Building (sturdy, medium-sized cuboid)
    const bWidth = baseUnit * 2;
    const bHeight = baseUnit * 1.4;
    const bDepth = baseUnit * 1.6;
    const bGeometry = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
    const bMesh = createMesh(bGeometry, COLORS.BEIGE, 'Building'); // Light Grey or Beige
    mintGroup.add(bMesh);

    // Roof (flat or slightly sloped cuboid)
    const roofWidth = bWidth * 1.05;
    const roofHeight = baseUnit * 0.3; // Flat-ish
    const roofDepth = bDepth * 1.05;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_GREY, 'Roof');
    roofMesh.position.y = bHeight / 2 + roofHeight / 2 - 0.05;
    mintGroup.add(roofMesh);

    // Accent (prominent bright yellow cube or small pyramid on roof or above entrance)
    const accentSize = baseUnit * 0.3;
    const accentGeometry = new THREE.BoxGeometry(accentSize, accentSize, accentSize); // Cube
    const accentMesh = createMesh(accentGeometry, COLORS.YELLOW, 'Accent');
    accentMesh.position.y = roofHeight / 2 + accentSize / 2; // On top of the roof
    roofMesh.add(accentMesh); // Add to roof for relative positioning

    mintGroup.position.y = bHeight / 2;
    return mintGroup;
}

export function createBlacksmithArmory() {
    const armoryGroup = new THREE.Group();
    armoryGroup.name = 'Blacksmith / Armory';
    const baseUnit = 0.7;

    // Building (dark grey or black cuboid)
    const bWidth = baseUnit * 2.5;
    const bHeight = baseUnit * 1.5;
    const bDepth = baseUnit * 2;
    const bGeometry = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
    const bMesh = createMesh(bGeometry, COLORS.DARK_GREY, 'Building'); // Dark Grey or Black
    armoryGroup.add(bMesh);

    // Roof (simple flat or slightly sloped)
    const roofWidth = bWidth * 1.05;
    const roofHeight = baseUnit * 0.2;
    const roofDepth = bDepth * 1.05;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const roofMesh = createMesh(roofGeometry, COLORS.BLACK, 'Roof');
    roofMesh.position.y = bHeight / 2 + roofHeight / 2 - 0.02;
    armoryGroup.add(roofMesh);

    // Forge Glow (orange or red glow visible from an opening)
    // Represent opening as a darker recessed area
    const openingWidth = bWidth * 0.4;
    const openingHeight = bHeight * 0.5;
    const openingDepth = 0.1;
    const openingGeometry = new THREE.BoxGeometry(openingWidth, openingHeight, openingDepth);
    const openingMesh = createMesh(openingGeometry, 0x222222, 'OpeningRecess'); // Very dark
    openingMesh.position.set(0, -bHeight / 2 + openingHeight / 2 + baseUnit * 0.1, bDepth / 2 - openingDepth / 2 + 0.01);
    armoryGroup.add(openingMesh);

    const glowSize = openingWidth * 0.3;
    const glowGeometry = new THREE.BoxGeometry(glowSize, glowSize, glowSize);
    const glowMesh = createMesh(glowGeometry, COLORS.ORANGE, 'ForgeGlow');
    glowMesh.position.set(0, 0, -openingDepth/2 - glowSize/2); // Inside the recess
    openingMesh.add(glowMesh);


    // Chimney (short, wide, black cuboid chimney)
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

    // Structure (small, robust-looking square cuboid)
    const sWidth = baseUnit * 1.5;
    const sHeight = baseUnit * 1.2;
    const sDepth = baseUnit * 1.5;
    const sGeometry = new THREE.BoxGeometry(sWidth, sHeight, sDepth);
    const sMesh = createMesh(sGeometry, COLORS.DARK_GREY, 'Structure');
    hutGroup.add(sMesh);

    // Roof/Banner (slightly smaller, flat red cuboid or small red pyramid)
    const bannerSize = sWidth * 0.8;
    const bannerHeight = baseUnit * 0.2;
    // Using a flat cuboid for banner
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
    const baseUnit = 0.4; // Thin and tall

    // Tower (tall, relatively thin cylinder or square prism)
    const towerRadius = baseUnit * 1.2;
    const towerHeight = baseUnit * 5;
    const towerSegments = 8; // Square prism if 4, cylinder-like if more
    const towerGeometry = new THREE.CylinderGeometry(towerRadius, towerRadius * 0.9, towerHeight, towerSegments); // Slightly tapering
    const towerMesh = createMesh(towerGeometry, COLORS.STONE_GREY, 'Tower');
    towerGroup.add(towerMesh);

    // Top (slightly wider cylinder or square prism with crenellations)
    const topRadius = towerRadius * 1.2;
    const topHeight = baseUnit * 0.8;
    const topGeometry = new THREE.CylinderGeometry(topRadius, topRadius, topHeight, towerSegments);
    const topMesh = createMesh(topGeometry, COLORS.STONE_GREY, 'TopPlatform');
    topMesh.position.y = towerHeight / 2 + topHeight / 2 - 0.1;
    towerGroup.add(topMesh);

    // Crenellations (small cubes around the upper edge of the top)
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
        cren.lookAt(0, cren.position.y, 0); // Orient towards center
        topMesh.add(cren); // Add to topMesh for relative positioning
    }

    // Flag (small red pyramid on the very top)
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

    // Main Structure (large, wide, medium-height cuboid)
    const mainWidth = baseUnit * 4.5;
    const mainHeight = baseUnit * 2.2;
    const mainDepth = baseUnit * 3.5;
    const mainGeometry = new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth);
    const mainMesh = createMesh(mainGeometry, COLORS.DARK_GREY, 'MainStructure'); // Dark Grey or Black
    fortressGroup.add(mainMesh);

    // Optional Towers (smaller square cuboids at corners)
    const towerWidth = baseUnit * 1;
    const towerHeight = mainHeight * 1.2; // Slightly taller than main structure
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
        tower.position.set(pos.x, -mainHeight/2 + towerHeight/2 , pos.z); // Align base with main structure base

        // Red pyramidal flags on towers
        const flagRadius = towerWidth * 0.15;
        const flagHeight = towerWidth * 0.4;
        const flagGeo = new THREE.ConeGeometry(flagRadius, flagHeight, 4);
        const flag = createMesh(flagGeo, COLORS.RED, `TowerFlag_${index}`);
        flag.position.y = towerHeight / 2 + flagHeight / 2;
        flag.rotation.y = Math.PI / 4;
        tower.add(flag);

        fortressGroup.add(tower);
    });

    // Central Red Flag (optional, if no towers or for extra emphasis)
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

    // Building (long, wide, plain cuboid)
    const bWidth = baseUnit * 5;
    const bHeight = baseUnit * 1.8;
    const bDepth = baseUnit * 2.5;
    const bGeometry = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
    const bMesh = createMesh(bGeometry, COLORS.BEIGE, 'Building'); // Light Brown or Beige
    warehouseGroup.add(bMesh);

    // Roof (simple, large, slightly sloped cuboid)
    const roofWidth = bWidth * 1.02; // Slightly overhang
    const roofHeight = baseUnit * 0.4;
    const roofDepth = bDepth * 1.02;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const roofMesh = createMesh(roofGeometry, COLORS.DARK_BROWN, 'Roof'); // Darker Brown or Grey
    roofMesh.position.y = bHeight / 2 + roofHeight / 2 - 0.05;
    warehouseGroup.add(roofMesh);

    // Doors (wide, darker rectangular indentations) - 2 on each long side
    const doorWidth = baseUnit * 0.8;
    const doorHeight = bHeight * 0.6;
    const doorDepth = 0.05; // Indentation depth

    const doorPositions = [
        { x: -bWidth / 4, z: bDepth / 2 - doorDepth / 2 + 0.01, side: 'front' },
        { x: bWidth / 4, z: bDepth / 2 - doorDepth / 2 + 0.01, side: 'front' },
        { x: -bWidth / 4, z: -bDepth / 2 + doorDepth / 2 - 0.01, side: 'back' },
        { x: bWidth / 4, z: -bDepth / 2 + doorDepth / 2 - 0.01, side: 'back' },
    ];

    doorPositions.forEach((pos, index) => {
        const doorGeo = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);
        const door = createMesh(doorGeo, 0x5a3825, `DoorIndentation_${index}`); // Darker than building
        door.position.set(pos.x, -bHeight / 2 + doorHeight / 2, pos.z);
        warehouseGroup.add(door);
    });

    warehouseGroup.position.y = bHeight / 2;
    return warehouseGroup;
}

export function createBuildersHut() {
    const hutGroup = new THREE.Group();
    hutGroup.name = "Builder's Hut";
    const baseUnit = 0.4; // Very small

    // Hut (very small, simple cuboid)
    const hutWidth = baseUnit * 1.5;
    const hutHeight = baseUnit * 1;
    const hutDepth = baseUnit * 1.2;
    const hutGeometry = new THREE.BoxGeometry(hutWidth, hutHeight, hutDepth);
    const hutMesh = createMesh(hutGeometry, COLORS.BROWN, 'Hut');
    hutGroup.add(hutMesh);
    // Simple flat roof implied

    // Materials Stack
    // Planks (thin, light brown cuboids)
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

    // Stones (grey cubes)
    const stoneSize = baseUnit * 0.25;
    const stoneGeometry = new THREE.BoxGeometry(stoneSize, stoneSize, stoneSize);
    const stone1 = createMesh(stoneGeometry, COLORS.STONE_GREY, 'Stone1'); // Changed from COLORS.GREY
    stone1.position.set(
        hutWidth / 2 + stoneSize / 2 + 0.1,
        -hutHeight / 2 + (plankHeight * 3 + 0.02) + stoneSize / 2 + 0.05,
        plankDepth / 2 - stoneSize /2
    );
    hutGroup.add(stone1);

    const stone2 = createMesh(stoneGeometry, COLORS.STONE_GREY, 'Stone2'); // Changed from COLORS.GREY
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

    // Pier (long, flat, dark brown cuboid)
    const pierWidth = baseUnit * 1.5;
    const pierHeight = baseUnit * 0.2;
    const pierLength = baseUnit * 5; // Long
    const pierGeometry = new THREE.BoxGeometry(pierWidth, pierHeight, pierLength);
    const pierMesh = createMesh(pierGeometry, COLORS.DARK_BROWN, 'Pier');
    // Assuming pier extends along Z axis, origin at land-end center
    pierMesh.position.z = pierLength / 2;
    harborGroup.add(pierMesh);

    // Dock Building (small light brown or grey cuboid at land-end)
    const dockWidth = baseUnit * 1.8;
    const dockHeight = baseUnit * 1.2;
    const dockDepth = baseUnit * 1.2;
    const dockGeometry = new THREE.BoxGeometry(dockWidth, dockHeight, dockDepth);
    const dockMesh = createMesh(dockGeometry, COLORS.LIGHT_BROWN, 'DockBuilding');
    dockMesh.position.set(0, pierHeight / 2 + dockHeight / 2, 0); // Sits on land at pier start
    harborGroup.add(dockMesh);

    // Boats (Indicator - simple elongated blue cuboids)
    const boatWidth = baseUnit * 0.6;
    const boatHeight = baseUnit * 0.4;
    const boatLength = baseUnit * 1.8;
    const boatGeometry = new THREE.BoxGeometry(boatWidth, boatHeight, boatLength);

    const boat1 = createMesh(boatGeometry, COLORS.LIGHT_BLUE, 'Boat1');
    boat1.position.set(pierWidth / 2 + boatWidth / 2 + 0.1, pierHeight / 2 - boatHeight/2 + 0.05, pierLength * 0.3);
    harborGroup.add(boat1);

    const boat2 = createMesh(boatGeometry, COLORS.LIGHT_BLUE, 'Boat2');
    boat2.position.set(-pierWidth / 2 - boatWidth / 2 - 0.1, pierHeight / 2 - boatHeight/2 + 0.05, pierLength * 0.6);
    boat2.rotation.y = -Math.PI / 20; // Slightly angled
    harborGroup.add(boat2);

    // Position group so that y=0 is the water level / base of pier
    harborGroup.position.y = pierHeight / 2;
    return harborGroup;
}
