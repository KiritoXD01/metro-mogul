import { useState } from 'react';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { dashboard, logout } from '@/routes';
import { store as loginStore } from '@/routes/login';
import { store as registerStore } from '@/routes/register';
import { request as passwordRequest } from '@/routes/password';
import { edit as profileEdit } from '@/routes/profile';
import { BUILDING_TYPES } from '@/components/game/metro-city-game';
import type { Auth } from '@/types';
import {
    ArrowRight,
    Building2,
    Coins,
    Crown,
    Gamepad2,
    Layers,
    LogOut,
    Play,
    Settings,
    Sparkles,
    Volume2,
} from 'lucide-react';

function formatBuildTime(seconds?: number): string {
    if (!seconds) return 'Instant';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export default function Welcome() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth?.user;

    const [authTab, setAuthTab] = useState<'login' | 'register'>('register');
    const [catalogFilter, setCatalogFilter] = useState<
        'all' | 'residential' | 'commercial' | 'decor' | 'road'
    >('all');

    const filteredBuildings = Object.values(BUILDING_TYPES).filter(
        (b) => catalogFilter === 'all' || b.category === catalogFilter,
    );

    return (
        <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 selection:bg-amber-400 selection:text-slate-950">
            <Head title="Metro Mogul 3D - The Isometric City Builder" />

            {/* Top Ambient Glow */}
            <div className="pointer-events-none fixed top-0 left-1/2 -z-10 h-96 w-full max-w-7xl -translate-x-1/2 bg-gradient-to-b from-indigo-600/15 via-amber-500/10 to-transparent blur-3xl" />

            {/* NAVIGATION BAR */}
            <nav className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 font-black text-slate-950 shadow-lg shadow-amber-500/20">
                            <Crown className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="bg-gradient-to-r from-amber-300 via-yellow-200 to-indigo-200 bg-clip-text text-lg font-black tracking-wider text-transparent">
                                METRO MOGUL{' '}
                                <span className="ml-1 rounded border border-amber-400/20 bg-amber-400/10 px-1.5 py-0.5 font-mono text-sm text-amber-400">
                                    3D
                                </span>
                            </div>
                            <div className="text-[10px] font-medium tracking-tight text-slate-400">
                                The Isometric Metropolis Builder
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <a
                            href="#showcase"
                            className="hidden text-xs font-semibold text-slate-400 transition-colors hover:text-white md:inline-block"
                        >
                            Building Catalog
                        </a>
                        <a
                            href="#mechanics"
                            className="hidden text-xs font-semibold text-slate-400 transition-colors hover:text-white md:inline-block"
                        >
                            City Mechanics
                        </a>

                        {user ? (
                            <div className="flex items-center gap-3">
                                <Link
                                    href={dashboard()}
                                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:from-amber-400 hover:to-amber-300"
                                >
                                    <Play className="h-3.5 w-3.5 fill-current" />
                                    <span>Resume City</span>
                                </Link>
                                <Link
                                    href={logout()}
                                    method="post"
                                    as="button"
                                    className="rounded-xl border border-slate-800 p-2 text-slate-400 transition-all hover:bg-slate-900 hover:text-rose-400"
                                    title="Log out"
                                >
                                    <LogOut className="h-4 w-4" />
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setAuthTab('login');
                                        document
                                            .getElementById('mayor-terminal')
                                            ?.scrollIntoView({
                                                behavior: 'smooth',
                                            });
                                    }}
                                    className="rounded-xl px-3 py-2 text-xs font-bold text-slate-300 transition-all hover:bg-slate-900 hover:text-white"
                                >
                                    Log In
                                </button>
                                <button
                                    onClick={() => {
                                        setAuthTab('register');
                                        document
                                            .getElementById('mayor-terminal')
                                            ?.scrollIntoView({
                                                behavior: 'smooth',
                                            });
                                    }}
                                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-md shadow-indigo-600/30 transition-all hover:bg-indigo-500"
                                >
                                    <span>Start City</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative mx-auto flex max-w-7xl flex-1 flex-col justify-center px-4 pt-12 pb-16 sm:px-6 lg:px-8">
                <div className="grid items-center gap-12 lg:grid-cols-12">
                    {/* Left Column: Game Premise & Features */}
                    <div className="space-y-6 lg:col-span-7">
                        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-slate-900 px-3 py-1.5 text-xs font-bold text-amber-300 shadow-inner">
                            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                            <span>Full 3D WebGL Isometric Simulation</span>
                        </div>

                        <h1 className="text-4xl leading-[1.1] font-black tracking-tight sm:text-5xl lg:text-6xl">
                            Architect Your <br />
                            <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-indigo-400 bg-clip-text text-transparent">
                                Thriving Empire
                            </span>
                        </h1>

                        <p className="max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
                            Found your city, zone residential cottages and
                            towering highrises, establish lucrative coffee cafes
                            and tech hubs, lay asphalt grids, and collect cycles
                            of rent in an interactive 3D procedural world.
                        </p>

                        {/* Feature Highlights Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
                            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3 backdrop-blur-sm">
                                <div className="mb-1 text-indigo-400">
                                    <Gamepad2 className="h-5 w-5" />
                                </div>
                                <div className="text-xs font-bold text-white">
                                    Three.js 3D
                                </div>
                                <div className="text-[11px] text-slate-400">
                                    Isometric viewport
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3 backdrop-blur-sm">
                                <div className="mb-1 text-emerald-400">
                                    <Coins className="h-5 w-5" />
                                </div>
                                <div className="text-xs font-bold text-white">
                                    Live Economy
                                </div>
                                <div className="text-[11px] text-slate-400">
                                    Rent & cycles
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3 backdrop-blur-sm">
                                <div className="mb-1 text-amber-400">
                                    <Volume2 className="h-5 w-5" />
                                </div>
                                <div className="text-xs font-bold text-white">
                                    Web Audio
                                </div>
                                <div className="text-[11px] text-slate-400">
                                    Custom synth FX
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3 backdrop-blur-sm">
                                <div className="mb-1 text-purple-400">
                                    <Layers className="h-5 w-5" />
                                </div>
                                <div className="text-xs font-bold text-white">
                                    Persistent DB
                                </div>
                                <div className="text-[11px] text-slate-400">
                                    Cloud auto-save
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Mayor Terminal (Auth Card / Resume Card) */}
                    <div id="mayor-terminal" className="lg:col-span-5">
                        <div className="relative overflow-hidden rounded-3xl border border-slate-800/90 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
                            <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl" />
                            <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />

                            {user ? (
                                /* Authenticated Mayor State */
                                <div className="space-y-6 text-center">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 font-black text-slate-950 shadow-xl shadow-amber-500/30">
                                        <Crown className="h-8 w-8" />
                                    </div>

                                    <div>
                                        <div className="text-xs font-bold tracking-widest text-amber-400 uppercase">
                                            Mayor Headquarters
                                        </div>
                                        <h2 className="mt-1 text-2xl font-black text-white">
                                            Welcome back, {user.name}!
                                        </h2>
                                        <p className="mt-1 text-xs text-slate-400">
                                            Your city treasury and citizens
                                            await your command.
                                        </p>
                                    </div>

                                    <div className="space-y-2 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 text-left">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400">
                                                Account
                                            </span>
                                            <span className="font-semibold text-white">
                                                {user.email}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400">
                                                Status
                                            </span>
                                            <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                                                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                                                Mayor Active
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <Link
                                            href={dashboard()}
                                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-3 text-sm font-black tracking-wide text-slate-950 shadow-xl shadow-amber-500/30 transition-all hover:from-amber-400 hover:to-yellow-300"
                                        >
                                            <Play className="h-4 w-4 fill-current" />
                                            <span>ENTER METROPOLIS</span>
                                        </Link>

                                        <div className="flex gap-2">
                                            <Link
                                                href={profileEdit()}
                                                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 transition-all hover:bg-slate-700"
                                            >
                                                <Settings className="h-3.5 w-3.5" />
                                                <span>Settings</span>
                                            </Link>

                                            <Link
                                                href={logout()}
                                                method="post"
                                                as="button"
                                                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-800 px-4 py-2.5 text-xs font-bold text-rose-300 transition-all hover:bg-rose-500/20 hover:text-rose-200"
                                            >
                                                <LogOut className="h-3.5 w-3.5" />
                                                <span>Log Out</span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Guest Auth: Login & Register Tabs */
                                <div>
                                    <div className="mb-6 flex rounded-2xl border border-slate-800 bg-slate-950/80 p-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setAuthTab('register')
                                            }
                                            className={`flex-1 rounded-xl py-2 text-xs font-extrabold transition-all ${
                                                authTab === 'register'
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            Found New City
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAuthTab('login')}
                                            className={`flex-1 rounded-xl py-2 text-xs font-extrabold transition-all ${
                                                authTab === 'login'
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            Mayor Log In
                                        </button>
                                    </div>

                                    {authTab === 'register' ? (
                                        /* CREATE PROFILE & START NEW CITY */
                                        <div>
                                            <div className="mb-4">
                                                <h2 className="text-xl font-bold text-white">
                                                    Create Mayor Profile
                                                </h2>
                                                <p className="text-xs text-slate-400">
                                                    Found your city with $2,500
                                                    initial treasury capital.
                                                </p>
                                            </div>

                                            <Form
                                                {...registerStore.form()}
                                                resetOnSuccess={[
                                                    'password',
                                                    'password_confirmation',
                                                ]}
                                                disableWhileProcessing
                                                className="space-y-4"
                                            >
                                                {({ processing, errors }) => (
                                                    <>
                                                        <div className="space-y-1.5">
                                                            <Label
                                                                htmlFor="reg_name"
                                                                className="text-xs font-bold text-slate-300"
                                                            >
                                                                Mayor Name
                                                            </Label>
                                                            <Input
                                                                id="reg_name"
                                                                name="name"
                                                                type="text"
                                                                required
                                                                placeholder="Mayor Alexander"
                                                                className="rounded-xl border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600"
                                                            />
                                                            <InputError
                                                                message={
                                                                    errors.name
                                                                }
                                                            />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <Label
                                                                htmlFor="reg_email"
                                                                className="text-xs font-bold text-slate-300"
                                                            >
                                                                Email Address
                                                            </Label>
                                                            <Input
                                                                id="reg_email"
                                                                name="email"
                                                                type="email"
                                                                required
                                                                placeholder="mayor@metropolis.gov"
                                                                className="rounded-xl border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600"
                                                            />
                                                            <InputError
                                                                message={
                                                                    errors.email
                                                                }
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                            <div className="space-y-1.5">
                                                                <Label
                                                                    htmlFor="reg_password"
                                                                    className="text-xs font-bold text-slate-300"
                                                                >
                                                                    Password
                                                                </Label>
                                                                <PasswordInput
                                                                    id="reg_password"
                                                                    name="password"
                                                                    required
                                                                    autoComplete="new-password"
                                                                    placeholder="••••••••"
                                                                    className="rounded-xl border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600"
                                                                />
                                                                <InputError
                                                                    message={
                                                                        errors.password
                                                                    }
                                                                />
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <Label
                                                                    htmlFor="reg_password_confirmation"
                                                                    className="text-xs font-bold text-slate-300"
                                                                >
                                                                    Confirm
                                                                </Label>
                                                                <PasswordInput
                                                                    id="reg_password_confirmation"
                                                                    name="password_confirmation"
                                                                    required
                                                                    autoComplete="new-password"
                                                                    placeholder="••••••••"
                                                                    className="rounded-xl border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600"
                                                                />
                                                                <InputError
                                                                    message={
                                                                        errors.password_confirmation
                                                                    }
                                                                />
                                                            </div>
                                                        </div>

                                                        <Button
                                                            type="submit"
                                                            disabled={
                                                                processing
                                                            }
                                                            className="mt-2 w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 py-3 text-xs font-black tracking-wider text-slate-950 uppercase shadow-xl shadow-amber-500/25 transition-all hover:from-amber-400 hover:to-yellow-300"
                                                        >
                                                            {processing ? (
                                                                <Spinner className="mr-2 h-4 w-4" />
                                                            ) : (
                                                                <Play className="mr-2 h-3.5 w-3.5 fill-current" />
                                                            )}
                                                            Start New City
                                                        </Button>
                                                    </>
                                                )}
                                            </Form>
                                        </div>
                                    ) : (
                                        /* LOGIN SCREEN */
                                        <div>
                                            <div className="mb-4">
                                                <h2 className="text-xl font-bold text-white">
                                                    Access Your City
                                                </h2>
                                                <p className="text-xs text-slate-400">
                                                    Enter your mayor credentials
                                                    to resume management.
                                                </p>
                                            </div>

                                            <Form
                                                {...loginStore.form()}
                                                resetOnSuccess={['password']}
                                                disableWhileProcessing
                                                className="space-y-4"
                                            >
                                                {({ processing, errors }) => (
                                                    <>
                                                        <div className="space-y-1.5">
                                                            <Label
                                                                htmlFor="login_email"
                                                                className="text-xs font-bold text-slate-300"
                                                            >
                                                                Email Address
                                                            </Label>
                                                            <Input
                                                                id="login_email"
                                                                name="email"
                                                                type="email"
                                                                required
                                                                autoFocus
                                                                placeholder="mayor@metropolis.gov"
                                                                className="rounded-xl border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600"
                                                            />
                                                            <InputError
                                                                message={
                                                                    errors.email
                                                                }
                                                            />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between">
                                                                <Label
                                                                    htmlFor="login_password"
                                                                    className="text-xs font-bold text-slate-300"
                                                                >
                                                                    Password
                                                                </Label>
                                                                <Link
                                                                    href={passwordRequest()}
                                                                    className="text-[11px] text-indigo-400 underline hover:text-indigo-300"
                                                                >
                                                                    Forgot?
                                                                </Link>
                                                            </div>
                                                            <PasswordInput
                                                                id="login_password"
                                                                name="password"
                                                                required
                                                                autoComplete="current-password"
                                                                placeholder="••••••••"
                                                                className="rounded-xl border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600"
                                                            />
                                                            <InputError
                                                                message={
                                                                    errors.password
                                                                }
                                                            />
                                                        </div>

                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="remember"
                                                                name="remember"
                                                            />
                                                            <Label
                                                                htmlFor="remember"
                                                                className="text-xs text-slate-400"
                                                            >
                                                                Remember this
                                                                mayor terminal
                                                            </Label>
                                                        </div>

                                                        <Button
                                                            type="submit"
                                                            disabled={
                                                                processing
                                                            }
                                                            className="mt-2 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-3 text-xs font-black tracking-wider text-white uppercase shadow-xl shadow-indigo-600/30 transition-all hover:from-indigo-500 hover:to-indigo-400"
                                                        >
                                                            {processing ? (
                                                                <Spinner className="mr-2 h-4 w-4" />
                                                            ) : (
                                                                <Play className="mr-2 h-3.5 w-3.5 fill-current" />
                                                            )}
                                                            Enter Metropolis
                                                        </Button>
                                                    </>
                                                )}
                                            </Form>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* BUILDING CATALOG SHOWCASE */}
            <section
                id="showcase"
                className="border-t border-slate-800/60 bg-slate-950/40 py-20"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                        <div>
                            <div className="mb-1 flex items-center gap-1.5 text-xs font-extrabold tracking-widest text-amber-400 uppercase">
                                <Building2 className="h-4 w-4" />
                                <span>Structural Blueprint Catalog</span>
                            </div>
                            <h2 className="text-3xl font-black text-white sm:text-4xl">
                                9 Interactive 3D Structures
                            </h2>
                            <p className="mt-2 max-w-xl text-sm text-slate-400">
                                Every structure features procedural 3D models
                                with real-time shadow casting, population
                                yields, rent cycles, and level XP.
                            </p>
                        </div>

                        {/* Filter buttons */}
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'all' as const, label: 'All Structures' },
                                {
                                    id: 'residential' as const,
                                    label: 'Housing',
                                },
                                {
                                    id: 'commercial' as const,
                                    label: 'Commercial',
                                },
                                { id: 'decor' as const, label: 'Decorations' },
                                { id: 'road' as const, label: 'Roads' },
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setCatalogFilter(f.id)}
                                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                        catalogFilter === f.id
                                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                                            : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredBuildings.map((b) => {
                            const Icon = b.icon;
                            return (
                                <div
                                    key={b.id}
                                    className="group flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-900/80 p-5 shadow-xl transition-all hover:border-slate-700"
                                >
                                    <div>
                                        <div className="mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white shadow-md"
                                                    style={{
                                                        backgroundColor:
                                                            b.color,
                                                    }}
                                                >
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-bold text-white transition-colors group-hover:text-amber-300">
                                                        {b.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                            {b.category}
                                                        </span>
                                                        <span className="inline-flex items-center rounded-md border border-amber-400/20 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                                                            Level{' '}
                                                            {b.unlockLevel}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-sm font-extrabold text-emerald-400">
                                                    ${b.cost}
                                                </div>
                                                <div className="text-[10px] font-medium text-slate-500">
                                                    Cost to build
                                                </div>
                                            </div>
                                        </div>

                                        <p className="mb-4 text-xs leading-relaxed text-slate-300">
                                            {b.description}
                                        </p>
                                    </div>

                                    {/* Metrics footer */}
                                    <div className="grid grid-cols-4 gap-2 border-t border-slate-800/80 pt-3 text-center">
                                        <div className="border-slate-850 rounded-xl border bg-slate-950/60 p-2">
                                            <div className="text-[9px] font-semibold text-slate-400">
                                                Build Time
                                            </div>
                                            <div className="text-xs font-black text-amber-400">
                                                {formatBuildTime(b.buildTime)}
                                            </div>
                                        </div>
                                        <div className="border-slate-850 rounded-xl border bg-slate-950/60 p-2">
                                            <div className="text-[9px] font-semibold text-slate-400">
                                                Citizens
                                            </div>
                                            <div className="text-xs font-black text-blue-300">
                                                +{b.population}
                                            </div>
                                        </div>
                                        <div className="border-slate-850 rounded-xl border bg-slate-950/60 p-2">
                                            <div className="text-[9px] font-semibold text-slate-400">
                                                Income
                                            </div>
                                            <div className="text-xs font-black text-emerald-400">
                                                {b.income > 0
                                                    ? `+$${b.income}`
                                                    : '$0'}
                                            </div>
                                        </div>
                                        <div className="border-slate-850 rounded-xl border bg-slate-950/60 p-2">
                                            <div className="text-[9px] font-semibold text-slate-400">
                                                Cycle
                                            </div>
                                            <div className="text-xs font-black text-indigo-300">
                                                {b.timer > 0
                                                    ? `${b.timer}s`
                                                    : 'Passive'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* GAME MECHANICS SECTION */}
            <section
                id="mechanics"
                className="mx-auto max-w-7xl border-t border-slate-800/60 px-4 py-20 sm:px-6 lg:px-8"
            >
                <div className="mx-auto mb-16 max-w-2xl text-center">
                    <div className="mb-1 text-xs font-extrabold tracking-widest text-indigo-400 uppercase">
                        Rules of Urban Prosperity
                    </div>
                    <h2 className="text-3xl font-black text-white sm:text-4xl">
                        How to Rule Your Metropolis
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Master the city balance between citizen capacity,
                        commercial taxation cycles, and town aesthetics.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-lg font-black text-indigo-400">
                            1
                        </div>
                        <h3 className="text-lg font-bold text-white">
                            Active Construction Sites
                        </h3>
                        <p className="text-xs leading-relaxed text-slate-300">
                            Founding structures takes time and engineering.
                            Watch tower cranes swing and scaffolds rise as
                            timers tick down (e.g., 1m for Cozy Cottages, 5m for
                            Luxury Villas) backed by Laravel jobs.
                        </p>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-lg font-black text-emerald-400">
                            2
                        </div>
                        <h3 className="text-lg font-bold text-white">
                            Recollect Revenue with 3D Dollars
                        </h3>
                        <p className="text-xs leading-relaxed text-slate-300">
                            Commercial stores and cafes produce steady revenue
                            cycles. When funds are ready, a spinning, floating
                            3D dollar token appears over the building—click to
                            harvest coins and XP!
                        </p>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-lg font-black text-amber-400">
                            3
                        </div>
                        <h3 className="text-lg font-bold text-white">
                            Redevelop & Expand
                        </h3>
                        <p className="text-xs leading-relaxed text-slate-300">
                            Demolish outdated homes with the bulldozer tool to
                            construct luxury villas and high-tech innovation
                            hubs as your city prestige rises.
                        </p>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-slate-800/80 bg-slate-950 py-10">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-400" />
                        <span className="font-bold text-slate-300">
                            Metro Mogul 3D
                        </span>
                        <span>&copy; {new Date().getFullYear()}</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <span>Powered by Three.js, React & Laravel 13</span>
                        <a
                            href="#mayor-terminal"
                            className="font-bold text-amber-400 hover:text-amber-300"
                        >
                            Back to Top ↑
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
