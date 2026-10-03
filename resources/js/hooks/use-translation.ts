import { usePage } from '@inertiajs/react';
import { useCallback, useRef } from 'react';

export type Locale = 'en' | 'es';

type LocalePageProps = {
    locale: Locale;
    availableLocales: Locale[];
    translations: Record<string, string>;
};

/**
 * Tiny translation helper backed by the server-shared dictionary
 * (see HandleInertiaRequests::share + lang/{locale}.json).
 *
 * Falls back to the key itself so untranslated surfaces keep
 * rendering English instead of blanking out.
 */
export function useTranslation() {
    const { locale, availableLocales, translations } =
        usePage<LocalePageProps>().props;

    // Keep the latest dictionary in a ref so `t` stays stable yet always
    // reads fresh strings (e.g. inside websocket handlers or timeouts
    // captured before a locale switch re-renders the tree).
    const latestRef = useRef(translations);
    latestRef.current = translations;

    const t = useCallback(
        (
            key: string,
            varsOrFallback?: Record<string, string | number> | string,
            fallback?: string,
        ): string => {
            const dict = latestRef.current;
            const fallbackText =
                typeof varsOrFallback === 'string'
                    ? varsOrFallback
                    : (fallback ?? key);
            let template = dict?.[key] ?? fallbackText;

            const vars =
                typeof varsOrFallback === 'object' ? varsOrFallback : undefined;

            if (vars) {
                for (const [name, value] of Object.entries(vars)) {
                    template = template.replaceAll(`:${name}`, String(value));
                }
            }

            return template;
        },
        [],
    );

    return {
        t,
        locale: (locale ?? 'en') as Locale,
        availableLocales: (availableLocales ?? ['en', 'es']) as Locale[],
    };
}
