import * as THREE from 'three';
import Building from '../Building.js';
import { BUILDING_DATA } from '../../config/buildingData.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class ChurchTemple extends Building {
    constructor(gridX, gridZ, gameMap) {
        const buildingDataEntry = BUILDING_DATA.CHURCH_TEMPLE;
        super(buildingDataEntry.key, gridX, gridZ, gameMap, buildingDataEntry);

        this.model = this.createModel();
        if (this.model) {
            this.model.position.set(gridX * TILE_SIZE, 0, gridZ * TILE_SIZE);
            this.model.userData.building = this;
            // this.gameMap.scene.add(this.model); // Removed as gameMap does not have a scene property directly
        }
    }

    createModel() {
        const modelGroup = new THREE.Group();

        // Main Building: Tall, stone-like cuboid (Light Grey)
        const mainWidth = TILE_SIZE * 1.0; // Churches can be narrower but taller
        const mainHeight = TILE_SIZE * 1.5;
        const mainDepth = TILE_SIZE * 1.75; // Longer
        const mainMaterial = new THREE.MeshPhongMaterial({ color: 0xD3D3D3 }); // LightGrey
        const mainMesh = new THREE.Mesh(new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth), mainMaterial);
        mainMesh.position.y = mainHeight / 2;
        modelGroup.add(mainMesh);

        // Roof: Steeply sloped (Dark Grey or Blue-Grey)
        const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x708090 }); // SlateGray
        const roofWidth = mainWidth + TILE_SIZE * 0.1;
        const roofSlopeHeight = TILE_SIZE * 0.5; // Height of the roof peak from building top
        const roofPanelDepth = (mainDepth / 2) + TILE_SIZE * 0.05;

        const roofSlopeGeometry = new THREE.BoxGeometry(roofWidth, TILE_SIZE * 0.1, roofPanelDepth);

        const r1 = new THREE.Mesh(roofSlopeGeometry, roofMaterial);
        r1.position.set(0, mainHeight + roofSlopeHeight * 0.35, mainDepth / 4); // Adjusted Y for steeper look
        r1.rotation.x = -Math.atan2(roofSlopeHeight, mainDepth / 2);
        modelGroup.add(r1);

        const r2 = new THREE.Mesh(roofSlopeGeometry, roofMaterial);
        r2.position.set(0, mainHeight + roofSlopeHeight * 0.35, -mainDepth / 4); // Adjusted Y for steeper look
        r2.rotation.x = Math.atan2(roofSlopeHeight, mainDepth / 2);
        modelGroup.add(r2);

        // Tower/Steeple (optional): Tall, thin cuboid or cylinder with a conical/pyramidal top
        const steepleBaseSize = TILE_SIZE * 0.35;
        const steepleBaseHeight = TILE_SIZE * 0.75;
        const steepleBaseMesh = new THREE.Mesh(
            new THREE.BoxGeometry(steepleBaseSize, steepleBaseHeight, steepleBaseSize),
            mainMaterial // Same as building
        );
        // Position steeple at the front center of the main building
        steepleBaseMesh.position.set(0, mainHeight + steepleBaseHeight / 2, -mainDepth / 2 + steepleBaseSize / 2 + TILE_SIZE * 0.1);
        modelGroup.add(steepleBaseMesh);

        const steepleTopHeight = TILE_SIZE * 0.5;
        const steepleTopGeometry = new THREE.ConeGeometry(steepleBaseSize / 2 * 1.1, steepleTopHeight, 4); // Pyramidal top
        const steepleTopMesh = new THREE.Mesh(steepleTopGeometry, roofMaterial); // Same as roof
        steepleTopMesh.position.y = steepleBaseHeight / 2 + steepleTopHeight / 2; // Relative to steeple base center
        steepleTopMesh.rotation.y = Math.PI / 4;
        steepleBaseMesh.add(steepleTopMesh); // Add to steeple base

        // Accent: Gold cross or symbol (small gold cuboids)
        const crossBarLength = TILE_SIZE * 0.15;
        const crossBarThickness = TILE_SIZE * 0.025;
        const crossMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700 }); // Gold

        const verticalBar = new THREE.Mesh(new THREE.BoxGeometry(crossBarThickness, crossBarLength * 1.2, crossBarThickness), crossMaterial);
        verticalBar.position.y = steepleTopHeight / 2 + (crossBarLength * 1.2) / 2; // Relative to steeple top center

        const horizontalBar = new THREE.Mesh(new THREE.BoxGeometry(crossBarLength, crossBarThickness, crossBarThickness), crossMaterial);
        horizontalBar.position.y = steepleTopHeight / 2 + crossBarLength * 0.3; // Relative to steeple top center
        
        steepleTopMesh.add(verticalBar);
        steepleTopMesh.add(horizontalBar);

        return modelGroup;
    }
}

export default ChurchTemple;
