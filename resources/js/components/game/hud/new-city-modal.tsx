import type React from 'react';
import { Crown, X } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

interface NewCityModalProps {
    userName: string;
    value: string;
    onChange: (value: string) => void;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
}

export default function NewCityModal({
    userName,
    value,
    onChange,
    onClose,
    onSubmit,
}: NewCityModalProps) {
    const { t } = useTranslation();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-amber-400" />
                        <h3 className="text-lg font-bold text-white">
                            {t('city.found_title')}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <p className="mb-4 text-sm text-slate-300">
                    {t('city.found_desc')}
                </p>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="newCityName"
                            className="mb-1 block text-xs font-bold tracking-wider text-slate-400 uppercase"
                        >
                            {t('city.name_label')}
                        </label>
                        <input
                            id="newCityName"
                            type="text"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={t('city.name_ph', { name: userName })}
                            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-4 py-2 text-sm text-slate-300 transition-all hover:bg-slate-800"
                        >
                            {t('city.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-slate-950 shadow-lg transition-all hover:bg-amber-400"
                        >
                            {t('city.found')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
