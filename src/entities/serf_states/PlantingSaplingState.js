import SerfState from './SerfState.js';
import { SERF_ACTION_STATES } from '../../config/serfActionStates.js';
import { TASK_STATUS } from '../../core/tasks/Task.js';
import { TERRAIN_TYPES } from '../../config/mapConstants.js'; // For checking tile suitability

const PLANT_TIME = 3000; // 3 seconds to plant a sapling

class PlantingSaplingState extends SerfState {
    constructor() {
        super(SERF_ACTION_STATES.PLANTING_SAPLING);
        this.plantTimer = 0;
    }

    enter(serf) {
        super.enter(serf);
        this.plantTimer = 0;

        if (!serf.currentTask || serf.currentTask.type !== 'PLANT_SAPLING' || serf.currentTask.status !== TASK_STATUS.ACTIVE) {
            // console.error(`Serf ${serf.id} entered PlantingSaplingState without a valid PLANT_SAPLING task.`);
            serf.changeState(SERF_ACTION_STATES.IDLE);
            return;
        }

        const targetTileInfo = serf.currentTask.targetTile;
        if (!targetTileInfo) {
            // console.error(`Serf ${serf.id} in PlantingSaplingState: Task has no targetTile.`);
            serf.currentTask.handleOutcome(serf, 'planting_failed_no_target');
            return;
        }

        // Validate the tile again just before planting
        const tile = serf.gameMap.getTile(targetTileInfo.x, targetTileInfo.y);
        // Pass serf.id to isTileOccupiedForPlanting to exclude the current serf from the check
        if (!tile || tile.terrainType !== TERRAIN_TYPES.GRASSLAND || tile.resource || serf.game.serfManager.isTileOccupiedForPlanting(targetTileInfo.x, targetTileInfo.y, serf.id)) {
            // console.warn(`Serf ${serf.id} cannot plant at (${targetTileInfo.x}, ${targetTileInfo.y}): Tile became unsuitable (Terrain: ${tile?.terrainType}, Resource: ${tile?.resource}, Occupied by other: ${serf.game.serfManager.isTileOccupiedForPlanting(targetTileInfo.x, targetTileInfo.y, serf.id)}).`);
            serf.currentTask.handleOutcome(serf, 'tile_became_unplantable');
            return;
        }

        // console.log(`Serf ${serf.id} starting to plant sapling at (${targetTileInfo.x}, ${targetTileInfo.y}).`);
    }

    execute(serf, deltaTime) {
        if (!serf.currentTask || serf.currentTask.status !== TASK_STATUS.ACTIVE) {
            serf.changeState(SERF_ACTION_STATES.IDLE); // Task might have been cancelled or completed externally
            return;
        }

        this.plantTimer += deltaTime * 1000;

        if (this.plantTimer >= PLANT_TIME) {
            const targetTileInfo = serf.currentTask.targetTile;
            
            if (serf.game && serf.game.natureManager && serf.game.natureManager.addSapling(targetTileInfo.x, targetTileInfo.y)) {
                // console.log(`Serf ${serf.id} successfully planted sapling at (${targetTileInfo.x}, ${targetTileInfo.y}).`);
                serf.currentTask.handleOutcome(serf, 'sapling_planted');
            } else {
                // console.error(`Serf ${serf.id} failed to plant sapling at (${targetTileInfo.x}, ${targetTileInfo.y}) via NatureManager.`);
                serf.currentTask.handleOutcome(serf, 'planting_failed');
            }
            // The task outcome will change the serf's state (usually to IDLE)
        }
    }

    exit(serf) {
        super.exit(serf);
        this.plantTimer = 0;
    }
}

export default PlantingSaplingState;
