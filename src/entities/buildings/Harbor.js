import * as THREE from 'three';
import Building from '../Building.js';
import { BUILDING_DATA } from '../../config/buildingData.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class Harbor extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry = null, resourceFlowManager = null) {
        const buildingData = buildingDataEntry || BUILDING_DATA.HARBOR;
        super(buildingData.key, gridX, gridZ, gameMap, buildingData, resourceFlowManager);

        this.model = this.createModel();
        if (this.model) {
            this.model.position.set(gridX * TILE_SIZE, 0, gridZ * TILE_SIZE);
            this.model.userData.building = this;
            // this.gameMap.scene.add(this.model); // Removed as gameMap does not have a scene property directly
        }
    }

    createModel() {
        const modelGroup = new THREE.Group();

        // Dock Building: A small light brown or grey cuboid building at the land-end of the pier
        const buildingWidth = TILE_SIZE * 0.75;
        const buildingHeight = TILE_SIZE * 0.6;
        const buildingDepth = TILE_SIZE * 0.5;
        const buildingMaterial = new THREE.MeshPhongMaterial({ color: 0xD2B48C }); // Tan (Light Brown)
        const buildingMesh = new THREE.Mesh(new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth), buildingMaterial);
        buildingMesh.position.y = buildingHeight / 2;
        // Position building at the origin of the model group, pier will extend from it
        modelGroup.add(buildingMesh);

        // Roof for dock building
        const roofMesh = new THREE.Mesh(
            new THREE.BoxGeometry(buildingWidth + TILE_SIZE * 0.05, TILE_SIZE * 0.1, buildingDepth + TILE_SIZE * 0.05),
            new THREE.MeshPhongMaterial({ color: 0x8B4513 }) // SaddleBrown
        );
        roofMesh.position.y = buildingHeight + (TILE_SIZE * 0.1) / 2;
        modelGroup.add(roofMesh); // Add roof to the group, will be positioned relative to building if building is at 0,0,0 of group

        // Pier: A long, flat, dark brown cuboid extending from the land out into the water
        // Assuming the building front is along +Z, pier extends from there.
        const pierLength = TILE_SIZE * 2.0;
        const pierWidth = TILE_SIZE * 0.5;
        const pierHeight = TILE_SIZE * 0.15;
        const pierMaterial = new THREE.MeshPhongMaterial({ color: 0x5C3317 }); // Dark Brown
        const pierMesh = new THREE.Mesh(new THREE.BoxGeometry(pierWidth, pierHeight, pierLength), pierMaterial);
        // Position pier starting from the front of the building
        pierMesh.position.set(0, pierHeight / 2, buildingDepth / 2 + pierLength / 2);
        modelGroup.add(pierMesh);

        // Boats (Indicator): Small, simple boat shapes
        const boatMaterial = new THREE.MeshPhongMaterial({ color: 0x4682B4 }); // SteelBlue
        const boatLength = TILE_SIZE * 0.6;
        const boatWidth = TILE_SIZE * 0.25;
        const boatHeight = TILE_SIZE * 0.15;
        const boatGeometry = new THREE.BoxGeometry(boatWidth, boatHeight, boatLength);

        const boat1Mesh = new THREE.Mesh(boatGeometry, boatMaterial);
        // Position boat alongside the pier
        boat1Mesh.position.set(pierWidth / 2 + boatWidth / 2 + TILE_SIZE * 0.05, boatHeight / 2, buildingDepth/2 + pierLength * 0.5);
        modelGroup.add(boat1Mesh);

        // Optional mast/cabin for boat
        const mastHeight = TILE_SIZE * 0.25;
        const mastGeometry = new THREE.BoxGeometry(TILE_SIZE * 0.05, mastHeight, TILE_SIZE * 0.05);
        const mastMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 }); // Grey
        const mastMesh = new THREE.Mesh(mastGeometry, mastMaterial);
        mastMesh.position.y = boatHeight/2 + mastHeight/2;
        boat1Mesh.add(mastMesh);
        
        // The Harbor model group's origin is where the building part is.
        // The pier extends from it. Rotation of the whole group will orient the pier.
        // Example: modelGroup.rotation.y = Math.PI; // Pier extends along -Z from building

        return modelGroup;
    }
}

export default Harbor;
