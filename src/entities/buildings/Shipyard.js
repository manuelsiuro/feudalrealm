import * as THREE from 'three';
import Building from '../Building.js';
import { BUILDING_DATA } from '../../config/buildingData.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class Shipyard extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry = null, resourceFlowManager = null) {
        const buildingData = buildingDataEntry || BUILDING_DATA.SHIPYARD;
        super(buildingData.key, gridX, gridZ, gameMap, buildingData, resourceFlowManager);

        // Model creation is handled by the base Building class
        // Model will be created when construction starts, not immediately
    }

    createModel() {
        const modelGroup = new THREE.Group();

        // Aiming for overall width/depth of ~0.9 * TILE_SIZE.
        const targetFootprint = TILE_SIZE * 0.9;

        // Main structure: Large, open-sided shed near water
        // Assuming length is along Z, width along X for footprint calculation.
        const shedLength = targetFootprint; // Adjusted from TILE_SIZE * 2.0
        const shedWidth = targetFootprint * 0.7; // Adjusted from TILE_SIZE * 1.25, making it narrower
        const shedWallHeight = TILE_SIZE * 0.6; // Adjusted from TILE_SIZE * 1.0
        const wallThickness = TILE_SIZE * 0.05; // Adjusted from TILE_SIZE * 0.1
        const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // SaddleBrown (Wood)

        // Side walls
        const wallGeometry = new THREE.BoxGeometry(wallThickness, shedWallHeight, shedLength);
        const wall1Mesh = new THREE.Mesh(wallGeometry, wallMaterial);
        wall1Mesh.position.set(shedWidth / 2 - wallThickness / 2, shedWallHeight / 2, 0); // Base of wall at y=0
        modelGroup.add(wall1Mesh);

        const wall2Mesh = new THREE.Mesh(wallGeometry, wallMaterial);
        wall2Mesh.position.set(-shedWidth / 2 + wallThickness / 2, shedWallHeight / 2, 0); // Base of wall at y=0
        modelGroup.add(wall2Mesh);

        // Roof: Large sloped roof
        const roofMaterial = new THREE.MeshPhongMaterial({ color: 0xA0522D }); // Sienna (Lighter wood or tarp)
        const roofRidgeY = shedWallHeight + TILE_SIZE * 0.2; // Adjusted peak height from TILE_SIZE * 0.4
        const roofOverhang = TILE_SIZE * 0.05; // Adjusted from TILE_SIZE * 0.1

        // Each slope of the gabled roof
        const roofSlopePanelWidth = (shedWidth / 2) + roofOverhang;
        const roofSlopePanelThickness = TILE_SIZE * 0.05; // Adjusted from TILE_SIZE * 0.1
        const roofSlopePanelGeometry = new THREE.BoxGeometry(roofSlopePanelWidth, roofSlopePanelThickness, shedLength + roofOverhang * 2);
        
        // Adjust pivot for rotation
        roofSlopePanelGeometry.translate(roofSlopePanelWidth / 2, 0, 0); 

        const roofSlope1 = new THREE.Mesh(roofSlopePanelGeometry, roofMaterial);
        roofSlope1.position.set(0, roofRidgeY, 0); 
        const roofRise = roofRidgeY - shedWallHeight;
        const roofRun = shedWidth / 2;
        roofSlope1.rotation.z = Math.atan2(roofRise, roofRun);
        modelGroup.add(roofSlope1);

        const roofSlope2 = new THREE.Mesh(roofSlopePanelGeometry, roofMaterial);
        roofSlope2.position.set(0, roofRidgeY, 0); 
        roofSlope2.rotation.z = -Math.atan2(roofRise, roofRun);
        roofSlope2.scale.x = -1; 
        modelGroup.add(roofSlope2);

        // Slipway/Ramp (optional): Sloping cuboid into water area
        const slipwayWidth = shedWidth * 0.6; 
        const slipwayLength = TILE_SIZE * 0.4; 
        const slipwayHeight = TILE_SIZE * 0.08; 
        const slipwayMesh = new THREE.Mesh(
            new THREE.BoxGeometry(slipwayWidth, slipwayHeight, slipwayLength),
            new THREE.MeshPhongMaterial({ color: 0x696969 }) 
        );
        // Position it extending from the front of the shed, its top surface starting near ground level and sloping down.
        // The center of the mesh is (slipwayHeight / 2) above its bottom.
        // To make its top align with y=0 (approx), position.y = -slipwayHeight/2. 
        // Adding a slight positive offset to make it sit on ground before sloping.
        // Or, if it should start from the shed floor (y=0), its center y is slipwayHeight/2.
        // The original code: slipwayHeight / 2 - TILE_SIZE * 0.05 makes it slightly submerged at start.
        // Let's assume it starts at ground level (y=0 for its top back edge).
        // For a BoxGeometry, position.y is its center. If its top back edge is at y=0 and it slopes down,
        // its center y will be negative. This is complex with rotation.
        // Let's keep its base slightly below ground as intended for a slipway into water.
        slipwayMesh.position.set(0, (slipwayHeight / 2) - (TILE_SIZE * 0.02) , shedLength / 2 + slipwayLength / 2 - TILE_SIZE * 0.1);
        slipwayMesh.rotation.x = Math.PI / 16; 
        modelGroup.add(slipwayMesh);

        // Ship under construction (simplified hull shape - elongated cuboid)
        const hullLength = shedLength * 0.7; 
        const hullWidth = shedWidth * 0.3; 
        const hullHeight = TILE_SIZE * 0.2; 
        const hullMesh = new THREE.Mesh(
            new THREE.BoxGeometry(hullWidth, hullHeight, hullLength),
            new THREE.MeshPhongMaterial({ color: 0xDEB887 }) 
        );
        hullMesh.position.set(0, hullHeight / 2, 0); // Base of hull at y=0
        modelGroup.add(hullMesh);

        return modelGroup;
    }
}

export default Shipyard;
