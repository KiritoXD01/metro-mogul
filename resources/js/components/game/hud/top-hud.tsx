import {
    AlertCircle,
    CheckCircle2,
    Coins,
    Crown,
    RotateCcw,
    RotateCw,
    Save,
    Sparkles,
    Users,
    Volume2,
    VolumeX,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import type { SaveStatus } from '../types';

interface TopHudProps {
    cityName: string;
    userName: string;
    money: number;
    population: number;
    xp: number;
    level: number;
    saveStatus: SaveStatus;
    soundEnabled: boolean;
    onSave: () => void;
    onNewCity: () => void;
    onProfileClick: () => void;
    onToggleSound: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetCamera: () => void;
}

export default function TopHud({
    cityName,
    userName,
    money,
    population,
    xp,
    level,
    saveStatus,
    soundEnabled,
    onSave,
    onNewCity,
    onProfileClick,
    onToggleSound,
    onZoomIn,
    onZoomOut,
    onResetCamera,
}: TopHudProps) {
    return (
        <header className="pointer-events-none absolute top-4 right-4 left-4 z-10 flex flex-wrap items-center justify-between gap-4">
            {/* City Info & Mayor Bar */}
            <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/85 px-4 py-2.5 shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                    <div className="rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-2 font-bold text-slate-950 shadow-md">
                        <Crown className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold tracking-wide text-white">
                                {cityName}
                            </span>
                            <span className="rounded-full border border-indigo-400/30 bg-indigo-500/30 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                                Mayor {userName}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span>Metro Mogul 3D</span>
                            {saveStatus === 'saving' && (
                                <span className="flex items-center gap-1 text-amber-400">
                                    <RotateCw className="h-3 w-3 animate-spin" />{' '}
                                    Saving...
                                </span>
                            )}
                            {saveStatus === 'saved' && (
                                <span className="flex items-center gap-1 text-emerald-400">
                                    <CheckCircle2 className="h-3 w-3" /> Saved
                                </span>
                            )}
                            {saveStatus === 'error' && (
                                <span className="flex items-center gap-1 text-rose-400">
                                    <AlertCircle className="h-3 w-3" /> Save
                                    failed
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Money, Population & XP Stats Bar */}
            <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/85 px-5 py-2.5 shadow-2xl backdrop-blur-md">
                {/* Cash */}
                <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-400">
                        <Coins className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                            Treasury
                        </div>
                        <div className="text-lg font-extrabold text-emerald-400">
                            ${money.toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="h-8 w-px bg-slate-700/60" />

                {/* Population */}
                <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-blue-500/20 p-2 text-blue-400">
                        <Users className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                            Citizens
                        </div>
                        <div className="text-lg font-extrabold text-blue-300">
                            {population.toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="h-8 w-px bg-slate-700/60" />

                {/* Level & XP */}
                <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-amber-500/20 p-2 text-amber-400">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center justify-between gap-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                            <span>Lvl {level}</span>
                            <span>
                                {xp}/{level * 100} XP
                            </span>
                        </div>
                        <div className="mt-1 h-2 w-24 overflow-hidden rounded-full border border-slate-700 bg-slate-800">
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-300"
                                style={{
                                    width: `${Math.min(100, (xp / (level * 100)) * 100)}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Right Quick Controls */}
            <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border border-slate-700/60 bg-slate-900/85 p-1.5 shadow-2xl backdrop-blur-md">
                <button
                    onClick={onSave}
                    className="flex items-center gap-1 rounded-xl p-2.5 text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
                    title="Save City"
                >
                    <Save className="h-4 w-4 text-indigo-400" />
                    <span className="hidden text-xs font-bold sm:inline">
                        Save
                    </span>
                </button>
                <button
                    onClick={onNewCity}
                    className="flex items-center gap-1 rounded-xl p-2.5 text-slate-300 transition-all hover:bg-slate-800 hover:text-amber-400"
                    title="Start New City"
                >
                    <RotateCw className="h-4 w-4 text-amber-400" />
                    <span className="hidden text-xs font-bold sm:inline">
                        New City
                    </span>
                </button>
                <div className="mx-1 h-6 w-px bg-slate-700/60" />
                <button
                    onClick={onToggleSound}
                    className="rounded-xl p-2.5 text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
                    title="Toggle Audio"
                >
                    {soundEnabled ? (
                        <Volume2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                        <VolumeX className="h-4 w-4 text-rose-400" />
                    )}
                </button>
                <button
                    onClick={onZoomIn}
                    className="rounded-xl p-2.5 text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
                    title="Zoom In"
                >
                    <ZoomIn className="h-4 w-4" />
                </button>
                <button
                    onClick={onZoomOut}
                    className="rounded-xl p-2.5 text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
                    title="Zoom Out"
                >
                    <ZoomOut className="h-4 w-4" />
                </button>
                <button
                    onClick={onResetCamera}
                    className="rounded-xl p-2.5 text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
                    title="Reset Camera View"
                >
                    <RotateCcw className="h-4 w-4" />
                </button>
                <button
                    onClick={onProfileClick}
                    className="ml-1 rounded-xl p-2.5 text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
                    title="Mayor Profile & Settings"
                >
                    <span className="text-xs font-bold">Profile</span>
                </button>
            </div>
        </header>
    );
}
