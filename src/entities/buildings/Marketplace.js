import * as THREE from 'three';
import Building from '../Building.js';
import { BUILDING_DATA } from '../../config/buildingData.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class Marketplace extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry = null, resourceFlowManager = null) {
        const buildingData = buildingDataEntry || BUILDING_DATA.MARKETPLACE;
        super(buildingData.key, gridX, gridZ, gameMap, buildingData, resourceFlowManager);

        this.model = this.createModel();
        if (this.model) {
            this.model.position.set(gridX * TILE_SIZE, 0, gridZ * TILE_SIZE);
            this.model.userData.building = this;
        }
    }

    createModel() {
        const modelGroup = new THREE.Group();

        // Main structure: Open-air feel, perhaps a central covered area and stalls
        // Central covered area: A wider, low cuboid with a prominent roof
        const centralWidth = TILE_SIZE * 0.5; // Adjusted from 1.25
        const centralPostHeight = TILE_SIZE * 0.4; // Adjusted from 0.5
        const centralDepth = TILE_SIZE * 0.5; // Adjusted from 1.25
        
        // Posts for central area
        const postSize = TILE_SIZE * 0.05; // Adjusted from 0.1
        const postMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // SaddleBrown
        const postPositions = [
            new THREE.Vector3(centralWidth/2 - postSize/2, centralPostHeight/2, centralDepth/2 - postSize/2),
            new THREE.Vector3(-centralWidth/2 + postSize/2, centralPostHeight/2, centralDepth/2 - postSize/2),
            new THREE.Vector3(centralWidth/2 - postSize/2, centralPostHeight/2, -centralDepth/2 + postSize/2),
            new THREE.Vector3(-centralWidth/2 + postSize/2, centralPostHeight/2, -centralDepth/2 + postSize/2),
        ];
        postPositions.forEach(pos => {
            const postMesh = new THREE.Mesh(new THREE.BoxGeometry(postSize, centralPostHeight, postSize), postMaterial);
            postMesh.position.copy(pos);
            modelGroup.add(postMesh);
        });

        // Roof for central area: Pyramidal or large sloped
        const roofHeight = TILE_SIZE * 0.3; // Adjusted from 0.5
        const roofGeometry = new THREE.ConeGeometry(centralWidth / 2 * 1.2, roofHeight, 4); // Pyramidal roof
        const roofMaterial = new THREE.MeshPhongMaterial({ color: 0xD2691E }); // Chocolate (Brown/Orange)
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        roofMesh.position.y = centralPostHeight + roofHeight / 2;
        roofMesh.rotation.y = Math.PI / 4; // Align pyramid sides
        modelGroup.add(roofMesh);

        // Stalls: Smaller cuboids with slanted roofs around the central area
        const stallWidth = TILE_SIZE * 0.3; // Adjusted from 0.4
        const stallBaseHeight = TILE_SIZE * 0.25; // Adjusted from 0.35
        const stallDepth = TILE_SIZE * 0.2; // Adjusted from 0.3
        const stallRoofHeight = TILE_SIZE * 0.05; // Kept same, relative to new stall size

        const stallData = [
            { x: centralWidth/2 + stallWidth/2 + TILE_SIZE * 0.05, z: 0, color: 0xFF6347 /* Tomato */ }, // Adjusted spacing from 0.1
            { x: -centralWidth/2 - stallWidth/2 - TILE_SIZE * 0.05, z: 0, color: 0x4682B4 /* SteelBlue */ }, // Adjusted spacing from 0.1
            { x: 0, z: centralDepth/2 + stallDepth/2 + TILE_SIZE * 0.05, color: 0x3CB371 /* MediumSeaGreen */ }, // Adjusted spacing from 0.1
            { x: 0, z: -centralDepth/2 - stallDepth/2 - TILE_SIZE * 0.05, color: 0xEE82EE /* Violet */ }, // Adjusted spacing from 0.1
        ];

        stallData.forEach(sp => {
            const stallGroup = new THREE.Group();
            const stallBaseMesh = new THREE.Mesh(
                new THREE.BoxGeometry(stallWidth, stallBaseHeight, stallDepth),
                new THREE.MeshPhongMaterial({ color: 0xD2B48C }) // Tan wood for stall base
            );
            stallBaseMesh.position.y = stallBaseHeight/2;
            stallGroup.add(stallBaseMesh);

            const stallRoofMesh = new THREE.Mesh(
                new THREE.BoxGeometry(stallWidth + TILE_SIZE * 0.025, stallRoofHeight, stallDepth + TILE_SIZE * 0.025), // Adjusted overhang
                new THREE.MeshPhongMaterial({ color: sp.color })
            );
            stallRoofMesh.position.y = stallBaseHeight + stallRoofHeight / 2;
            stallRoofMesh.rotation.x = -Math.PI / 12; // Slanted roof
            stallGroup.add(stallRoofMesh);
            
            stallGroup.position.set(sp.x, 0, sp.z);
            if (sp.x === 0) stallGroup.rotation.y = Math.PI/2; // Rotate side stalls
            modelGroup.add(stallGroup);
        });

        return modelGroup;
    }
}

export default Marketplace;
