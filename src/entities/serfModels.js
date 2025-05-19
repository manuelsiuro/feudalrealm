// src/entities/serfModels.js
import * as THREE from 'three';
import * as Resources from './resources.js'; // For tools
import { COLORS } from '../config/colors.js';

// Helper function to create a mesh
function createMesh(geometry, color, name = '') {
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    return mesh;
}

const BASE_SERF_BODY_COLOR = COLORS.BEIGE; // Neutral clothing
const BASE_SERF_HEAD_COLOR = COLORS.PEACH; // Skin tone

// --- Base Serf Model ---
export function createBaseSerf(bodyColor = BASE_SERF_BODY_COLOR, headColor = BASE_SERF_HEAD_COLOR) {
    const serfGroup = new THREE.Group();
    // Dimensions from units.md: medium-height. Let\'s define standard sizes.
    const bodyHeight = 0.6; 
    const bodyRadius = 0.18; 
    const headRadius = 0.1;  

    // Body: Upright, medium-height, slightly rounded cuboid or a simple cylinder.
    // Using a cylinder as it\'s simpler and often looks better than a blocky cuboid for characters.
    const bodyGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyHeight, 8);
    const bodyMesh = createMesh(bodyGeom, bodyColor, 'SerfBody');
    // Position body so its base is at y=0 for the serfGroup
    bodyMesh.position.y = bodyHeight / 2;
    serfGroup.add(bodyMesh);

    // Head: Sphere or a slightly rounded cube, placed on top of the body.
    const headGeom = new THREE.SphereGeometry(headRadius, 8, 6);
    const headMesh = createMesh(headGeom, headColor, 'SerfHead');
    // Position head on top of the body
    headMesh.position.y = bodyHeight + headRadius * 0.9; // Place it just on top
    serfGroup.add(headMesh);
    
    // The serfGroup\'s origin will be at the base of the feet.
    return serfGroup;
}

// --- Serf Profession Configuration Data ---
const SERF_PROFESSION_CONFIGS = {
    "Transporter": {
        baseBodyColor: BASE_SERF_BODY_COLOR,
        baseHeadColor: BASE_SERF_HEAD_COLOR,
        attire: [],
        items: []
    },
    "Builder": {
        baseBodyColor: BASE_SERF_BODY_COLOR,
        baseHeadColor: BASE_SERF_HEAD_COLOR,
        attire: [
            {
                name: 'Apron',
                geometry: { type: 'box', width: 0.25, height: 0.2, depth: 0.02 },
                color: COLORS.DARK_GREY,
                position: [0, (0.6 / 2) - 0.2 / 3, 0.18 / 2 + 0.02 / 2],
                attachTo: 'SerfBody'
            }
        ],
        items: [
            {
                type: 'Hammer', name: 'BuilderHammer',
                scale: [0.45, 0.45, 0.45],
                position: [0.12, 0.3, 0.1],
                rotation: [Math.PI / 6, -Math.PI / 4, Math.PI / 3]
            }
        ]
    },
    "Woodcutter": {
        baseBodyColor: BASE_SERF_BODY_COLOR,
        baseHeadColor: BASE_SERF_HEAD_COLOR,
        attire: [],
        items: [
            {
                type: 'Axe', name: 'WoodcutterAxe',
                scale: [0.45, 0.45, 0.45],
                position: [0.12, 0.3, 0.1],
                rotation: [Math.PI / 2, Math.PI / 6, -Math.PI / 4]
            }
        ]
    },
    "Forester": {
        baseBodyColor: COLORS.DARK_GREEN,
        baseHeadColor: BASE_SERF_HEAD_COLOR,
        attire: [],
        items: [
            {
                name: 'Sapling',
                geometry: { type: 'cone', radius: 0.04, height: 0.12, radialSegments: 6 },
                color: COLORS.GREEN,
                position: [0.1, 0.25, 0.05],
                rotation: [Math.PI / 6, 0, 0]
            }
        ]
    },
    "Stonemason": {
        baseBodyColor: BASE_SERF_BODY_COLOR,
        baseHeadColor: BASE_SERF_HEAD_COLOR,
        attire: [],
        items: [
            {
                type: 'Pickaxe', name: 'StonemasonPickaxe',
                scale: [0.40, 0.40, 0.40],
                position: [0.12, 0.3, 0.05],
                rotation: [Math.PI / 2, Math.PI / 3, -Math.PI / 3]
            }
        ]
    },
    "Miner": {
        baseBodyColor: BASE_SERF_BODY_COLOR,
        baseHeadColor: BASE_SERF_HEAD_COLOR,
        attire: [
            {
                name: 'HelmetBase',
                geometry: { type: 'cylinder', radiusTop: 0.1 * 0.9, radiusBottom: 0.1 * 0.8, height: 0.05, radialSegments: 8 },
                color: COLORS.YELLOW,
                position: [0, 0.6 + 0.1 * 0.9 + 0.1 * 0.3 + 0.05 / 2, 0], // Approximated from original
                children: [ // Child meshes for the helmet
                    {
                        name: 'HelmetLamp',
                        geometry: { type: 'cylinder', radiusTop: 0.02, radiusBottom: 0.02, height: 0.04, radialSegments: 6 },
                        color: COLORS.DARK_GREY,
                        position: [0, 0.05 / 2, 0.1 * 0.8], // Relative to HelmetBase
                        rotation: [Math.PI / 2.5, 0, 0]
                    }
                ]
            }
        ],
        items: [
            {
                type: 'Pickaxe', name: 'MinerPickaxe',
                scale: [0.40, 0.40, 0.40],
                position: [0.12, 0.3, 0.05],
                rotation: [Math.PI / 2, Math.PI / 3, -Math.PI / 3]
            }
        ]
    },
    "Farmer": {
        baseBodyColor: BASE_SERF_BODY_COLOR,
        baseHeadColor: BASE_SERF_HEAD_COLOR,
        attire: [
            {
                name: 'FarmerHatBrim',
                geometry: { type: 'cylinder', radiusTop: 0.15, radiusBottom: 0.15, height: 0.03, radialSegments: 12 },
                color: COLORS.MEDIUM_BROWN,
                position: [0, 0.6 + 0.1 * 0.9 + 0.1 * 0.8 + 0.03 / 2, 0], // Approximated
                children: [
                    {
                        name: 'FarmerHatCrown',
                        geometry: { type: 'cylinder', radiusTop: 0.08 * 0.9, radiusBottom: 0.08, height: 0.06, radialSegments: 12 },
                        color: COLORS.MEDIUM_BROWN,
                        position: [0, 0.03 / 2 + 0.06 / 2, 0] // Relative to Brim
                    }
                ]
            }
        ],
        items: [
            {
                type: 'Scythe', name: 'FarmerScythe',
                scale: [0.45, 0.45, 0.45],
                position: [0.12, 0.25, 0],
                rotation: [0, -Math.PI / 4, -Math.PI / 2.5]
            }
        ]
    },
    "Fisherman": {
        baseBodyColor: COLORS.LIGHT_BLUE,
        baseHeadColor: BASE_SERF_HEAD_COLOR,
        attire: [],
        items: [
            {
                type: 'FishingRod', name: 'FishermanRod',
                scale: [0.45, 0.45, 0.45],
                position: [0.1, 0.2, 0.15],
                rotation: [Math.PI / 3, -Math.PI / 3, -Math.PI / 2.2]
            }
        ]
    },
    "Miller": {
        baseBodyColor: COLORS.OFF_WHITE,
        baseHeadColor: BASE_SERF_HEAD_COLOR,
        attire: [],
        items: [
            {
                type: 'FlourSack', name: 'MillerFlourSack',
                scale: [0.25, 0.25, 0.25],
                position: [0.12, 0.1, 0],
                rotation: [0,0,0]
            }
        ]
    },
    "Baker": {
        baseBodyColor: BASE_SERF_BODY_COLOR,
        baseHeadColor: BASE_SERF_HEAD_COLOR,
        attire: [
            {
                name: 'ChefsHatCylinder',
                geometry: { type: 'cylinder', radiusTop: 0.09, radiusBottom: 0.07, height: 0.12, radialSegments: 12 },
                color: COLORS.WHITE,
                position: [0, 0.6 + 0.1 * 0.9 + 0.1 * 0.8 + 0.12 / 2, 0], // Approximated
                children: [
                    {
                        name: 'ChefsHatPuff',
                        geometry: { type: 'sphere', radius: 0.09 * 1.1, widthSegments: 10, heightSegments: 8 },
                        color: COLORS.WHITE,
                        position: [0, 0.12 / 2 - (0.09 * 1.1) * 0.2, 0] // Relative
                    }
                ]
            },
            {
                name: 'BakerApron',
                geometry: { type: 'box', width: 0.25, height: 0.25, depth: 0.01 },
                color: COLORS.WHITE,
                position: [0, (0.6 / 2) - 0.25 / 2.5, 0.18 / 2 + 0.01 / 2],
                attachTo: 'SerfBody'
            }
        ],
        items: []
    },
    "PigFarmer": {
        baseBodyColor: BASE_SERF_BODY_COLOR,
        baseHeadColor: BASE_SERF_HEAD_COLOR,
        attire: [
            {
                name: 'MudPatch1',
                geometry: { type: 'box', width: 0.05, height: 0.08, depth: 0.01 },
                color: COLORS.MEDIUM_BROWN,
                position: [0.05, 0.1, 0.18 / 2 + 0.005],
                rotation: [0, Math.PI / 6, 0],
                attachTo: 'SerfBody'
            },
            {
                name: 'MudPatch2',
                geometry: { type: 'box', width: 0.05, height: 0.08, depth: 0.01 },
                color: COLORS.MEDIUM_BROWN,
                position: [-0.06, 0.15, 0.18 / 2 + 0.005],
                rotation: [0, -Math.PI / 8, 0],
                attachTo: 'SerfBody'
            }
        ],
        items: [
            {
                name: 'Bucket',
                geometry: { type: 'cylinder', radiusTop: 0.05, radiusBottom: 0.04, height: 0.07, radialSegments: 8 },
                color: COLORS.MEDIUM_BROWN,
                position: [0.12, 0.1, 0],
                children: [
                    {
                        name: 'BucketHandle',
                        geometry: { type: 'cylinder', radiusTop: 0.005, radiusBottom: 0.005, height: 0.05 * 2.2, radialSegments: 6 },
                        color: COLORS.DARK_GREY,
                        position: [0, 0.07 / 2 - 0.005, 0],
                        rotation: [0, 0, Math.PI / 2]
                    }
                ]
            }
        ]
    },
    "Butcher": {
        baseBodyColor: BASE_SERF_BODY_COLOR,
        baseHeadColor: BASE_SERF_HEAD_COLOR,
        attire: [
            {
                name: 'ButcherApron',
                geometry: { type: 'box', width: 0.26, height: 0.28, depth: 0.015 },
                color: COLORS.MAROON,
                position: [0, (0.6 / 2) - 0.28 / 2.5, 0.18 / 2 + 0.015 / 2],
                attachTo: 'SerfBody'
            }
        ],
        items: [
            { // Cleaver (as a group of meshes)
                name: 'CleaverAssembly',
                isGroup: true, // Indicates this item itself is a group to be constructed
                position: [0.1, 0.25, 0.05],
                rotation: [0, -Math.PI/3, Math.PI/2.5],
                scale: [1.3, 1.3, 1.3],
                children: [
                    {
                        name: 'CleaverBlade',
                        geometry: { type: 'box', length: 0.1, height: 0.05, thick: 0.008 }, // Use custom params for clarity
                        color: COLORS.GREY,
                        position: [0,0,0], // Relative to CleaverAssembly group
                        children: [
                             {
                                name: 'CleaverHandle',
                                geometry: { type: 'cylinder', radiusTop: 0.01, radiusBottom: 0.01, height: 0.07, radialSegments: 6 },
                                color: COLORS.MEDIUM_BROWN,
                                position: [-0.1/2 - 0.07/2 + 0.01, 0, 0], // Relative to Blade
                                rotation: [0, 0, Math.PI/2]
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "SawmillWorker": {
        baseBodyColor: BASE_SERF_BODY_COLOR,
        baseHeadColor: BASE_SERF_HEAD_COLOR,
        attire: [
            {
                name: 'SawmillApron',
                geometry: { type: 'box', width: 0.25, height: 0.25, depth: 0.015 },
                color: COLORS.MEDIUM_BROWN,
                position: [0, (0.6 / 2) - 0.25 / 2.5, 0.18 / 2 + 0.015 / 2],
                attachTo: 'SerfBody'
            }
        ],
        items: [
            {
                type: 'Plank', name: 'SawmillPlank',
                scale: [0.35, 0.35, 0.35],
                position: [0.1, 0.15, -0.05],
                rotation: [Math.PI / 6, Math.PI / 3, -Math.PI / 5]
            }
        ]
    },
    "SmelterWorker": {
        baseBodyColor: COLORS.DARK_GREY,
        baseHeadColor: BASE_SERF_HEAD_COLOR,
        attire: [
            {
                name: 'SmelterApron',
                geometry: { type: 'box', width: 0.27, height: 0.3, depth: 0.02 },
                color: COLORS.BLACK,
                position: [0, (0.6 / 2) - 0.3 / 2.5, 0.18 / 2 + 0.02 / 2],
                attachTo: 'SerfBody'
            }
        ],
        items: [
            {
                name: 'Poker',
                geometry: { type: 'cylinder', radiusTop: 0.01, radiusBottom: 0.01, height: 0.5, radialSegments: 6 },
                color: COLORS.DARK_METALLIC_GREY,
                position: [0.08, 0.2, 0.05],
                rotation: [Math.PI / 2.2, Math.PI / 5, -Math.PI / 3]
            }
        ]
    },
    "Goldsmith": {
        baseBodyColor: BASE_SERF_BODY_COLOR,
        baseHeadColor: BASE_SERF_HEAD_COLOR,
        attire: [
            {
                name: 'ChestPatch',
                geometry: { type: 'box', width: 0.06, height: 0.06, depth: 0.01 },
                color: COLORS.YELLOW,
                position: [0.05, 0.6 / 2 + 0.05, 0.18 / 2 + 0.005],
                attachTo: 'SerfBody'
            }
        ],
        items: [
            {
                type: 'GoldBar', name: 'GoldsmithGoldBar',
                scale: [0.3, 0.3, 0.3],
                position: [0.1, 0.15, 0],
                rotation: [0,0,0]
            }
        ]
    },
    "Toolmaker": {
        baseBodyColor: BASE_SERF_BODY_COLOR,
        baseHeadColor: BASE_SERF_HEAD_COLOR,
        attire: [
            {
                name: 'ToolmakerApron',
                geometry: { type: 'box', width: 0.25, height: 0.28, depth: 0.015 },
                color: COLORS.MEDIUM_BROWN,
                position: [0, (0.6 / 2) - 0.28 / 2.5, 0.18 / 2 + 0.015 / 2],
                attachTo: 'SerfBody'
            }
        ],
        items: [
            {
                name: 'Toolbox',
                geometry: { type: 'box', width: 0.12, height: 0.08, depth: 0.06 },
                color: COLORS.MEDIUM_BROWN,
                position: [0.1, 0.1, 0],
                children: [
                    {
                        name: 'ToolboxHandle',
                        geometry: { type: 'cylinder', radiusTop: 0.008, radiusBottom: 0.008, height: 0.12 * 0.7, radialSegments: 4 },
                        color: COLORS.DARK_GREY,
                        position: [0, 0.08 / 2, 0],
                        rotation: [0, 0, Math.PI / 2]
                    }
                ]
            }
        ]
    },
    "Blacksmith": {
        baseBodyColor: COLORS.DARK_GREY,
        baseHeadColor: BASE_SERF_HEAD_COLOR,
        attire: [
            {
                name: 'BlacksmithApron',
                geometry: { type: 'box', width: 0.28, height: 0.3, depth: 0.02 },
                color: COLORS.BLACK,
                position: [0, (0.6 / 2) - 0.3 / 2.5, 0.18 / 2 + 0.02 / 2],
                attachTo: 'SerfBody'
            }
        ],
        items: [
            {
                type: 'Hammer', name: 'BlacksmithHammer',
                scale: [0.55, 0.55, 0.55], // Larger
                position: [0.13, 0.3, 0.1],
                rotation: [Math.PI / 6, -Math.PI / 4, Math.PI / 3]
            }
        ]
    },
    "Geologist": {
        baseBodyColor: BASE_SERF_BODY_COLOR,
        baseHeadColor: BASE_SERF_HEAD_COLOR,
        attire: [
             {
                name: 'GeologistHatBrim',
                geometry: { type: 'cylinder', radiusTop: 0.16, radiusBottom: 0.16, height: 0.03, radialSegments: 10 },
                color: COLORS.MEDIUM_BROWN,
                position: [0, 0.6 + 0.1*0.9 + 0.1 * 0.8 + 0.03/2, 0], // Approximated
                children: [
                    {
                        name: 'GeologistHatCrown',
                        geometry: { type: 'cylinder', radiusTop: 0.08 * 0.95, radiusBottom: 0.08, height: 0.05, radialSegments: 10 },
                        color: COLORS.MEDIUM_BROWN,
                        position: [0, 0.03/2 + 0.05/2, 0]
                    }
                ]
            }
        ],
        items: [
            {
                name: 'MapScroll',
                geometry: { type: 'cylinder', radiusTop: 0.025, radiusBottom: 0.025, height: 0.12, radialSegments: 8 },
                color: COLORS.BEIGE,
                position: [0.1, 0.15, 0],
                rotation: [0, 0, Math.PI / 6]
            }
        ]
    },
    "Knight": {
        baseBodyColor: "PLAYER_COLOR", // Special keyword for dynamic color
        baseHeadColor: COLORS.DARK_METALLIC_GREY,
        specialVisuals: { // For non-standard modifications like scaling base parts
            bodyScale: [1.1, 1.0, 1.1], // scale x, y, z for SerfBody (y is height, so typically 1.0)
            headScale: [1.1, 1.1, 1.1],
        },
        attire: [
            {
                name: 'HelmetCrest',
                geometry: { type: 'box', width: 0.02, height: 0.1, depth: 0.05 },
                color: "PLAYER_COLOR",
                position: [0, 0.1 * 1.1 * 0.5, 0], // Relative to scaled head's top-ish center
                attachTo: 'SerfHead' // Will be attached to the possibly scaled head
            }
        ],
        items: [
            {
                type: 'Sword', name: 'KnightSword',
                scale: [0.55, 0.55, 0.55],
                position: [0.15, 0.25, 0.05],
                rotation: [Math.PI / 2.2, Math.PI / 7, -Math.PI / 4],
                partColors: [ // For coloring parts of the item from Resources.js
                    { partName: 'SwordHilt', color: "PLAYER_COLOR" },
                    { partName: 'SwordCrossguard', color: "PLAYER_COLOR" }
                ]
            },
            {
                type: 'Shield', name: 'KnightShield',
                scale: [0.6, 0.6, 0.6],
                position: [-0.12, 0.2, 0.12],
                rotation: [0, -Math.PI / 3, Math.PI / 12],
                partColors: [
                    { partName: 'ShieldEmblem', color: "PLAYER_COLOR" },
                    // Fallback for shield emblem if 'ShieldEmblem' is not found
                    { partNameQueryAlternative: { parentName: 'ShieldBody', childIndex: 0 }, color: "PLAYER_COLOR" }
                ]
            }
        ]
    }
};

// --- Generic Serf Model Creation Function ---
function createSerfFromData(config, professionName, dynamicColor = null) {
    const bodyColor = (config.baseBodyColor === "PLAYER_COLOR" && dynamicColor) ? dynamicColor : config.baseBodyColor;
    const headColor = (config.baseHeadColor === "PLAYER_COLOR" && dynamicColor) ? dynamicColor : config.baseHeadColor;
    
    const serf = createBaseSerf(bodyColor || BASE_SERF_BODY_COLOR, headColor || BASE_SERF_HEAD_COLOR);
    serf.name = professionName;

    // Apply special visuals like scaling
    if (config.specialVisuals) {
        if (config.specialVisuals.bodyScale) {
            const body = serf.getObjectByName('SerfBody');
            if (body) body.scale.set(...config.specialVisuals.bodyScale);
        }
        if (config.specialVisuals.headScale) {
            const head = serf.getObjectByName('SerfHead');
            if (head) head.scale.set(...config.specialVisuals.headScale);
        }
    }
    
    // Function to recursively create and add meshes (for attire and custom items)
    function processMeshConfig(meshConfig, parentObject) {
        let geom;
        const geoConf = meshConfig.geometry;
        if (geoConf) {
            switch (geoConf.type) {
                case 'box':
                    geom = new THREE.BoxGeometry(geoConf.width, geoConf.height, geoConf.depth);
                    break;
                case 'cylinder':
                    geom = new THREE.CylinderGeometry(geoConf.radiusTop, geoConf.radiusBottom, geoConf.height, geoConf.radialSegments || 8);
                    break;
                case 'sphere':
                    geom = new THREE.SphereGeometry(geoConf.radius, geoConf.widthSegments || 8, geoConf.heightSegments || 6);
                    break;
                case 'cone':
                    geom = new THREE.ConeGeometry(geoConf.radius, geoConf.height, geoConf.radialSegments || 6);
                    break;
                // Add more geometry types if needed
            }
        }

        let mesh;
        if (geom) {
             const meshColorValue = (meshConfig.color === "PLAYER_COLOR" && dynamicColor) ? dynamicColor : meshConfig.color;
             mesh = createMesh(geom, meshColorValue, meshConfig.name);
        } else if (meshConfig.isGroup) {
            mesh = new THREE.Group();
            mesh.name = meshConfig.name;
        }


        if (!mesh) return; // Should not happen if config is correct

        if (meshConfig.position) mesh.position.set(...meshConfig.position);
        if (meshConfig.rotation) mesh.rotation.set(...meshConfig.rotation);
        if (meshConfig.scale) mesh.scale.set(...meshConfig.scale);

        parentObject.add(mesh);

        if (meshConfig.children) {
            meshConfig.children.forEach(childConfig => processMeshConfig(childConfig, mesh));
        }
        return mesh;
    }

    // Add attire
    if (config.attire) {
        config.attire.forEach(attireConfig => {
            const attachTargetName = attireConfig.attachTo;
            const parentObject = attachTargetName ? serf.getObjectByName(attachTargetName) : serf;
            if (parentObject) {
                processMeshConfig(attireConfig, parentObject);
            } else {
                console.warn(`Could not find attach target \'\'\'${attachTargetName}\'\'\' for attire \'\'\'${attireConfig.name}\'\'\' in ${professionName}`);
            }
        });
    }

    // Add items (from Resources.js or custom geometry)
    if (config.items) {
        config.items.forEach(itemConfig => {
            let itemModel;
            if (itemConfig.type) { // Item from Resources.js
                const createFunctionName = 'create' + itemConfig.type;
                if (Resources[createFunctionName]) {
                    itemModel = Resources[createFunctionName]();
                } else {
                    console.warn(`Resource creation function ${createFunctionName} not found.`);
                    return;
                }
            } else if (itemConfig.geometry || itemConfig.isGroup) { // Custom item defined by geometry or as a group
                 itemModel = processMeshConfig(itemConfig, new THREE.Group()); // Create it detached first, then add to serf
                 if (!itemModel) return;
            }


            if (!itemModel) return;
            
            itemModel.name = itemConfig.name || (itemConfig.type ? itemConfig.type + 'Item' : 'CustomItem');

            // Apply transformations AFTER getting the model from Resources or creating it
            if (itemConfig.scale) itemModel.scale.set(...itemConfig.scale);
            if (itemConfig.position) itemModel.position.set(...itemConfig.position);
            if (itemConfig.rotation) itemModel.rotation.set(...itemConfig.rotation);
            
            // Color parts of the item if specified
            if (itemConfig.partColors) {
                itemConfig.partColors.forEach(pc => {
                    let partToColor;
                    if (pc.partName) {
                        partToColor = itemModel.getObjectByName(pc.partName);
                    }
                    
                    // Handle fallback for Knight's shield emblem coloring
                    if (!partToColor && pc.partNameQueryAlternative) {
                        const altQuery = pc.partNameQueryAlternative;
                        const parentPart = itemModel.getObjectByName(altQuery.parentName);
                        if (parentPart && parentPart.children[altQuery.childIndex] && parentPart.children[altQuery.childIndex].material) {
                            partToColor = parentPart.children[altQuery.childIndex];
                        }
                    }

                    if (partToColor && partToColor.material) {
                        const partColorValue = (pc.color === "PLAYER_COLOR" && dynamicColor) ? dynamicColor : pc.color;
                        partToColor.material.color.set(partColorValue);
                    } else {
                        // console.warn(`Part \'\'\'${pc.partName || 'alternative'}\'\'\' not found or has no material on item \'\'\'${itemModel.name}\'\'\' for ${professionName}`);
                    }
                });
            }
            serf.add(itemModel);
        });
    }
    return serf;
}

// --- Exported Model Creators Map ---
export const SERF_MODEL_CREATORS = {};

for (const professionName in SERF_PROFESSION_CONFIGS) {
    const config = SERF_PROFESSION_CONFIGS[professionName];
    if (professionName === "Knight") {
        // Knight needs to pass the dynamicColor (playerColor)
        SERF_MODEL_CREATORS[professionName] = (playerColor = COLORS.PLAYER_FACTION_DEFAULT) =>
            createSerfFromData(config, professionName, playerColor);
    } else {
        SERF_MODEL_CREATORS[professionName] = () => createSerfFromData(config, professionName);
    }
}
