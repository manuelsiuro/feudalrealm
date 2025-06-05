import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';

class Renderer {
    constructor(gameCanvas) { // Removed appContainer as it's not used if gameCanvas is always provided
        this.gameCanvas = gameCanvas;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);

        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        this.camera.position.set(0, 15, 15); // Initial position, might be overridden by Game.js

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.gameCanvas || undefined,
            antialias: true,
            powerPreference: 'high-performance',
            precision: 'highp'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Ensure renderer's DOM element is correctly handled by the caller (Game.js)

        this.composer = new EffectComposer(this.renderer);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);

        this.outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera);
        this.outlinePass.edgeStrength = 8;  // Increased for more visible selection
        this.outlinePass.edgeGlow = 1.2;    // Enhanced glow effect
        this.outlinePass.edgeThickness = 2;  // Thicker outline for better visibility
        this.outlinePass.visibleEdgeColor.set('#00ff88');  // Bright green for selected objects
        this.outlinePass.hiddenEdgeColor.set('#004422');   // Darker green for hidden edges
        this.composer.addPass(this.outlinePass);

        this.fxaaPass = new ShaderPass(FXAAShader);
        const pixelRatio = this.renderer.getPixelRatio();
        this.fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
        this.fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);
        this.composer.addPass(this.fxaaPass);

        const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
        this.composer.addPass(gammaCorrectionPass);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5; // Initial values, might be overridden
        this.controls.maxDistance = 100; // Initial values, might be overridden
        this.controls.target.set(0, 0, 0); // Initial target

        this.setupLights();

        // The Game class will now handle adding the resize listener for the renderer.

        // Group for all game elements (map, buildings, units)
        this.gameElementsGroup = new THREE.Group();
        this.gameElementsGroup.name = "GameElements";
        this.scene.add(this.gameElementsGroup);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xfffbf0, 0.65);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffeb, 1.0);
        directionalLight.position.set(30, 50, 30);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 150;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.bias = -0.0003;
        this.scene.add(directionalLight);

        const fillLight = new THREE.DirectionalLight(0xc4d7f0, 0.35);
        fillLight.position.set(-20, 30, -20);
        this.scene.add(fillLight);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.composer.setSize(window.innerWidth, window.innerHeight);
        const newPixelRatio = this.renderer.getPixelRatio();
        this.fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * newPixelRatio);
        this.fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * newPixelRatio);
        this.outlinePass.resolution.set(window.innerWidth, window.innerHeight);
    }

    render() {
        // Game.js will update controls before calling render
        this.composer.render();
    }

    // Method to update selected objects for outline pass
    setSelectedObjects(objects) {
        this.outlinePass.selectedObjects = objects;
        
        // Clear any previous selection indicators
        this.clearSelectionIndicators();
        
        // Add selection indicators for each selected object
        if (objects && objects.length > 0) {
            this.addSelectionIndicators(objects);
        }
    }
    
    clearSelectionIndicators() {
        // Remove any existing selection indicator meshes
        const indicatorsToRemove = [];
        this.scene.traverse((child) => {
            if (child.userData.isSelectionIndicator) {
                indicatorsToRemove.push(child);
            }
        });
        indicatorsToRemove.forEach(indicator => {
            indicator.parent.remove(indicator);
            if (indicator.geometry) indicator.geometry.dispose();
            if (indicator.material) indicator.material.dispose();
        });
    }
    
    addSelectionIndicators(objects) {
        objects.forEach(object => {
            if (object && object.children) {
                // Create a subtle ground indicator ring
                this.createGroundIndicator(object);
                
                // Add pulsing animation properties to the object
                if (!object.userData.selectionAnimation) {
                    object.userData.selectionAnimation = {
                        isSelected: true,
                        pulseTime: 0,
                        originalIntensity: object.children.length > 0 ? 1.0 : 1.0
                    };
                }
            }
        });
    }
    
    createGroundIndicator(entityModel) {
        // Create a subtle ring indicator on the ground
        const ringGeometry = new THREE.RingGeometry(2, 2.5, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2; // Lay flat on ground
        ring.position.copy(entityModel.position);
        ring.position.y += 0.1; // Slightly above ground to avoid z-fighting
        ring.userData.isSelectionIndicator = true;
        ring.userData.parentEntity = entityModel; // Changed from parentBuilding to parentEntity
        
        this.scene.add(ring);
        
        // Store reference for animation
        if (!entityModel.userData.selectionIndicators) {
            entityModel.userData.selectionIndicators = [];
        }
        entityModel.userData.selectionIndicators.push(ring);
    }
    
    // Update method to animate selection indicators (called from Game.js animate loop)
    updateSelectionAnimations(deltaTime) {
        this.scene.traverse((child) => {
            if (child.userData.isSelectionIndicator) {
                // Update position to follow the parent entity
                if (child.userData.parentEntity) {
                    child.position.copy(child.userData.parentEntity.position);
                    child.position.y += 0.1; // Keep slightly above ground
                }
                
                // Animate the ring indicator
                const time = Date.now() * 0.002;
                const pulseFactor = 0.3 + 0.2 * Math.sin(time * 2);
                child.material.opacity = 0.3 + pulseFactor * 0.3;
                
                // Subtle scale animation
                const scale = 1.0 + 0.1 * Math.sin(time * 1.5);
                child.scale.setScalar(scale);
            }
            
            // Animate selected building models with subtle glow effect
            if (child.userData.selectionAnimation && child.userData.selectionAnimation.isSelected) {
                child.userData.selectionAnimation.pulseTime += deltaTime;
                const pulseIntensity = 1.0 + 0.15 * Math.sin(child.userData.selectionAnimation.pulseTime * 3);
                
                // Apply subtle brightness modulation to building materials
                child.traverse((subChild) => {
                    if (subChild.isMesh && subChild.material) {
                        if (subChild.material.emissive) {
                            subChild.material.emissive.setRGB(0.05 * pulseIntensity, 0.08 * pulseIntensity, 0.03 * pulseIntensity);
                        }
                    }
                });
            }
        });
    }
}

export default Renderer;
