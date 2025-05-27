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

        // Aiming for overall footprint approx. 0.85 (D) x 0.6 (W) * TILE_SIZE

        // Main Building: Tall, stone-like cuboid (Light Grey)
        const mainWidth = TILE_SIZE * 0.6; // Adjusted from 1.0
        const mainHeight = TILE_SIZE * 0.5; // Adjusted from 1.5
        const mainDepth = TILE_SIZE * 0.85; // Adjusted from 1.75
        const mainMaterial = new THREE.MeshPhongMaterial({ color: 0xD3D3D3 }); // LightGrey
        const mainMesh = new THREE.Mesh(new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth), mainMaterial);
        mainMesh.position.y = mainHeight / 2;
        modelGroup.add(mainMesh);

        // Roof: Steeply sloped (Dark Grey or Blue-Grey)
        const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x708090 }); // SlateGray
        const roofWidth = mainWidth + TILE_SIZE * 0.05; // Adjusted overhang from 0.1
        const roofSlopeHeight = TILE_SIZE * 0.2; // Adjusted from 0.5 (height of peak from building top)
        // Each panel covers half the depth, plus overhang
        const roofPanelLength = (mainDepth / 2) + TILE_SIZE * 0.025; // Adjusted from 0.05 overhang
        const roofPanelThickness = TILE_SIZE * 0.05; // Adjusted from 0.1

        const roofSlopeGeometry = new THREE.BoxGeometry(roofWidth, roofPanelThickness, roofPanelLength);

        const r1 = new THREE.Mesh(roofSlopeGeometry, roofMaterial);
        // Position and rotate for one side of the gable
        // Y: top of main building + half of roof rise. Z: quarter of main depth.
        r1.position.set(0, mainHeight + roofSlopeHeight / 2, mainDepth / 4);
        r1.rotation.x = -Math.atan2(roofSlopeHeight, mainDepth / 2); 
        modelGroup.add(r1);

        const r2 = new THREE.Mesh(roofSlopeGeometry, roofMaterial);
        // Position and rotate for the other side
        r2.position.set(0, mainHeight + roofSlopeHeight / 2, -mainDepth / 4);
        r2.rotation.x = Math.atan2(roofSlopeHeight, mainDepth / 2);
        modelGroup.add(r2);

        // Tower/Steeple (optional): Tall, thin cuboid or cylinder with a conical/pyramidal top
        const steepleBaseSize = TILE_SIZE * 0.2; // Adjusted from 0.35
        const steepleBaseHeight = TILE_SIZE * 0.4; // Adjusted from 0.75
        const steepleBaseMesh = new THREE.Mesh(
            new THREE.BoxGeometry(steepleBaseSize, steepleBaseHeight, steepleBaseSize),
            mainMaterial // Same as building
        );
        // Position steeple on top of the main building, at the front edge
        steepleBaseMesh.position.set(0, mainHeight + steepleBaseHeight / 2, -mainDepth / 2 + steepleBaseSize / 2 + TILE_SIZE * 0.02); // Small forward offset
        modelGroup.add(steepleBaseMesh);

        const steepleTopHeight = TILE_SIZE * 0.25; // Adjusted from 0.5
        const steepleTopGeometry = new THREE.ConeGeometry(steepleBaseSize / 2 * 1.1, steepleTopHeight, 4); // Pyramidal top
        const steepleTopMesh = new THREE.Mesh(steepleTopGeometry, roofMaterial); // Same as roof
        steepleTopMesh.position.y = steepleBaseHeight / 2 + steepleTopHeight / 2; // Relative to steeple base center
        steepleTopMesh.rotation.y = Math.PI / 4;
        steepleBaseMesh.add(steepleTopMesh); // Add to steeple base

        // Accent: Gold cross or symbol (small gold cuboids)
        const crossBarLength = TILE_SIZE * 0.1; // Adjusted from 0.15
        const crossBarThickness = TILE_SIZE * 0.02; // Adjusted from 0.025
        const crossMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700 }); // Gold

        const verticalBar = new THREE.Mesh(new THREE.BoxGeometry(crossBarThickness, crossBarLength * 1.2, crossBarThickness), crossMaterial);
        verticalBar.position.y = steepleTopHeight / 2 + (crossBarLength * 1.2) / 2; // Relative to steeple top center

        const horizontalBar = new THREE.Mesh(new THREE.BoxGeometry(crossBarLength, crossBarThickness, crossBarThickness), crossMaterial);
        horizontalBar.position.y = steepleTopHeight / 2 + crossBarLength * 0.3; // Relative to steeple top center
        
        steepleTopMesh.add(verticalBar);
        steepleTopMesh.add(horizontalBar);

        // Ensure all children cast and receive shadows
        modelGroup.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return modelGroup;
    }
}

export default ChurchTemple;
