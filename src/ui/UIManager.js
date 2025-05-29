import { RESOURCE_TYPES } from '../config/resourceTypes.js'; // May be needed for UI updates
import { SERF_PROFESSIONS } from '../config/serfProfessions.js';
import { FORESTER_SAPLING_UPGRADE_AMOUNT } from '../config/unitConstants.js';
import ProductionChainUI from './ProductionChainUI.js';

class UIManager {
    constructor(uiContainer, resourceManager, constructionManager, serfManager, selectionManager, productionChainManager) {
        this.uiContainer = uiContainer;
        this.resourceManager = resourceManager;
        this.constructionManager = constructionManager;
        this.serfManager = serfManager;
        this.selectionManager = selectionManager;
        this.productionChainManager = productionChainManager;

        // Core UI panels
        this.topBar = null;
        this.leftSidebar = null;
        this.rightSidebar = null;
        this.bottomPanel = null;
        this.centerInfoPanel = null;
        
        // Specific components
        this.resourceDisplay = null;
        this.gameActions = null;
        this.entityLists = null;
        this.buildingConstruction = null;
        this.selectionInfo = null;
        this.miniMap = null;

        // Production chain components
        this.productionChainUI = null;

        this.buildingButtons = new Map();
        this.onSerfSelectCallback = null;
        this.onBuildingSelectCallback = null;
        this.isDevMode = false; // Toggle for developer features

        if (!this.uiContainer) {
            console.error("UIManager: uiContainer element not found. UI will not be initialized.");
            return;
        }

        this.initModernUI();
        this.setupEventListeners();

        // Initialize ProductionChainUI if productionChainManager is available
        if (this.productionChainManager) {
            this.productionChainUI = new ProductionChainUI(this.productionChainManager, this);
            console.log('ProductionChainUI initialized.');
        }

        this.resourceManager.onChange((stockpiles) => {
            this.updateResourceDisplay(stockpiles);
            this.updateBuildingButtons();
        });

        // Initial UI updates
        this.updateResourceDisplay(this.resourceManager.getAllStockpiles());
        this.updateBuildingButtons();
        this.updateEntityLists();

        // Auto-update entity lists
        if (this.constructionManager && typeof this.constructionManager.onChange === 'function') {
            this.constructionManager.onChange(() => {
                this.updateEntityLists();
            });
        }

        // Add resize listener
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        this.onWindowResize();
    }

    initModernUI() {
        // Create or find the UI overlay container (don't clear the canvas!)
        let uiOverlay = document.getElementById('ui-overlay');
        if (!uiOverlay) {
            uiOverlay = document.createElement('div');
            uiOverlay.id = 'ui-overlay';
            uiOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 10;
                
                display: grid;
                grid-template-areas: 
                    "topbar topbar topbar"
                    "left center right"
                    "bottom bottom bottom";
                grid-template-rows: 60px 1fr 120px;
                grid-template-columns: 280px 1fr 280px;
                gap: 8px;
                padding: 8px;
                box-sizing: border-box;
            `;
            this.uiContainer.appendChild(uiOverlay);
        } else {
            // Clear only the UI overlay, not the entire container
            uiOverlay.innerHTML = '';
        }
        
        // Use the overlay as our UI container
        this.uiOverlay = uiOverlay;
        
        // Create main layout structure
        this.createTopBar();
        this.createLeftSidebar();
        this.createRightSidebar();
        this.createBottomPanel();
        this.createCenterInfoPanel();
    }

    createTopBar() {
        this.topBar = document.createElement('div');
        this.topBar.style.cssText = `
            grid-area: topbar;
            background: linear-gradient(135deg, rgba(25,35,45,0.95), rgba(35,45,55,0.95));
            border-radius: 12px;
            display: flex;
            align-items: center;
            padding: 0 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            pointer-events: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;

        // Resource display section
        this.resourceDisplay = document.createElement('div');
        this.resourceDisplay.style.cssText = `
            display: flex;
            gap: 20px;
            align-items: center;
            flex: 1;
        `;

        const resourceTitle = document.createElement('span');
        resourceTitle.textContent = 'Resources';
        resourceTitle.style.cssText = `
            color: #4CAF50;
            font-weight: 600;
            font-size: 16px;
            margin-right: 20px;
        `;

        this.resourceDisplay.appendChild(resourceTitle);
        this.topBar.appendChild(this.resourceDisplay);

        // Game actions section (right side of top bar)
        this.gameActions = document.createElement('div');
        this.gameActions.style.cssText = `
            display: flex;
            gap: 12px;
            align-items: center;
        `;

        // Toggle dev mode button
        const devToggle = document.createElement('button');
        devToggle.textContent = 'DEV';
        devToggle.style.cssText = `
            background: rgba(255,193,7,0.2);
            border: 1px solid rgba(255,193,7,0.5);
            color: #FFC107;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.3s ease;
        `;
        devToggle.addEventListener('click', () => this.toggleDevMode());

        // Production chains button
        const productionChainsBtn = document.createElement('button');
        productionChainsBtn.textContent = 'Production Chains';
        productionChainsBtn.style.cssText = `
            background: rgba(76,175,80,0.2);
            border: 1px solid rgba(76,175,80,0.5);
            color: #4CAF50;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.3s ease;
            margin-left: 8px;
        `;
        productionChainsBtn.addEventListener('click', () => this.toggleProductionChains());

        this.gameActions.appendChild(devToggle);
        this.gameActions.appendChild(productionChainsBtn);
        this.topBar.appendChild(this.gameActions);
        this.uiOverlay.appendChild(this.topBar);
    }

    setupEventListeners() {
        // Subscribe to selection changes
        this._subscribeToSelectionChanges();
        
        // Listen for serf changes
        if (this.serfManager && typeof this.serfManager.onChange === 'function') {
            this.serfManager.onChange(() => {
                this.updateEntityLists();
            });
        }
    }

    updateResourceDisplay(stockpiles) {
        if (!this.resourceDisplay) return;
        
        // Clear existing resource items (keep title)
        const existingItems = this.resourceDisplay.querySelectorAll('.resource-item');
        existingItems.forEach(item => item.remove());

        // Priority resources to display
        const priorityResources = [
            RESOURCE_TYPES.WOOD,
            RESOURCE_TYPES.STONE,
            RESOURCE_TYPES.GRAIN,
            RESOURCE_TYPES.IRON_ORE,
            RESOURCE_TYPES.PLANKS,
            RESOURCE_TYPES.IRON_BARS
        ].filter(type => type !== undefined);

        priorityResources.forEach(resourceType => {
            if (!stockpiles.hasOwnProperty(resourceType)) return;

            const amount = stockpiles[resourceType];
            const resourceItem = document.createElement('div');
            resourceItem.className = 'resource-item';
            
            resourceItem.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                background: rgba(255,255,255,0.1);
                border-radius: 8px;
                border: 1px solid rgba(255,255,255,0.2);
                transition: all 0.3s ease;
                cursor: pointer;
            `;

            // Resource icon and amount
            const resourceIcons = {
                [RESOURCE_TYPES.WOOD]: '🪵',
                [RESOURCE_TYPES.STONE]: '🪨',
                [RESOURCE_TYPES.GRAIN]: '🌾',
                [RESOURCE_TYPES.IRON_ORE]: '⛏️',
                [RESOURCE_TYPES.PLANKS]: '📏',
                [RESOURCE_TYPES.IRON_BARS]: '🔩'
            };

            const icon = document.createElement('span');
            icon.textContent = resourceIcons[resourceType] || '📦';
            icon.style.fontSize = '16px';

            const amountSpan = document.createElement('span');
            amountSpan.textContent = amount.toString();
            amountSpan.style.cssText = `
                color: white;
                font-weight: 600;
                font-size: 14px;
            `;

            // Color coding
            if (amount === 0) {
                resourceItem.style.background = 'rgba(244,67,54,0.2)';
                resourceItem.style.borderColor = 'rgba(244,67,54,0.4)';
            } else if (amount < 10) {
                resourceItem.style.background = 'rgba(255,193,7,0.2)';
                resourceItem.style.borderColor = 'rgba(255,193,7,0.4)';
            } else {
                resourceItem.style.background = 'rgba(76,175,80,0.2)';
                resourceItem.style.borderColor = 'rgba(76,175,80,0.4)';
            }

            resourceItem.appendChild(icon);
            resourceItem.appendChild(amountSpan);
            
            // Hover effects
            resourceItem.addEventListener('mouseenter', () => {
                resourceItem.style.transform = 'translateY(-2px)';
                resourceItem.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            });
            
            resourceItem.addEventListener('mouseleave', () => {
                resourceItem.style.transform = '';
                resourceItem.style.boxShadow = '';
            });

            this.resourceDisplay.appendChild(resourceItem);
        });
    }

    updateEntityLists() {
        this.updateSerfListUI();
        this.updateBuildingListUI();
    }

    toggleDevMode() {
        this.isDevMode = !this.isDevMode;
        const devPanel = this.bottomPanel?.querySelector('.dev-panel');
        
        if (this.isDevMode) {
            this.showDevPanel();
        } else {
            if (devPanel) devPanel.remove();
        }
    }

    toggleProductionChains() {
        if (this.productionChainUI) {
            this.productionChainUI.toggle();
        } else {
            console.warn('UIManager: ProductionChainUI not available');
        }
    }

    showDevPanel() {
        if (!this.bottomPanel) return;
        
        // Remove existing dev panel
        const existingDevPanel = this.bottomPanel.querySelector('.dev-panel');
        if (existingDevPanel) existingDevPanel.remove();
        
        const devPanel = document.createElement('div');
        devPanel.className = 'dev-panel';
        devPanel.style.cssText = `
            background: rgba(255,193,7,0.1);
            border: 1px solid rgba(255,193,7,0.3);
            border-radius: 8px;
            padding: 12px;
            display: flex;
            gap: 12px;
            align-items: center;
        `;

        const addResourcesBtn = document.createElement('button');
        addResourcesBtn.textContent = '+50 All Resources';
        addResourcesBtn.style.cssText = `
            background: rgba(76,175,80,0.8);
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
        `;
        addResourcesBtn.addEventListener('click', () => {
            Object.values(RESOURCE_TYPES).forEach(type => {
                if (typeof type === 'string') {
                    this.resourceManager.addResource(type, 50);
                }
            });
        });

        devPanel.appendChild(addResourcesBtn);
        this.bottomPanel.appendChild(devPanel);
    }

    createLeftSidebar() {
        this.leftSidebar = document.createElement('div');
        this.leftSidebar.style.cssText = `
            grid-area: left;
            background: rgba(25,35,45,0.9);
            border-radius: 12px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            pointer-events: auto;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
        `;

        // Entity lists container
        this.entityLists = document.createElement('div');
        this.entityLists.style.cssText = `
            flex: 1;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        `;

        this.createSerfList();
        this.createBuildingList();
        
        this.leftSidebar.appendChild(this.entityLists);
        this.uiOverlay.appendChild(this.leftSidebar);
    }

    createSerfList() {
        const serfSection = document.createElement('div');
        serfSection.style.cssText = `
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
            padding: 12px;
        `;

        const serfTitle = document.createElement('h3');
        serfTitle.textContent = 'Serfs';
        serfTitle.style.cssText = `
            margin: 0 0 12px 0;
            color: #4CAF50;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
        `;

        this.serfListContent = document.createElement('div');
        this.serfListContent.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 4px;
        `;

        serfTitle.addEventListener('click', () => {
            const isHidden = this.serfListContent.style.display === 'none';
            this.serfListContent.style.display = isHidden ? 'flex' : 'none';
        });

        serfSection.appendChild(serfTitle);
        serfSection.appendChild(this.serfListContent);
        this.entityLists.appendChild(serfSection);
    }

    createBuildingList() {
        const buildingSection = document.createElement('div');
        buildingSection.style.cssText = `
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
            padding: 12px;
        `;

        const buildingTitle = document.createElement('h3');
        buildingTitle.textContent = 'Buildings';
        buildingTitle.style.cssText = `
            margin: 0 0 12px 0;
            color: #FF9800;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
        `;

        this.buildingListContent = document.createElement('div');
        this.buildingListContent.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 4px;
        `;

        buildingTitle.addEventListener('click', () => {
            const isHidden = this.buildingListContent.style.display === 'none';
            this.buildingListContent.style.display = isHidden ? 'flex' : 'none';
        });

        buildingSection.appendChild(buildingTitle);
        buildingSection.appendChild(this.buildingListContent);
        this.entityLists.appendChild(buildingSection);
    }

    createRightSidebar() {
        this.rightSidebar = document.createElement('div');
        this.rightSidebar.style.cssText = `
            grid-area: right;
            background: rgba(25,35,45,0.9);
            border-radius: 12px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            pointer-events: auto;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding: 16px;
        `;

        this.createMiniMap();
        this.createConstructionPanel();
        
        this.uiOverlay.appendChild(this.rightSidebar);
    }

    createMiniMap() {
        this.miniMap = document.createElement('div');
        this.miniMap.style.cssText = `
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
            height: 150px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255,255,255,0.6);
            font-size: 14px;
            border: 1px dashed rgba(255,255,255,0.2);
        `;
        this.miniMap.textContent = 'Mini-map (Coming Soon)';
        this.rightSidebar.appendChild(this.miniMap);
    }

    createConstructionPanel() {
        this.buildingConstruction = document.createElement('div');
        this.buildingConstruction.style.cssText = `
            flex: 1;
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
            padding: 12px;
            display: flex;
            flex-direction: column;
        `;

        const constructionTitle = document.createElement('h3');
        constructionTitle.textContent = 'Build';
        constructionTitle.style.cssText = `
            margin: 0 0 16px 0;
            color: #2196F3;
            font-size: 16px;
            font-weight: 600;
        `;

        const buildingGrid = document.createElement('div');
        buildingGrid.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            overflow-y: auto;
        `;

        // Create building buttons
        const availableBuildings = this.constructionManager.getAvailableBuildings();
        availableBuildings.forEach(building => {
            const buildingBtn = document.createElement('button');
            buildingBtn.style.cssText = `
                background: rgba(76,175,80,0.8);
                border: 1px solid rgba(76,175,80,0.6);
                color: white;
                padding: 12px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.3s ease;
                text-align: left;
            `;

            const buildingName = document.createElement('div');
            buildingName.textContent = building.name;
            buildingName.style.fontWeight = '600';

            const costDisplay = document.createElement('div');
            costDisplay.style.cssText = `
                font-size: 12px;
                color: rgba(255,255,255,0.8);
                margin-top: 4px;
            `;
            
            const costText = Object.entries(building.cost || {})
                .map(([resource, amount]) => `${resource.replace(/_/g, ' ')}: ${amount}`)
                .join(', ') || 'Free';
            costDisplay.textContent = costText;

            buildingBtn.appendChild(buildingName);
            buildingBtn.appendChild(costDisplay);

            buildingBtn.addEventListener('click', () => {
                this.constructionManager.startPlacement(building.key);
            });

            buildingBtn.addEventListener('mouseenter', () => {
                buildingBtn.style.background = 'rgba(76,175,80,1)';
                buildingBtn.style.transform = 'translateX(4px)';
            });

            buildingBtn.addEventListener('mouseleave', () => {
                buildingBtn.style.background = 'rgba(76,175,80,0.8)';
                buildingBtn.style.transform = '';
            });

            this.buildingButtons.set(building.key, { 
                button: buildingBtn, 
                cost: building.cost || {},
                costDisplay: costDisplay
            });
            
            buildingGrid.appendChild(buildingBtn);
        });

        this.buildingConstruction.appendChild(constructionTitle);
        this.buildingConstruction.appendChild(buildingGrid);
        this.rightSidebar.appendChild(this.buildingConstruction);
    }

    createBottomPanel() {
        this.bottomPanel = document.createElement('div');
        this.bottomPanel.style.cssText = `
            grid-area: bottom;
            background: rgba(25,35,45,0.9);
            border-radius: 12px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            pointer-events: auto;
            padding: 16px;
            display: flex;
            gap: 16px;
            align-items: center;
        `;

        this.uiOverlay.appendChild(this.bottomPanel);
    }

    createCenterInfoPanel() {
        this.centerInfoPanel = document.createElement('div');
        this.centerInfoPanel.style.cssText = `
            grid-area: center;
            pointer-events: none;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        this.selectionInfo = document.createElement('div');
        this.selectionInfo.style.cssText = `
            background: rgba(25,35,45,0.95);
            border-radius: 12px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            pointer-events: auto;
            padding: 20px;
            max-width: 400px;
            max-height: 300px;
            overflow-y: auto;
            display: none;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        `;

        this.centerInfoPanel.appendChild(this.selectionInfo);
        this.uiOverlay.appendChild(this.centerInfoPanel);
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

        // Add close button to resource panel
        const resourceCloseButton = this.createPanelCloseButton(this.resourcePanel);
        this.resourcePanel.appendChild(resourceCloseButton);

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

        // Add close button to serf list panel
        const serfListCloseButton = this.createPanelCloseButton(this.serfListPanel);
        this.serfListPanel.appendChild(serfListCloseButton);

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

        // Add close button to building list panel
        const buildingListCloseButton = this.createPanelCloseButton(this.buildingListPanel);
        this.buildingListPanel.appendChild(buildingListCloseButton);

        // Create content area
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

        // Add close button to mini-map panel
        const miniMapCloseButton = this.createPanelCloseButton(this.miniMapPanel);
        this.miniMapPanel.appendChild(miniMapCloseButton);

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
        this.selectedUnitInfoPanel.style.width = '250px';        this.selectedUnitInfoPanel.style.minHeight = '100px';
        this.selectedUnitInfoPanel.style.maxHeight = '300px';
        this.selectedUnitInfoPanel.style.overflowY = 'auto';
        this.selectedUnitInfoPanel.style.display = 'none';        this.selectedUnitInfoPanel.style.padding = '10px';
        this.selectedUnitInfoPanel.style.boxSizing = 'border-box';

        const unitInfoTitle = document.createElement('h3');
        unitInfoTitle.textContent = 'Selected Unit';
        unitInfoTitle.classList.add('themed-panel-title');
        this.selectedUnitInfoPanel.appendChild(unitInfoTitle);

        // Add close button to unit info panel
        const unitCloseButton = this.createCloseButton();
        this.selectedUnitInfoPanel.appendChild(unitCloseButton);

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
        this.selectedBuildingInfoPanel.style.display = 'none';        this.selectedBuildingInfoPanel.style.padding = '10px';
        this.selectedBuildingInfoPanel.style.boxSizing = 'border-box';

        const buildingInfoTitle = document.createElement('h3');
        buildingInfoTitle.textContent = 'Selected Building';
        buildingInfoTitle.classList.add('themed-panel-title');
        this.selectedBuildingInfoPanel.appendChild(buildingInfoTitle);

        // Add close button to building info panel
        const buildingCloseButton = this.createCloseButton();
        this.selectedBuildingInfoPanel.appendChild(buildingCloseButton);

        this.selectedBuildingInfoContent = document.createElement('div');
        this.selectedBuildingInfoContent.classList.add('panel-content-area');
        this.selectedBuildingInfoPanel.appendChild(this.selectedBuildingInfoContent);

        this.uiContainer.appendChild(this.selectedBuildingInfoPanel);    }

    displayUnitInfo(unit) {
        if (!this.selectionInfo || !unit) {
            this.hideUnitInfo();
            return;
        }
        
        // Clear and set up the panel with relative positioning for the close button
        this.selectionInfo.innerHTML = '';
        this.selectionInfo.style.position = 'relative';
        
        // Add close button to the selection info panel
        const closeButton = this.createCloseButton();
        this.selectionInfo.appendChild(closeButton);
        
        // Create modern header
        const header = document.createElement('h3');
        header.textContent = `👤 ${unit.serfType || 'Unit'}`;
        header.style.cssText = `
            margin: 0 0 16px 0;
            color: #4CAF50;
            font-size: 18px;
            font-weight: 600;
            border-bottom: 2px solid rgba(76,175,80,0.3);
            padding-bottom: 8px;
            padding-right: 40px; /* Space for close button */
        `;

        const details = document.createElement('div');
        details.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-size: 14px;
            line-height: 1.4;
        `;

        // Basic info with modern styling
        const basicInfo = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                <div><strong>🆔 ID:</strong> ${unit.id}</div>
                <div><strong>⚙️ State:</strong> ${unit.state || 'N/A'}</div>
                <div><strong>📋 Task:</strong> ${unit.task || 'None'}</div>
                ${unit.model ? `<div><strong>📍 Position:</strong> (${unit.model.position.x.toFixed(1)}, ${unit.model.position.z.toFixed(1)})</div>` : ''}
            </div>
        `;
        details.innerHTML = basicInfo;

        // Forester-specific features (simplified for main UIManager)
        if (unit.serfType === 'forester') {
            const plantedCount = unit.plantedSaplingsCount !== undefined ? unit.plantedSaplingsCount : 'N/A';
            const maxPlanted = unit.maxPlantedSaplings !== undefined ? unit.maxPlantedSaplings : 'N/A';
            
            const foresterInfo = document.createElement('div');
            foresterInfo.style.cssText = `
                background: rgba(76,175,80,0.1);
                border-radius: 8px;
                padding: 12px;
                margin: 8px 0;
                border: 1px solid rgba(76,175,80,0.3);
            `;
            foresterInfo.innerHTML = `
                <div style="margin-bottom: 8px;"><strong>🌱 Saplings Planted:</strong> ${plantedCount} / ${maxPlanted}</div>
            `;
            details.appendChild(foresterInfo);
        }
        
        // Inventory display
        if (unit.inventory && Object.keys(unit.inventory).length > 0) {
            const inventorySection = document.createElement('div');
            inventorySection.style.cssText = `
                background: rgba(255,255,255,0.05);
                border-radius: 8px;
                padding: 12px;
                margin: 8px 0;
            `;
            
            let inventoryHTML = '<div style="margin-bottom: 8px; font-weight: 600; color: #FFB74D;">📦 Inventory:</div>';
            inventoryHTML += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 4px;">';
            
            for (const resource in unit.inventory) {
                if (unit.inventory[resource] > 0) {
                    inventoryHTML += `<div style="padding: 4px 8px; background: rgba(255,255,255,0.1); border-radius: 4px; font-size: 12px;">${resource.replace(/_/g, ' ')}: ${unit.inventory[resource]}</div>`;
                }
            }
            inventoryHTML += '</div>';
            inventorySection.innerHTML = inventoryHTML;
            details.appendChild(inventorySection);
        }

        // Clear and populate selection info panel
        this.selectionInfo.innerHTML = '';
        this.selectionInfo.appendChild(header);
        this.selectionInfo.appendChild(details);
        this.selectionInfo.style.display = 'block';
    }

    hideUnitInfo() {
        if (this.selectionInfo) {
            this.selectionInfo.style.display = 'none';
            this.selectionInfo.innerHTML = '';
        }
    }

    displayBuildingInfo(building) {
        if (!this.selectionInfo || !building) {
            this.hideBuildingInfo();
            return;
        }
        
        // Clear and set up the panel with relative positioning for the close button
        this.selectionInfo.innerHTML = '';
        this.selectionInfo.style.position = 'relative';
        
        // Add close button to the selection info panel
        const closeButton = this.createCloseButton();
        this.selectionInfo.appendChild(closeButton);
        
        // Create modern header
        const header = document.createElement('h3');
        let buildingName = 'Unknown Building';
        if (building.info && building.info.name) {
            buildingName = building.info.name;
        } else if (building.type) {
            buildingName = building.type;
        }
        
        header.textContent = `🏗️ ${buildingName}`;
        header.style.cssText = `
            margin: 0 0 16px 0;
            color: #FF9800;
            font-size: 18px;
            font-weight: 600;
            border-bottom: 2px solid rgba(255,152,0,0.3);
            padding-bottom: 8px;
            padding-right: 40px; /* Space for close button */
        `;

        const details = document.createElement('div');
        details.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-size: 14px;
            line-height: 1.4;
        `;

        let buildingStatus = 'N/A';
        
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
        
        // Basic building info with modern styling
        const basicInfo = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                <div><strong>⚙️ Status:</strong> ${buildingStatus}</div>
                ${building.model ? `<div><strong>🌍 World:</strong> (${building.model.position.x.toFixed(1)}, ${building.model.position.z.toFixed(1)})</div>` : ''}
            </div>
        `;
        details.innerHTML = basicInfo;

        // Display health information with visual indicators
        if (building.health !== undefined && building.maxHealth !== undefined) {
            const healthPercent = Math.round((building.health / building.maxHealth) * 100);
            const healthColor = healthPercent > 75 ? '#4CAF50' : healthPercent > 50 ? '#FF9800' : '#F44336';
            
            const healthSection = document.createElement('div');
            healthSection.style.cssText = `
                background: rgba(255,255,255,0.05);
                border-radius: 8px;
                padding: 12px;
                margin: 8px 0;
                border: 1px solid ${healthColor}40;
            `;
            healthSection.innerHTML = `
                <div style="margin-bottom: 4px;"><strong>❤️ Health:</strong> <span style="color: ${healthColor}">${building.health}/${building.maxHealth} (${healthPercent}%)</span></div>
                <div style="background: rgba(255,255,255,0.1); border-radius: 4px; height: 8px; overflow: hidden;">
                    <div style="background: ${healthColor}; height: 100%; width: ${healthPercent}%; transition: width 0.3s ease;"></div>
                </div>
            `;
            details.appendChild(healthSection);
        }

        // Enhanced worker information
        if (building.workers && building.workers.length > 0) {
            const maxWorkers = building.info?.jobSlots || 'N/A';
            const workerSection = document.createElement('div');
            workerSection.style.cssText = `
                background: rgba(33,150,243,0.1);
                border-radius: 8px;
                padding: 12px;
                margin: 8px 0;
                border: 1px solid rgba(33,150,243,0.3);
            `;
            
            let workerHTML = `<div style="margin-bottom: 8px; font-weight: 600; color: #2196F3;">👥 Workers: ${building.workers.length} / ${maxWorkers}</div>`;
            
            building.workers.forEach((worker, index) => {
                const workerName = worker.id || `Worker ${index + 1}`;
                const workerStatus = worker.state || 'Active';
                workerHTML += `<div style="margin-left: 12px; font-size: 12px; color: rgba(255,255,255,0.8);">• ${workerName} - ${workerStatus}</div>`;
            });
            
            workerSection.innerHTML = workerHTML;
            details.appendChild(workerSection);
        }

        // Clear and populate selection info panel
        this.selectionInfo.appendChild(header);
        this.selectionInfo.appendChild(details);
        this.selectionInfo.style.display = 'block';
    }

    hideBuildingInfo() {
        if (this.selectionInfo) {
            this.selectionInfo.style.display = 'none';
            this.selectionInfo.innerHTML = '';
        }
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
        if (!this.serfListContent || !this.serfManager || typeof this.serfManager.getSerfsGroupedByProfession !== 'function') {
            if (this.serfListContent) {
                this.serfListContent.innerHTML = '';
                const placeholder = document.createElement('p');
                placeholder.textContent = 'Serf data unavailable.';
                placeholder.style.cssText = `
                    padding: 8px;
                    font-style: italic;
                    color: rgba(255,255,255,0.6);
                    font-size: 12px;
                `;
                this.serfListContent.appendChild(placeholder);
            }
            return;
        }

        this.serfListContent.innerHTML = '';
        const serfsByProfession = this.serfManager.getSerfsGroupedByProfession();

        if (Object.keys(serfsByProfession).length === 0) {
            const noSerfsMessage = document.createElement('p');
            noSerfsMessage.textContent = 'No serfs active.';
            noSerfsMessage.style.cssText = `
                padding: 8px;
                font-style: italic;
                color: rgba(255,255,255,0.6);
                font-size: 12px;
                text-align: center;
            `;
            this.serfListContent.appendChild(noSerfsMessage);
            return;
        }

        for (const profession in serfsByProfession) {
            const serfs = serfsByProfession[profession];
            if (serfs.length > 0) {
                const professionHeader = document.createElement('h4');
                professionHeader.textContent = `${profession.replace(/([A-Z])/g, ' $1').trim()} (${serfs.length})`;
                professionHeader.style.cssText = `
                    margin: 8px 0 4px 0;
                    color: #81C784;
                    font-size: 12px;
                    font-weight: 600;
                    border-bottom: 1px solid rgba(129,199,132,0.3);
                    padding-bottom: 2px;
                `;
                this.serfListContent.appendChild(professionHeader);

                serfs.forEach(serf => {
                    const serfItem = document.createElement('div');
                    serfItem.className = 'serf-list-item';
                    serfItem.dataset.serfId = serf.id;
                    serfItem.textContent = `${serf.id.substring(0, 6)} - ${serf.state || 'Active'}`;
                    serfItem.style.cssText = `
                        padding: 6px 8px;
                        background: rgba(255,255,255,0.05);
                        border-radius: 4px;
                        margin-bottom: 2px;
                        cursor: pointer;
                        font-size: 11px;
                        color: rgba(255,255,255,0.9);
                        transition: all 0.2s ease;
                        border: 1px solid transparent;
                    `;

                    serfItem.addEventListener('mouseenter', () => {
                        serfItem.style.background = 'rgba(76,175,80,0.2)';
                        serfItem.style.borderColor = 'rgba(76,175,80,0.4)';
                        serfItem.style.transform = 'translateX(2px)';
                    });

                    serfItem.addEventListener('mouseleave', () => {
                        if (!serfItem.classList.contains('selected')) {
                            serfItem.style.background = 'rgba(255,255,255,0.05)';
                            serfItem.style.borderColor = 'transparent';
                            serfItem.style.transform = '';
                        }
                    });

                    serfItem.addEventListener('click', () => {
                        if (this.onSerfSelectCallback) {
                            this.onSerfSelectCallback(serf.id);
                        } else {
                            console.warn('UIManager: onSerfSelectCallback not set.');
                        }
                    });

                    this.serfListContent.appendChild(serfItem);
                });
            }
        }
    }

    updateBuildingListUI() {
        if (!this.buildingListContent || !this.constructionManager) {
            if (this.buildingListContent) {
                this.buildingListContent.innerHTML = '';
                const placeholder = document.createElement('p');
                placeholder.textContent = 'Building data unavailable.';
                placeholder.style.cssText = `
                    padding: 8px;
                    font-style: italic;
                    color: rgba(255,255,255,0.6);
                    font-size: 12px;
                `;
                this.buildingListContent.appendChild(placeholder);
            }
            return;
        }

        this.buildingListContent.innerHTML = '';
        
        // Combine all relevant building lists from ConstructionManager
        const buildings = [
            ...this.constructionManager.placedBuildings,
            ...this.constructionManager.activeConstructions,
            ...this.constructionManager.constructionQueue
        ];

        if (buildings.length === 0) {
            const noBuildingsMessage = document.createElement('p');
            noBuildingsMessage.textContent = 'No buildings on map.';
            noBuildingsMessage.style.cssText = `
                padding: 8px;
                font-style: italic;
                color: rgba(255,255,255,0.6);
                font-size: 12px;
                text-align: center;
            `;
            this.buildingListContent.appendChild(noBuildingsMessage);
            return;
        }

        // Group buildings by type for better display
        const buildingsByType = buildings.reduce((acc, building) => {
            let typeName = 'Unknown Building';
            
            if (building && building.info && building.info.name) {
                typeName = building.info.name;
            } else if (building && building.type) {
                typeName = building.type;
            }

            if (!acc[typeName]) {
                acc[typeName] = [];
            }
            acc[typeName].push(building);
            return acc;
        }, {});

        for (const typeName in buildingsByType) {
            const buildingGroup = buildingsByType[typeName];
            if (buildingGroup.length > 0) {
                const typeHeader = document.createElement('h4');
                typeHeader.textContent = `${typeName} (${buildingGroup.length})`;
                typeHeader.style.cssText = `
                    margin: 8px 0 4px 0;
                    color: #FFB74D;
                    font-size: 12px;
                    font-weight: 600;
                    border-bottom: 1px solid rgba(255,183,77,0.3);
                    padding-bottom: 2px;
                `;
                this.buildingListContent.appendChild(typeHeader);

                buildingGroup.forEach(building => {
                    const buildingItem = document.createElement('div');
                    buildingItem.className = 'building-list-item';
                    
                    const buildingId = (building.model && building.model.uuid) ? 
                        building.model.uuid.substring(0,6) : (building.id || 'N/A');
                    
                    let status = 'Completed';
                    if (building.currentConstructionState) {
                        switch (building.currentConstructionState) {
                            case 'NEEDS_CONSTRUCTION':
                                status = '🏗️ Needs Construction';
                                break;
                            case 'UNDER_CONSTRUCTION':
                                status = '🔨 Building';
                                break;
                            case 'NEEDS_RESOURCES':
                                status = '📦 Needs Resources';
                                break;
                            default:
                                status = building.isConstructed ? '✅ Complete' : '⏳ Planning';
                        }
                    } else {
                        status = building.isConstructed ? '✅ Complete' : '⏳ Planning';
                    }

                    buildingItem.textContent = `${buildingId} - ${status}`;
                    buildingItem.dataset.buildingId = (building.model && building.model.uuid) ? building.model.uuid : '';
                    buildingItem.style.cssText = `
                        padding: 6px 8px;
                        background: rgba(255,255,255,0.05);
                        border-radius: 4px;
                        margin-bottom: 2px;
                        cursor: pointer;
                        font-size: 11px;
                        color: rgba(255,255,255,0.9);
                        transition: all 0.2s ease;
                        border: 1px solid transparent;
                    `;

                    buildingItem.addEventListener('mouseenter', () => {
                        buildingItem.style.background = 'rgba(255,183,77,0.2)';
                        buildingItem.style.borderColor = 'rgba(255,183,77,0.4)';
                        buildingItem.style.transform = 'translateX(2px)';
                    });

                    buildingItem.addEventListener('mouseleave', () => {
                        if (!buildingItem.classList.contains('selected')) {
                            buildingItem.style.background = 'rgba(255,255,255,0.05)';
                            buildingItem.style.borderColor = 'transparent';
                            buildingItem.style.transform = '';
                        }
                    });

                    buildingItem.addEventListener('click', () => {
                        if (this.onBuildingSelectCallback && building.model && building.model.uuid) {
                            this.onBuildingSelectCallback(building.model.uuid);
                        }
                    });

                    this.buildingListContent.appendChild(buildingItem);
                });
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

    // Helper method to create a professional close button for info panels
    createCloseButton() {
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(244, 67, 54, 0.8);
            border: none;
            color: white;
            font-size: 20px;
            font-weight: bold;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            z-index: 10;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        `;
        
        // Add hover effects
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.background = 'rgba(244, 67, 54, 1)';
            closeButton.style.transform = 'scale(1.1)';
            closeButton.style.boxShadow = '0 4px 12px rgba(244, 67, 54, 0.4)';
        });
        
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.background = 'rgba(244, 67, 54, 0.8)';
            closeButton.style.transform = 'scale(1)';
            closeButton.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
        });
        
        closeButton.onclick = () => {
            this.hideUnitInfo();
            this.hideBuildingInfo();
            // Also clear the selection if the selectionManager is available
            if (this.selectionManager && typeof this.selectionManager.clearSelection === 'function') {
                this.selectionManager.clearSelection();
            }
        };
        
        return closeButton;
    }

    // Helper method to create a close button for any panel
    createPanelCloseButton(targetPanel, customHandler = null) {
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(244, 67, 54, 0.8);
            border: none;
            color: white;
            font-size: 18px;
            font-weight: bold;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            z-index: 10;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        `;
        
        // Add hover effects
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.background = 'rgba(244, 67, 54, 1)';
            closeButton.style.transform = 'scale(1.1)';
            closeButton.style.boxShadow = '0 4px 12px rgba(244, 67, 54, 0.4)';
        });
        
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.background = 'rgba(244, 67, 54, 0.8)';
            closeButton.style.transform = 'scale(1)';
            closeButton.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
        });
        
        closeButton.onclick = () => {
            if (customHandler) {
                customHandler();
            } else if (targetPanel) {
                targetPanel.style.display = 'none';
            }
        };
        
        return closeButton;
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
