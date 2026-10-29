import type { GridData, MissionDefinition, MissionState } from './types';

export interface MissionWorldState {
    gridData: GridData;
    population: number;
    level: number;
    mapExpansions: number;
    collects: number;
}

export const countConstructedBuildings = (
    gridData: GridData,
    buildingType: string,
): number => {
    return Object.values(gridData).filter((item) => {
        return item.type === buildingType && (item.isConstructed ?? true);
    }).length;
};

export const missionCurrent = (
    mission: MissionDefinition,
    world: MissionWorldState,
): number => {
    switch (mission.metric) {
        case 'buildings':
            return countConstructedBuildings(
                world.gridData,
                mission.building ?? '',
            );
        case 'collects':
            return world.collects;
        case 'population':
            return world.population;
        case 'level':
            return world.level;
        case 'expansions':
            return world.mapExpansions;
        default:
            return 0;
    }
};

export const isMissionClaimed = (
    mission: MissionDefinition,
    state: MissionState,
): boolean => state.claimed.includes(mission.id);

export const isMissionClaimable = (
    mission: MissionDefinition,
    state: MissionState,
    world: MissionWorldState,
): boolean => {
    if (isMissionClaimed(mission, state)) {
        return false;
    }

    return missionCurrent(mission, world) >= mission.count;
};

export const claimableMissionCount = (
    catalog: MissionDefinition[],
    state: MissionState,
    world: MissionWorldState,
): number => {
    return catalog.filter((mission) =>
        isMissionClaimable(mission, state, world),
    ).length;
};
