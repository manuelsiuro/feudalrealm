// src/ui/ProductionChainUI.js
import { RESOURCE_TYPES } from '../config/resourceTypes.js';

/**
 * @class ProductionChainUI
 * @classdesc UI component for monitoring and managing production chains
 */
class ProductionChainUI {
    constructor(productionChainManager, uiManager) {
        this.productionChainManager = productionChainManager;
        this.uiManager = uiManager;
        this.isVisible = false;
        this.selectedChain = null;
        this.updateInterval = 2000; // Update every 2 seconds
        this.lastUpdateTime = 0;
        
        this.createUI();
    }

    /**
     * Creates the production chain UI elements
     * @private
     */
    createUI() {
        // Main container
        this.container = document.createElement('div');
        this.container.id = 'production-chain-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            width: 400px;
            max-height: 600px;
            background: rgba(0, 0, 0, 0.85);
            border: 2px solid #8B4513;
            border-radius: 8px;
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            z-index: 1000;
            overflow-y: auto;
            display: none;
        `;

        // Header
        this.createHeader();
        
        // Chain selection tabs
        this.createChainTabs();
        
        // Chain details panel
        this.createDetailsPanel();
        
        // Building list
        this.createBuildingList();
        
        // Transfer controls
        this.createTransferControls();
        
        document.body.appendChild(this.container);
    }

    /**
     * Creates the header section
     * @private
     */
    createHeader() {
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 10px;
            background: linear-gradient(90deg, #654321, #8B4513);
            border-radius: 6px 6px 0 0;
            border-bottom: 1px solid #A0522D;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Production Chains';
        title.style.cssText = 'margin: 0; color: #FFD700; font-size: 16px;';

        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            background: #8B0000;
            border: none;
            color: white;
            font-size: 18px;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            cursor: pointer;
        `;
        closeButton.onclick = () => this.hide();

        header.appendChild(title);
        header.appendChild(closeButton);
        this.container.appendChild(header);
    }

    /**
     * Creates the chain selection tabs
     * @private
     */
    createChainTabs() {
        this.tabsContainer = document.createElement('div');
        this.tabsContainer.style.cssText = `
            display: flex;
            background: #2F2F2F;
            padding: 5px;
            overflow-x: auto;
        `;

        // Will be populated when showing
        this.container.appendChild(this.tabsContainer);
    }

    /**
     * Creates the details panel
     * @private
     */
    createDetailsPanel() {
        this.detailsPanel = document.createElement('div');
        this.detailsPanel.style.cssText = `
            padding: 15px;
            border-bottom: 1px solid #555;
        `;
        this.container.appendChild(this.detailsPanel);
    }

    /**
     * Creates the building list
     * @private
     */
    createBuildingList() {
        this.buildingListContainer = document.createElement('div');
        this.buildingListContainer.style.cssText = `
            padding: 10px;
            max-height: 200px;
            overflow-y: auto;
        `;

        const listTitle = document.createElement('h4');
        listTitle.textContent = 'Production Buildings';
        listTitle.style.cssText = 'margin: 0 0 10px 0; color: #FFD700; font-size: 14px;';
        this.buildingListContainer.appendChild(listTitle);

        this.buildingList = document.createElement('div');
        this.buildingListContainer.appendChild(this.buildingList);
        
        this.container.appendChild(this.buildingListContainer);
    }

    /**
     * Creates transfer controls
     * @private
     */
    createTransferControls() {
        this.transferContainer = document.createElement('div');
        this.transferContainer.style.cssText = `
            padding: 15px;
            background: #1A1A1A;
            border-radius: 0 0 6px 6px;
        `;

        const controlsTitle = document.createElement('h4');
        controlsTitle.textContent = 'Quick Actions';
        controlsTitle.style.cssText = 'margin: 0 0 10px 0; color: #FFD700; font-size: 14px;';
        
        const autoTransferButton = document.createElement('button');
        autoTransferButton.textContent = 'Optimize Transfers';
        autoTransferButton.style.cssText = `
            background: #228B22;
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
            font-size: 12px;
        `;
        autoTransferButton.onclick = () => this.optimizeTransfers();

        const balanceButton = document.createElement('button');
        balanceButton.textContent = 'Balance Chains';
        balanceButton.style.cssText = `
            background: #4169E1;
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;
        balanceButton.onclick = () => this.balanceChains();

        this.transferContainer.appendChild(controlsTitle);
        this.transferContainer.appendChild(autoTransferButton);
        this.transferContainer.appendChild(balanceButton);
        this.container.appendChild(this.transferContainer);
    }

    /**
     * Populates the chain tabs
     * @private
     */
    populateChainTabs() {
        this.tabsContainer.innerHTML = '';
        const efficiencies = this.productionChainManager.getAllChainEfficiencies();

        efficiencies.forEach((chain, index) => {
            const tab = document.createElement('button');
            tab.textContent = chain.name.replace(' Chain', '');
            tab.style.cssText = `
                background: ${this.selectedChain === chain.chainId ? '#8B4513' : '#444'};
                border: none;
                color: white;
                padding: 8px 12px;
                margin-right: 5px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
                white-space: nowrap;
                position: relative;
            `;

            // Add efficiency indicator
            const indicator = document.createElement('span');
            indicator.style.cssText = `
                position: absolute;
                top: -2px;
                right: -2px;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: ${this.getEfficiencyColor(chain.overallEfficiency)};
            `;
            tab.appendChild(indicator);

            tab.onclick = () => {
                this.selectedChain = chain.chainId;
                this.updateDisplay();
            };

            this.tabsContainer.appendChild(tab);

            // Select first chain by default
            if (index === 0 && !this.selectedChain) {
                this.selectedChain = chain.chainId;
            }
        });
    }

    /**
     * Gets color for efficiency indicator
     * @param {number} efficiency - Efficiency percentage
     * @returns {string} CSS color
     * @private
     */
    getEfficiencyColor(efficiency) {
        if (efficiency >= 80) return '#00FF00'; // Green
        if (efficiency >= 60) return '#FFFF00'; // Yellow
        if (efficiency >= 40) return '#FFA500'; // Orange
        return '#FF0000'; // Red
    }

    /**
     * Updates the details panel for selected chain
     * @private
     */
    updateDetailsPanel() {
        if (!this.selectedChain) {
            this.detailsPanel.innerHTML = '<p>Select a production chain to view details</p>';
            return;
        }

        const efficiency = this.productionChainManager.getChainEfficiency(this.selectedChain);
        if (!efficiency) {
            this.detailsPanel.innerHTML = '<p>Chain data not available</p>';
            return;
        }

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #FFD700;">${efficiency.name}</h3>
                <div style="display: flex; align-items: center;">
                    <span style="color: ${this.getEfficiencyColor(efficiency.overallEfficiency)}; font-weight: bold; margin-right: 5px;">
                        ${efficiency.overallEfficiency.toFixed(1)}%
                    </span>
                    <div style="width: 60px; height: 8px; background: #333; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${efficiency.overallEfficiency}%; height: 100%; background: ${this.getEfficiencyColor(efficiency.overallEfficiency)}; transition: width 0.3s;"></div>
                    </div>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 11px;">
        `;

        efficiency.stages.forEach(stage => {
            html += `
                <div style="background: #333; padding: 8px; border-radius: 4px; border-left: 3px solid ${this.getEfficiencyColor(stage.efficiency)};">
                    <div style="font-weight: bold; margin-bottom: 4px;">${stage.buildingType.replace('_', ' ')}</div>
                    <div>Buildings: ${stage.buildings}</div>
                    <div>Workers: ${stage.active}/${stage.capacity}</div>
                    <div>Efficiency: ${stage.efficiency.toFixed(1)}%</div>
                </div>
            `;
        });

        html += '</div>';
        this.detailsPanel.innerHTML = html;
    }

    /**
     * Updates the building list
     * @private
     */
    updateBuildingList() {
        const buildings = this.productionChainManager.getProductionBuildingsStatus();
        
        let html = '';
        buildings.forEach(building => {
            const statusColor = building.canProduce ? '#00FF00' : '#FF6B6B';
            const progressWidth = (building.progress || 0) * 100;
            
            html += `
                <div style="background: #2A2A2A; margin-bottom: 8px; padding: 10px; border-radius: 4px; border-left: 3px solid ${statusColor};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <span style="font-weight: bold; color: #FFD700;">${building.name}</span>
                        <span style="font-size: 10px; color: #CCC;">(${building.gridX}, ${building.gridZ})</span>
                    </div>
                    <div style="font-size: 10px; color: #CCC; margin-bottom: 5px;">
                        Workers: ${building.workers}/${building.maxWorkers} | Status: ${building.reason}
                    </div>
                    ${building.isProcessing ? `
                        <div style="background: #444; height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 5px;">
                            <div style="width: ${progressWidth}%; height: 100%; background: #00FF00; transition: width 0.3s;"></div>
                        </div>
                        <div style="font-size: 10px; color: #00FF00;">Processing... ${building.timeRemaining ? Math.ceil(building.timeRemaining / 1000) + 's remaining' : ''}</div>
                    ` : ''}
                    ${building.inputStatus ? this.renderResourceStatus(building.inputStatus, 'Inputs') : ''}
                    ${building.outputStatus ? this.renderResourceStatus(building.outputStatus, 'Outputs') : ''}
                </div>
            `;
        });

        this.buildingList.innerHTML = html || '<p style="color: #999;">No production buildings found</p>';
    }

    /**
     * Renders resource status for inputs or outputs
     * @param {Array} resources - Resource status array
     * @param {string} type - "Inputs" or "Outputs"
     * @returns {string} HTML string
     * @private
     */
    renderResourceStatus(resources, type) {
        if (!resources || resources.length === 0) return '';

        let html = `<div style="margin-top: 8px; font-size: 10px;">
            <div style="color: #FFD700; margin-bottom: 3px;">${type}:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 5px;">`;

        resources.forEach(resource => {
            const isInput = type === 'Inputs';
            const status = isInput ? resource.sufficient : resource.hasSpace;
            const current = isInput ? resource.available : resource.current;
            const max = isInput ? resource.required : resource.capacity;
            const statusColor = status ? '#00FF00' : '#FF6B6B';

            html += `
                <span style="background: #444; padding: 2px 6px; border-radius: 3px; border-left: 2px solid ${statusColor};">
                    ${resource.resource.replace('_', ' ')}: ${current}${isInput ? `/${max}` : `/${max}`}
                </span>
            `;
        });

        html += '</div></div>';
        return html;
    }

    /**
     * Optimizes resource transfers across the chain
     * @private
     */
    optimizeTransfers() {
        // Force immediate transfer update
        this.productionChainManager.executeAutoTransfers();
        
        // Show feedback
        this.showNotification('Transfer optimization executed', 'success');
        
        // Update display after short delay
        setTimeout(() => this.updateDisplay(), 500);
    }

    /**
     * Attempts to balance production chains
     * @private
     */
    balanceChains() {
        // This could implement more sophisticated balancing logic
        // For now, just optimize transfers and show feedback
        this.optimizeTransfers();
        this.showNotification('Chain balancing attempted', 'info');
    }

    /**
     * Shows a notification message
     * @param {string} message - The message to show
     * @param {string} type - Message type ('success', 'error', 'info')
     * @private
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50px;
            right: 50%;
            transform: translateX(50%);
            background: ${type === 'success' ? '#228B22' : type === 'error' ? '#8B0000' : '#4169E1'};
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 10000;
            font-size: 12px;
            animation: slideDown 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 2000);
    }

    /**
     * Updates the entire display
     * @private
     */
    updateDisplay() {
        this.populateChainTabs();
        this.updateDetailsPanel();
        this.updateBuildingList();
    }

    /**
     * Shows the production chain UI
     */
    show() {
        this.isVisible = true;
        this.container.style.display = 'block';
        this.updateDisplay();
    }

    /**
     * Hides the production chain UI
     */
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
    }

    /**
     * Toggles the UI visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Updates the UI periodically
     * @param {number} currentTime - Current game time
     */
    update(currentTime) {
        if (!this.isVisible) return;

        if (currentTime - this.lastUpdateTime >= this.updateInterval) {
            this.updateDisplay();
            this.lastUpdateTime = currentTime;
        }
    }
}

export default ProductionChainUI;
