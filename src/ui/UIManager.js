import { RESOURCE_TYPES } from '../config/resourceTypes.js'; // May be needed for UI updates
import { SERF_PROFESSIONS } from '../config/serfProfessions.js';
import { FORESTER_SAPLING_UPGRADE_AMOUNT } from '../config/unitConstants.js';

class UIManager {
    constructor(uiContainer, resourceManager, constructionManager, serfManager, selectionManager) {
        this.uiContainer = uiContainer; // Changed from uiOverlay to uiContainer
        this.resourceManager = resourceManager;
        this.constructionManager = constructionManager;
        this.serfManager = serfManager; // To get serf data for info panel
        this.selectionManager = selectionManager; // Store SelectionManager

        this.resourcePanel = null;
        this.serfListPanel = null; // New panel for serf list
        this.buildingListPanel = null; // New panel for building list
        this.miniMapPanel = null;
        this.testButtonContainer = null;
        this.constructionPanel = null;
        this.selectedBuildingInfoPanel = null;
        this.selectedUnitInfoPanel = null;

        this.buildingButtons = new Map();
        this.onSerfSelectCallback = null; // Callback for when a serf is selected from the list
        this.onBuildingSelectCallback = null; // Callback for when a building is selected

        if (!this.uiContainer) {
            console.error("UIManager: uiContainer element not found. UI will not be initialized.");
            return;
        }

        this.initResourcePanel();
        this.initSerfListPanel(); // Initialize the new panel
        this.initBuildingListPanel(); // Initialize building list panel
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

        this._subscribeToSelectionChanges(); // Subscribe to SelectionManager

        // Listen for changes in serf population
        if (this.serfManager && typeof this.serfManager.onChange === 'function') {
            this.serfManager.onChange(() => {
                this.updateSerfListUI();
            });
            this.updateSerfListUI(); // Initial update
        } else {
            console.warn("UIManager: SerfManager not available or doesn't have onChange method. Serf list will not auto-update.");
        }

        // Listen for changes in buildings (new listener needed in ConstructionManager)
        if (this.constructionManager && typeof this.constructionManager.onChange === 'function') {
            this.constructionManager.onChange(() => {
                this.updateBuildingListUI();
            });
            this.updateBuildingListUI(); // Initial update
        } else {
            console.warn("UIManager: ConstructionManager not available or doesn't have onChange method. Building list will not auto-update.");
        }

        // Add resize listener for UI elements that need it
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        this.onWindowResize(); // Call once to set initial sizes
    }

    setSerfSelectCallback(callback) {
        this.onSerfSelectCallback = callback;
    }

    // Method to set the building selection callback
    setBuildingSelectCallback(callback) {
        this.onBuildingSelectCallback = callback;
    }

    initResourcePanel() {
        this.resourcePanel = document.createElement('div');
        this.resourcePanel.id = 'resource-panel';
        this.resourcePanel.classList.add('themed-panel');
        this.resourcePanel.style.top = '10px';
        this.resourcePanel.style.left = '10px';
        this.resourcePanel.style.minWidth = '230px';
        this.resourcePanel.style.maxHeight = 'calc(100vh - 20px)'; // Max height for the panel itself
        this.resourcePanel.style.overflowY = 'auto'; // Scroll for the panel when content overflows

        const resourceTitle = document.createElement('h3');
        resourceTitle.textContent = 'Resources';
        resourceTitle.classList.add('themed-panel-title');
        this.resourcePanel.appendChild(resourceTitle);

        // Create content area
        this.resourcePanelContent = document.createElement('div');
        this.resourcePanelContent.classList.add('panel-content-area');
        this.resourcePanel.appendChild(this.resourcePanelContent);

        resourceTitle.addEventListener('click', () => {
            const isHidden = this.resourcePanelContent.style.display === 'none';
            this.resourcePanelContent.style.display = isHidden ? '' : 'none';
        });

        this.uiContainer.appendChild(this.resourcePanel);
    }

    initSerfListPanel() {
        this.serfListPanel = document.createElement('div');
        this.serfListPanel.id = 'serf-list-panel';
        this.serfListPanel.classList.add('themed-panel');
        this.serfListPanel.style.top = '10px';
        // Position it to the right of the resource panel.
        // Assuming resourcePanel is ~230px wide + 10px padding + 10px gap = 250px
        this.serfListPanel.style.left = '250px'; 
        this.serfListPanel.style.minWidth = '200px';
        this.serfListPanel.style.maxHeight = 'calc(100vh - 20px)'; // Same height as resource panel
        this.serfListPanel.style.overflowY = 'auto'; // Scroll for the panel

        const serfListTitle = document.createElement('h3');
        serfListTitle.textContent = 'Serfs';
        serfListTitle.classList.add('themed-panel-title');
        this.serfListPanel.appendChild(serfListTitle);

        // Create content area
        this.serfListPanelContent = document.createElement('div');
        this.serfListPanelContent.classList.add('panel-content-area');
        this.serfListPanel.appendChild(this.serfListPanelContent);
        
        serfListTitle.addEventListener('click', () => {
            const isHidden = this.serfListPanelContent.style.display === 'none';
            this.serfListPanelContent.style.display = isHidden ? '' : 'none';
        });

        this.uiContainer.appendChild(this.serfListPanel);
    }

    initBuildingListPanel() {
        this.buildingListPanel = document.createElement('div');
        this.buildingListPanel.id = 'building-list-panel';
        this.buildingListPanel.classList.add('themed-panel');
        this.buildingListPanel.style.top = '10px';
        // Position it to the right of the serf list panel.
        // serfListPanel.left (250px) + serfListPanel.minWidth (200px) + 10px gap = 460px
        this.buildingListPanel.style.left = '460px'; 
        this.buildingListPanel.style.minWidth = '220px';
        this.buildingListPanel.style.maxHeight = 'calc(100vh - 20px)';
        this.buildingListPanel.style.overflowY = 'auto';

        const buildingListTitle = document.createElement('h3');
        buildingListTitle.textContent = 'Buildings on Map';
        buildingListTitle.classList.add('themed-panel-title');
        this.buildingListPanel.appendChild(buildingListTitle);

        this.buildingListPanelContent = document.createElement('div');
        this.buildingListPanelContent.classList.add('panel-content-area');
        this.buildingListPanel.appendChild(this.buildingListPanelContent);

        buildingListTitle.addEventListener('click', () => {
            const isHidden = this.buildingListPanelContent.style.display === 'none';
            this.buildingListPanelContent.style.display = isHidden ? '' : 'none';
        });

        this.uiContainer.appendChild(this.buildingListPanel);
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
        this.uiContainer.appendChild(this.miniMapPanel);
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
        this.uiContainer.appendChild(this.testButtonContainer);
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
        this.uiContainer.appendChild(this.constructionPanel);
    }

    initSelectionInfoPanels() {
        // Selected Unit Info Panel
        this.selectedUnitInfoPanel = document.createElement('div');
        this.selectedUnitInfoPanel.id = 'selected-unit-info-panel';
        this.selectedUnitInfoPanel.classList.add('themed-panel');
        this.selectedUnitInfoPanel.style.position = 'absolute';
        this.selectedUnitInfoPanel.style.bottom = '10px';
        // Position it to the left of the construction panel
        // Assuming construction panel is ~220px wide + 10px gap = 230px from right
        this.selectedUnitInfoPanel.style.right = '240px'; 
        this.selectedUnitInfoPanel.style.width = '250px'; // Adjusted width
        this.selectedUnitInfoPanel.style.minHeight = '100px';
        this.selectedUnitInfoPanel.style.maxHeight = '300px';
        this.selectedUnitInfoPanel.style.overflowY = 'auto';
        this.selectedUnitInfoPanel.style.display = 'none'; // Hidden by default
        this.selectedUnitInfoPanel.style.padding = '10px';
        this.selectedUnitInfoPanel.style.boxSizing = 'border-box';

        const unitInfoTitle = document.createElement('h3');
        unitInfoTitle.textContent = 'Selected Unit';
        unitInfoTitle.classList.add('themed-panel-title');
        this.selectedUnitInfoPanel.appendChild(unitInfoTitle);

        this.selectedUnitInfoContent = document.createElement('div');
        this.selectedUnitInfoContent.classList.add('panel-content-area');
        this.selectedUnitInfoPanel.appendChild(this.selectedUnitInfoContent);
        
        this.uiContainer.appendChild(this.selectedUnitInfoPanel);

        // Selected Building Info Panel
        this.selectedBuildingInfoPanel = document.createElement('div');
        this.selectedBuildingInfoPanel.id = 'selected-building-info-panel';
        this.selectedBuildingInfoPanel.classList.add('themed-panel');
        this.selectedBuildingInfoPanel.style.position = 'absolute';
        this.selectedBuildingInfoPanel.style.bottom = '10px';
        // Position it to the left of the construction panel, same as unit info or adjust as needed
        this.selectedBuildingInfoPanel.style.right = '240px'; 
        this.selectedBuildingInfoPanel.style.width = '250px'; 
        this.selectedBuildingInfoPanel.style.minHeight = '100px';
        this.selectedBuildingInfoPanel.style.maxHeight = '300px';
        this.selectedBuildingInfoPanel.style.overflowY = 'auto';
        this.selectedBuildingInfoPanel.style.display = 'none'; // Hidden by default
        this.selectedBuildingInfoPanel.style.padding = '10px';
        this.selectedBuildingInfoPanel.style.boxSizing = 'border-box';

        const buildingInfoTitle = document.createElement('h3');
        buildingInfoTitle.textContent = 'Selected Building';
        buildingInfoTitle.classList.add('themed-panel-title');
        this.selectedBuildingInfoPanel.appendChild(buildingInfoTitle);

        this.selectedBuildingInfoContent = document.createElement('div');
        this.selectedBuildingInfoContent.classList.add('panel-content-area');
        this.selectedBuildingInfoPanel.appendChild(this.selectedBuildingInfoContent);

        this.uiContainer.appendChild(this.selectedBuildingInfoPanel); // Add to UI container
    }

    updateResourceUI(stockpiles) {
        if (!this.resourcePanel || !this.resourcePanelContent) return; // Check for content area
        this.resourcePanelContent.innerHTML = ''; // Clear only the content area

        // Title is already part of this.resourcePanel, no need to re-add here

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
        this.resourcePanelContent.appendChild(table); // Append table to content area
    }

    updateSerfListUI() {
        if (!this.serfListPanel || !this.serfListPanelContent || !this.serfManager || typeof this.serfManager.getSerfsGroupedByProfession !== 'function') {
            if (this.serfListPanelContent && (!this.serfManager || typeof this.serfManager.getSerfsGroupedByProfession !== 'function')) {
                this.serfListPanelContent.innerHTML = ''; // Clear content area
                const placeholder = document.createElement('p');
                placeholder.textContent = 'Serf data unavailable.';
                placeholder.style.padding = '5px';
                placeholder.style.fontStyle = 'italic';
                placeholder.style.color = 'rgba(255,255,255,0.7)';
                this.serfListPanelContent.appendChild(placeholder);
            }
            return;
        }

        this.serfListPanelContent.innerHTML = ''; // Clear only the content area
        // Title is already part of this.serfListPanel

        const serfsByProfession = this.serfManager.getSerfsGroupedByProfession();

        if (Object.keys(serfsByProfession).length === 0) {
            const noSerfsMessage = document.createElement('p');
            noSerfsMessage.textContent = 'No serfs active.';
            noSerfsMessage.style.padding = '5px';
            noSerfsMessage.style.fontStyle = 'italic';
            noSerfsMessage.style.color = 'rgba(255,255,255,0.7)';
            this.serfListPanelContent.appendChild(noSerfsMessage); // Append to content area
            return;
        }

        for (const profession in serfsByProfession) {
            const serfs = serfsByProfession[profession];
            if (serfs.length > 0) {
                const professionHeader = document.createElement('h5');
                professionHeader.textContent = profession.replace(/([A-Z])/g, ' $1').trim(); // Add space before caps
                professionHeader.classList.add('serf-list-panel-subheader');
                this.serfListPanelContent.appendChild(professionHeader);

                const ul = document.createElement('ul');
                serfs.forEach(serf => {
                    const li = document.createElement('li');
                    li.textContent = `Serf ${serf.id.substring(0, 6)}`; // Display partial ID
                    li.classList.add('serf-list-item');
                    li.dataset.serfId = serf.id; // Store full ID

                    li.addEventListener('click', () => {
                        if (this.onSerfSelectCallback) {
                            this.onSerfSelectCallback(serf.id);
                        } else {
                            console.warn('UIManager: onSerfSelectCallback not set.');
                        }
                    });
                    ul.appendChild(li);
                });
                this.serfListPanelContent.appendChild(ul); // Append to content area
            }
        }
    }

    updateBuildingListUI() {
        if (!this.buildingListPanel || !this.buildingListPanelContent || !this.constructionManager) {
            if (this.buildingListPanelContent) {
                this.buildingListPanelContent.innerHTML = '';
                const placeholder = document.createElement('p');
                placeholder.textContent = 'Building data unavailable.';
                placeholder.style.padding = '5px';
                placeholder.style.fontStyle = 'italic';
                placeholder.style.color = 'rgba(255,255,255,0.7)';
                this.buildingListPanelContent.appendChild(placeholder);
            }
            return;
        }

        this.buildingListPanelContent.innerHTML = '';
        const buildings = this.constructionManager.placedBuildings.concat(this.constructionManager.buildingsUnderConstruction);

        if (buildings.length === 0) {
            const noBuildingsMessage = document.createElement('p');
            noBuildingsMessage.textContent = 'No buildings on map.';
            noBuildingsMessage.style.padding = '5px';
            noBuildingsMessage.style.fontStyle = 'italic';
            noBuildingsMessage.style.color = 'rgba(255,255,255,0.7)';
            this.buildingListPanelContent.appendChild(noBuildingsMessage);
            return;
        }

        // Group buildings by type for better display
        const buildingsByType = buildings.reduce((acc, building) => {
            const typeName = building.info.name || building.type;
            if (!acc[typeName]) {
                acc[typeName] = [];
            }
            acc[typeName].push(building);
            return acc;
        }, {});

        for (const typeName in buildingsByType) {
            const buildingGroup = buildingsByType[typeName];
            if (buildingGroup.length > 0) {
                const typeHeader = document.createElement('h5');
                typeHeader.textContent = typeName;
                typeHeader.classList.add('building-list-panel-subheader');
                this.buildingListPanelContent.appendChild(typeHeader);

                const ul = document.createElement('ul');
                buildingGroup.forEach(building => {
                    const li = document.createElement('li');
                    let status = building.isConstructed ? 'Completed' : 'Constructing';
                    li.textContent = `${building.info.name} (ID: ${building.model.uuid.substring(0,6)}) - ${status}`;
                    li.classList.add('building-list-item');
                    li.dataset.buildingId = building.model.uuid;

                    li.addEventListener('click', () => {
                        // Reuse selectAndFocusSerf logic for focusing, adapt for buildings
                        // This requires a new method in Game.js: selectAndFocusBuilding(buildingId)
                        if (this.onBuildingSelectCallback) { // A new callback for buildings
                            this.onBuildingSelectCallback(building.model.uuid);
                        }
                        // Also, directly update selection for immediate feedback if Game doesn't handle it fast enough
                        // Or rely on Game to call displaySelectedBuildingInfo
                    });
                    ul.appendChild(li);
                });
                this.buildingListPanelContent.appendChild(ul);
            }
        }
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

    // Removed dead code: displaySelectedBuildingInfo(buildingModel)
    // Removed dead code: clearSelectedBuildingInfo()
    // Removed dead code: displaySelectedUnitInfo(serfModel)
    // Removed dead code: clearSelectedUnitInfo()

    displayUnitInfo(unit) {
        if (!this.selectedUnitInfoPanel || !this.selectedUnitInfoContent || !unit) {
            this.hideUnitInfo();
            return;
        }
        this.selectedUnitInfoContent.innerHTML = ''; // Clear previous content

        const details = document.createElement('div');
        details.innerHTML = `
            <p><strong>ID:</strong> ${unit.id}</p>
            <p><strong>Type:</strong> ${unit.serfType || 'N/A'}</p>
            <p><strong>State:</strong> ${unit.state || 'N/A'}</p>
            <p><strong>Task:</strong> ${unit.task || 'None'}</p>
            ${unit.model ? `<p><strong>Position:</strong> X: ${unit.model.position.x.toFixed(1)}, Z: ${unit.model.position.z.toFixed(1)}</p>` : ''}
        `;

        if (unit.serfType === SERF_PROFESSIONS.FORESTER) {
            const plantedCount = unit.plantedSaplingsCount !== undefined ? unit.plantedSaplingsCount : 'N/A';
            const maxPlanted = unit.maxPlantedSaplings !== undefined ? unit.maxPlantedSaplings : 'N/A';
            details.innerHTML += `<p><strong>Saplings Planted:</strong> ${plantedCount} / ${maxPlanted}</p>`;

            const upgradeButton = document.createElement('md-filled-button');
            upgradeButton.textContent = 'Upgrade Max Saplings';
            upgradeButton.style.marginTop = '10px';
            upgradeButton.style.width = '100%';
            upgradeButton.addEventListener('click', () => {
                if (unit.upgradeMaxPlantedSaplings) {
                    // The FORESTER_SAPLING_UPGRADE_AMOUNT should be available here
                    // It's imported at the top of UIManager.js
                    unit.upgradeMaxPlantedSaplings(FORESTER_SAPLING_UPGRADE_AMOUNT);
                    this.displayUnitInfo(unit); // Refresh panel
                    // Resource UI will be updated by the resourceManager's onChange event
                } else {
                    console.error("Selected unit does not have upgradeMaxPlantedSaplings method.");
                }
            });
            details.appendChild(upgradeButton);
        }
        
        // Display inventory if it exists and is not empty
        if (unit.inventory && Object.keys(unit.inventory).length > 0) {
            let inventoryHTML = '<p><strong>Inventory:</strong></p><ul>';
            for (const resource in unit.inventory) {
                if (unit.inventory[resource] > 0) {
                    inventoryHTML += `<li>${resource.replace(/_/g, ' ')}: ${unit.inventory[resource]}</li>`;
                }
            }
            inventoryHTML += '</ul>';
            details.innerHTML += inventoryHTML;
        }


        this.selectedUnitInfoContent.appendChild(details);
        this.selectedUnitInfoPanel.style.display = 'block';
        this.hideBuildingInfo(); // Hide building info when showing unit info
    }

    hideUnitInfo() {
        if (this.selectedUnitInfoPanel) {
            this.selectedUnitInfoPanel.style.display = 'none';
            if (this.selectedUnitInfoContent) {
                this.selectedUnitInfoContent.innerHTML = ''; // Clear content
            }
        }
    }

    displayBuildingInfo(building) {
        if (!this.selectedBuildingInfoPanel || !this.selectedBuildingInfoContent || !building) {
            this.hideBuildingInfo();
            return;
        }
        this.selectedBuildingInfoContent.innerHTML = ''; // Clear previous content

        const details = document.createElement('div');
        let buildingName = 'N/A';
        let buildingStatus = 'N/A';
        let buildingPosition = '';

        if (building.info && building.info.name) {
            buildingName = building.info.name;
        } else if (building.type) {
            buildingName = building.type; // Fallback to type
        }
        
        if (building.isConstructed !== undefined) {
            buildingStatus = building.isConstructed ? 'Completed' : 'Under Construction';
        }
        
        if (building.model) {
            buildingPosition = `<p><strong>Position:</strong> X: ${building.model.position.x.toFixed(1)}, Z: ${building.model.position.z.toFixed(1)}</p>`;
        }

        details.innerHTML = `
            <p><strong>Name:</strong> ${buildingName}</p>
            <p><strong>Status:</strong> ${buildingStatus}</p>
            ${buildingPosition}
        `;

        // Display workers if any
        if (building.workers && building.workers.length > 0) {
            details.innerHTML += `<p><strong>Workers:</strong> ${building.workers.length} / ${building.info.jobSlots || 'N/A'}</p>`;
            // Could list worker IDs if needed: building.workers.join(', ')
        } else if (building.info && building.info.jobSlots) {
            details.innerHTML += `<p><strong>Workers:</strong> 0 / ${building.info.jobSlots}</p>`;
        }
        
        // Display inventory if the building has one (e.g., for storehouses, production buildings)
        if (building.inventory && typeof building.getStock === 'function') {
            const inventoryItems = [];
            for (const resourceType in building.inventory) {
                const amount = building.getStock(resourceType);
                if (amount > 0) {
                    inventoryItems.push(`<li>${resourceType.replace(/_/g, ' ')}: ${amount}</li>`);
                }
            }
            if (inventoryItems.length > 0) {
                details.innerHTML += `<p><strong>Inventory:</strong></p><ul>${inventoryItems.join('')}</ul>`;
            } else {
                 details.innerHTML += `<p><strong>Inventory:</strong> Empty</p>`;
            }
        }


        this.selectedBuildingInfoContent.appendChild(details);
        this.selectedBuildingInfoPanel.style.display = 'block';
        this.hideUnitInfo(); // Hide unit info when showing building info
    }

    hideBuildingInfo() {
        if (this.selectedBuildingInfoPanel) {
            this.selectedBuildingInfoPanel.style.display = 'none';
            if (this.selectedBuildingInfoContent) {
                this.selectedBuildingInfoContent.innerHTML = ''; // Clear content
            }
        }
    }

    onWindowResize() {
        // This method might be needed if any UI panels have sizes dependent on viewport
        // For example, if a panel should not exceed viewport height.
        // For now, most panels are fixed size or use CSS that handles responsiveness.
        // Example: if resourcePanel needs to adjust its maxHeight:
        if (this.resourcePanel) {
            this.resourcePanel.style.maxHeight = `calc(100vh - 20px - ${this.testButtonContainer.offsetHeight + 10}px)`;
        }
        if (this.constructionPanel) {
            this.constructionPanel.style.maxHeight = `calc(100vh - 20px - ${this.miniMapPanel.offsetHeight + 10}px)`;
        }
    }

_subscribeToSelectionChanges() {
    if (this.selectionManager && typeof this.selectionManager.onSelectionChange === 'function') {
        this.selectionManager.onSelectionChange((selectedEntity) => {
            if (selectedEntity) {
                // Determine if it's a Serf or Building based on its properties
                if (selectedEntity.unitType === 'serf' || selectedEntity.serfType) { // serfType is on Serf instance
                    this.displayUnitInfo(selectedEntity); // Pass the Serf instance
                } else if (selectedEntity.info && selectedEntity.info.name) { // Building instances have 'info.name'
                    this.displayBuildingInfo(selectedEntity); // Pass the Building instance
                } else {
                    console.warn("UIManager: Selected entity type not recognized.", selectedEntity);
                    this.hideUnitInfo();
                    this.hideBuildingInfo();
                    }
            } else {
                this.hideUnitInfo();
                this.hideBuildingInfo();
                }
        });
        console.log("UIManager: Subscribed to SelectionManager changes.");
    } else {
        console.warn("UIManager: SelectionManager not provided or 'onSelectionChange' is not available. UI will not update on selection.");
        }
    }

// Removed handleCanvasClick method
// Removed handleOverlayClick method
}

export default UIManager;
