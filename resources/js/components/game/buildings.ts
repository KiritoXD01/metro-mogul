import { Building2, Home, Route, Sparkles, Store, Trees } from 'lucide-react';
import type { BuildingDefinition } from './types';

export const GRID_SIZE = 12;

export const formatDuration = (seconds: number): string => {
    if (seconds <= 0) return 'Instant';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const remainingSecs = seconds % 60;
    if (remainingSecs === 0) return `${mins} min`;
    return `${mins}m ${remainingSecs}s`;
};

export const BUILDING_TYPES: Record<string, BuildingDefinition> = {
    // RESIDENTIAL
    small_house: {
        id: 'small_house',
        name: 'Cozy Cottage',
        category: 'residential',
        cost: 150,
        population: 5,
        income: 30,
        timer: 10,
        buildTime: 60, // 1 min (as requested)
        unlockLevel: 1, // Level 1 (cheapest house)
        xp: 15,
        icon: Home,
        color: '#e74c3c',
        description: 'Generates steady modest rent from local residents.',
    },
    villa: {
        id: 'villa',
        name: 'Luxury Villa',
        category: 'residential',
        cost: 600,
        population: 15,
        income: 140,
        timer: 25,
        buildTime: 300, // 5 min (as requested)
        unlockLevel: 4,
        xp: 50,
        icon: Home,
        color: '#9b59b6',
        description: 'High-end residence with high rent yield.',
    },
    apartment: {
        id: 'apartment',
        name: 'Highrise Apartments',
        category: 'residential',
        cost: 1800,
        population: 40,
        income: 450,
        timer: 45,
        buildTime: 600, // 10 min
        unlockLevel: 6,
        xp: 120,
        icon: Building2,
        color: '#3498db',
        description: 'Massive housing capacity for fast population growth.',
    },

    // COMMERCIAL
    coffee_shop: {
        id: 'coffee_shop',
        name: 'Bean & Brew Cafe',
        category: 'commercial',
        cost: 300,
        population: 0,
        income: 90,
        timer: 15,
        buildTime: 90, // 1.5 min
        unlockLevel: 2,
        xp: 30,
        icon: Store,
        color: '#e67e22',
        description: 'Quick espresso sales yield fast profit cycles.',
    },
    supermarket: {
        id: 'supermarket',
        name: 'Mega Mart',
        category: 'commercial',
        cost: 1000,
        population: 0,
        income: 320,
        timer: 35,
        buildTime: 420, // 7 min
        unlockLevel: 5,
        xp: 90,
        icon: Store,
        color: '#f1c40f',
        description: 'Essential grocery store with lucrative customer revenue.',
    },
    tech_office: {
        id: 'tech_office',
        name: 'Tech Innovation Hub',
        category: 'commercial',
        cost: 3500,
        population: 0,
        income: 1200,
        timer: 60,
        buildTime: 900, // 15 min
        unlockLevel: 7,
        xp: 250,
        icon: Building2,
        color: '#1abc9c',
        description: 'High capital venture providing massive payouts.',
    },

    // DECORATIONS
    park: {
        id: 'park',
        name: 'Community Park',
        category: 'decor',
        cost: 200,
        population: 8,
        income: 0,
        timer: 0,
        buildTime: 15, // 15 sec
        unlockLevel: 2,
        xp: 20,
        icon: Trees,
        color: '#2ecc71',
        description: 'Adds greenery and increases city overall happiness.',
    },
    fountain: {
        id: 'fountain',
        name: 'Grand Fountain',
        category: 'decor',
        cost: 500,
        population: 18,
        income: 0,
        timer: 0,
        buildTime: 45, // 45 sec
        unlockLevel: 3,
        xp: 45,
        icon: Sparkles,
        color: '#34495e',
        description: 'A dazzling centerpiece attraction for citizens.',
    },

    // ROADS
    road: {
        id: 'road',
        name: 'Asphalt Road',
        category: 'road',
        cost: 20,
        population: 0,
        income: 0,
        timer: 0,
        buildTime: 3, // 3 sec
        unlockLevel: 1, // Level 1 (basic road)
        xp: 2,
        icon: Route,
        color: '#333333',
        description: 'Connects city buildings and enables vehicle traffic.',
    },
};

// Building Height Lookup for HUD / Indicators
export const getBuildingHeight = (type: string): number => {
    switch (type) {
        case 'road':
            return 0.5;
        case 'park':
            return 0.7;
        case 'fountain':
            return 0.8;
        case 'small_house':
            return 1.1;
        case 'coffee_shop':
            return 1.0;
        case 'supermarket':
            return 1.1;
        case 'villa':
            return 1.25;
        case 'apartment':
            return 1.95;
        case 'tech_office':
            return 2.1;
        default:
            return 1.2;
    }
};
