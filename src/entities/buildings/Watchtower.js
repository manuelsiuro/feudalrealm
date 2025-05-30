import * as THREE from 'three';
import Building from '../Building.js';
import { BUILDING_DATA } from '../../config/buildingData.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class Watchtower extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry = null, resourceFlowManager = null) {
        const buildingData = buildingDataEntry || BUILDING_DATA.WATCHTOWER;
        super(buildingData.key, gridX, gridZ, gameMap, buildingData, resourceFlowManager);

        // Model creation is handled by the base Building class
        // Model will be created when construction starts, not immediately
    }

    createModel() {
        const modelGroup = new THREE.Group();

        // Tower: A tall, relatively thin cylinder or square prism (color: Stone Grey)
        const towerHeight = TILE_SIZE * 2.25;
        const towerRadius = TILE_SIZE * 0.3;
        // Using a cylinder for a round tower
        const towerGeometry = new THREE.CylinderGeometry(towerRadius, towerRadius * 1.1, towerHeight, 12); // Slightly wider at base
        const towerMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 }); // Stone Grey (Grey)
        const towerMesh = new THREE.Mesh(towerGeometry, towerMaterial);
        towerMesh.position.y = towerHeight / 2;
        modelGroup.add(towerMesh);

        // Top: A slightly wider cylinder or square prism on top of the tower
        const topHeight = TILE_SIZE * 0.4;
        const topRadius = towerRadius + TILE_SIZE * 0.1;
        const topGeometry = new THREE.CylinderGeometry(topRadius, topRadius, topHeight, 12);
        const topMesh = new THREE.Mesh(topGeometry, towerMaterial); // Same material
        topMesh.position.y = towerHeight + topHeight / 2 - TILE_SIZE * 0.05; // Slightly overlap
        modelGroup.add(topMesh);

        // Crenellations: Small cubes arranged around its upper edge
        const crenellationSize = TILE_SIZE * 0.125;
        const crenellationHeight = TILE_SIZE * 0.15;
        const numCrenellations = 8;
        const crenellationGeometry = new THREE.BoxGeometry(crenellationSize, crenellationHeight, crenellationSize);
        
        for (let i = 0; i < numCrenellations; i++) {
            const angle = (Math.PI * 2 / numCrenellations) * i;
            const crenellationMesh = new THREE.Mesh(crenellationGeometry, towerMaterial);
            crenellationMesh.position.set(
                (topRadius - crenellationSize / 3) * Math.cos(angle),
                towerHeight + topHeight - crenellationHeight / 2 - TILE_SIZE * 0.05,
                (topRadius - crenellationSize / 3) * Math.sin(angle)
            );
            crenellationMesh.rotation.y = angle;
            modelGroup.add(crenellationMesh);
        }

        // Flag: A small red pyramid on the very top.
        const flagPoleHeight = TILE_SIZE * 0.3;
        const poleGeometry = new THREE.CylinderGeometry(TILE_SIZE * 0.015, TILE_SIZE * 0.015, flagPoleHeight, 6);
        const poleMaterial = new THREE.MeshPhongMaterial({color: 0x404040});
        const poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
        poleMesh.position.y = towerHeight + topHeight + flagPoleHeight/2 - TILE_SIZE * 0.05;
        modelGroup.add(poleMesh);

        const flagHeight = TILE_SIZE * 0.15;
        const flagBase = TILE_SIZE * 0.1;
        const flagGeometry = new THREE.ConeGeometry(flagBase/2, flagHeight, 4); // Pyramid shape
        const flagMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000 }); // Red
        const flagMesh = new THREE.Mesh(flagGeometry, flagMaterial);
        flagMesh.position.y = towerHeight + topHeight + flagPoleHeight + flagHeight/2 - TILE_SIZE * 0.05;
        flagMesh.rotation.y = Math.PI / 4; // Align one flat side of pyramid
        modelGroup.add(flagMesh);
        
        return modelGroup;
    }
}

export default Watchtower;
