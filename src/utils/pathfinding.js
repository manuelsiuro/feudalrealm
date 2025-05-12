// src/utils/pathfinding.js

// Basic A* Node structure
class AStarNode {
    constructor(x, y, g = 0, h = 0, parent = null) {
        this.x = x; // Grid x
        this.y = y; // Grid y
        this.g = g; // Cost from start to this node
        this.h = h; // Heuristic cost from this node to end
        this.f = g + h; // Total cost
        this.parent = parent; // Parent node in the path
    }
}

// Heuristic function (Manhattan distance)
function manhattanDistance(nodeA, nodeB) {
    return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
}

// Function to check if a tile is walkable
// This will need access to gameMap and TERRAIN_TYPES
// For now, a placeholder
function isWalkable(gridX, gridY, gameMap, TERRAIN_TYPES) {
    if (!gameMap || !TERRAIN_TYPES) {
        console.warn("isWalkable: gameMap or TERRAIN_TYPES not provided.");
        return true; // Assume walkable if map data is missing (for initial structure)
    }
    const tile = gameMap.getTile(gridX, gridY);
    if (!tile) return false; // Out of bounds

    if (!tile) return false; // Out of bounds

    // Define non-walkable types
    const nonWalkable = [TERRAIN_TYPES.WATER, TERRAIN_TYPES.MOUNTAIN]; // Example
    // console.log(`Pathfinding: Checking tile (${gridX}, ${gridY}) - Type: ${tile.terrainType}, Walkable: ${!nonWalkable.includes(tile.terrainType)}`); // DEBUG
    return !nonWalkable.includes(tile.terrainType);
}

/**
 * Finds a path using A* algorithm.
 * @param {object} startPos - {x, y} grid coordinates.
 * @param {object} endPos - {x, y} grid coordinates.
 * @param {GameMap} gameMap - The game map instance.
 * @param {object} TERRAIN_TYPES - Terrain types definition.
 * @returns {Array|null} Array of {x, y} path coordinates, or null if no path.
 */
export function findPathAStar(startPos, endPos, gameMap, TERRAIN_TYPES) {
    const openSet = [];
    const closedSet = new Set(); // Using Set for efficient 'has' checks

    const startNode = new AStarNode(startPos.x, startPos.y, 0, manhattanDistance(startPos, endPos));
    openSet.push(startNode);

    while (openSet.length > 0) {
        // Find node with lowest F score in openSet
        openSet.sort((a, b) => a.f - b.f);
        const currentNode = openSet.shift();

        // Goal reached? Reconstruct path.
        if (currentNode.x === endPos.x && currentNode.y === endPos.y) {
            const path = [];
            let temp = currentNode;
            while (temp) {
                path.push({ x: temp.x, y: temp.y });
                temp = temp.parent;
            }
            return path.reverse(); // Return reversed path (start to end)
        }

        closedSet.add(`${currentNode.x},${currentNode.y}`);

        // Explore neighbors (up, down, left, right - no diagonals for simplicity first)
        const neighbors = [
            { x: currentNode.x, y: currentNode.y - 1 }, // Up
            { x: currentNode.x, y: currentNode.y + 1 }, // Down
            { x: currentNode.x - 1, y: currentNode.y }, // Left
            { x: currentNode.x + 1, y: currentNode.y }, // Right
        ];

        for (const neighborPos of neighbors) {
            const neighborKey = `${neighborPos.x},${neighborPos.y}`;
            if (closedSet.has(neighborKey)) continue; // Already evaluated

            if (!isWalkable(neighborPos.x, neighborPos.y, gameMap, TERRAIN_TYPES)) {
                closedSet.add(neighborKey); // Mark non-walkable as closed to avoid re-checking
                continue;
            }

            const gScore = currentNode.g + 1; // Cost of 1 to move to an adjacent tile
            let neighborNode = openSet.find(node => node.x === neighborPos.x && node.y === neighborPos.y);

            if (!neighborNode) { // New node
                neighborNode = new AStarNode(
                    neighborPos.x,
                    neighborPos.y,
                    gScore,
                    manhattanDistance(neighborPos, endPos),
                    currentNode
                );
                openSet.push(neighborNode);
            } else if (gScore < neighborNode.g) { // Found a better path to this neighbor
                neighborNode.parent = currentNode;
                neighborNode.g = gScore;
                neighborNode.f = neighborNode.g + neighborNode.h;
            }
        }
    }

    return null; // No path found
}
