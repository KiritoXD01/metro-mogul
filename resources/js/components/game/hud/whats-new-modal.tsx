import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { ChangelogRelease } from '@/types/changelog';
import { useTranslation } from '@/hooks/use-translation';

interface WhatsNewModalProps {
    open: boolean;
    releases: ChangelogRelease[];
    onClose: () => void;
}

function formatDate(value: string): string {
    return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function WhatsNewModal({
    open,
    releases,
    onClose,
}: WhatsNewModalProps) {
    const { t } = useTranslation();

    if (releases.length === 0) {
        return null;
    }

    const multiple = releases.length > 1;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent
                className="max-h-[85vh] max-w-lg border-slate-700 bg-slate-900 text-slate-100"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>{t('whats_new.title')}</DialogTitle>
                </DialogHeader>

                <div className="max-h-[55vh] space-y-6 overflow-y-auto pr-1">
                    {multiple && (
                        <p className="text-xs text-slate-400">
                            {t('whats_new.multiple', {
                                count: releases.length,
                            })}
                        </p>
                    )}
                    {releases.map((release) => (
                        <div key={release.id}>
                            <div className="mb-3 flex items-baseline justify-between gap-3">
                                <span className="text-sm font-semibold text-emerald-400">
                                    {release.title}
                                </span>
                                <span className="shrink-0 text-xs text-slate-500">
                                    {formatDate(release.date)}
                                </span>
                            </div>
                            <ul className="space-y-3">
                                {release.items.map((item, index) => (
                                    <li
                                        key={`${release.id}-${index}`}
                                        className="flex gap-2 text-sm"
                                    >
                                        <span className="shrink-0 leading-snug">
                                            {item.icon}
                                        </span>
                                        <span>
                                            <span className="font-semibold text-slate-100">
                                                {item.title}
                                            </span>
                                            <span className="text-slate-400">
                                                {' '}
                                                — {item.summary}
                                            </span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400"
                    >
                        {t('whats_new.dismiss')}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
