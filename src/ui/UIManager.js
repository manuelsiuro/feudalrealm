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
        this.resourceCounterBar = null; // New top resource counter bar
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

        this.initResourceCounterBar(); // Add the new resource counter bar first
        this.initResourcePanel();
        this.initSerfListPanel(); // Initialize the new panel
        this.initBuildingListPanel(); // Initialize building list panel
        this.initMiniMapPanel(); // Placeholder
        this.initTestButtons(); // Cheat buttons
        this.initConstructionPanel();
        this.initSelectionInfoPanels(); // Sets up placeholders, actual display is dynamic

        this.resourceManager.onChange((stockpiles) => {
            this.updateResourceUI(stockpiles);
            this.updateResourceCounterBar(stockpiles); // Add real-time counter bar updates
            this.updateBuildingButtons();
        });

        // Initial UI updates
        this.updateResourceUI(this.resourceManager.getAllStockpiles());
        this.updateResourceCounterBar(this.resourceManager.getAllStockpiles()); // Initial counter bar update
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

    initResourceCounterBar() {
        // Create a prominent resource counter bar at the top of the screen
        this.resourceCounterBar = document.createElement('div');
        this.resourceCounterBar.id = 'resource-counter-bar';
        this.resourceCounterBar.style.position = 'absolute';
        this.resourceCounterBar.style.top = '0';
        this.resourceCounterBar.style.left = '0';
        this.resourceCounterBar.style.right = '0';
        this.resourceCounterBar.style.height = '50px';
        this.resourceCounterBar.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        this.resourceCounterBar.style.borderBottom = '2px solid rgba(76, 175, 80, 0.8)';
        this.resourceCounterBar.style.display = 'flex';
        this.resourceCounterBar.style.alignItems = 'center';
        this.resourceCounterBar.style.padding = '0 20px';
        this.resourceCounterBar.style.zIndex = '100';
        this.resourceCounterBar.style.backdropFilter = 'blur(5px)';
        this.resourceCounterBar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';

        // Add title
        const title = document.createElement('span');
        title.textContent = 'Resources:';
        title.style.color = '#4CAF50';
        title.style.fontWeight = 'bold';
        title.style.marginRight = '20px';
        title.style.fontSize = '14px';
        title.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.8)';
        this.resourceCounterBar.appendChild(title);

        // Container for resource items
        this.resourceCounterContainer = document.createElement('div');
        this.resourceCounterContainer.style.display = 'flex';
        this.resourceCounterContainer.style.gap = '15px';
        this.resourceCounterContainer.style.alignItems = 'center';
        this.resourceCounterContainer.style.flexWrap = 'wrap';
        this.resourceCounterBar.appendChild(this.resourceCounterContainer);

        this.uiContainer.appendChild(this.resourceCounterBar);

        // Adjust other top panels to account for the new counter bar
        setTimeout(() => {
            if (this.resourcePanel) {
                this.resourcePanel.style.top = '60px'; // 50px bar + 10px gap
            }
            if (this.serfListPanel) {
                this.serfListPanel.style.top = '60px';
            }
            if (this.buildingListPanel) {
                this.buildingListPanel.style.top = '60px';
            }
            if (this.miniMapPanel) {
                this.miniMapPanel.style.top = '60px';
            }
        }, 0);
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
        this.resourcePanel.style.top = '50px';
        this.resourcePanel.style.left = '10px';
        this.resourcePanel.style.minWidth = '230px';
        this.resourcePanel.style.maxHeight = 'calc(100vh - 60px)'; // Max height for the panel itself
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

    updateResourceCounterBar(stockpiles) {
        if (!this.resourceCounterContainer) return;
        
        // Store previous values for change detection
        if (!this.previousResourceValues) {
            this.previousResourceValues = {};
        }
        
        this.resourceCounterContainer.innerHTML = ''; // Clear previous content

        // Define the most important resources to display in the counter bar
        const priorityResources = [
            RESOURCE_TYPES.WOOD,
            RESOURCE_TYPES.STONE, 
            RESOURCE_TYPES.GRAIN,
            RESOURCE_TYPES.IRON_ORE,
            RESOURCE_TYPES.COAL_ORE,
            RESOURCE_TYPES.GOLD_ORE,
            RESOURCE_TYPES.PLANKS,
            RESOURCE_TYPES.IRON_BARS,
            RESOURCE_TYPES.TOOL_AXE,
            RESOURCE_TYPES.TOOL_PICKAXE
        ].filter(type => type !== undefined); // Filter out any undefined types

        priorityResources.forEach(resourceType => {
            if (!stockpiles.hasOwnProperty(resourceType)) return;

            const amount = stockpiles[resourceType];
            const previousAmount = this.previousResourceValues[resourceType] || 0;
            const hasChanged = amount !== previousAmount;
            
            const resourceItem = document.createElement('div');
            resourceItem.className = 'resource-item';
            if (hasChanged && previousAmount > 0) {
                resourceItem.classList.add('resource-item-updated');
            }
            
            resourceItem.style.display = 'flex';
            resourceItem.style.alignItems = 'center';
            resourceItem.style.gap = '6px';
            resourceItem.style.padding = '4px 8px';
            resourceItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            resourceItem.style.borderRadius = '6px';
            resourceItem.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            resourceItem.style.minWidth = '70px';
            resourceItem.style.justifyContent = 'center';

            // Add a subtle animation for resource changes
            resourceItem.style.transition = 'all 0.3s ease-in-out';

            // Resource icon (using emoji as placeholder for now)
            const icon = document.createElement('span');
            icon.style.fontSize = '16px';
            icon.style.lineHeight = '1';
            
            // Map resource types to icons
            const resourceIcons = {
                [RESOURCE_TYPES.WOOD]: '🪵',
                [RESOURCE_TYPES.STONE]: '🪨', 
                [RESOURCE_TYPES.GRAIN]: '🌾',
                [RESOURCE_TYPES.IRON_ORE]: '⛏️',
                [RESOURCE_TYPES.COAL_ORE]: '⚫',
                [RESOURCE_TYPES.GOLD_ORE]: '💰',
                [RESOURCE_TYPES.PLANKS]: '📏',
                [RESOURCE_TYPES.IRON_BARS]: '🔩',
                [RESOURCE_TYPES.TOOL_AXE]: '🪓',
                [RESOURCE_TYPES.TOOL_PICKAXE]: '⛏️'
            };
            
            icon.textContent = resourceIcons[resourceType] || '📦';
            resourceItem.appendChild(icon);

            // Resource amount
            const amountSpan = document.createElement('span');
            amountSpan.textContent = amount.toString();
            amountSpan.style.color = 'white';
            amountSpan.style.fontWeight = 'bold';
            amountSpan.style.fontSize = '14px';
            amountSpan.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.8)';
            
            // Color coding based on amount
            if (amount === 0) {
                amountSpan.style.color = '#FF6B6B'; // Red for empty
                resourceItem.style.backgroundColor = 'rgba(255, 107, 107, 0.2)';
                resourceItem.style.borderColor = 'rgba(255, 107, 107, 0.4)';
            } else if (amount < 10) {
                amountSpan.style.color = '#FFE66D'; // Yellow for low
                resourceItem.style.backgroundColor = 'rgba(255, 230, 109, 0.2)';
                resourceItem.style.borderColor = 'rgba(255, 230, 109, 0.4)';
            } else {
                amountSpan.style.color = '#4ECDC4'; // Cyan for good amounts
                resourceItem.style.backgroundColor = 'rgba(78, 205, 196, 0.2)';
                resourceItem.style.borderColor = 'rgba(78, 205, 196, 0.4)';
            }

            resourceItem.appendChild(amountSpan);

            // Add hover effect
            resourceItem.addEventListener('mouseenter', () => {
                resourceItem.style.transform = 'scale(1.05)';
                resourceItem.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            });
            
            resourceItem.addEventListener('mouseleave', () => {
                resourceItem.style.transform = 'scale(1)';
                // Restore original background color based on amount
                if (amount === 0) {
                    resourceItem.style.backgroundColor = 'rgba(255, 107, 107, 0.2)';
                } else if (amount < 10) {
                    resourceItem.style.backgroundColor = 'rgba(255, 230, 109, 0.2)';
                } else {
                    resourceItem.style.backgroundColor = 'rgba(78, 205, 196, 0.2)';
                }
            });

            // Add tooltip with resource name
            const resourceName = resourceType.split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
            resourceItem.title = resourceName;

            this.resourceCounterContainer.appendChild(resourceItem);
            
            // Store current value for next comparison
            this.previousResourceValues[resourceType] = amount;
        });
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
        // Combine all relevant building lists from ConstructionManager
        const buildings = [
            ...this.constructionManager.placedBuildings,
            ...this.constructionManager.activeConstructions,
            ...this.constructionManager.constructionQueue
        ];

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
            // Check if building and building.info are defined
            if (building && building.info && building.info.name) {
                const typeName = building.info.name || building.type; // Fallback to building.type if name is somehow missing
                if (!acc[typeName]) {
                    acc[typeName] = [];
                }
                acc[typeName].push(building);
            } else if (building && building.type) {
                // Fallback if info or info.name is missing, but type exists
                const typeName = building.type;
                if (!acc[typeName]) {
                    acc[typeName] = [];
                }
                acc[typeName].push(building);
                console.warn(`UIManager: Building with ID ${building.id || 'N/A'} (Type: ${building.type}) is missing 'info.name'. Grouping by type.`);
            } else {
                console.warn("UIManager: Encountered a building object without 'info' or 'type' property.", building);
            }
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
                    // Ensure building.info and building.info.name exist before accessing
                    const displayName = (building.info && building.info.name) ? building.info.name : (building.type || 'Unknown Building');
                    const displayId = (building.model && building.model.uuid) ? building.model.uuid.substring(0,6) : (building.id || 'N/A');
                    li.textContent = `${displayName} (ID: ${displayId}) - ${status}`;
                    li.classList.add('building-list-item');
                    li.dataset.buildingId = (building.model && building.model.uuid) ? building.model.uuid : '';

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

    // Enhanced selection feedback methods
    clearSelectionHighlights() {
        // Remove selection classes from all list items
        document.querySelectorAll('.building-list-item.selected, .serf-list-item.selected').forEach(item => {
            item.classList.remove('selected', 'selection-pulse');
        });
        
        // Remove selection classes from info panels
        document.querySelectorAll('.themed-panel.entity-selected').forEach(panel => {
            panel.classList.remove('entity-selected');
        });
        
        document.querySelectorAll('.themed-panel-title.entity-selected').forEach(title => {
            title.classList.remove('entity-selected');
        });
    }
    
    highlightSelectedBuilding(building) {
        if (!building || !building.model) return;
        
        // Find and highlight the building in the building list
        const buildingItems = document.querySelectorAll('.building-list-item');
        buildingItems.forEach(item => {
            if (item.dataset.buildingId === building.model.uuid) {
                item.classList.add('selected', 'selection-pulse');
                // Scroll item into view if needed
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
        
        // Enhance building info panel appearance
        if (this.selectedBuildingInfoPanel) {
            this.selectedBuildingInfoPanel.classList.add('entity-selected');
            const title = this.selectedBuildingInfoPanel.querySelector('.themed-panel-title');
            if (title) title.classList.add('entity-selected');
        }
    }
    
    highlightSelectedSerf(serf) {
        if (!serf || !serf.id) return;
        
        // Find and highlight the serf in the serf list
        const serfItems = document.querySelectorAll('.serf-list-item');
        serfItems.forEach(item => {
            if (item.dataset.serfId === serf.id) {
                item.classList.add('selected', 'selection-pulse');
                // Scroll item into view if needed
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
        
        // Enhance serf info panel appearance
        if (this.selectedSerfInfoPanel) {
            this.selectedSerfInfoPanel.classList.add('entity-selected');
            const title = this.selectedSerfInfoPanel.querySelector('.themed-panel-title');
            if (title) title.classList.add('entity-selected');
        }
    }
    
    showSelectionStatus(entity) {
        // Create or update selection status indicator
        let statusElement = document.getElementById('selection-status');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'selection-status';
            statusElement.className = 'selection-status';
            document.body.appendChild(statusElement);
        }
        
        let statusText = '';
        if (entity.info && entity.info.name) {
            const state = entity.isConstructed ? 'Ready' : 'Building';
            statusText = `🏗️ ${entity.info.name} - ${state}`;
        } else if (entity.serfType) {
            const state = entity.currentTask ? 'Working' : 'Idle';
            statusText = `👷 ${entity.serfType} - ${state}`;
        }
        
        statusElement.textContent = statusText;
        statusElement.classList.add('visible');
        
        // Auto-hide after 3 seconds
        clearTimeout(this.selectionStatusTimeout);
        this.selectionStatusTimeout = setTimeout(() => {
            this.hideSelectionStatus();
        }, 3000);
    }
    
    hideSelectionStatus() {
        const statusElement = document.getElementById('selection-status');
        if (statusElement) {
            statusElement.classList.remove('visible');
        }
        if (this.selectionStatusTimeout) {
            clearTimeout(this.selectionStatusTimeout);
        }
    }

    // ...existing code...

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

        // Building name and type
        if (building.info && building.info.name) {
            buildingName = building.info.name;
        } else if (building.type) {
            buildingName = building.type; // Fallback to type
        }
        
        // Enhanced status with construction state support
        if (building.currentConstructionState) {
            switch (building.currentConstructionState) {
                case 'NEEDS_CONSTRUCTION':
                    buildingStatus = '🏗️ Needs Construction';
                    break;
                case 'UNDER_CONSTRUCTION':
                    buildingStatus = '🔨 Under Construction';
                    if (building.constructionRequiredTime && building.currentConstructionProgress !== undefined) {
                        const progressPercent = Math.min(100, Math.round((building.currentConstructionProgress / building.constructionRequiredTime) * 100));
                        const timeLeft = Math.max(0, building.constructionRequiredTime - building.currentConstructionProgress);
                        buildingStatus += ` (${progressPercent}% - ${Math.ceil(timeLeft / 1000)}s left)`;
                    }
                    break;
                case 'CONSTRUCTED':
                    buildingStatus = '✅ Completed';
                    break;
                default:
                    buildingStatus = building.isConstructed ? '✅ Completed' : '🔨 Under Construction';
            }
        } else if (building.isConstructed !== undefined) {
            buildingStatus = building.isConstructed ? '✅ Completed' : '🔨 Under Construction';
            if (!building.isConstructed && building.constructionEndTime) {
                const timeLeft = Math.max(0, building.constructionEndTime - Date.now());
                if (timeLeft > 0) {
                    buildingStatus += ` (${Math.ceil(timeLeft / 1000)}s remaining)`;
                }
            }
        }
        
        // Position information
        if (building.model) {
            buildingPosition = `<p><strong>📍 Position:</strong> Grid (${building.gridX || 'N/A'}, ${building.gridZ || 'N/A'}) | World (${building.model.position.x.toFixed(1)}, ${building.model.position.z.toFixed(1)})</p>`;
        } else if (building.gridX !== undefined && building.gridZ !== undefined) {
            buildingPosition = `<p><strong>📍 Position:</strong> Grid (${building.gridX}, ${building.gridZ})</p>`;
        }

        details.innerHTML = `
            <p><strong>🏗️ Name:</strong> ${buildingName}</p>
            <p><strong>⚙️ Status:</strong> ${buildingStatus}</p>
            ${buildingPosition}
        `;

        // Display health information with visual indicators
        if (building.health !== undefined && building.maxHealth !== undefined) {
            const healthPercent = Math.round((building.health / building.maxHealth) * 100);
            const healthColor = healthPercent > 75 ? '#32CD32' : healthPercent > 50 ? '#FFD700' : '#FF6347';
            const healthBar = '█'.repeat(Math.floor(healthPercent / 10)) + '░'.repeat(10 - Math.floor(healthPercent / 10));
            details.innerHTML += `
                <p><strong>❤️ Health:</strong> <span style="color: ${healthColor}">${building.health}/${building.maxHealth} (${healthPercent}%)</span></p>
                <p style="font-family: monospace; font-size: 12px; color: ${healthColor};">${healthBar}</p>
            `;
        }

        // Enhanced worker information
        if (building.workers && building.workers.length > 0) {
            const maxWorkers = building.info?.jobSlots || 'N/A';
            const workerIcon = building.workers.length >= maxWorkers ? '👥' : '👤';
            details.innerHTML += `<p><strong>${workerIcon} Workers:</strong> ${building.workers.length} / ${maxWorkers}</p>`;
            
            // List individual workers
            building.workers.forEach((worker, index) => {
                const workerName = worker.id || `Worker ${index + 1}`;
                const workerStatus = worker.state || 'Active';
                details.innerHTML += `<p style="margin-left: 20px; font-size: 12px;">• ${workerName} - ${workerStatus}</p>`;
            });
            
            // Show worker profession requirement
            if (building.jobProfession) {
                details.innerHTML += `<p><strong>🎓 Required Job:</strong> ${building.jobProfession.replace(/_/g, ' ')}</p>`;
            }
            if (building.requiredTool) {
                details.innerHTML += `<p><strong>🔧 Required Tool:</strong> ${building.requiredTool.replace(/_/g, ' ')}</p>`;
            }
        } else if (building.info?.jobSlots > 0) {
            const jobSlotsIcon = building.info.jobSlots > 1 ? '👥' : '👤';
            details.innerHTML += `<p><strong>${jobSlotsIcon} Workers:</strong> 0 / ${building.info.jobSlots} <span style="color: #FFD700;">(Needs Workers)</span></p>`;
            
            if (building.jobProfession) {
                details.innerHTML += `<p><strong>🎓 Required Job:</strong> ${building.jobProfession.replace(/_/g, ' ')}</p>`;
            }
            if (building.requiredTool) {
                details.innerHTML += `<p><strong>🔧 Required Tool:</strong> ${building.requiredTool.replace(/_/g, ' ')}</p>`;
            }
        }

        // Enhanced production information
        if (building.producesResource || (building.info?.producesResource)) {
            const producedResource = building.producesResource || building.info.producesResource;
            const productionInterval = building.productionIntervalMs || building.info?.productionIntervalMs || 'N/A';
            const intervalText = productionInterval !== 'N/A' ? `${Math.round(productionInterval / 1000)}s` : 'Unknown';
            details.innerHTML += `<p><strong>🏭 Produces:</strong> ${producedResource.replace(/_/g, ' ')} (Every ${intervalText})</p>`;
            
            // Show last production time if available
            if (building.lastProductionTime) {
                const timeSinceProduction = Math.round((Date.now() - building.lastProductionTime) / 1000);
                details.innerHTML += `<p style="font-size: 12px; color: #888;">Last produced: ${timeSinceProduction}s ago</p>`;
            }
        }

        // Enhanced consumption information
        if (building.consumesMaterials && building.consumesMaterials.length > 0) {
            const consumedResources = building.consumesMaterials.map(r => r.replace(/_/g, ' ')).join(', ');
            details.innerHTML += `<p><strong>📦 Consumes:</strong> ${consumedResources}</p>`;
        }

        if (building.consumesFood && building.consumesFood.length > 0) {
            const consumedFood = building.consumesFood.map(f => f.replace(/_/g, ' ')).join(', ');
            const foodRate = building.foodConsumptionRate || 'N/A';
            details.innerHTML += `<p><strong>🍞 Food Needs:</strong> ${consumedFood} (Rate: ${foodRate})</p>`;
            
            if (building.isHaltedByNoFood) {
                details.innerHTML += `<p style="color: #FF6347; font-weight: bold;">⚠️ Halted: No Food Available</p>`;
            }
        }

        // Enhanced inventory display with stock limits
        if (building.inventory) {
            const inventoryItems = [];
            const hasGetStock = typeof building.getStock === 'function';
            
            for (const resourceType in building.inventory) {
                const amount = hasGetStock ? building.getStock(resourceType) : building.inventory[resourceType];
                if (amount > 0) {
                    let maxStock = 'N/A';
                    if (building.maxStock) {
                        maxStock = building.maxStock[resourceType] || building.maxStock.default || 'N/A';
                    }
                    
                    const stockDisplay = maxStock !== 'N/A' ? `${amount}/${maxStock}` : amount;
                    const resourceName = resourceType.replace(/_/g, ' ');
                    inventoryItems.push(`<li>${resourceName}: ${stockDisplay}</li>`);
                }
            }
            
            if (inventoryItems.length > 0) {
                details.innerHTML += `<p><strong>📦 Inventory:</strong></p><ul style="margin-left: 20px;">${inventoryItems.join('')}</ul>`;
            } else {
                details.innerHTML += `<p><strong>📦 Inventory:</strong> <span style="color: #888;">Empty</span></p>`;
            }
            
            // Show storage capacity if available
            if (building.maxStock) {
                const defaultCapacity = building.maxStock.default;
                if (defaultCapacity) {
                    details.innerHTML += `<p style="font-size: 12px; color: #888;">Storage Capacity: ${defaultCapacity} per resource type</p>`;
                }
            }
        }

        // Construction cost information (useful for repair estimates)
        if (building.cost && Object.keys(building.cost).length > 0) {
            const costItems = [];
            for (const resourceType in building.cost) {
                const amount = building.cost[resourceType];
                const resourceName = resourceType.replace(/_/g, ' ');
                costItems.push(`${resourceName}: ${amount}`);
            }
            details.innerHTML += `<p><strong>💰 Construction Cost:</strong> ${costItems.join(', ')}</p>`;
        }

        // Additional building-specific information
        if (building.assignedBuilderId) {
            details.innerHTML += `<p><strong>👷 Assigned Builder:</strong> ${building.assignedBuilderId}</p>`;
        }

        if (building.info?.tier) {
            details.innerHTML += `<p><strong>⭐ Tier:</strong> ${building.info.tier}</p>`;
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
            // Clear previous selection highlights
            this.clearSelectionHighlights();
            
            if (selectedEntity) {
                // Show selection status indicator
                this.showSelectionStatus(selectedEntity);
                
                // Determine if it's a Serf or Building based on its properties
                if (selectedEntity.unitType === 'serf' || selectedEntity.serfType) { // serfType is on Serf instance
                    this.displayUnitInfo(selectedEntity); // Pass the Serf instance
                    this.highlightSelectedSerf(selectedEntity);
                } else if (selectedEntity.info && selectedEntity.info.name) { // Building instances have 'info.name'
                    this.displayBuildingInfo(selectedEntity); // Pass the Building instance
                    this.highlightSelectedBuilding(selectedEntity);
                } else {
                    console.warn("UIManager: Selected entity type not recognized.", selectedEntity);
                    this.hideUnitInfo();
                    this.hideBuildingInfo();
                    this.hideSelectionStatus();
                }
            } else {
                this.hideUnitInfo();
                this.hideBuildingInfo();
                this.hideSelectionStatus();
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
