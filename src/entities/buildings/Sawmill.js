import * as THREE from 'three';
import Building from '../Building.js';
import { BUILDING_DATA } from '../../config/buildingData.js';
import { TILE_SIZE } from '../../config/mapConstants.js';

class Sawmill extends Building {
    constructor(gridX, gridZ, gameMap, buildingDataEntry = null, resourceFlowManager = null) {
        const buildingData = buildingDataEntry || BUILDING_DATA.SAWMILL;
        super(buildingData.key, gridX, gridZ, gameMap, buildingData, resourceFlowManager);

        // Model creation is handled by the base Building class
        // Model will be created when construction starts, not immediately
    }

    createModel() {
        const modelGroup = new THREE.Group();

        const mainBuildingWidth = TILE_SIZE * 0.8;
        const mainBuildingHeight = TILE_SIZE * 0.6;
        const mainBuildingDepth = TILE_SIZE * 0.7;

        // Main Building: Medium-sized cuboid (color: Brown)
        const mainBuildingGeometry = new THREE.BoxGeometry(mainBuildingWidth, mainBuildingHeight, mainBuildingDepth);
        const mainBuildingMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // Brown
        const mainBuildingMesh = new THREE.Mesh(mainBuildingGeometry, mainBuildingMaterial);
        mainBuildingMesh.position.y = mainBuildingHeight / 2;
        modelGroup.add(mainBuildingMesh);

        // Roof: A sloped cuboid roof (color: Dark Brown)
        const roofHeight = TILE_SIZE * 0.2;
        const roofOverhang = TILE_SIZE * 0.05;
        const roofGeometry = new THREE.BoxGeometry(
            mainBuildingWidth + roofOverhang * 2,
            roofHeight,
            mainBuildingDepth + roofOverhang * 2
        );
        const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x5C3317 }); // Dark Brown
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        roofMesh.position.y = mainBuildingHeight + roofHeight / 2;
        // For a simple sloped roof, we can make one side higher than the other by rotating the geometry
        // Or, more simply, just a flat cuboid slightly larger.
        // For a gabled roof:
        // Create two planes or two thin, rotated cuboids.
        // For simplicity, using a slightly thicker, flat roof for now as "sloped cuboid" can be ambiguous.
        // A true sloped roof (like a lean-to) would involve more complex geometry or rotation.
        // Let's make a simple gabled roof with two cuboids.
        modelGroup.remove(roofMesh); // Remove if we are redoing it.

        const roofPanelWidth = mainBuildingWidth + roofOverhang * 2;
        const roofPanelDepth = (mainBuildingDepth / 2) + roofOverhang;
        const roofPanelThickness = TILE_SIZE * 0.1;
        
        const roofPanel1Geometry = new THREE.BoxGeometry(roofPanelWidth, roofPanelThickness, roofPanelDepth);
        const roofPanel1Mesh = new THREE.Mesh(roofPanel1Geometry, roofMaterial);
        roofPanel1Mesh.position.set(0, mainBuildingHeight + roofHeight * 0.6, mainBuildingDepth * 0.25);
        roofPanel1Mesh.rotation.x = -Math.PI / 7; // Approx 25 degrees slope
        modelGroup.add(roofPanel1Mesh);

        const roofPanel2Geometry = new THREE.BoxGeometry(roofPanelWidth, roofPanelThickness, roofPanelDepth);
        const roofPanel2Mesh = new THREE.Mesh(roofPanel2Geometry, roofMaterial);
        roofPanel2Mesh.position.set(0, mainBuildingHeight + roofHeight * 0.6, -mainBuildingDepth * 0.25);
        roofPanel2Mesh.rotation.x = Math.PI / 7; // Approx 25 degrees slope
        modelGroup.add(roofPanel2Mesh);


        // Processing Area: An open-sided extension or a slightly lower, longer cuboid attached
        const processingAreaWidth = TILE_SIZE * 0.5;
        const processingAreaHeight = TILE_SIZE * 0.4;
        const processingAreaDepth = TILE_SIZE * 0.9;
        const processingAreaGeometry = new THREE.BoxGeometry(processingAreaWidth, processingAreaHeight, processingAreaDepth);
        const processingAreaMaterial = new THREE.MeshPhongMaterial({ color: 0xA0522D }); // Lighter Brown (Sienna)
        const processingAreaMesh = new THREE.Mesh(processingAreaGeometry, processingAreaMaterial);
        // Position it to the side of the main building (e.g., positive X)
        processingAreaMesh.position.set(mainBuildingWidth / 2 + processingAreaWidth / 2 + TILE_SIZE * 0.05, processingAreaHeight / 2, 0);
        modelGroup.add(processingAreaMesh);

        // Logs (cylinders) at one end of processing area
        const logRadius = TILE_SIZE * 0.08;
        const logLength = TILE_SIZE * 0.6;
        const logGeometry = new THREE.CylinderGeometry(logRadius, logRadius, logLength, 8);
        const logMaterial = new THREE.MeshPhongMaterial({ color: 0xDEB887 }); // BurlyWood (Light Brown)
        
        const log1Mesh = new THREE.Mesh(logGeometry, logMaterial);
        // Position logs near the processing area
        log1Mesh.position.set(processingAreaMesh.position.x, logRadius, processingAreaDepth / 2 - logLength / 2 - TILE_SIZE * 0.05);
        log1Mesh.rotation.x = Math.PI / 2; // Laying down along Z axis
        modelGroup.add(log1Mesh);

        const log2Mesh = new THREE.Mesh(logGeometry, logMaterial);
        log2Mesh.position.set(processingAreaMesh.position.x + logRadius * 2.2, logRadius, processingAreaDepth / 2 - logLength / 2 - TILE_SIZE * 0.05);
        log2Mesh.rotation.x = Math.PI / 2;
        modelGroup.add(log2Mesh);
        
        const log3Mesh = new THREE.Mesh(logGeometry, logMaterial);
        log3Mesh.position.set(processingAreaMesh.position.x + logRadius * 1.1, logRadius * 3, processingAreaDepth / 2 - logLength / 2 - TILE_SIZE * 0.05);
        log3Mesh.rotation.x = Math.PI / 2;
        modelGroup.add(log3Mesh);

        // Planks (thin cuboids) at the other end
        const plankWidth = TILE_SIZE * 0.1;
        const plankHeight = TILE_SIZE * 0.02;
        const plankLength = TILE_SIZE * 0.5;
        const plankGeometry = new THREE.BoxGeometry(plankWidth, plankHeight, plankLength);
        const plankMaterial = new THREE.MeshPhongMaterial({ color: 0xD2B48C }); // Tan (light planks)

        for (let i = 0; i < 5; i++) {
            const plankMesh = new THREE.Mesh(plankGeometry, plankMaterial);
            plankMesh.position.set(
                processingAreaMesh.position.x,
                plankHeight / 2 + (plankHeight * i * 1.1), // Stacked
                -processingAreaDepth / 2 + plankLength / 2 + TILE_SIZE * 0.05
            );
            modelGroup.add(plankMesh);
        }
        
        modelGroup.scale.set(0.8, 0.8, 0.8); // Overall scaling if needed, can be adjusted
        // modelGroup.traverse((child) => {
        //     if (child.isMesh) {
        //         child.castShadow = true;
        //         child.receiveShadow = true;
        //     }
        // });

        return modelGroup;
    }

    /**
     * Update method for the Sawmill using enhanced production chain processing.
     * @param {number} deltaTime - The time elapsed since the last update in milliseconds.
     * @param {number} currentTime - The current game time (e.g., Date.now()).
     */
    update(deltaTime, currentTime) {
        super.update(deltaTime, currentTime); // Base update (handles construction, etc.)

        // Use the enhanced production chain processing from the base class
        this.updateProductionChain(deltaTime, currentTime);
    }

    /**
     * Gets the current production status for UI display.
     * @returns {object} Status information for the sawmill
     */
    getStatus() {
        const baseStatus = this.getProductionChainStatus();
        return {
            ...baseStatus,
            buildingType: 'Sawmill',
            specialty: 'Wood Processing',
            currentProduct: this.producesMaterials.length > 0 ? this.producesMaterials[0].resource : 'None',
            efficiency: this.workers.length > 0 ? (this.workers.length / this.jobSlots) * 100 : 0
        };
    }

    // ... other methods
}

export default Sawmill;
