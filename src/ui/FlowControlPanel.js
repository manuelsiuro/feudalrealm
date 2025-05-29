// src/ui/FlowControlPanel.js
/**
 * FlowControlPanel - UI controls for ResourceFlowManager visualization
 * Provides visual toggles and settings for resource flow visualization
 */
export class FlowControlPanel {
    constructor(resourceFlowManager) {
        this.resourceFlowManager = resourceFlowManager;
        this.panel = null;
        this.isVisible = false;
        this.filterSettings = {
            enabledResources: new Set(Object.keys(resourceFlowManager.resourceColors))
        };
        
        this.createPanel();
        this.setupEventListeners();
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'flow-control-panel';
        this.panel.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            width: 280px;
            background: linear-gradient(135deg, rgba(25,35,45,0.95), rgba(35,45,55,0.95));
            border-radius: 12px;
            padding: 16px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 1000;
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            display: none;
            user-select: none;
        `;

        // Panel header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        `;

        const title = document.createElement('h3');
        title.textContent = 'Flow Visualization';
        title.style.cssText = `
            margin: 0;
            color: #4CAF50;
            font-size: 16px;
            font-weight: 600;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: #999;
            cursor: pointer;
            font-size: 18px;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.2s ease;
        `;
        closeBtn.addEventListener('mouseover', () => closeBtn.style.color = '#fff');
        closeBtn.addEventListener('mouseout', () => closeBtn.style.color = '#999');
        closeBtn.addEventListener('click', () => this.hide());

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Main controls section
        const mainControls = document.createElement('div');
        mainControls.style.cssText = `
            margin-bottom: 16px;
        `;

        // Toggle switches for main visualization modes
        const toggles = [
            { key: 'showFlows', label: 'Resource Flows', shortcut: 'F', method: 'toggleFlows' },
            { key: 'showTrails', label: 'Serf Trails', shortcut: 'T', method: 'toggleTrails' },
            { key: 'showParticles', label: 'Flow Particles', shortcut: 'Shift+F', method: 'toggleParticles' }
        ];

        toggles.forEach(toggle => {
            const toggleContainer = this.createToggleSwitch(
                toggle.label, 
                toggle.shortcut,
                this.resourceFlowManager.config[toggle.key],
                (enabled) => {
                    this.resourceFlowManager[toggle.method]();
                    this.updateStats();
                }
            );
            mainControls.appendChild(toggleContainer);
        });

        // Resource type filters section
        const filtersSection = document.createElement('div');
        filtersSection.style.cssText = `
            margin-bottom: 16px;
        `;

        const filtersTitle = document.createElement('h4');
        filtersTitle.textContent = 'Resource Filters';
        filtersTitle.style.cssText = `
            margin: 0 0 12px 0;
            color: #81C784;
            font-size: 14px;
            font-weight: 500;
        `;

        const resourceFilters = document.createElement('div');
        resourceFilters.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            max-height: 120px;
            overflow-y: auto;
        `;

        // Create resource type filter buttons
        Object.entries(this.resourceFlowManager.resourceColors).forEach(([resourceType, color]) => {
            if (resourceType === 'default') return;
            
            const filterBtn = this.createResourceFilter(resourceType, color);
            resourceFilters.appendChild(filterBtn);
        });

        filtersSection.appendChild(filtersTitle);
        filtersSection.appendChild(resourceFilters);

        // Statistics section
        const statsSection = document.createElement('div');
        statsSection.style.cssText = `
            border-top: 1px solid rgba(255,255,255,0.1);
            padding-top: 12px;
        `;

        const statsTitle = document.createElement('h4');
        statsTitle.textContent = 'Flow Statistics';
        statsTitle.style.cssText = `
            margin: 0 0 8px 0;
            color: #81C784;
            font-size: 14px;
            font-weight: 500;
        `;

        this.statsContainer = document.createElement('div');
        this.statsContainer.style.cssText = `
            font-size: 12px;
            color: #ccc;
            line-height: 1.4;
        `;

        statsSection.appendChild(statsTitle);
        statsSection.appendChild(this.statsContainer);

        // Performance controls section
        const performanceSection = document.createElement('div');
        performanceSection.style.cssText = `
            border-top: 1px solid rgba(255,255,255,0.1);
            padding-top: 12px;
            margin-top: 12px;
        `;

        const performanceTitle = document.createElement('h4');
        performanceTitle.textContent = 'Performance';
        performanceTitle.style.cssText = `
            margin: 0 0 8px 0;
            color: #81C784;
            font-size: 14px;
            font-weight: 500;
        `;

        const qualitySlider = this.createSlider(
            'Visual Quality',
            1, 3, 2,
            (value) => this.updateQuality(value)
        );

        performanceSection.appendChild(performanceTitle);
        performanceSection.appendChild(qualitySlider);

        // Assemble the panel
        this.panel.appendChild(header);
        this.panel.appendChild(mainControls);
        this.panel.appendChild(filtersSection);
        this.panel.appendChild(statsSection);
        this.panel.appendChild(performanceSection);

        document.body.appendChild(this.panel);
        this.updateStats();
    }

    createToggleSwitch(label, shortcut, initialState, onChange) {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            padding: 8px 0;
        `;

        const labelContainer = document.createElement('div');
        
        const labelText = document.createElement('span');
        labelText.textContent = label;
        labelText.style.cssText = `
            color: #fff;
            font-size: 14px;
        `;

        const shortcutText = document.createElement('span');
        shortcutText.textContent = shortcut;
        shortcutText.style.cssText = `
            color: #999;
            font-size: 12px;
            margin-left: 8px;
            font-family: monospace;
        `;

        labelContainer.appendChild(labelText);
        labelContainer.appendChild(shortcutText);

        const toggle = document.createElement('div');
        toggle.style.cssText = `
            width: 40px;
            height: 20px;
            background: ${initialState ? '#4CAF50' : '#555'};
            border-radius: 10px;
            position: relative;
            cursor: pointer;
            transition: background 0.3s ease;
        `;

        const toggleKnob = document.createElement('div');
        toggleKnob.style.cssText = `
            width: 16px;
            height: 16px;
            background: white;
            border-radius: 50%;
            position: absolute;
            top: 2px;
            left: ${initialState ? '22px' : '2px'};
            transition: left 0.3s ease;
        `;

        toggle.appendChild(toggleKnob);

        let currentState = initialState;
        toggle.addEventListener('click', () => {
            currentState = !currentState;
            toggle.style.background = currentState ? '#4CAF50' : '#555';
            toggleKnob.style.left = currentState ? '22px' : '2px';
            onChange(currentState);
        });

        container.appendChild(labelContainer);
        container.appendChild(toggle);

        return container;
    }

    createResourceFilter(resourceType, color) {
        const button = document.createElement('button');
        button.style.cssText = `
            background: rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, 0.3);
            border: 1px solid rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, 0.6);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            transition: all 0.2s ease;
            text-transform: capitalize;
        `;

        button.textContent = resourceType.replace('_', ' ').toLowerCase();

        const isEnabled = this.filterSettings.enabledResources.has(resourceType);
        if (!isEnabled) {
            button.style.opacity = '0.4';
            button.style.background = 'rgba(80,80,80,0.3)';
        }

        button.addEventListener('click', () => {
            const wasEnabled = this.filterSettings.enabledResources.has(resourceType);
            if (wasEnabled) {
                this.filterSettings.enabledResources.delete(resourceType);
                button.style.opacity = '0.4';
                button.style.background = 'rgba(80,80,80,0.3)';
            } else {
                this.filterSettings.enabledResources.add(resourceType);
                button.style.opacity = '1';
                button.style.background = `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, 0.3)`;
            }
            this.applyResourceFilters();
        });

        return button;
    }

    createSlider(label, min, max, value, onChange) {
        const container = document.createElement('div');
        container.style.cssText = `
            margin-bottom: 8px;
        `;

        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.style.cssText = `
            display: block;
            color: #ccc;
            font-size: 12px;
            margin-bottom: 4px;
        `;

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.value = value;
        slider.style.cssText = `
            width: 100%;
            height: 4px;
            border-radius: 2px;
            background: #555;
            outline: none;
            cursor: pointer;
        `;

        slider.addEventListener('input', (e) => {
            onChange(parseInt(e.target.value));
        });

        container.appendChild(labelEl);
        container.appendChild(slider);

        return container;
    }

    setupEventListeners() {
        // Listen for keyboard shortcuts to update UI state
        document.addEventListener('keydown', (event) => {
            // Update UI state when keyboard shortcuts are used
            setTimeout(() => this.updateToggleStates(), 50);
        });
    }

    updateToggleStates() {
        // Update visual state of toggles to match ResourceFlowManager config
        const toggles = this.panel.querySelectorAll('[data-toggle]');
        // This would need more sophisticated tracking in a full implementation
        this.updateStats();
    }

    updateStats() {
        if (!this.statsContainer) return;

        const stats = this.resourceFlowManager.getFlowStats();
        this.statsContainer.innerHTML = `
            <div>Active Flows: ${stats.activeFlows}</div>
            <div>Flow Lines: ${stats.flowLines}</div>
            <div>Serf Trails: ${stats.serfTrails}</div>
            <div>Particle Systems: ${stats.particleSystems}</div>
            <div>Status: ${stats.isEnabled ? 'Enabled' : 'Disabled'}</div>
        `;
    }

    updateQuality(level) {
        // Update ResourceFlowManager quality settings based on slider
        const qualityConfigs = {
            1: { // Low quality
                maxFlows: 50,
                particleSpeed: 1.0,
                updateInterval: 1/30
            },
            2: { // Medium quality (default)
                maxFlows: 100,
                particleSpeed: 2.0,
                updateInterval: 1/60
            },
            3: { // High quality
                maxFlows: 200,
                particleSpeed: 3.0,
                updateInterval: 1/60
            }
        };

        const config = qualityConfigs[level];
        Object.assign(this.resourceFlowManager.config, config);
        console.log(`🎨 Flow quality set to ${['Low', 'Medium', 'High'][level - 1]}`);
    }

    applyResourceFilters() {
        // Apply resource type visibility filters
        this.resourceFlowManager.flowLines.forEach((flowLine, flowId) => {
            const flowData = flowLine.flowData;
            const isVisible = this.filterSettings.enabledResources.has(flowData.resourceType);
            flowLine.line.visible = isVisible && this.resourceFlowManager.config.showFlows;
        });

        this.resourceFlowManager.particleSystems.forEach((particles, flowId) => {
            const flowData = this.resourceFlowManager.activeFlows.get(flowId);
            if (flowData) {
                const isVisible = this.filterSettings.enabledResources.has(flowData.resourceType);
                particles.visible = isVisible && this.resourceFlowManager.config.showParticles;
            }
        });
    }

    show() {
        this.isVisible = true;
        this.panel.style.display = 'block';
        this.updateStats();
    }

    hide() {
        this.isVisible = false;
        this.panel.style.display = 'none';
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    destroy() {
        if (this.panel && this.panel.parentNode) {
            this.panel.parentNode.removeChild(this.panel);
        }
    }
}

export default FlowControlPanel;
