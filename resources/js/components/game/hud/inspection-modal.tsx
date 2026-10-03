import { Hammer, X } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { BUILDING_TYPES } from '../buildings';
import type { GridItem } from '../types';

export interface InspectedBuilding extends GridItem {
    key: string;
}

interface InspectionModalProps {
    building: InspectedBuilding;
    nowTick: number;
    onClose: () => void;
    onCollect: (key: string) => void;
    onDemolish: (key: string) => void;
}

export default function InspectionModal({
    building,
    nowTick,
    onClose,
    onCollect,
    onDemolish,
}: InspectionModalProps) {
    const { t } = useTranslation();
    const bDef = BUILDING_TYPES[building.type];
    if (!bDef) return null;
    const Icon = bDef.icon;
    const now = nowTick;
    const isConstructed = building.isConstructed ?? true;

    const buildEnd = building.buildCompletedAt || now;
    const buildStart = building.buildStartedAt || now;
    const buildTotal = Math.max(1, buildEnd - buildStart);
    const buildTimeLeft = Math.max(0, Math.ceil((buildEnd - now) / 1000));
    const buildProgress = Math.min(
        100,
        Math.max(0, ((now - buildStart) / buildTotal) * 100),
    );

    const harvestLeft = Math.max(
        0,
        Math.ceil((building.harvestReadyAt - now) / 1000),
    );

    return (
        <div className="absolute top-20 right-6 z-20 w-84 rounded-2xl border border-slate-700 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-xl">
            <div>
                <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-indigo-500/30 bg-indigo-600/20 p-2.5 text-indigo-400">
                            <Icon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-100">
                                {t(`building.${building.type}.name`, bDef.name)}
                            </h3>
                            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                                {bDef.category}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <p className="mb-4 text-xs leading-relaxed text-slate-300">
                    {t(`building.${building.type}.description`, bDef.description)}
                </p>

                {/* Construction Status Card */}
                {!isConstructed ? (
                    <div className="mb-4 space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                            <span className="flex items-center gap-1.5">
                                <Hammer className="h-4 w-4 animate-bounce" />
                                {t('inspect.under_construction')}
                            </span>
                            <span>{t('inspect.remaining', { seconds: `${buildTimeLeft}s` })}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-300"
                                style={{
                                    width: `${buildProgress}%`,
                                }}
                            />
                        </div>
                        <p className="text-[11px] text-slate-400">
                            {t('inspect.workers')}
                        </p>
                    </div>
                ) : (
                    <div className="mb-4 space-y-2.5 rounded-xl border border-slate-700/40 bg-slate-800/50 p-3">
                        {bDef.population > 0 && (
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">
                                    {t('inspect.capacity')}
                                </span>
                                <span className="font-bold text-blue-300">
                                    +{bDef.population} {t('inspect.citizens')}
                                </span>
                            </div>
                        )}
                        {bDef.income > 0 && (
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">
                                    {t('inspect.cycle_income')}
                                </span>
                                <span className="font-bold text-emerald-400">
                                    +${bDef.income}
                                </span>
                            </div>
                        )}
                        {bDef.timer > 0 && (
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">
                                    {t('inspect.income_status')}
                                </span>
                                <span
                                    className={`font-bold ${
                                        building.isReady
                                            ? 'animate-pulse text-emerald-400'
                                            : 'text-amber-300'
                                    }`}
                                >
                                    {building.isReady
                                        ? `💰 ${t('inspect.money_ready')}`
                                        : t('inspect.remaining', { seconds: `${harvestLeft}s` })}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-2">
                    {isConstructed && building.isReady && (
                        <button
                            onClick={() => onCollect(building.key)}
                            className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-emerald-500"
                        >
                            {t('inspect.collect')} ${bDef.income}
                        </button>
                    )}
                    <button
                        onClick={() => onDemolish(building.key)}
                        className="flex-1 rounded-xl border border-rose-500/40 bg-rose-600/20 py-2.5 text-xs font-bold text-rose-300 transition-all hover:bg-rose-600 hover:text-white"
                    >
                        {isConstructed ? t('inspect.demolish') : t('inspect.cancel_construction')}
                    </button>
                </div>
            </div>
        </div>
    );
}
