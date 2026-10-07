import { Head, router, usePage } from '@inertiajs/react';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type {
    CityModelData,
    GameSettingsProps,
    GridData,
} from '@/components/game/metro-city-game';
import WhatsNewModal from '@/components/game/hud/whats-new-modal';
import type { ChangelogRelease } from '@/types/changelog';
import type { Auth } from '@/types';

const MetroCityGame = lazy(() => import('@/components/game/metro-city-game'));

type DashboardProps = {
    city: CityModelData;
} & GameSettingsProps;

export default function Dashboard({ city, ...settings }: DashboardProps) {
    const { auth, changelogUnseen = [] } = usePage<{
        auth: Auth;
        changelogUnseen?: ChangelogRelease[];
    }>().props;
    const userName = auth?.user?.name || 'Mayor';

    const [whatsNewOpen, setWhatsNewOpen] = useState(false);
    const latestUnseenId = changelogUnseen[0]?.id ?? null;
    const changelogUnread = changelogUnseen.length > 0;

    useEffect(() => {
        if (!changelogUnread || !latestUnseenId) {
            return;
        }
        const key = `metro-whatsnew-${latestUnseenId}`;
        if (sessionStorage.getItem(key)) {
            return;
        }
        sessionStorage.setItem(key, '1');
        setWhatsNewOpen(true);
    }, [changelogUnread, latestUnseenId]);

    const dismissWhatsNew = () => {
        setWhatsNewOpen(false);
        router.post(
            '/changelog/seen',
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSave = useCallback(
        (data: {
            name: string;
            money: number;
            population: number;
            xp: number;
            level: number;
            grid_data: GridData;
        }) => {
            return fetch('/city', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement
                        )?.content || '',
                },
                body: JSON.stringify(data),
            }).then(async (response) => {
                if (!response.ok) {
                    throw new Error('Save failed');
                }
            });
        },
        [],
    );

    const handleResetCity = (newCityName: string) => {
        return new Promise<void>((resolve, reject) => {
            router.post(
                '/city/reset',
                { name: newCityName },
                {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => resolve(),
                    onError: () => reject(new Error('Reset failed')),
                },
            );
        });
    };

    const handleExpandMap = (): Promise<CityModelData> => {
        return fetch('/city/expand-map', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN':
                    (
                        document.querySelector(
                            'meta[name="csrf-token"]',
                        ) as HTMLMetaElement
                    )?.content || '',
            },
        }).then(async (response) => {
            const payload = (await response.json()) as {
                city?: CityModelData;
                message?: string;
            };

            if (!response.ok) {
                throw new Error(payload.message ?? 'Expand failed');
            }

            if (!payload.city) {
                throw new Error('Expand failed');
            }

            return payload.city;
        });
    };

    return (
        <>
            <Head title={`${city.name} - Metro Mogul 3D`} />
            <WhatsNewModal
                open={whatsNewOpen}
                releases={changelogUnseen}
                onClose={dismissWhatsNew}
            />
            <main className="h-screen w-screen overflow-hidden bg-slate-950">
                <Suspense
                    fallback={
                        <div className="flex h-full items-center justify-center text-sm font-medium text-slate-400">
                            Loading city…
                        </div>
                    }
                >
                    <MetroCityGame
                        initialCity={city}
                        userName={userName}
                        userId={auth?.user?.id}
                        onSave={handleSave}
                        onResetCity={handleResetCity}
                        onExpandMap={handleExpandMap}
                        settings={settings}
                    />
                </Suspense>
            </main>
        </>
    );
}
