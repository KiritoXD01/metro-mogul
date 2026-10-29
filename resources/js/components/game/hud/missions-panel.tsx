import { Check, ScrollText, X } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import {
    isMissionClaimable,
    isMissionClaimed,
    missionCurrent,
    type MissionWorldState,
} from '../missions';
import type { MissionDefinition, MissionState } from '../types';

interface MissionsPanelProps {
    catalog: MissionDefinition[];
    missions: MissionState;
    world: MissionWorldState;
    onClose: () => void;
    onClaim: (id: string) => void;
}

export default function MissionsPanel({
    catalog,
    missions,
    world,
    onClose,
    onClaim,
}: MissionsPanelProps) {
    const { t } = useTranslation();

    const ordered = [...catalog].sort((left, right) => {
        const rank = (mission: MissionDefinition): number => {
            if (isMissionClaimable(mission, missions, world)) {
                return 0;
            }
            if (isMissionClaimed(mission, missions)) {
                return 2;
            }
            return 1;
        };

        return rank(left) - rank(right);
    });

    return (
        <div className="absolute top-24 left-4 z-20 w-84 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-700 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/15 p-2.5 text-amber-300">
                        <ScrollText className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-100">
                            {t('missions.title')}
                        </h3>
                        <p className="text-xs text-slate-400">
                            {t('missions.subtitle')}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <ul className="max-h-[min(24rem,50vh)] space-y-2 overflow-y-auto pr-1">
                {ordered.map((mission) => {
                    const current = Math.min(
                        mission.count,
                        missionCurrent(mission, world),
                    );
                    const claimed = isMissionClaimed(mission, missions);
                    const claimable = isMissionClaimable(
                        mission,
                        missions,
                        world,
                    );
                    const progress = Math.min(
                        100,
                        (current / Math.max(1, mission.count)) * 100,
                    );

                    return (
                        <li
                            key={mission.id}
                            className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                        >
                            <div className="mb-1 flex items-start justify-between gap-2">
                                <div>
                                    <div className="text-sm font-semibold text-slate-100">
                                        {t(`missions.${mission.id}.title`)}
                                    </div>
                                    <p className="text-xs leading-relaxed text-slate-400">
                                        {t(`missions.${mission.id}.summary`)}
                                    </p>
                                </div>
                                {claimed && (
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                                )}
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                                <div
                                    className="h-full bg-amber-400 transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2">
                                <span className="text-[11px] font-semibold text-slate-400">
                                    {current}/{mission.count}
                                    <span className="ml-2 text-amber-300">
                                        {t('missions.reward', {
                                            money: mission.money.toLocaleString(),
                                            xp: mission.xp,
                                        })}
                                    </span>
                                </span>
                                <button
                                    type="button"
                                    disabled={!claimable}
                                    onClick={() => onClaim(mission.id)}
                                    className="rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
                                >
                                    {claimed
                                        ? t('missions.claimed')
                                        : t('missions.claim')}
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
