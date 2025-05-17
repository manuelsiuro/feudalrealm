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
        this.outlinePass.edgeStrength = 5;
        this.outlinePass.edgeGlow = 0.5;
        this.outlinePass.edgeThickness = 1;
        this.outlinePass.visibleEdgeColor.set('#ffffff');
        this.outlinePass.hiddenEdgeColor.set('#190a05');
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
    }
}

export default Renderer;
