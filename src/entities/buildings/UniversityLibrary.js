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
        // The existing code implements a stately, multi-part cuboid structure with wings, columns, and an optional dome.
        // We will adapt this existing design to use TILE_SIZE and ensure all parts are correctly scaled and positioned.

        const mainBuildingColor = 0xB0C4DE; // LightSteelBlue (Stone-like)
        const wingColor = 0xC0C0C0;       // Silver (Slightly different stone)
        const roofColor = 0x696969;       // DimGray
        const columnColor = 0xFFFAFA;     // Snow (Whiteish columns)
        const domeColor = 0x8FBC8F;       // DarkSeaGreen

        // Main Building: Stately central cuboid
        const mainWidth = TILE_SIZE * 1.2;
        const mainHeight = TILE_SIZE * 1.0;
        const mainDepth = TILE_SIZE * 0.8;
        const mainMaterial = new THREE.MeshPhongMaterial({ color: mainBuildingColor });
        const centralBlock = new THREE.Mesh(new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth), mainMaterial);
        centralBlock.position.y = mainHeight / 2;
        centralBlock.castShadow = true;
        centralBlock.receiveShadow = true;
        modelGroup.add(centralBlock);

        // Roof for Central Block: Flat with a slight overhang
        const roofThickness = TILE_SIZE * 0.08;
        const centralRoofMaterial = new THREE.MeshPhongMaterial({ color: roofColor });
        const centralRoof = new THREE.Mesh(
            new THREE.BoxGeometry(mainWidth + TILE_SIZE * 0.04, roofThickness, mainDepth + TILE_SIZE * 0.04),
            centralRoofMaterial
        );
        centralRoof.position.y = mainHeight + roofThickness / 2;
        centralRoof.castShadow = true;
        modelGroup.add(centralRoof);

        // Wings (slightly lower and can be set back or forward)
        const wingWidth = TILE_SIZE * 0.4;
        const wingHeight = mainHeight * 0.8;
        const wingDepth = mainDepth * 1.1; // Slightly deeper than main block
        const wingMaterial = new THREE.MeshPhongMaterial({ color: wingColor });

        const wing1 = new THREE.Mesh(new THREE.BoxGeometry(wingWidth, wingHeight, wingDepth), wingMaterial);
        wing1.position.set(mainWidth / 2 + wingWidth / 2, wingHeight / 2, 0); // Positioned to the side of the main block
        wing1.castShadow = true;
        wing1.receiveShadow = true;
        modelGroup.add(wing1);

        const wing1Roof = new THREE.Mesh(
            new THREE.BoxGeometry(wingWidth + TILE_SIZE * 0.04, roofThickness, wingDepth + TILE_SIZE * 0.04),
            centralRoofMaterial // Same roof material
        );
        wing1Roof.position.y = wingHeight + roofThickness / 2;
        wing1Roof.castShadow = true;
        modelGroup.add(wing1Roof);
        // Adjust wing1Roof position to be relative to wing1 if wing1 is moved
        wing1Roof.position.x = wing1.position.x;
        wing1Roof.position.z = wing1.position.z;


        const wing2 = new THREE.Mesh(new THREE.BoxGeometry(wingWidth, wingHeight, wingDepth), wingMaterial);
        wing2.position.set(-(mainWidth / 2 + wingWidth / 2), wingHeight / 2, 0); // Positioned to the other side
        wing2.castShadow = true;
        wing2.receiveShadow = true;
        modelGroup.add(wing2);

        const wing2Roof = new THREE.Mesh(
            new THREE.BoxGeometry(wingWidth + TILE_SIZE * 0.04, roofThickness, wingDepth + TILE_SIZE * 0.04),
            centralRoofMaterial // Same roof material
        );
        wing2Roof.position.y = wingHeight + roofThickness / 2;
        wing2Roof.castShadow = true;
        modelGroup.add(wing2Roof);
        // Adjust wing2Roof position to be relative to wing2
        wing2Roof.position.x = wing2.position.x;
        wing2Roof.position.z = wing2.position.z;

        // Entrance Accent: Small portico with columns (simplified)
        const columnRadius = TILE_SIZE * 0.06;
        const columnHeight = mainHeight * 0.6;
        const columnMaterial = new THREE.MeshPhongMaterial({ color: columnColor });
        const numColumns = 2;
        const columnSpacing = TILE_SIZE * 0.2;

        for (let i = 0; i < numColumns; i++) {
            const column = new THREE.Mesh(new THREE.CylinderGeometry(columnRadius, columnRadius, columnHeight, 8), columnMaterial);
            const offset = (numColumns - 1) * columnSpacing / 2;
            column.position.set(i * columnSpacing - offset, columnHeight / 2, mainDepth / 2 + TILE_SIZE * 0.05);
            column.castShadow = true;
            column.receiveShadow = true;
            modelGroup.add(column);
        }

        const porticoRoofWidth = (numColumns * columnRadius * 2) + ((numColumns -1) * (columnSpacing - columnRadius*2)) + TILE_SIZE * 0.08;        
        const porticoRoofHeight = TILE_SIZE * 0.08;
        const porticoRoofDepth = TILE_SIZE * 0.15;
        const porticoRoof = new THREE.Mesh(
            new THREE.BoxGeometry(porticoRoofWidth, porticoRoofHeight, porticoRoofDepth),
            centralRoofMaterial
        );
        porticoRoof.position.set(0, columnHeight + porticoRoofHeight / 2, mainDepth / 2 + TILE_SIZE * 0.05 + porticoRoofDepth/2 - TILE_SIZE*0.02);
        porticoRoof.castShadow = true;
        modelGroup.add(porticoRoof);

        // Optional Dome on central block
        const domeRadius = mainWidth * 0.25;
        const domeGeometry = new THREE.SphereGeometry(domeRadius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); // Half-sphere
        const domeMaterial = new THREE.MeshPhongMaterial({ color: domeColor });
        const domeMesh = new THREE.Mesh(domeGeometry, domeMaterial);
        domeMesh.position.y = mainHeight + roofThickness + TILE_SIZE * 0.01; // On top of central flat roof
        domeMesh.castShadow = true;
        modelGroup.add(domeMesh);

        return modelGroup;
    }
}

export default UniversityLibrary;
