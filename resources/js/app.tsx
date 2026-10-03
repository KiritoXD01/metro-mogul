import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import AblyEcho from '@ably/laravel-echo';
import * as Ably from 'ably';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Ably: typeof Ably;
        Pusher: typeof Pusher;
        // Vanilla Echo instance: official laravel-echo (Reverb) or Ably fork (Ably).
        // NOTE: @laravel/echo-react hooks (useEcho, configureEcho) are NOT used
        // here because the native Ably fork has no React integration. Components
        // must use window.Echo.channel()/private()/join() so local and prod
        // share the same API.
        Echo: Echo<'reverb'> | InstanceType<typeof AblyEcho>;
    }
}

const broadcaster = import.meta.env.VITE_BROADCAST_CONNECTION ?? 'reverb';

// Echo connects from the browser only: SSR runs this module in Node.js where
// `window` doesn't exist.
if (typeof window !== 'undefined') {
    if (broadcaster === 'ably') {
        window.Ably = Ably;
        window.Echo = new AblyEcho({
            broadcaster: 'ably',
        });

        window.Echo.connector.ably.connection.on(
            (stateChange: { current: string }) => {
                if (stateChange.current === 'connected') {
                    console.log('Connected to Ably');
                }
            },
        );
    } else {
        window.Pusher = Pusher;
        window.Echo = new Echo({
            broadcaster: 'reverb',
            key: import.meta.env.VITE_REVERB_APP_KEY,
            wsHost: import.meta.env.VITE_REVERB_HOST,
            wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
            wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
            forceTLS:
                (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
            enabledTransports: ['ws', 'wss'],
        });
    }
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name === 'dashboard':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
