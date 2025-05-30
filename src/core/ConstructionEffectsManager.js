// src/core/ConstructionEffectsManager.js
import * as THREE from 'three';
import { TILE_SIZE } from '../config/mapConstants.js';

/**
 * ConstructionEffectsManager - Advanced visual effects for building construction
 * Provides immersive construction feedback including transparency, particles, scaffolding, and animations
 */
export class ConstructionEffectsManager {
    constructor(scene, resourceFlowManager) {
        this.scene = scene;
        this.resourceFlowManager = resourceFlowManager;
        
        // Effect tracking
        this.activeConstructions = new Map(); // buildingId -> construction data
        this.dustSystems = new Map(); // buildingId -> dust particle system
        this.scaffoldingSystems = new Map(); // buildingId -> scaffolding objects
        this.soundEffects = new Map(); // buildingId -> sound instances
        
        // Visual groups
        this.effectsGroup = new THREE.Group();
        this.effectsGroup.name = "ConstructionEffects";
        this.scene.add(this.effectsGroup);
        
        this.dustGroup = new THREE.Group();
        this.dustGroup.name = "ConstructionDust";
        this.effectsGroup.add(this.dustGroup);
        
        this.scaffoldingGroup = new THREE.Group();
        this.scaffoldingGroup.name = "ConstructionScaffolding";
        this.effectsGroup.add(this.scaffoldingGroup);
        
        // Configuration
        this.config = {
            isEnabled: true,
            showDustParticles: true,
            showScaffolding: true,
            showTransparency: true,
            showAnimations: true,
            dustIntensity: 1.0,
            animationSpeed: 1.0,
            maxDustParticles: 50,
            scaffoldingDetail: 0.8, // 0-1, how detailed scaffolding should be
        };
        
        // Material cache for transparency effects
        this.originalMaterials = new Map(); // buildingId -> original materials
        this.transparentMaterials = new Map(); // buildingId -> transparent materials
        
        // Animation state
        this.lastUpdate = 0;
        this.animationTime = 0;
        
        console.log('🏗️ ConstructionEffectsManager initialized');
    }
    
    /**
     * Start construction effects for a building
     */
    startConstructionEffects(building) {
        if (!this.config.isEnabled || !building || !building.model) return;
        
        const buildingId = building.id;
        console.log(`🏗️ Starting construction effects for ${building.name} (${buildingId})`);
        
        // Initialize construction data
        const constructionData = {
            building,
            startTime: Date.now(),
            lastUpdate: Date.now(),
            effectIntensity: 1.0,
            dustTimer: 0,
            scaffoldingComplete: false,
            transparencyApplied: false
        };
        
        this.activeConstructions.set(buildingId, constructionData);
        
        // Apply initial transparency effect
        if (this.config.showTransparency) {
            this.applyTransparencyEffect(building);
        }
        
        // Create scaffolding
        if (this.config.showScaffolding) {
            this.createScaffolding(building);
        }
        
        // Initialize dust particles
        if (this.config.showDustParticles) {
            this.createDustSystem(building);
        }
    }
    
    /**
     * Stop construction effects for a building
     */
    stopConstructionEffects(building) {
        if (!building) return;
        
        const buildingId = building.id;
        console.log(`🏗️ Stopping construction effects for ${building.name} (${buildingId})`);
        
        // Remove transparency effect
        this.removeTransparencyEffect(building);
        
        // Remove scaffolding
        this.removeScaffolding(buildingId);
        
        // Remove dust system
        this.removeDustSystem(buildingId);
        
        // Clean up data
        this.activeConstructions.delete(buildingId);
    }
    
    /**
     * Apply transparency effect to building during construction
     */
    applyTransparencyEffect(building) {
        if (!building.model || this.transparentMaterials.has(building.id)) return;
        
        const originalMaterials = [];
        const transparentMaterials = [];
        
        building.model.traverse((child) => {
            if (child.isMesh && child.material) {
                // Store original material
                originalMaterials.push({
                    mesh: child,
                    material: child.material
                });
                
                // Create transparent version
                let transparentMaterial;
                if (Array.isArray(child.material)) {
                    transparentMaterial = child.material.map(mat => this.createTransparentMaterial(mat));
                } else {
                    transparentMaterial = this.createTransparentMaterial(child.material);
                }
                
                transparentMaterials.push({
                    mesh: child,
                    material: transparentMaterial
                });
                
                // Apply transparent material
                child.material = transparentMaterial;
            }
        });
        
        this.originalMaterials.set(building.id, originalMaterials);
        this.transparentMaterials.set(building.id, transparentMaterials);
    }
    
    /**
     * Create transparent version of a material
     */
    createTransparentMaterial(originalMaterial) {
        const transparentMaterial = originalMaterial.clone();
        transparentMaterial.transparent = true;
        transparentMaterial.opacity = 0.3; // Start very transparent
        transparentMaterial.depthWrite = false; // Prevent z-fighting issues
        return transparentMaterial;
    }
    
    /**
     * Remove transparency effect and restore original materials
     */
    removeTransparencyEffect(building) {
        if (!this.originalMaterials.has(building.id)) return;
        
        const originalMaterials = this.originalMaterials.get(building.id);
        
        // Restore original materials
        originalMaterials.forEach(({ mesh, material }) => {
            if (mesh && material) {
                mesh.material = material;
            }
        });
        
        // Dispose transparent materials
        const transparentMaterials = this.transparentMaterials.get(building.id);
        if (transparentMaterials) {
            transparentMaterials.forEach(({ material }) => {
                if (Array.isArray(material)) {
                    material.forEach(mat => mat.dispose());
                } else if (material) {
                    material.dispose();
                }
            });
        }
        
        this.originalMaterials.delete(building.id);
        this.transparentMaterials.delete(building.id);
    }
    
    /**
     * Create scaffolding around the building
     */
    createScaffolding(building) {
        if (!building.model || this.scaffoldingSystems.has(building.id)) return;
        
        const scaffoldingGroup = new THREE.Group();
        scaffoldingGroup.name = `Scaffolding_${building.id}`;
        
        // Get building dimensions
        const boundingBox = new THREE.Box3().setFromObject(building.model);
        const size = boundingBox.getSize(new THREE.Vector3());
        const center = boundingBox.getCenter(new THREE.Vector3());
        
        // Create scaffolding poles and platforms
        this.createScaffoldingPoles(scaffoldingGroup, size, center);
        this.createScaffoldingPlatforms(scaffoldingGroup, size, center);
        
        // Position scaffolding relative to building
        scaffoldingGroup.position.copy(building.model.position);
        
        this.scaffoldingGroup.add(scaffoldingGroup);
        this.scaffoldingSystems.set(building.id, scaffoldingGroup);
    }
    
    /**
     * Create vertical scaffolding poles
     */
    createScaffoldingPoles(group, size, center) {
        const poleRadius = 0.05;
        const poleHeight = size.y * 1.2; // Slightly taller than building
        const poleGeometry = new THREE.CylinderGeometry(poleRadius, poleRadius, poleHeight, 8);
        const poleMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8B4513, // Brown wood
            transparent: true,
            opacity: 0.8
        });
        
        // Create poles at corners and mid-points
        const polePositions = [
            // Corners
            { x: -size.x/2 * 1.1, z: -size.z/2 * 1.1 },
            { x: size.x/2 * 1.1, z: -size.z/2 * 1.1 },
            { x: -size.x/2 * 1.1, z: size.z/2 * 1.1 },
            { x: size.x/2 * 1.1, z: size.z/2 * 1.1 },
            // Mid-points for larger buildings
            { x: 0, z: -size.z/2 * 1.1 },
            { x: 0, z: size.z/2 * 1.1 },
            { x: -size.x/2 * 1.1, z: 0 },
            { x: size.x/2 * 1.1, z: 0 }
        ];
        
        polePositions.forEach(pos => {
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(pos.x, poleHeight/2, pos.z);
            pole.castShadow = true;
            group.add(pole);
        });
    }
    
    /**
     * Create horizontal scaffolding platforms
     */
    createScaffoldingPlatforms(group, size, center) {
        const platformThickness = 0.05;
        const platformMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xDEB887, // Light brown wood
            transparent: true,
            opacity: 0.7
        });
        
        // Create platforms at different heights
        const numLevels = Math.ceil(size.y / (TILE_SIZE * 0.4));
        for (let i = 1; i <= numLevels; i++) {
            const height = (size.y / numLevels) * i;
            
            // Main platform
            const platformGeometry = new THREE.BoxGeometry(
                size.x * 1.2, 
                platformThickness, 
                size.z * 1.2
            );
            const platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.set(0, height, 0);
            platform.castShadow = true;
            platform.receiveShadow = true;
            group.add(platform);
            
            // Cross beams for structural detail
            if (this.config.scaffoldingDetail > 0.5) {
                this.createCrossBeams(group, size, height);
            }
        }
    }
    
    /**
     * Create cross beams for scaffolding detail
     */
    createCrossBeams(group, size, height) {
        const beamRadius = 0.03;
        const beamMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x654321, // Dark brown
            transparent: true,
            opacity: 0.8
        });
        
        // Horizontal beams
        const beamLength = size.x * 1.2;
        const beamGeometry = new THREE.CylinderGeometry(beamRadius, beamRadius, beamLength, 6);
        
        // Front and back beams
        [-size.z/2 * 1.1, size.z/2 * 1.1].forEach(z => {
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            beam.position.set(0, height, z);
            beam.rotation.z = Math.PI / 2;
            group.add(beam);
        });
        
        // Side beams
        const sideBeamGeometry = new THREE.CylinderGeometry(beamRadius, beamRadius, size.z * 1.2, 6);
        [-size.x/2 * 1.1, size.x/2 * 1.1].forEach(x => {
            const beam = new THREE.Mesh(sideBeamGeometry, beamMaterial);
            beam.position.set(x, height, 0);
            beam.rotation.x = Math.PI / 2;
            group.add(beam);
        });
    }
    
    /**
     * Remove scaffolding for a building
     */
    removeScaffolding(buildingId) {
        if (this.scaffoldingSystems.has(buildingId)) {
            const scaffolding = this.scaffoldingSystems.get(buildingId);
            
            // Dispose of geometries and materials
            scaffolding.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            
            this.scaffoldingGroup.remove(scaffolding);
            this.scaffoldingSystems.delete(buildingId);
        }
    }
    
    /**
     * Create dust particle system for construction site
     */
    createDustSystem(building) {
        if (!building.model || this.dustSystems.has(building.id)) return;
        
        const particleCount = this.config.maxDustParticles;
        const dustGeometry = new THREE.BufferGeometry();
        
        // Get building bounds for dust area
        const boundingBox = new THREE.Box3().setFromObject(building.model);
        const size = boundingBox.getSize(new THREE.Vector3());
        const center = boundingBox.getCenter(new THREE.Vector3());
        
        // Create particle positions and properties
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const lifetimes = new Float32Array(particleCount);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position around building
            positions[i * 3] = (Math.random() - 0.5) * size.x * 1.5;
            positions[i * 3 + 1] = Math.random() * size.y * 0.5; // Start low
            positions[i * 3 + 2] = (Math.random() - 0.5) * size.z * 1.5;
            
            // Random velocity (upward and outward)
            velocities[i * 3] = (Math.random() - 0.5) * 0.5;
            velocities[i * 3 + 1] = Math.random() * 0.8 + 0.2; // Upward
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
            
            // Random lifetime and size
            lifetimes[i] = Math.random() * 5 + 2; // 2-7 seconds
            sizes[i] = Math.random() * 0.1 + 0.05; // 0.05-0.15
        }
        
        dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        dustGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        dustGeometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
        dustGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Dust material
        const dustMaterial = new THREE.PointsMaterial({
            color: 0xD2B48C, // Tan/dust color
            size: 0.1,
            transparent: true,
            opacity: 0.3,
            sizeAttenuation: true,
            vertexColors: false
        });
        
        const dustSystem = new THREE.Points(dustGeometry, dustMaterial);
        dustSystem.position.copy(building.model.position);
        dustSystem.userData = {
            buildingId: building.id,
            startTime: Date.now(),
            isDustSystem: true,
            basePosition: building.model.position.clone(),
            boundingSize: size
        };
        
        this.dustGroup.add(dustSystem);
        this.dustSystems.set(building.id, dustSystem);
    }
    
    /**
     * Remove dust system for a building
     */
    removeDustSystem(buildingId) {
        if (this.dustSystems.has(buildingId)) {
            const dustSystem = this.dustSystems.get(buildingId);
            
            if (dustSystem.geometry) dustSystem.geometry.dispose();
            if (dustSystem.material) dustSystem.material.dispose();
            
            this.dustGroup.remove(dustSystem);
            this.dustSystems.delete(buildingId);
        }
    }
    
    /**
     * Update all construction effects
     */
    update(deltaTime) {
        if (!this.config.isEnabled) return;
        
        this.animationTime += deltaTime;
        this.lastUpdate += deltaTime;
        
        // Update at 60 FPS
        if (this.lastUpdate >= 1/60) {
            this.updateTransparencyEffects(deltaTime);
            this.updateDustSystems(deltaTime);
            this.updateScaffoldingAnimations(deltaTime);
            this.lastUpdate = 0;
        }
    }
    
    /**
     * Update transparency effects based on construction progress
     */
    updateTransparencyEffects(deltaTime) {
        this.activeConstructions.forEach((constructionData, buildingId) => {
            const { building } = constructionData;
            if (!building || !this.transparentMaterials.has(buildingId)) return;
            
            // Calculate construction progress (0 to 1)
            const progress = Math.min(building.currentConstructionProgress / building.constructionRequiredTime, 1.0);
            
            // Update opacity based on progress (0.3 to 1.0)
            const targetOpacity = 0.3 + (progress * 0.7);
            
            const transparentMaterials = this.transparentMaterials.get(buildingId);
            transparentMaterials.forEach(({ material }) => {
                if (Array.isArray(material)) {
                    material.forEach(mat => {
                        if (mat.opacity !== undefined) {
                            mat.opacity = targetOpacity;
                        }
                    });
                } else if (material && material.opacity !== undefined) {
                    material.opacity = targetOpacity;
                }
            });
        });
    }
    
    /**
     * Update dust particle systems
     */
    updateDustSystems(deltaTime) {
        this.dustSystems.forEach((dustSystem, buildingId) => {
            const positions = dustSystem.geometry.attributes.position;
            const velocities = dustSystem.geometry.attributes.velocity;
            const lifetimes = dustSystem.geometry.attributes.lifetime;
            
            const constructionData = this.activeConstructions.get(buildingId);
            const intensity = constructionData ? constructionData.effectIntensity * this.config.dustIntensity : 0.5;
            
            for (let i = 0; i < positions.count; i++) {
                // Update position based on velocity
                positions.array[i * 3] += velocities.array[i * 3] * deltaTime * intensity;
                positions.array[i * 3 + 1] += velocities.array[i * 3 + 1] * deltaTime * intensity;
                positions.array[i * 3 + 2] += velocities.array[i * 3 + 2] * deltaTime * intensity;
                
                // Apply gravity and wind
                velocities.array[i * 3 + 1] -= 0.1 * deltaTime; // Gravity
                velocities.array[i * 3] += (Math.random() - 0.5) * 0.05 * deltaTime; // Wind
                
                // Reset particles that have expired or gone too far
                if (positions.array[i * 3 + 1] < -1 || 
                    Math.abs(positions.array[i * 3]) > dustSystem.userData.boundingSize.x * 2 ||
                    Math.abs(positions.array[i * 3 + 2]) > dustSystem.userData.boundingSize.z * 2) {
                    
                    // Reset to new random position near building
                    positions.array[i * 3] = (Math.random() - 0.5) * dustSystem.userData.boundingSize.x;
                    positions.array[i * 3 + 1] = Math.random() * 0.5;
                    positions.array[i * 3 + 2] = (Math.random() - 0.5) * dustSystem.userData.boundingSize.z;
                    
                    velocities.array[i * 3] = (Math.random() - 0.5) * 0.5;
                    velocities.array[i * 3 + 1] = Math.random() * 0.8 + 0.2;
                    velocities.array[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
                }
            }
            
            positions.needsUpdate = true;
            velocities.needsUpdate = true;
        });
    }
    
    /**
     * Update scaffolding animations (subtle swaying, etc.)
     */
    updateScaffoldingAnimations(deltaTime) {
        if (!this.config.showAnimations) return;
        
        this.scaffoldingSystems.forEach((scaffolding, buildingId) => {
            // Subtle swaying animation
            const swayAmount = 0.005 * Math.sin(this.animationTime * 2 + buildingId.hashCode());
            scaffolding.rotation.y = swayAmount;
            
            // Pulse opacity based on construction activity
            const constructionData = this.activeConstructions.get(buildingId);
            if (constructionData) {
                const pulseIntensity = 0.1 * Math.sin(this.animationTime * 4);
                scaffolding.traverse((child) => {
                    if (child.material && child.material.opacity !== undefined) {
                        child.material.opacity = Math.max(0.6, child.material.opacity + pulseIntensity);
                    }
                });
            }
        });
    }
    
    /**
     * Toggle dust particles
     */
    toggleDustParticles() {
        this.config.showDustParticles = !this.config.showDustParticles;
        this.dustGroup.visible = this.config.showDustParticles;
        console.log(`🏗️ Construction dust: ${this.config.showDustParticles ? 'ON' : 'OFF'}`);
    }
    
    /**
     * Toggle scaffolding
     */
    toggleScaffolding() {
        this.config.showScaffolding = !this.config.showScaffolding;
        this.scaffoldingGroup.visible = this.config.showScaffolding;
        console.log(`🏗️ Construction scaffolding: ${this.config.showScaffolding ? 'ON' : 'OFF'}`);
    }
    
    /**
     * Toggle transparency effects
     */
    toggleTransparency() {
        this.config.showTransparency = !this.config.showTransparency;
        console.log(`🏗️ Construction transparency: ${this.config.showTransparency ? 'ON' : 'OFF'}`);
        
        if (this.config.showTransparency) {
            // Reapply transparency to active constructions
            this.activeConstructions.forEach((data) => {
                this.applyTransparencyEffect(data.building);
            });
        } else {
            // Remove transparency from all buildings
            this.activeConstructions.forEach((data) => {
                this.removeTransparencyEffect(data.building);
            });
        }
    }
    
    /**
     * Get construction effects statistics
     */
    getStats() {
        return {
            activeConstructions: this.activeConstructions.size,
            dustSystems: this.dustSystems.size,
            scaffoldingSystems: this.scaffoldingSystems.size,
            isEnabled: this.config.isEnabled,
            showDustParticles: this.config.showDustParticles,
            showScaffolding: this.config.showScaffolding,
            showTransparency: this.config.showTransparency
        };
    }
    
    /**
     * Clean up all resources
     */
    dispose() {
        // Stop all active construction effects
        const buildingIds = [...this.activeConstructions.keys()];
        buildingIds.forEach(buildingId => {
            const constructionData = this.activeConstructions.get(buildingId);
            if (constructionData) {
                this.stopConstructionEffects(constructionData.building);
            }
        });
        
        // Remove effect groups from scene
        this.scene.remove(this.effectsGroup);
        
        console.log('🏗️ ConstructionEffectsManager disposed');
    }
}

// Helper function for string hash code
String.prototype.hashCode = function() {
    let hash = 0;
    if (this.length === 0) return hash;
    for (let i = 0; i < this.length; i++) {
        const char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};

export default ConstructionEffectsManager;
