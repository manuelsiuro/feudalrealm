import Task, { TASK_STATUS, TASK_TYPES } from './Task.js';
import { SERF_PROFESSIONS } from '../../config/serfProfessions.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';

let nextPlantSaplingTaskId = 1;

class PlantSaplingTask extends Task {
    constructor(targetTile, forestersHut) {
        // Call super with TASK_TYPES.PLANT_SAPLING.
        // Priority will be handled by the base Task class using TASK_PRIORITIES.PLANT_SAPLING.
        // forestersHut is a good candidate for targetEntity.
        super(TASK_TYPES.PLANT_SAPLING, null, forestersHut);
        this.targetTile = targetTile; // { x, y }
        this.forestersHut = forestersHut; // Building instance of the Forester's Hut
        this.profession = SERF_PROFESSIONS.FORESTER;
        // The unique ID (like `plant-sapling-${nextPlantSaplingTaskId++}`) is now handled by the base Task constructor.
    }

    canBeExecutedBy(serf) {
        if (serf.serfType !== this.profession) {
            return false;
        }
        if (serf.isInventoryFull()) { // Foresters shouldn't be carrying things when planting
            return false;
        }
        // Check if this task is associated with the serf's current job (hut)
        if (this.forestersHut && serf.job && serf.job.id !== this.forestersHut.id) {
            // // console.log(`Serf ${serf.id} cannot execute PlantSaplingTask ${this.id}: Serf's job hut ${serf.job.id} does not match task hut ${this.forestersHut.id}`);
            return false;
        }
        // Check if the serf has already planted their quota from this hut
        if (serf.job && serf.job.info && serf.job.info.maxSaplingsToPlantPerForester && serf.plantedSaplingsCount >= serf.job.info.maxSaplingsToPlantPerForester) {
            // // console.log(`Serf ${serf.id} cannot execute PlantSaplingTask ${this.id}: Already planted max saplings (${serf.plantedSaplingsCount}/${serf.job.info.maxSaplingsToPlantPerForester}) for this hut.`);
            return false;
        }

        return true;
    }

    onAssign(serf) {
        super.onAssign(serf);
        serf.targetTile = this.targetTile; // Serf needs to know the specific tile
        // console.log(`PlantSaplingTask ${this.id} assigned to Serf ${serf.id}. Target tile: (${this.targetTile.x}, ${this.targetTile.y})`);
        serf.changeState(SERF_ACTION_STATES.MOVING_TO_TARGET_TILE);
    }

    isComplete() {
        return this.status === TASK_STATUS.COMPLETED ||
               this.status === TASK_STATUS.FAILED ||
               this.status === TASK_STATUS.CANCELLED;
    }

    handleOutcome(serf, outcome, details = {}) {
        // console.log(`PlantSaplingTask ${this.id} outcome for Serf ${serf.id}: ${outcome}`, details);
        switch (outcome) {
            case 'sapling_planted':
                this.status = TASK_STATUS.COMPLETED;
                if (serf.job && serf.job.info && serf.job.info.maxSaplingsToPlantPerForester) { // Check if job and config exist
                    serf.plantedSaplingsCount = (serf.plantedSaplingsCount || 0) + 1;
                     // console.log(`Serf ${serf.id} plantedSaplingsCount incremented to ${serf.plantedSaplingsCount}`);
                }
                break;
            case 'path_not_found_to_plant_tile':
            case 'tile_became_unplantable':
            case 'planting_failed':
                this.status = TASK_STATUS.FAILED;
                break;
            default:
                // console.warn(`PlantSaplingTask ${this.id}: Unhandled outcome '${outcome}'`);
                this.status = TASK_STATUS.FAILED; // Default to failed for unhandled outcomes
                break;
        }
        serf.clearTask(); // This should set serf to IDLE
    }
}

export default PlantSaplingTask;
