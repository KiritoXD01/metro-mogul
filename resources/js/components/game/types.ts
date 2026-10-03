import type { ComponentType } from 'react';

export interface BuildingDefinition {
    id: string;
    name: string;
    category: 'residential' | 'commercial' | 'decor' | 'road';
    cost: number;
    population: number;
    income: number;
    timer: number; // rent cycle in seconds
    buildTime: number; // construction wait time in seconds
    unlockLevel: number; // Mayor level required to build
    xp: number;
    icon: ComponentType<{ className?: string }>;
    color: string;
    description: string;
}

export interface GridItem {
    type: string;
    isConstructed?: boolean;
    buildStartedAt?: number;
    buildCompletedAt?: number;
    harvestReadyAt: number;
    isReady: boolean;
    createdAt: number;
}

export type GridData = Record<string, GridItem>;

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface FloatingText {
    id: number;
    text: string;
    x: number;
    y: number;
}

export interface CityModelData {
    id: number;
    ulid: string;
    name: string;
    money: number;
    population: number;
    xp: number;
    level: number;
    gridData: GridData;
    updatedAt?: string | null;
}

export interface CitySaveData {
    name: string;
    money: number;
    population: number;
    xp: number;
    level: number;
    grid_data: GridData;
}

export interface MetroCityGameProps {
    initialCity: CityModelData;
    userName?: string;
    userId?: number;
    onSave?: (data: CitySaveData) => Promise<void> | void;
    onResetCity?: (newCityName: string) => Promise<void> | void;
}

export interface RoadConnections {
    north: boolean;
    south: boolean;
    west: boolean;
    east: boolean;
}
