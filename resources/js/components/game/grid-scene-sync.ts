import * as THREE from 'three';
import { BUILDING_TYPES, getBuildingHeight } from './buildings';
import { createBuildingMesh } from './building-meshes';
import { createConstructionMesh } from './construction-mesh';
import { createDollarCoinMesh } from './coin-indicator';
import type { GridData, GridItem, RoadConnections } from './types';

export function roadConnectionsFor(
    gridData: GridData,
    x: number,
    z: number,
): RoadConnections {
    return {
        north: gridData[`${x},${z - 1}`]?.type === 'road',
        south: gridData[`${x},${z + 1}`]?.type === 'road',
        west: gridData[`${x - 1},${z}`]?.type === 'road',
        east: gridData[`${x + 1},${z}`]?.type === 'road',
    };
}

export function disposeObject3D(root: THREE.Object3D): void {
    root.traverse((node) => {
        if (node instanceof THREE.Mesh) {
            node.geometry?.dispose();
            const { material } = node;
            if (Array.isArray(material)) {
                material.forEach((m) => m.dispose());
            } else {
                material?.dispose();
            }
        }
    });
}

export function createTileBuildingGroup(
    key: string,
    item: GridItem,
    gridData: GridData,
    now = Date.now(),
): THREE.Group {
    const [x, z] = key.split(',').map(Number);
    const isConstructed = item.isConstructed ?? true;
    const roadConnections = roadConnectionsFor(gridData, x, z);

    let meshGroup: THREE.Group;
    if (!isConstructed) {
        const start = item.buildStartedAt || item.createdAt;
        const end = item.buildCompletedAt || start;
        const total = Math.max(1, end - start);
        const currentElapsed = Math.max(0, now - start);
        const progress = Math.min(1.0, currentElapsed / total);
        meshGroup = createConstructionMesh(
            item.type,
            progress,
            roadConnections,
        );
    } else {
        meshGroup = createBuildingMesh(item.type, roadConnections);
        if (item.isReady) {
            const bHeight = getBuildingHeight(item.type);
            meshGroup.add(createDollarCoinMesh(bHeight));
        }
    }

    meshGroup.position.set(x + 0.5, 0, z + 0.5);
    meshGroup.userData = {
        key,
        x,
        z,
        type: item.type,
        isConstructed,
    };

    return meshGroup;
}

export function gridItemNeedsMeshRebuild(
    prev: GridItem | undefined,
    next: GridItem | undefined,
): boolean {
    if (!prev && !next) {
        return false;
    }
    if (!prev || !next) {
        return true;
    }
    return (
        prev.type !== next.type ||
        (prev.isConstructed ?? true) !== (next.isConstructed ?? true) ||
        prev.isReady !== next.isReady ||
        prev.buildCompletedAt !== next.buildCompletedAt ||
        prev.buildStartedAt !== next.buildStartedAt
    );
}

export function neighborRoadKeys(key: string): string[] {
    const [x, z] = key.split(',').map(Number);

    return [`${x},${z - 1}`, `${x},${z + 1}`, `${x - 1},${z}`, `${x + 1},${z}`];
}

export function calcDemolishRefund(
    cost: number,
    refundPercent: number,
): number {
    return Math.floor(cost * (refundPercent / 100));
}

export function buildingCost(type: string): number {
    return BUILDING_TYPES[type]?.cost ?? 0;
}
