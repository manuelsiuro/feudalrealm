// src/core/ResourceFlowManager.js
import * as THREE from 'three';

/**
 * ResourceFlowManager - Visualizes resource flows and serf movements
 * Provides real-time animated visualization of resource transport between buildings
 */
export class ResourceFlowManager {
    constructor(scene, serfManager, constructionManager) {
        this.scene = scene;
        this.serfManager = serfManager;
        this.constructionManager = constructionManager;
        
        // Flow tracking
        this.activeFlows = new Map(); // flowId -> flowData
        this.flowLines = new Map();   // flowId -> THREE objects
        this.serfTrails = new Map();  // serfId -> trail data
        this.particleSystems = new Map(); // flowId -> particle system
        
        // Visual groups for organization
        this.flowGroup = new THREE.Group();
        this.flowGroup.name = "ResourceFlows";
        this.scene.add(this.flowGroup);
        
        this.trailGroup = new THREE.Group();
        this.trailGroup.name = "SerfTrails";
        this.scene.add(this.trailGroup);
        
        // Configuration
        this.config = {
            isEnabled: true,
            showFlows: true,
            showTrails: true,
            showParticles: true,
            maxFlows: 100,
            maxTrailAge: 30, // seconds
            updateInterval: 1/60, // 60 FPS
            particleSpeed: 2.0,
            trailFadeTime: 5.0
        };
        
        // Resource type colors
        this.resourceColors = {
            'WOOD': 0x8B4513,        // Brown
            'STONE': 0x696969,       // Gray
            'GRAIN': 0xDAA520,       // Golden
            'IRON_ORE': 0x708090,    // Slate Gray
            'COAL_ORE': 0x2F4F4F,    // Dark Slate Gray
            'GOLD_ORE': 0xFFD700,    // Gold
            'PLANKS': 0xCD853F,      // Peru
            'IRON_BARS': 0x778899,   // Light Slate Gray
            'FISH': 0x4682B4,        // Steel Blue
            'MEAT': 0xDC143C,        // Crimson
            'BREAD': 0xF4A460,       // Sandy Brown
            'TOOL_AXE': 0xC0C0C0,    // Silver
            'TOOL_PICKAXE': 0xC0C0C0, // Silver
            'default': 0x00FF88      // Bright green fallback
        };
        
        // Performance tracking
        this.lastUpdate = 0;
        this.frameCount = 0;
    }
    
    /**
     * Update the flow visualization system
     */
    update(deltaTime) {
        if (!this.config.isEnabled) return;
        
        this.lastUpdate += deltaTime;
        if (this.lastUpdate >= this.config.updateInterval) {
            this.updateFlowVisualization(deltaTime);
            this.updateSerfTrails(deltaTime);
            this.updateParticles(deltaTime);
            this.cleanupOldData();
            this.lastUpdate = 0;
        }
    }
    
    /**
     * Record a resource flow between buildings
     */
    recordFlow(fromBuildingId, toBuildingId, resourceType, amount) {
        if (!this.config.isEnabled || !this.config.showFlows) return;
        
        const flowId = `${fromBuildingId}-${toBuildingId}-${resourceType}`;
        const timestamp = Date.now();
        
        // Get building positions
        const fromBuilding = this.findBuildingById(fromBuildingId);
        const toBuilding = this.findBuildingById(toBuildingId);
        
        if (!fromBuilding || !toBuilding) {
            console.warn(`ResourceFlowManager: Could not find buildings for flow ${flowId}`);
            return;
        }
        
        // Create or update flow data
        const flowData = {
            id: flowId,
            fromBuilding,
            toBuilding,
            resourceType,
            amount,
            timestamp,
            lastActivity: timestamp,
            totalVolume: (this.activeFlows.get(flowId)?.totalVolume || 0) + amount,
            frequency: this.calculateFlowFrequency(flowId, timestamp)
        };
        
        this.activeFlows.set(flowId, flowData);
        this.createOrUpdateFlowLine(flowData);
        
        // Create particles for this flow
        if (this.config.showParticles) {
            this.createFlowParticles(flowData);
        }
        
        console.log(`📈 Flow recorded: ${amount} ${resourceType} from ${fromBuilding.info?.name || fromBuilding.type} to ${toBuilding.info?.name || toBuilding.type}`);
    }
    
    /**
     * Record serf movement for trail visualization
     */
    recordSerfMovement(serfId, position, carriedResources = []) {
        if (!this.config.isEnabled || !this.config.showTrails) return;
        
        const timestamp = Date.now();
        
        if (!this.serfTrails.has(serfId)) {
            this.serfTrails.set(serfId, {
                id: serfId,
                positions: [],
                resources: [],
                timestamps: [],
                visualTrail: null
            });
        }
        
        const trail = this.serfTrails.get(serfId);
        
        // Add new position
        trail.positions.push(position.clone());
        trail.resources.push([...carriedResources]);
        trail.timestamps.push(timestamp);
        
        // Limit trail length for performance
        const maxTrailPoints = 50;
        if (trail.positions.length > maxTrailPoints) {
            trail.positions.shift();
            trail.resources.shift();
            trail.timestamps.shift();
        }
        
        this.updateSerfTrailVisual(trail);
    }
    
    /**
     * Create or update a flow line between buildings
     */
    createOrUpdateFlowLine(flowData) {
        const { id, fromBuilding, toBuilding, resourceType, totalVolume, frequency } = flowData;
        
        // Remove existing line if it exists
        if (this.flowLines.has(id)) {
            const oldLine = this.flowLines.get(id);
            this.flowGroup.remove(oldLine.line);
            if (oldLine.geometry) oldLine.geometry.dispose();
            if (oldLine.material) oldLine.material.dispose();
        }
        
        // Create flow line geometry
        const fromPos = fromBuilding.model?.position || fromBuilding.position || new THREE.Vector3();
        const toPos = toBuilding.model?.position || toBuilding.position || new THREE.Vector3();
        
        // Add slight vertical offset to prevent z-fighting
        const heightOffset = 0.5;
        const points = [
            new THREE.Vector3(fromPos.x, fromPos.y + heightOffset, fromPos.z),
            new THREE.Vector3(toPos.x, toPos.y + heightOffset, toPos.z)
        ];
        
        // Create curved path for more interesting visuals
        const midPoint = new THREE.Vector3().lerpVectors(points[0], points[1], 0.5);
        midPoint.y += Math.min(3, points[0].distanceTo(points[1]) * 0.2); // Arc height
        
        const curve = new THREE.QuadraticBezierCurve3(points[0], midPoint, points[1]);
        const curvePoints = curve.getPoints(20);
        
        const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
        
        // Create material with resource-specific color
        const color = this.resourceColors[resourceType] || this.resourceColors.default;
        const lineWidth = Math.min(8, 2 + Math.log10(totalVolume + 1)); // Width based on volume
        
        const material = new THREE.LineBasicMaterial({
            color: color,
            linewidth: lineWidth,
            transparent: true,
            opacity: 0.7
        });
        
        const line = new THREE.Line(geometry, material);
        line.userData = {
            flowId: id,
            resourceType,
            fromBuilding: fromBuilding.id,
            toBuilding: toBuilding.id,
            isFlowLine: true
        };
        
        this.flowGroup.add(line);
        this.flowLines.set(id, {
            line,
            geometry,
            material,
            curve,
            flowData
        });
    }
    
    /**
     * Create animated particles along a flow line
     */
    createFlowParticles(flowData) {
        if (!this.flowLines.has(flowData.id)) return;
        
        const flowLine = this.flowLines.get(flowData.id);
        const particleCount = Math.min(10, Math.max(3, Math.floor(flowData.frequency * 2)));
        
        // Remove existing particles
        if (this.particleSystems.has(flowData.id)) {
            const oldSystem = this.particleSystems.get(flowData.id);
            this.flowGroup.remove(oldSystem);
            if (oldSystem.geometry) oldSystem.geometry.dispose();
            if (oldSystem.material) oldSystem.material.dispose();
        }
        
        // Create particle geometry
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const progress = new Float32Array(particleCount);
        
        const color = new THREE.Color(this.resourceColors[flowData.resourceType] || this.resourceColors.default);
        
        for (let i = 0; i < particleCount; i++) {
            // Distribute particles along the curve
            const t = i / particleCount;
            const point = flowLine.curve.getPoint(t);
            
            positions[i * 3] = point.x;
            positions[i * 3 + 1] = point.y;
            positions[i * 3 + 2] = point.z;
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            progress[i] = t;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('progress', new THREE.BufferAttribute(progress, 1));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        particles.userData = {
            flowId: flowData.id,
            curve: flowLine.curve,
            speed: this.config.particleSpeed,
            lastUpdate: Date.now(),
            isParticleSystem: true
        };
        
        this.flowGroup.add(particles);
        this.particleSystems.set(flowData.id, particles);
    }
    
    /**
     * Update particle animations
     */
    updateParticles(deltaTime) {
        this.particleSystems.forEach((particles, flowId) => {
            if (!particles.userData.curve) return;
            
            const positions = particles.geometry.attributes.position;
            const progress = particles.geometry.attributes.progress;
            const speed = particles.userData.speed * deltaTime;
            
            for (let i = 0; i < progress.count; i++) {
                // Update particle progress along curve
                progress.array[i] += speed;
                if (progress.array[i] > 1) {
                    progress.array[i] = 0; // Loop back to start
                }
                
                // Get new position on curve
                const point = particles.userData.curve.getPoint(progress.array[i]);
                positions.array[i * 3] = point.x;
                positions.array[i * 3 + 1] = point.y;
                positions.array[i * 3 + 2] = point.z;
            }
            
            positions.needsUpdate = true;
            progress.needsUpdate = true;
        });
    }
    
    /**
     * Update serf trail visuals
     */
    updateSerfTrails(deltaTime) {
        this.serfTrails.forEach((trail, serfId) => {
            if (trail.positions.length < 2) return;
            
            this.updateSerfTrailVisual(trail);
        });
    }
    
    /**
     * Update individual serf trail visual
     */
    updateSerfTrailVisual(trail) {
        // Remove old trail visual
        if (trail.visualTrail) {
            this.trailGroup.remove(trail.visualTrail);
            if (trail.visualTrail.geometry) trail.visualTrail.geometry.dispose();
            if (trail.visualTrail.material) trail.visualTrail.material.dispose();
        }
        
        if (trail.positions.length < 2) return;
        
        // Create trail geometry
        const geometry = new THREE.BufferGeometry().setFromPoints(trail.positions);
        
        // Create gradient material that fades older parts
        const material = new THREE.LineBasicMaterial({
            color: 0x00AAFF,
            transparent: true,
            opacity: 0.6,
            linewidth: 2
        });
        
        const line = new THREE.Line(geometry, material);
        line.userData = {
            serfId: trail.id,
            isSerfTrail: true,
            createdAt: Date.now()
        };
        
        this.trailGroup.add(line);
        trail.visualTrail = line;
    }
    
    /**
     * Update flow visualization
     */
    updateFlowVisualization(deltaTime) {
        // Update flow line animations
        this.flowLines.forEach((flowLineData, flowId) => {
            const { material } = flowLineData;
            
            // Pulse animation based on flow activity
            const timeSinceLastActivity = Date.now() - flowLineData.flowData.lastActivity;
            const pulseIntensity = Math.max(0.3, 1.0 - (timeSinceLastActivity / 10000)); // Fade over 10 seconds
            
            material.opacity = 0.4 + 0.3 * pulseIntensity * (0.8 + 0.2 * Math.sin(Date.now() * 0.003));
        });
    }
    
    /**
     * Clean up old flows and trails
     */
    cleanupOldData() {
        const now = Date.now();
        const maxAge = this.config.maxTrailAge * 1000; // Convert to milliseconds
        
        // Clean up old flows (inactive for more than 30 seconds)
        this.activeFlows.forEach((flowData, flowId) => {
            if (now - flowData.lastActivity > 30000) {
                this.removeFlow(flowId);
            }
        });
        
        // Clean up old serf trails
        this.serfTrails.forEach((trail, serfId) => {
            if (trail.timestamps.length > 0) {
                const oldestTimestamp = trail.timestamps[0];
                if (now - oldestTimestamp > maxAge) {
                    // Remove old trail points
                    while (trail.timestamps.length > 0 && now - trail.timestamps[0] > maxAge) {
                        trail.positions.shift();
                        trail.resources.shift();
                        trail.timestamps.shift();
                    }
                    
                    // Remove entire trail if empty
                    if (trail.positions.length === 0) {
                        this.removeSerfTrail(serfId);
                    }
                }
            }
        });
    }
    
    /**
     * Remove a flow visualization
     */
    removeFlow(flowId) {
        // Remove flow line
        if (this.flowLines.has(flowId)) {
            const flowLine = this.flowLines.get(flowId);
            this.flowGroup.remove(flowLine.line);
            if (flowLine.geometry) flowLine.geometry.dispose();
            if (flowLine.material) flowLine.material.dispose();
            this.flowLines.delete(flowId);
        }
        
        // Remove particles
        if (this.particleSystems.has(flowId)) {
            const particles = this.particleSystems.get(flowId);
            this.flowGroup.remove(particles);
            if (particles.geometry) particles.geometry.dispose();
            if (particles.material) particles.material.dispose();
            this.particleSystems.delete(flowId);
        }
        
        // Remove flow data
        this.activeFlows.delete(flowId);
    }
    
    /**
     * Remove serf trail
     */
    removeSerfTrail(serfId) {
        if (this.serfTrails.has(serfId)) {
            const trail = this.serfTrails.get(serfId);
            if (trail.visualTrail) {
                this.trailGroup.remove(trail.visualTrail);
                if (trail.visualTrail.geometry) trail.visualTrail.geometry.dispose();
                if (trail.visualTrail.material) trail.visualTrail.material.dispose();
            }
            this.serfTrails.delete(serfId);
        }
    }
    
    /**
     * Calculate flow frequency for visualization
     */
    calculateFlowFrequency(flowId, timestamp) {
        const existingFlow = this.activeFlows.get(flowId);
        if (!existingFlow) return 1;
        
        const timeDiff = timestamp - existingFlow.timestamp;
        if (timeDiff < 1000) return existingFlow.frequency + 1; // Less than 1 second = high frequency
        
        return Math.max(1, existingFlow.frequency * 0.9); // Decay frequency over time
    }
    
    /**
     * Find building by ID
     */
    findBuildingById(buildingId) {
        return this.constructionManager.placedBuildings.find(building => 
            building.id === buildingId || 
            building.model?.uuid === buildingId ||
            building.model?.userData?.buildingInstance?.id === buildingId
        );
    }
    
    /**
     * Toggle flow visualization
     */
    toggleFlows() {
        this.config.showFlows = !this.config.showFlows;
        this.flowGroup.visible = this.config.showFlows;
        console.log(`🔄 Flow visualization: ${this.config.showFlows ? 'ON' : 'OFF'}`);
    }
    
    /**
     * Toggle serf trails
     */
    toggleTrails() {
        this.config.showTrails = !this.config.showTrails;
        this.trailGroup.visible = this.config.showTrails;
        console.log(`🔄 Serf trails: ${this.config.showTrails ? 'ON' : 'OFF'}`);
    }
    
    /**
     * Toggle particle effects
     */
    toggleParticles() {
        this.config.showParticles = !this.config.showParticles;
        this.particleSystems.forEach(particles => {
            particles.visible = this.config.showParticles;
        });
        console.log(`🔄 Flow particles: ${this.config.showParticles ? 'ON' : 'OFF'}`);
    }
    
    /**
     * Get flow statistics for debugging
     */
    getFlowStats() {
        return {
            activeFlows: this.activeFlows.size,
            flowLines: this.flowLines.size,
            serfTrails: this.serfTrails.size,
            particleSystems: this.particleSystems.size,
            isEnabled: this.config.isEnabled
        };
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        // Remove all flows
        this.activeFlows.forEach((_, flowId) => this.removeFlow(flowId));
        
        // Remove all trails
        this.serfTrails.forEach((_, serfId) => this.removeSerfTrail(serfId));
        
        // Remove groups from scene
        this.scene.remove(this.flowGroup);
        this.scene.remove(this.trailGroup);
        
        console.log('🧹 ResourceFlowManager disposed');
    }
}

export default ResourceFlowManager;
