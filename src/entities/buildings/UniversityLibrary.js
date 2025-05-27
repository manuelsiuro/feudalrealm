import * as THREE from 'three';
import Building from '../Building.js';
import { BUILDING_DATA } from '../../config/buildingData.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class UniversityLibrary extends Building {
    constructor(gridX, gridZ, gameMap) {
        const buildingDataEntry = BUILDING_DATA.UNIVERSITY_LIBRARY;
        super(buildingDataEntry.key, gridX, gridZ, gameMap, buildingDataEntry);

        this.model = this.createModel();
        if (this.model) {
            this.model.position.set(gridX * TILE_SIZE, 0, gridZ * TILE_SIZE);
            this.model.userData.building = this;
        }
    }

    createModel() {
        const modelGroup = new THREE.Group();

        // buildings.md does not have a specific entry for "University/Library".
        // Aiming for overall width/depth of ~0.9 * TILE_SIZE.

        const mainBuildingColor = 0xB0C4DE; // LightSteelBlue (Stone-like)
        const wingColor = 0xC0C0C0;       // Silver (Slightly different stone)
        const roofColor = 0x696969;       // DimGray
        const columnColor = 0xFFFAFA;     // Snow (Whiteish columns)
        const domeColor = 0x8FBC8F;       // DarkSeaGreen

        // Main Building: Stately central cuboid
        const mainWidth = TILE_SIZE * 0.5; // Adjusted from 1.2
        const mainHeight = TILE_SIZE * 0.8; // Adjusted from 1.0
        const mainDepth = TILE_SIZE * 0.4; // Adjusted from 0.8
        const mainMaterial = new THREE.MeshPhongMaterial({ color: mainBuildingColor });
        const centralBlock = new THREE.Mesh(new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth), mainMaterial);
        centralBlock.position.y = mainHeight / 2;
        centralBlock.castShadow = true;
        centralBlock.receiveShadow = true;
        modelGroup.add(centralBlock);

        // Roof for Central Block: Flat with a slight overhang
        const roofThickness = TILE_SIZE * 0.05; // Adjusted from 0.08
        const centralRoofMaterial = new THREE.MeshPhongMaterial({ color: roofColor });
        const centralRoof = new THREE.Mesh(
            new THREE.BoxGeometry(mainWidth + TILE_SIZE * 0.02, roofThickness, mainDepth + TILE_SIZE * 0.02), // Smaller overhang
            centralRoofMaterial
        );
        centralRoof.position.y = mainHeight + roofThickness / 2;
        centralRoof.castShadow = true;
        modelGroup.add(centralRoof);

        // Wings (slightly lower and can be set back or forward)
        const wingWidth = TILE_SIZE * 0.2; // Adjusted from 0.4
        const wingHeight = mainHeight * 0.8; // Relative to new mainHeight
        const wingDepth = TILE_SIZE * 0.45; // Adjusted from mainDepth * 1.1 (was 0.88)
        const wingMaterial = new THREE.MeshPhongMaterial({ color: wingColor });

        const wing1 = new THREE.Mesh(new THREE.BoxGeometry(wingWidth, wingHeight, wingDepth), wingMaterial);
        // Positioned to the side of the main block: (mainWidth/2 + wingWidth/2)
        wing1.position.set((mainWidth / 2) + (wingWidth / 2), wingHeight / 2, 0); 
        wing1.castShadow = true;
        wing1.receiveShadow = true;
        modelGroup.add(wing1);

        const wing1Roof = new THREE.Mesh(
            new THREE.BoxGeometry(wingWidth + TILE_SIZE * 0.02, roofThickness, wingDepth + TILE_SIZE * 0.02), // Smaller overhang
            centralRoofMaterial // Same roof material
        );
        wing1Roof.position.y = wingHeight + roofThickness / 2;
        wing1Roof.castShadow = true;
        // Adjust wing1Roof position to be relative to wing1
        wing1Roof.position.x = wing1.position.x;
        wing1Roof.position.z = wing1.position.z;
        modelGroup.add(wing1Roof);


        const wing2 = new THREE.Mesh(new THREE.BoxGeometry(wingWidth, wingHeight, wingDepth), wingMaterial);
        // Positioned to the other side: -(mainWidth/2 + wingWidth/2)
        wing2.position.set(-((mainWidth / 2) + (wingWidth / 2)), wingHeight / 2, 0);
        wing2.castShadow = true;
        wing2.receiveShadow = true;
        modelGroup.add(wing2);

        const wing2Roof = new THREE.Mesh(
            new THREE.BoxGeometry(wingWidth + TILE_SIZE * 0.02, roofThickness, wingDepth + TILE_SIZE * 0.02), // Smaller overhang
            centralRoofMaterial // Same roof material
        );
        wing2Roof.position.y = wingHeight + roofThickness / 2;
        wing2Roof.castShadow = true;
        // Adjust wing2Roof position to be relative to wing2
        wing2Roof.position.x = wing2.position.x;
        wing2Roof.position.z = wing2.position.z;
        modelGroup.add(wing2Roof);

        // Entrance Accent: Small portico with columns (simplified)
        const columnRadius = TILE_SIZE * 0.03; // Adjusted from 0.06
        const columnHeight = mainHeight * 0.7; // Adjusted from 0.6
        const columnMaterial = new THREE.MeshPhongMaterial({ color: columnColor });
        const numColumns = 2;
        const columnSpacing = TILE_SIZE * 0.1; // Adjusted from 0.2

        for (let i = 0; i < numColumns; i++) {
            const column = new THREE.Mesh(new THREE.CylinderGeometry(columnRadius, columnRadius, columnHeight, 8), columnMaterial);
            const offset = (numColumns - 1) * columnSpacing / 2;
            column.position.set(i * columnSpacing - offset, columnHeight / 2, mainDepth / 2 + TILE_SIZE * 0.02); // Reduced Z offset
            column.castShadow = true;
            column.receiveShadow = true;
            modelGroup.add(column);
        }

        // Recalculate porticoRoofWidth based on new column dimensions
        const porticoColumnSpread = (numColumns - 1) * columnSpacing;
        const porticoEffectiveWidth = porticoColumnSpread + (2 * columnRadius);
        const porticoRoofWidth = porticoEffectiveWidth + TILE_SIZE * 0.04; // Adjusted from complex calc

        const porticoRoofHeight = TILE_SIZE * 0.05; // Adjusted (same as roofThickness)
        const porticoRoofDepth = TILE_SIZE * 0.1; // Adjusted from 0.15
        const porticoRoof = new THREE.Mesh(
            new THREE.BoxGeometry(porticoRoofWidth, porticoRoofHeight, porticoRoofDepth),
            centralRoofMaterial
        );
        // Adjusted Z position for portico roof
        porticoRoof.position.set(0, columnHeight + porticoRoofHeight / 2, mainDepth / 2 + TILE_SIZE * 0.02 + porticoRoofDepth / 2 - TILE_SIZE * 0.01);
        porticoRoof.castShadow = true;
        modelGroup.add(porticoRoof);

        // Optional Dome on central block
        const domeRadius = TILE_SIZE * 0.12; // Adjusted (was mainWidth * 0.25, now scaled)
        const domeGeometry = new THREE.SphereGeometry(domeRadius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); // Half-sphere
        const domeMaterial = new THREE.MeshPhongMaterial({ color: domeColor });
        const domeMesh = new THREE.Mesh(domeGeometry, domeMaterial);
        domeMesh.position.y = mainHeight + roofThickness; // Place directly on central flat roof
        domeMesh.castShadow = true;
        modelGroup.add(domeMesh);

        return modelGroup;
    }
}

export default UniversityLibrary;
