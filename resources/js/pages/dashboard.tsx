import { Head, usePage, router } from '@inertiajs/react';
import MetroCityGame, {
    type CityModelData,
    type GameSettingsProps,
    type GridData,
} from '@/components/game/metro-city-game';
import type { Auth } from '@/types';

type DashboardProps = {
    city: CityModelData;
} & GameSettingsProps;

export default function Dashboard({ city, ...settings }: DashboardProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const userName = auth?.user?.name || 'Mayor';

    const handleSave = (data: {
        name: string;
        money: number;
        population: number;
        xp: number;
        level: number;
        grid_data: GridData;
    }) => {
        return new Promise<void>((resolve, reject) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            router.put('/city', data as any, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => resolve(),
                onError: () => reject(new Error('Save failed')),
            });
        });
    };

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

    return (
        <>
            <Head title={`${city.name} - Metro Mogul 3D`} />
            <main className="h-screen w-screen overflow-hidden bg-slate-950">
                <MetroCityGame
                    initialCity={city}
                    userName={userName}
                    userId={auth?.user?.id}
                    onSave={handleSave}
                    onResetCity={handleResetCity}
                    settings={settings}
                />
            </main>
        </>
    );
}
