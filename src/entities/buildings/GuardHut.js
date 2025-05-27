import * as THREE from 'three';
import Building from '../Building.js';
import { BUILDING_DATA } from '../../config/buildingData.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class GuardHut extends Building {
    constructor(gridX, gridZ, gameMap) {
        const buildingDataEntry = BUILDING_DATA.GUARD_HUT;
        super(buildingDataEntry.key, gridX, gridZ, gameMap, buildingDataEntry);

        this.model = this.createModel();
        if (this.model) {
            this.model.position.set(gridX * TILE_SIZE, 0, gridZ * TILE_SIZE);
            this.model.userData.building = this;
        }
    }

    createModel() {
        const modelGroup = new THREE.Group();

        // Structure: Small, robust-looking square cuboid (color: Dark Grey)
        const hutSize = TILE_SIZE * 0.6;
        const hutHeight = TILE_SIZE * 0.5;
        const hutGeometry = new THREE.BoxGeometry(hutSize, hutHeight, hutSize);
        const hutMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 }); // Dark Grey (DimGray)
        const hutMesh = new THREE.Mesh(hutGeometry, hutMaterial);
        hutMesh.position.y = hutHeight / 2;
        modelGroup.add(hutMesh);

        // Roof/Banner: A slightly smaller, flat red cuboid or a small red pyramid on top.
        // Using a flat cuboid for the banner as per description "flat red cuboid OR a small red pyramid"
        const bannerWidth = hutSize * 0.8;
        const bannerHeight = TILE_SIZE * 0.1;
        const bannerDepth = hutSize * 0.8;
        const bannerGeometry = new THREE.BoxGeometry(bannerWidth, bannerHeight, bannerDepth);
        const bannerMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000 }); // Red
        const bannerMesh = new THREE.Mesh(bannerGeometry, bannerMaterial);
        bannerMesh.position.y = hutHeight + bannerHeight / 2;
        modelGroup.add(bannerMesh);

        // Optional: A small red pyramid on top of the banner/roof
        const pyramidHeight = TILE_SIZE * 0.15;
        const pyramidRadius = bannerWidth * 0.4;
        const pyramidGeometry = new THREE.ConeGeometry(pyramidRadius, pyramidHeight, 4); // 4 sides for pyramid
        const pyramidMesh = new THREE.Mesh(pyramidGeometry, bannerMaterial); // Red material
        pyramidMesh.position.y = hutHeight + bannerHeight + pyramidHeight / 2;
        pyramidMesh.rotation.y = Math.PI / 4; // Align flat side
        modelGroup.add(pyramidMesh);
        
        return modelGroup;
    }
}

export default GuardHut;
