import * as THREE from 'three';
import Building from '../Building.js';
import { BUILDING_DATA } from '../../config/buildingData.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class Shipyard extends Building {
    constructor(gridX, gridZ, gameMap) {
        const buildingDataEntry = BUILDING_DATA.SHIPYARD;
        super(buildingDataEntry.key, gridX, gridZ, gameMap, buildingDataEntry);

        this.model = this.createModel();
        if (this.model) {
            this.model.position.set(gridX * TILE_SIZE, 0, gridZ * TILE_SIZE);
            this.model.userData.building = this;
        }
    }

    createModel() {
        const modelGroup = new THREE.Group();

        // Main structure: Large, open-sided shed near water
        const shedLength = TILE_SIZE * 2.0;
        const shedWidth = TILE_SIZE * 1.25;
        const shedWallHeight = TILE_SIZE * 1.0;
        const wallThickness = TILE_SIZE * 0.1;
        const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // SaddleBrown (Wood)

        // Side walls
        const wallGeometry = new THREE.BoxGeometry(wallThickness, shedWallHeight, shedLength);
        const wall1Mesh = new THREE.Mesh(wallGeometry, wallMaterial);
        wall1Mesh.position.set(shedWidth / 2 - wallThickness / 2, shedWallHeight / 2, 0);
        modelGroup.add(wall1Mesh);

        const wall2Mesh = new THREE.Mesh(wallGeometry, wallMaterial);
        wall2Mesh.position.set(-shedWidth / 2 + wallThickness / 2, shedWallHeight / 2, 0);
        modelGroup.add(wall2Mesh);

        // Roof: Large sloped roof
        const roofMaterial = new THREE.MeshPhongMaterial({ color: 0xA0522D }); // Sienna (Lighter wood or tarp)
        const roofRidgeY = shedWallHeight + TILE_SIZE * 0.4; // Peak of the roof from ground
        const roofOverhang = TILE_SIZE * 0.1;

        // Each slope of the gabled roof
        const roofSlopePanelWidth = (shedWidth / 2) + roofOverhang;
        const roofSlopePanelGeometry = new THREE.BoxGeometry(roofSlopePanelWidth, TILE_SIZE * 0.1, shedLength + roofOverhang * 2);
        
        // Adjust pivot for rotation
        roofSlopePanelGeometry.translate(roofSlopePanelWidth / 2, 0, 0); 

        const roofSlope1 = new THREE.Mesh(roofSlopePanelGeometry, roofMaterial);
        roofSlope1.position.set(0, roofRidgeY, 0); // Position at ridge peak
        roofSlope1.rotation.z = Math.atan2(roofRidgeY - shedWallHeight, shedWidth / 2); // Angle down towards wall top
        modelGroup.add(roofSlope1);

        const roofSlope2 = new THREE.Mesh(roofSlopePanelGeometry, roofMaterial);
        roofSlope2.position.set(0, roofRidgeY, 0); // Position at ridge peak
        roofSlope2.rotation.z = -Math.atan2(roofRidgeY - shedWallHeight, shedWidth / 2); // Angle down towards other wall top
        roofSlope2.scale.x = -1; // Flip geometry for the other side
        modelGroup.add(roofSlope2);

        // Slipway/Ramp (optional): Sloping cuboid into water area
        // Assuming shipyard front (+Z) faces water
        const slipwayWidth = shedWidth * 0.7;
        const slipwayLength = TILE_SIZE * 1.0;
        const slipwayHeight = TILE_SIZE * 0.15;
        const slipwayMesh = new THREE.Mesh(
            new THREE.BoxGeometry(slipwayWidth, slipwayHeight, slipwayLength),
            new THREE.MeshPhongMaterial({ color: 0x696969 }) // DarkGrey stone/wood
        );
        // Position it extending from the front of the shed, sloping down
        slipwayMesh.position.set(0, slipwayHeight / 2 - TILE_SIZE * 0.1, shedLength / 2 + slipwayLength / 2 - TILE_SIZE * 0.25);
        slipwayMesh.rotation.x = Math.PI / 12; // Gentle slope down
        modelGroup.add(slipwayMesh);

        // Ship under construction (simplified hull shape - elongated cuboid)
        const hullLength = shedLength * 0.8;
        const hullWidth = shedWidth * 0.4;
        const hullHeight = TILE_SIZE * 0.4;
        const hullMesh = new THREE.Mesh(
            new THREE.BoxGeometry(hullWidth, hullHeight, hullLength),
            new THREE.MeshPhongMaterial({ color: 0xDEB887 }) // BurlyWood (Planks)
        );
        hullMesh.position.set(0, hullHeight / 2, 0); // Centered in the shed
        modelGroup.add(hullMesh);

        // Shipyard should be oriented towards water. This can be done by rotating the modelGroup
        // when placing or by ensuring the game logic places it with correct default rotation.
        // For now, the model is built with its length along Z, open ends at +/- Z.

        return modelGroup;
    }
}

export default Shipyard;
