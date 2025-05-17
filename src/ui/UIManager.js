import { RESOURCE_TYPES } from '../config/resourceTypes.js'; // May be needed for UI updates

class UIManager {
    constructor(uiOverlay, resourceManager, constructionManager, serfManager) {
        this.uiOverlay = uiOverlay;
        this.resourceManager = resourceManager;
        this.constructionManager = constructionManager;
        this.serfManager = serfManager; // To get serf data for info panel

        this.resourcePanel = null;
        this.miniMapPanel = null;
        this.testButtonContainer = null;
        this.constructionPanel = null;
        this.selectedBuildingInfoPanel = null;
        this.selectedUnitInfoPanel = null;

        this.buildingButtons = new Map();

        if (!this.uiOverlay) {
            console.error("UIManager: ui-overlay element not found. UI will not be initialized.");
            return;
        }

        this.initStyles();
        this.initResourcePanel();
        this.initMiniMapPanel(); // Placeholder
        this.initTestButtons(); // Cheat buttons
        this.initConstructionPanel();
        this.initSelectionInfoPanels(); // Sets up placeholders, actual display is dynamic

        this.resourceManager.onChange((stockpiles) => {
            this.updateResourceUI(stockpiles);
            this.updateBuildingButtons();
        });

        // Initial UI updates
        this.updateResourceUI(this.resourceManager.getAllStockpiles());
        this.updateBuildingButtons();

        // Add resize listener for UI elements that need it
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        this.onWindowResize(); // Call once to set initial sizes
    }

    initStyles() {
        const uiStyles = `
            .themed-panel {
                position: absolute;
                padding: 10px;
                background-color: rgba(25,25,35,0.85);
                border-radius: 10px;
                color: white;
                border: 1px solid rgba(255,255,255,0.2);
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                box-sizing: border-box;
            }
            .themed-panel-title {
                text-align: center;
                margin: 2px 0 12px 0;
                color: white;
                text-shadow: 0 0 5px rgba(0,0,0,0.5);
                letter-spacing: 1px;
                font-size: 1.3em;
                padding-bottom: 6px;
                border-bottom: 1px solid rgba(255,255,255,0.3);
            }
            .building-button-content {
                display: flex;
                flex-direction: column;
                width: 100%;
                align-items: center;
                text-align: center;
            }
            .building-button-name {
                font-weight: bold;
                width: 100%;
                margin-bottom: 10px;
                font-size: 1.15em;
                text-shadow: 0px 0px 3px rgba(0,0,0,0.6);
                letter-spacing: 0.5px;
                color: inherit;
            }
            .building-button-cost-section {
                font-size: 0.9em;
                padding: 10px;
                border-top: 1px solid rgba(255,255,255,0.3);
                background-color: rgba(0,0,0,0.2);
                border-radius: 6px;
                box-sizing: border-box;
                color: inherit;
            }
            .cost-display-title-container {
                text-align: center;
                margin-bottom: 10px;
                width: 100%;
            }
            .cost-display-title-text {
                background-color: rgba(255,255,255,0.1);
                color: rgba(255,255,255,0.95);
                padding: 5px 0px;
                border-radius: 4px;
                font-weight: bold;
                font-size: 1em;
                display: inline-block;
                width: 90px;
                min-width: 90px;
                box-sizing: border-box;
                text-align: center;
            }
            .cost-display-item {
                margin: 6px 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                width: 100%;
                padding: 4px 2px;
                box-sizing: border-box;
                font-size: 0.95em;
            }
            .cost-display-resource-name {
                font-weight: 500;
                margin-right: 8px;
            }
            .cost-display-resource-value span {
                font-weight: bold;
                text-shadow: 0px 0px 2px rgba(0,0,0,0.7);
            }
            .resource-sufficient {
                color: #32CD32;
            }
            .resource-insufficient {
                color: #FF6347;
            }
            .themed-panel::-webkit-scrollbar {
                width: 6px;
                height: 6px;
            }
            .themed-panel::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 4px;
            }
            .themed-panel::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.5);
                border-radius: 4px;
            }
            .themed-panel::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.7);
            }
            .themed-panel {
                scrollbar-width: thin;
                scrollbar-color: rgba(255, 255, 255, 0.5) rgba(0, 0, 0, 0.3);
            }
        `;
        const styleElement = document.createElement('style');
        styleElement.id = 'game-ui-styles';
        if (!document.getElementById('game-ui-styles')) {
            styleElement.textContent = uiStyles;
            document.head.appendChild(styleElement);
        }
    }

    initResourcePanel() {
        this.resourcePanel = document.createElement('div');
        this.resourcePanel.id = 'resource-panel';
        this.resourcePanel.classList.add('themed-panel');
        this.resourcePanel.style.top = '10px';
        this.resourcePanel.style.left = '10px';
        this.resourcePanel.style.minWidth = '230px';
        this.resourcePanel.style.maxHeight = 'calc(100vh - 20px)';
        this.resourcePanel.style.overflowY = 'auto';
        this.uiOverlay.appendChild(this.resourcePanel);
    }

    initMiniMapPanel() {
        this.miniMapPanel = document.createElement('div');
        this.miniMapPanel.id = 'mini-map-panel';
        this.miniMapPanel.style.position = 'absolute';
        this.miniMapPanel.style.top = '10px';
        this.miniMapPanel.style.right = '10px';
        this.miniMapPanel.style.width = '150px';
        this.miniMapPanel.style.height = '150px';
        this.miniMapPanel.style.backgroundColor = 'rgba(0,0,0,0.5)';
        this.miniMapPanel.style.border = '1px solid #fff';
        this.miniMapPanel.style.borderRadius = '4px';
        this.miniMapPanel.style.color = 'white';
        this.miniMapPanel.style.display = 'flex';
        this.miniMapPanel.style.alignItems = 'center';
        this.miniMapPanel.style.justifyContent = 'center';
        this.miniMapPanel.textContent = 'Mini-map';
        this.uiOverlay.appendChild(this.miniMapPanel);
    }

    initTestButtons() {
        this.testButtonContainer = document.createElement('div');
        this.testButtonContainer.style.position = 'absolute';
        this.testButtonContainer.style.bottom = '10px';
        this.testButtonContainer.style.left = '10px';
        this.testButtonContainer.style.display = 'flex';
        this.testButtonContainer.style.gap = '8px';
        this.testButtonContainer.style.zIndex = '50';

        const addCheatButton = document.createElement('md-filled-button');
        addCheatButton.textContent = '+50 All';
        addCheatButton.style.borderRadius = '4px';
        addCheatButton.addEventListener('click', () => {
            console.log('UI: "+50 All" button clicked.');
            Object.values(RESOURCE_TYPES).forEach(type => {
                if (typeof type === 'string') {
                    this.resourceManager.addResource(type, 50);
                }
            });
        });
        this.testButtonContainer.appendChild(addCheatButton);
        this.uiOverlay.appendChild(this.testButtonContainer);
    }

    initConstructionPanel() {
        this.constructionPanel = document.createElement('div');
        this.constructionPanel.id = 'construction-panel';
        this.constructionPanel.classList.add('themed-panel');
        this.constructionPanel.style.bottom = '10px';
        this.constructionPanel.style.right = '10px';
        this.constructionPanel.style.display = 'flex';
        this.constructionPanel.style.flexDirection = 'column';
        this.constructionPanel.style.gap = '8px';
        this.constructionPanel.style.maxHeight = '450px';
        this.constructionPanel.style.minWidth = '220px';
        this.constructionPanel.style.overflowY = 'auto';
        this.constructionPanel.style.overflowX = 'hidden';

        const buildingsTitle = document.createElement('h3');
        buildingsTitle.textContent = 'Buildings';
        buildingsTitle.classList.add('themed-panel-title');
        this.constructionPanel.appendChild(buildingsTitle);

        const availableBuildings = this.constructionManager.getAvailableBuildings();
        availableBuildings.forEach(building => {
            const button = document.createElement('md-filled-button');
            const costString = this.buildCostDisplay(building.cost);
            button.innerHTML = `
                <div class="building-button-content">
                    <div class="building-button-name">${building.name}</div>
                    <div class="building-button-cost-section">
                        ${costString}
                    </div>
                </div>
            `;
            button.style.setProperty('--md-filled-button-container-height', 'auto');
            button.style.setProperty('--md-filled-button-container-width', '100%');
            button.style.setProperty('--md-filled-button-container-shape', '8px');
            button.style.setProperty('--md-filled-button-disabled-container-opacity', '0.9');
            button.style.setProperty('--md-filled-button-disabled-label-text-color', 'rgba(255, 255, 255, 0.95)');
            button.style.setProperty('--md-filled-button-disabled-label-text-opacity', '0.95');
            button.style.padding = '12px 10px';
            button.style.borderRadius = '8px';
            button.style.margin = '0 0 12px 0';
            button.style.width = '100%';
            button.style.minWidth = '200px';
            button.style.maxWidth = '100%';
            button.style.boxSizing = 'border-box';
            button.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3)';
            button.style.transition = 'all 0.2s ease-in-out';
            button.style.border = '1px solid rgba(255,255,255,0.15)';
            button.style.letterSpacing = '0.3px';
            button.style.setProperty('--md-sys-color-primary', '#4CAF50');
            button.style.setProperty('--md-sys-color-on-primary', '#FFFFFF');

            button.addEventListener('mouseover', () => {
                if (!button.disabled) {
                    button.style.transform = 'translateY(-2px)';
                    button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
                    button.style.setProperty('--md-sys-color-primary', '#5DBF60');
                }
            });
            button.addEventListener('mouseout', () => {
                if (!button.disabled) {
                    button.style.transform = '';
                    button.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3)';
                    button.style.setProperty('--md-sys-color-primary', '#4CAF50');
                }
            });
            button.addEventListener('click', () => {
                console.log(`UI: Construction button clicked for building key: ${building.key}, name: ${building.name}`);
                this.constructionManager.startPlacement(building.key);
            });

            this.buildingButtons.set(building.key, { button, cost: building.cost });
            this.constructionPanel.appendChild(button);
        });
        this.uiOverlay.appendChild(this.constructionPanel);
    }

    initSelectionInfoPanels() {
        // These are created on demand, so this method can be a placeholder
        // or ensure the uiOverlay is ready for them.
    }

    updateResourceUI(stockpiles) {
        if (!this.resourcePanel) return;
        this.resourcePanel.innerHTML = '';

        const resourceTitle = document.createElement('h3');
        resourceTitle.textContent = 'Resources';
        resourceTitle.classList.add('themed-panel-title');
        this.resourcePanel.appendChild(resourceTitle);

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        for (const type in stockpiles) {
            const row = table.insertRow();
            const resourceName = type.split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');

            const labelCell = row.insertCell(0);
            labelCell.textContent = resourceName;
            labelCell.style.textAlign = 'left';
            labelCell.style.padding = '4px 2px';
            labelCell.style.color = 'rgba(255,255,255,0.9)';

            const valueCell = row.insertCell(1);
            valueCell.textContent = stockpiles[type];
            valueCell.style.textAlign = 'right';
            valueCell.style.fontWeight = 'bold';
            valueCell.style.padding = '4px 2px';
            valueCell.style.color = 'white';
        }
        this.resourcePanel.appendChild(table);
    }

    checkSufficientResources(cost) {
        if (Object.keys(cost).length === 0) return true;
        return Object.entries(cost).every(([resourceType, amount]) => {
            return this.resourceManager.getResourceCount(resourceType) >= amount;
        });
    }

    buildCostDisplay(cost) {
        if (Object.keys(cost).length === 0) {
            return `<div class="cost-display-title-container"><span class="cost-display-title-text">Free</span></div>`;
        }
        let costItemsHTML = Object.entries(cost).map(([res, amount]) => {
            const available = this.resourceManager.getResourceCount(res);
            const resourceName = res.split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
            const availabilityClass = available >= amount ? 'resource-sufficient' : 'resource-insufficient';
            const availableText = `<span class="${availabilityClass}">${available}/${amount}</span>`;
            return `<div class="cost-display-item">
                        <span class="cost-display-resource-name">${resourceName}:</span>
                        <span class="cost-display-resource-value">${availableText}</span>
                    </div>`;
        }).join('');
        return `<div class="cost-display-title-container"><span class="cost-display-title-text">Cost</span></div>
                ${costItemsHTML}`;
    }

    updateBuildingButtons() {
        this.buildingButtons.forEach(({ button, cost }, key) => {
            const canBuild = this.checkSufficientResources(cost);
            const costSectionContainer = button.querySelector('.building-button-cost-section');
            if (costSectionContainer) {
                costSectionContainer.innerHTML = this.buildCostDisplay(cost);
            }
            if (canBuild) {
                button.style.setProperty('--md-sys-color-primary', '#4CAF50');
                button.style.setProperty('--md-sys-color-on-primary', '#FFFFFF');
                button.style.fontWeight = 'bold';
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
                button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                button.style.transform = '';
                button.removeAttribute('title');
                button.disabled = false;
            } else {
                button.style.setProperty('--md-sys-color-primary', '#B71C1C');
                button.style.setProperty('--md-sys-color-on-primary', '#FFFFFF');
                button.style.opacity = '0.95';
                button.style.cursor = 'not-allowed';
                button.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
                const missingResources = Object.entries(cost)
                    .filter(([resource, amount]) => this.resourceManager.getResourceCount(resource) < amount)
                    .map(([resource, amount]) => {
                        const current = this.resourceManager.getResourceCount(resource);
                        const resourceName = resource.split('_')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join(' ');
                        return `${resourceName}: ${current}/${amount}`;
                    }).join(', ');
                button.title = missingResources ? `Missing Resources: ${missingResources}` : 'Not enough resources';
                button.style.transform = '';
                button.disabled = true;
            }
        });
    }

    displaySelectedBuildingInfo(buildingModel) {
        if (!this.uiOverlay) return;
        this.clearSelectedBuildingInfo();
        this.clearSelectedUnitInfo();

        const buildingInstance = buildingModel.userData.buildingInstance;
        if (!buildingInstance) {
            console.warn("UIManager: Could not find building instance on selected model:", buildingModel);
            return;
        }

        const buildingInfo = buildingInstance.info; // Data from the Building instance
        const buildingName = buildingInfo.name || "Unknown Building";
        const workers = buildingInstance.workers ? buildingInstance.workers.length : 0; // Data from the Building instance
        const maxWorkers = buildingInfo.jobSlots || 0;

        this.selectedBuildingInfoPanel = document.createElement('div');
        this.selectedBuildingInfoPanel.id = 'selected-info-panel';
        this.selectedBuildingInfoPanel.classList.add('themed-panel');
        this.selectedBuildingInfoPanel.style.bottom = '10px';
        this.selectedBuildingInfoPanel.style.left = '50%';
        this.selectedBuildingInfoPanel.style.transform = 'translateX(-50%)';
        this.selectedBuildingInfoPanel.style.minWidth = '220px';
        this.selectedBuildingInfoPanel.style.maxWidth = '300px';
        this.selectedBuildingInfoPanel.style.zIndex = '100';

        let contentHTML = `<h4 class="themed-panel-title" style="margin-bottom: 8px;">${buildingName}</h4>
                           <p style="margin: 4px 0;">Position: (${buildingModel.position.x.toFixed(1)}, ${buildingModel.position.z.toFixed(1)})</p>
                           <p style="margin: 4px 0;">Workers: ${workers} / ${maxWorkers}</p>`;
        if (buildingInfo.produces) {
            contentHTML += `<p style="margin: 4px 0;">Produces: ${buildingInfo.produces.map(p => p.resource.replace(/_/g, ' ')).join(', ')}</p>`;
        }
        if (buildingInstance.inventory) { // Data from the Building instance
            contentHTML += `<h5 style="margin-top: 10px; margin-bottom: 5px; color: rgba(255,255,255,0.9);">Local Stock:</h5>`;
            let stockEmpty = true;
            for (const resourceType in buildingInstance.inventory) {
                if (buildingInstance.inventory[resourceType] > 0) {
                    stockEmpty = false;
                    const currentStock = buildingInstance.inventory[resourceType];
                    const maxStock = buildingInstance.maxStock[resourceType] || buildingInstance.maxStock.default || 0;
                    contentHTML += `<p style="margin: 2px 0; font-size: 0.9em;">- ${resourceType.replace(/_/g, ' ')}: ${currentStock} / ${maxStock}</p>`;
                }
            }
            if (stockEmpty) {
                contentHTML += `<p style="margin: 2px 0; font-size: 0.9em; font-style: italic;">Empty</p>`;
            }
        }
        if (buildingInstance.isProducing && buildingInstance.currentProduction) { // Data from the Building instance
            contentHTML += `<p style="margin: 4px 0;">Current Task: Producing ${buildingInstance.currentProduction.resource.replace(/_/g, ' ')}</p>`;
        }
        contentHTML += `<div id="building-actions" style="margin-top: 16px; border-top: 1px solid #ccc; padding-top: 8px; display: flex; flex-direction: column; gap: 8px;">
                        <h4 style="margin-top:0; margin-bottom: 8px; font-size: 1em; color: rgba(255,255,255,0.8);">Actions:</h4>`;
        this.selectedBuildingInfoPanel.innerHTML = contentHTML;
        const actionsDiv = this.selectedBuildingInfoPanel.querySelector('#building-actions');
        if (actionsDiv) {
            if (buildingInfo.key === 'WOODCUTTERS_HUT') { // Example action
                const upgradeButton = document.createElement('md-filled-button');
                upgradeButton.textContent = 'Upgrade (NI)';
                upgradeButton.addEventListener('click', (e) => { e.stopPropagation(); console.log(`Action: Upgrade clicked for ${buildingName}`); });
                actionsDiv.appendChild(upgradeButton);
            } else {
                const placeholderButton = document.createElement('md-outlined-button');
                placeholderButton.textContent = 'No specific actions';
                placeholderButton.disabled = true;
                actionsDiv.appendChild(placeholderButton);
            }
        }
        this.uiOverlay.appendChild(this.selectedBuildingInfoPanel);
    }

    clearSelectedBuildingInfo() {
        if (this.selectedBuildingInfoPanel && this.selectedBuildingInfoPanel.parentElement) {
            this.selectedBuildingInfoPanel.parentElement.removeChild(this.selectedBuildingInfoPanel);
        }
        this.selectedBuildingInfoPanel = null;
    }

    displaySelectedUnitInfo(serfModel) {
        if (!this.uiOverlay) return;
        this.clearSelectedUnitInfo();
        this.clearSelectedBuildingInfo();

        const serfInstance = serfModel.userData.serfInstance; // Use serfInstance from model's userData
        if (!serfInstance) {
            console.warn("UIManager: Could not find serf instance on selected model:", serfModel);
            return;
        }

        this.selectedUnitInfoPanel = document.createElement('div');
        this.selectedUnitInfoPanel.id = 'selected-unit-info-panel';
        this.selectedUnitInfoPanel.classList.add('themed-panel');
        this.selectedUnitInfoPanel.style.bottom = '10px';
        this.selectedUnitInfoPanel.style.left = '50%';
        this.selectedUnitInfoPanel.style.transform = 'translateX(-50%)';
        this.selectedUnitInfoPanel.style.minWidth = '220px';
        this.selectedUnitInfoPanel.style.maxWidth = '300px';
        this.selectedUnitInfoPanel.style.zIndex = '100';

        let contentHTML = `<h4 class="themed-panel-title" style="margin-bottom: 8px;">Serf ID: ${serfInstance.id}</h4>
                           <p style="margin: 4px 0;">Type: ${serfInstance.serfType}</p>
                           <p style="margin: 4px 0;">Status: ${serfInstance.state}</p>`;
        if (serfInstance.job && serfInstance.job.info) { // Check serfInstance.job.info
            contentHTML += `<p style="margin: 4px 0;">Job: Working at ${serfInstance.job.info.name}</p>`;
        } else if (serfInstance.job) {
             contentHTML += `<p style="margin: 4px 0;">Job: Assigned (Building info missing)</p>`;
        }

        if (serfInstance.taskDetails && serfInstance.taskDetails.resourceType) {
            contentHTML += `<p style="margin: 4px 0;">Task: ${serfInstance.state} for ${serfInstance.taskDetails.resourceType.replace(/_/g, ' ')}</p>`;
        } else if (serfInstance.taskDetails && serfInstance.taskDetails.targetBuildingName) {
            contentHTML += `<p style="margin: 4px 0;">Task: ${serfInstance.state} related to ${serfInstance.taskDetails.targetBuildingName}</p>`;
        }
        // Display inventory
        const inventory = serfInstance.inventory;
        let inventoryContent = '';
        for (const resource in inventory) {
            if (inventory[resource] > 0) {
                inventoryContent += `<li>${resource.replace(/_/g, ' ')}: ${inventory[resource]}</li>`;
            }
        }
        if (inventoryContent) {
            contentHTML += `<p style="margin: 4px 0;">Carrying:</p><ul>${inventoryContent}</ul>`;
        } else {
            contentHTML += `<p style="margin: 4px 0;">Carrying: Nothing</p>`;
        }

        this.selectedUnitInfoPanel.innerHTML = contentHTML;
        this.uiOverlay.appendChild(this.selectedUnitInfoPanel);
    }

    clearSelectedUnitInfo() {
        if (this.selectedUnitInfoPanel && this.selectedUnitInfoPanel.parentElement) {
            this.selectedUnitInfoPanel.parentElement.removeChild(this.selectedUnitInfoPanel);
        }
        this.selectedUnitInfoPanel = null;
    }

    onWindowResize() {
        // This method might be needed if any UI panels have sizes dependent on viewport
        // For example, if a panel should not exceed viewport height.
        // For now, most panels are fixed size or use CSS that handles responsiveness.
        // If specific panels need JS-based resizing, add that logic here.
        // Example: if resourcePanel needs to adjust its maxHeight:
        if (this.resourcePanel) {
            this.resourcePanel.style.maxHeight = `calc(100vh - 20px - ${this.testButtonContainer.offsetHeight + 10}px)`;
        }
        if (this.constructionPanel) {
            this.constructionPanel.style.maxHeight = `calc(100vh - 20px - ${this.miniMapPanel.offsetHeight + 10}px)`;
        }
    }

    // This method will be called by Game.js or an input manager
    handleCanvasClick(event, raycaster, camera, gameMap, constructionManager, serfManagerInstance, outlinePassSetter) {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        if (constructionManager.isPlacing) {
            const intersectsPlacement = raycaster.intersectObject(gameMap.tileMeshes, true);
            const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            let placementPoint = new THREE.Vector3();
            if (intersectsPlacement.length > 0) {
                placementPoint = intersectsPlacement[0].point;
            } else {
                raycaster.ray.intersectPlane(groundPlane, placementPoint);
            }
            if (placementPoint) constructionManager.confirmPlacement(placementPoint);
        } else {
            const buildingsGroup = camera.parent.getObjectByName("GameBuildings"); // Assuming scene is camera.parent
            if (buildingsGroup) {
                const intersectsSelection = raycaster.intersectObjects(buildingsGroup.children, true);
                if (intersectsSelection.length > 0) {
                    let topObject = intersectsSelection[0].object;
                    while (topObject.parent && topObject.parent !== buildingsGroup) {
                        topObject = topObject.parent;
                    }
                    outlinePassSetter([topObject]);
                    this.displaySelectedBuildingInfo(topObject);
                    return topObject; // Return selected object
                }
            }

            // Check for serf selection - serfs are now direct children of the scene
            const serfModels = serfManagerInstance.serfs.map(s => s.model).filter(m => m);
            if (serfModels.length > 0) {
                const intersectsSerfs = raycaster.intersectObjects(serfModels, true);
                if (intersectsSerfs.length > 0) {
                    let topSerfModel = intersectsSerfs[0].object;
                    // Traverse up to the main serf group (which is the model itself if added directly to scene)
                     while (topSerfModel.parent && topSerfModel.parent !== camera.parent /* scene */ && !serfModels.includes(topSerfModel)) {
                        topSerfModel = topSerfModel.parent;
                    }
                    if (serfModels.includes(topSerfModel)) {
                         outlinePassSetter([topSerfModel]);
                         this.displaySelectedUnitInfo(topSerfModel);
                         return topSerfModel; // Return selected object
                    }
                }
            }
            outlinePassSetter([]);
            this.clearSelectedBuildingInfo();
            this.clearSelectedUnitInfo();
        }
        return null; // Return null if nothing was selected or action was placement
    }

    handleOverlayClick(event, constructionManager, outlinePassSetter) {
        // If click is on a UI button or panel, do nothing further for deselection
        if (event.target.closest('md-filled-button, md-outlined-button, #selected-info-panel, #selected-unit-info-panel, .themed-panel')) {
            return true; // Indicate UI interaction handled
        }
        // If click is on overlay but not a specific UI element, and not placing, then deselect
        if (!constructionManager.isPlacing) {
            outlinePassSetter([]);
            this.clearSelectedBuildingInfo();
            this.clearSelectedUnitInfo();
        }
        return false; // Indicate general overlay click, potentially for deselection
    }
}

export default UIManager;
