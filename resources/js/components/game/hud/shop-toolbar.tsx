import {
    Clock,
    Home,
    Lock,
    Route,
    Store,
    Trash2,
    Trees,
    X,
} from 'lucide-react';
import { BUILDING_TYPES, formatDuration } from '../buildings';
import type { BuildingDefinition } from '../types';

export type ShopCategory = BuildingDefinition['category'];

interface ShopToolbarProps {
    selectedTool: string | null;
    activeTab: ShopCategory;
    money: number;
    level: number;
    onTabChange: (tab: ShopCategory) => void;
    onToolChange: (tool: string | null) => void;
    onLockedBuilding: (item: BuildingDefinition) => void;
}

const TABS: { id: ShopCategory; label: string; icon: typeof Home }[] = [
    { id: 'residential', label: 'Housing', icon: Home },
    { id: 'commercial', label: 'Businesses', icon: Store },
    { id: 'decor', label: 'Decor', icon: Trees },
    { id: 'road', label: 'Roads', icon: Route },
];

export default function ShopToolbar({
    selectedTool,
    activeTab,
    money,
    level,
    onTabChange,
    onToolChange,
    onLockedBuilding,
}: ShopToolbarProps) {
    return (
        <footer className="pointer-events-none absolute right-4 bottom-4 left-4 z-10 flex flex-col items-center gap-3">
            {/* Tool Status Badge */}
            {selectedTool && (
                <div className="pointer-events-auto flex animate-pulse items-center gap-3 rounded-xl border border-amber-500/60 bg-slate-900/95 px-4 py-2 shadow-xl backdrop-blur-md">
                    <span className="text-xs font-semibold tracking-wider text-amber-400 uppercase">
                        {selectedTool === 'bulldozer'
                            ? 'Demolish Mode Active'
                            : `Constructing: ${BUILDING_TYPES[selectedTool]?.name} (${formatDuration(BUILDING_TYPES[selectedTool]?.buildTime ?? 0)} wait)`}
                    </span>
                    <button
                        onClick={() => onToolChange(null)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Shop Category Drawer */}
            <div className="pointer-events-auto w-full max-w-4xl rounded-2xl border border-slate-700/70 bg-slate-900/90 p-3 shadow-2xl backdrop-blur-md">
                {/* Category Tabs */}
                <div className="mb-3 flex items-center justify-between gap-2 overflow-x-auto border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        onTabChange(tab.id);
                                        if (selectedTool === 'bulldozer')
                                            onToolChange(null);
                                    }}
                                    className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                        isActive
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Bulldozer Button */}
                    <button
                        onClick={() =>
                            onToolChange(
                                selectedTool === 'bulldozer'
                                    ? null
                                    : 'bulldozer',
                            )
                        }
                        className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                            selectedTool === 'bulldozer'
                                ? 'bg-rose-600 text-white shadow-lg ring-2 shadow-rose-600/30 ring-rose-400'
                                : 'bg-slate-800/80 text-rose-400 hover:bg-rose-500/20'
                        }`}
                    >
                        <Trash2 className="h-4 w-4" />
                        <span>Demolish</span>
                    </button>
                </div>

                {/* Building Selection Grid */}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {Object.values(BUILDING_TYPES)
                        .filter((b) => b.category === activeTab)
                        .map((item) => {
                            const Icon = item.icon;
                            const isSelected = selectedTool === item.id;
                            const isLocked = level < item.unlockLevel;
                            const canAfford = money >= item.cost;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        if (isLocked) {
                                            onLockedBuilding(item);
                                            return;
                                        }
                                        onToolChange(
                                            isSelected ? null : item.id,
                                        );
                                    }}
                                    disabled={isLocked || !canAfford}
                                    className={`group relative flex flex-col justify-between rounded-xl border p-2.5 text-left transition-all ${
                                        isLocked
                                            ? 'cursor-not-allowed border-slate-800/60 bg-slate-900/60 opacity-60'
                                            : isSelected
                                              ? 'border-indigo-500 bg-indigo-600/20 shadow-md ring-1 shadow-indigo-500/20 ring-indigo-500'
                                              : canAfford
                                                ? 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/80'
                                                : 'cursor-not-allowed border-slate-800/40 bg-slate-900/40 opacity-50'
                                    }`}
                                >
                                    <div className="mb-1.5 flex w-full items-center justify-between">
                                        <span className="truncate text-xs font-bold text-slate-200">
                                            {item.name}
                                        </span>
                                        <div
                                            className={`rounded-lg p-1 ${
                                                isLocked
                                                    ? 'bg-slate-800/80 text-amber-400'
                                                    : 'bg-slate-800 text-amber-400'
                                            }`}
                                        >
                                            {isLocked ? (
                                                <Lock className="h-3.5 w-3.5 text-amber-400" />
                                            ) : (
                                                <Icon className="h-3.5 w-3.5" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex w-full items-center justify-between text-[11px] font-extrabold">
                                        {isLocked ? (
                                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-black text-amber-300">
                                                <Lock className="h-2.5 w-2.5" />
                                                Lvl {item.unlockLevel}
                                            </span>
                                        ) : (
                                            <span
                                                className={
                                                    canAfford
                                                        ? 'text-emerald-400'
                                                        : 'text-rose-400'
                                                }
                                            >
                                                ${item.cost}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-300/90">
                                            <Clock className="h-2.5 w-2.5" />
                                            {formatDuration(item.buildTime)}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                </div>
            </div>
        </footer>
    );
}
