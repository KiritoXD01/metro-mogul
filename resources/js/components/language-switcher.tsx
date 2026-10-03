import { router } from '@inertiajs/react';
import { Check, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation, type Locale } from '@/hooks/use-translation';
import { update as updateLocale } from '@/routes/locale';
import { cn } from '@/lib/utils';

const LOCALES: { value: Locale; short: string; labelKey: string }[] = [
    { value: 'en', short: 'EN', labelKey: 'language.english' },
    { value: 'es', short: 'ES', labelKey: 'language.spanish' },
];

function switchLocale(locale: Locale) {
    router.post(
        updateLocale().url,
        { locale },
        { preserveScroll: true, preserveState: false },
    );
}

type Props = {
    variant?: 'segmented' | 'compact';
    className?: string;
};

/**
 * EN/ES language switcher. Persists via POST /locale (session + cookie,
 * and user profile when authenticated) and reloads shared translations.
 */
export default function LanguageSwitcher({
    variant = 'segmented',
    className,
}: Props) {
    const { t, locale } = useTranslation();

    if (variant === 'compact') {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn('h-9 w-9 cursor-pointer', className)}
                        title={t('language.switch_to', 'Switch language')}
                        aria-label={t('language.switch_to', 'Switch language')}
                    >
                        <Globe className="!size-5 opacity-80" />
                        <span className="sr-only">
                            {t('language.name', 'Language')}: {locale.toUpperCase()}
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuRadioGroup
                        value={locale}
                        onValueChange={(value) =>
                            switchLocale(value as Locale)
                        }
                    >
                        {LOCALES.map(({ value, short, labelKey }) => (
                            <DropdownMenuRadioItem
                                key={value}
                                value={value}
                                className="cursor-pointer"
                            >
                                <span className="mr-2 font-mono text-xs font-bold">
                                    {short}
                                </span>
                                {t(labelKey)}
                                {locale === value && (
                                    <Check className="ml-auto h-4 w-4" />
                                )}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <div
            className={cn(
                'inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/80 p-1',
                className,
            )}
            role="group"
            aria-label={t('language.name', 'Language')}
        >
            <Globe className="ml-1.5 h-4 w-4 text-slate-400" />
            {LOCALES.map(({ value, short, labelKey }) => (
                <button
                    key={value}
                    type="button"
                    onClick={() => switchLocale(value)}
                    title={t(labelKey)}
                    aria-pressed={locale === value}
                    className={cn(
                        'rounded-lg px-2.5 py-1 font-mono text-xs font-extrabold transition-all',
                        locale === value
                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                            : 'text-slate-400 hover:text-white',
                    )}
                >
                    {short}
                </button>
            ))}
        </div>
    );
}
