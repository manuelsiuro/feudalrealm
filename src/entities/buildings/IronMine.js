import * as THREE from 'three';
import Mine from './Mine.js'; // Import the base Mine class

class IronMine extends Mine {
    constructor(gridX, gridZ, gameMap, buildingDataEntry) {
        const oreColor = 0xFF0000; // Red for Iron
        super(buildingDataEntry.key, gridX, gridZ, gameMap, buildingDataEntry, oreColor);
        // The model is already created by the Mine constructor, which calls createModel.
        // If IronMine needs a *different* overall structure beyond the ore indicator, 
        // then it would override createModel(). For now, it only customizes the indicator color.
    }

    // Optionally, if Iron Mine needs a different shape for its indicator (e.g., not a cube)
    // it could override createOreIndicatorModel. For now, a red cube is fine as per buildings.md.
    // createOreIndicatorModel(color) {
    //     // ... custom geometry for iron indicator ...
    //     const indicatorSize = TILE_SIZE * 0.15;
    //     const geometry = new THREE.BoxGeometry(indicatorSize, indicatorSize, indicatorSize); // Default is cube
    //     const material = new THREE.MeshStandardMaterial({ color: color });
    //     const mesh = new THREE.Mesh(geometry, material);
    //     mesh.castShadow = true;
    //     return mesh;
    // }
}

export default IronMine;
