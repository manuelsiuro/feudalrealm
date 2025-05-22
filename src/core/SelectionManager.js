// src/core/SelectionManager.js
import * as THREE from 'three';

/**
 * @class SelectionManager
 * @classdesc Handles entity selection in the game world using raycasting.
 * Manages the currently selected entity and notifies listeners of selection changes.
 */
class SelectionManager {
    /**
     * Creates an instance of SelectionManager.
     * @param {THREE.Scene} scene - The main game scene.
     * @param {THREE.Camera} camera - The game camera used for raycasting.
     */
    constructor(scene, camera) { // gameCanvas removed as per instructions
        this.scene = scene;
        this.camera = camera;
        /** @private @type {THREE.Raycaster} */
        this.raycaster = new THREE.Raycaster();
        /** 
         * @property {object|null} selectedEntity - The currently selected game entity (e.g., Serf instance, Building instance).
         */
        this.selectedEntity = null;
        /** @private @type {Array<Function>} */
        this.selectionChangeCallbacks = [];

        /** @private @type {THREE.Group|null} */
        this.buildingsGroup = null;
        /** @private @type {THREE.Group|null} */
        this.serfsGroup = null;    
    }

    /**
     * Configures the groups of objects that are selectable.
     * @param {THREE.Group} buildingsGroup - The group containing all building models.
     * @param {THREE.Group} serfsGroup - The group containing all serf models.
     */
    setSelectableGroups(buildingsGroup, serfsGroup) {
        this.buildingsGroup = buildingsGroup;
        this.serfsGroup = serfsGroup;
        console.log("SelectionManager: Selectable groups configured.");
    }

    /**
     * Processes a click event to determine if an entity should be selected or deselected.
     * Performs raycasting based on normalized mouse coordinates.
     * @param {object} normalizedMouseCoords - Normalized mouse coordinates.
     * @param {number} normalizedMouseCoords.x - X coordinate (-1 to 1).
     * @param {number} normalizedMouseCoords.y - Y coordinate (-1 to 1, top is 1).
     * @returns {object|null} The selected entity instance (Serf or Building) or null if nothing is selected.
     */
    handleSelectionClick(normalizedMouseCoords) {
        if (!this.camera || !this.scene) {
            console.error("SelectionManager: Camera or Scene not set. Cannot process selection.");
            return null; // Return null as per JSDoc
        }

        this.raycaster.setFromCamera(normalizedMouseCoords, this.camera);
        let newSelectedEntity = null;
        // let highestPriorityObject = null; // This variable is not used outside this scope

        // 1. Check for Buildings
        if (this.buildingsGroup && this.buildingsGroup.children.length > 0) {
            const intersectsBuildings = this.raycaster.intersectObjects(this.buildingsGroup.children, true);
            if (intersectsBuildings.length > 0) {
                let topObject = intersectsBuildings[0].object;
                while (topObject.parent && topObject.parent !== this.buildingsGroup && !topObject.userData.buildingInstance) {
                    topObject = topObject.parent;
                }
                if (topObject.userData.buildingInstance) {
                    // highestPriorityObject = topObject; 
                    newSelectedEntity = topObject.userData.buildingInstance;
                    // console.log("SelectionManager: Selected Building", newSelectedEntity.info.name);
                }
            }
        }

        // 2. Check for Serfs
        if (!newSelectedEntity && this.serfsGroup && this.serfsGroup.children.length > 0) {
            const intersectsSerfs = this.raycaster.intersectObjects(this.serfsGroup.children, true);
            if (intersectsSerfs.length > 0) {
                let topSerfModel = intersectsSerfs[0].object;
                while (topSerfModel.parent && topSerfModel.parent !== this.serfsGroup && !topSerfModel.userData.serfInstance) {
                    topSerfModel = topSerfModel.parent;
                }
                if (topSerfModel.userData.serfInstance) {
                    // highestPriorityObject = topSerfModel;
                    newSelectedEntity = topSerfModel.userData.serfInstance;
                    // console.log("SelectionManager: Selected Serf", newSelectedEntity.id);
                }
            }
        }
        
        if (this.selectedEntity !== newSelectedEntity) {
            this.selectedEntity = newSelectedEntity;
            this._notifySelectionChange();
        } else if (!newSelectedEntity && this.selectedEntity !== null) { // If clicked empty space and something was selected
            this.selectedEntity = null;
            this._notifySelectionChange();
        }
        
        return this.selectedEntity;
    }
    
    /**
     * Clears the current selection.
     */
    clearSelection() {
        if (this.selectedEntity) {
            this.selectedEntity = null;
            this._notifySelectionChange();
            // console.log("SelectionManager: Selection cleared.");
        }
    }

    /**
     * @private
     * Notifies all registered listeners about a change in selection.
     * Passes the newly selected entity (or null) to the callbacks.
     */
    _notifySelectionChange() {
        this.selectionChangeCallbacks.forEach(callback => callback(this.selectedEntity));
    }

    /**
     * Registers a callback for selection change events.
     * @param {Function} callback - Function to be called when the selection changes.
     *                              It receives the selected entity instance (or null).
     */
    onSelectionChange(callback) {
        this.selectionChangeCallbacks.push(callback);
    }

    /**
     * Unregisters a callback for selection change events.
     * @param {Function} callback - The callback function to remove.
     */
    offSelectionChange(callback) {
        this.selectionChangeCallbacks = this.selectionChangeCallbacks.filter(cb => cb !== callback);
    }

    /**
     * Gets the currently selected entity.
     * @returns {object|null} The selected entity instance or null.
     */
    getSelectedEntity() {
        return this.selectedEntity;
    }

    /**
     * Programmatically sets the current selection to the given entity.
     * Useful for selections triggered by UI lists or other game logic.
     * @param {object|null} entity - The entity instance to select, or null to clear selection.
     */
    setSelection(entity) {
        if (this.selectedEntity !== entity) {
            this.selectedEntity = entity;
            this._notifySelectionChange();
        } else if (!entity && this.selectedEntity !== null) { // If entity is null and something was selected
            this.selectedEntity = null;
            this._notifySelectionChange();
        }
    }
}

export default SelectionManager;
