import { BUILDING_TYPES } from './buildings';
import type { GridData, GridItem } from './types';

export function resolveGameCursor(
    selectedTool: string | null,
    hoverTile: { x: number; z: number } | null,
    gridData: GridData,
    money: number,
    level: number,
): string {
    if (!hoverTile) {
        return selectedTool ? 'crosshair' : 'default';
    }

    const key = `${hoverTile.x},${hoverTile.z}`;
    const existing: GridItem | undefined = gridData[key];

    if (selectedTool === 'bulldozer') {
        return existing ? 'cell' : 'not-allowed';
    }

    if (selectedTool) {
        const bType = BUILDING_TYPES[selectedTool];
        if (!bType) {
            return 'crosshair';
        }
        const isOccupied = !!existing;
        const canAfford = money >= bType.cost;
        const isUnlocked = level >= bType.unlockLevel;
        return !isOccupied && canAfford && isUnlocked ? 'copy' : 'not-allowed';
    }

    if (existing) {
        if ((existing.isConstructed ?? true) && existing.isReady) {
            return 'pointer';
        }
        return 'pointer';
    }

    return 'crosshair';
}
