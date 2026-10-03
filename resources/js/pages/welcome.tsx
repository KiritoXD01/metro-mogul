import { useState } from 'react';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import LanguageSwitcher from '@/components/language-switcher';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { dashboard, logout } from '@/routes';
import { store as loginStore } from '@/routes/login';
import { store as registerStore } from '@/routes/register';
import { edit as profileEdit } from '@/routes/profile';
import { BUILDING_TYPES } from '@/components/game/buildings';
import { useTranslation } from '@/hooks/use-translation';
import type { Auth } from '@/types';
import {
    ArrowRight,
    Building2,
    Coins,
    Crown,
    Gamepad2,
    Hammer,
    Layers,
    LogOut,
    Play,
    Settings,
    Sparkles,
    Trophy,
    Volume2,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';

function formatBuildTime(seconds?: number, instant = 'Instant'): string {
    if (!seconds) return instant;
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

// 4 signature buildings featured by default
const SIGNATURE_BUILDING_IDS = ['small_house', 'coffee_shop', 'villa', 'tech_office'];

export default function Welcome() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const { t } = useTranslation();
    const user = auth?.user;

    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authTab, setAuthTab] = useState<'register' | 'login'>('register');
    const [showAllBlueprints, setShowAllBlueprints] = useState(false);

    const openAuthModal = (tab: 'register' | 'login') => {
        setAuthTab(tab);
        setAuthModalOpen(true);
    };

    const allBuildings = Object.values(BUILDING_TYPES);
    const displayedBuildings = showAllBlueprints
        ? allBuildings
        : allBuildings.filter((b) => SIGNATURE_BUILDING_IDS.includes(b.id));

    return (
        <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 selection:bg-amber-400 selection:text-slate-950">
            <Head title="Metro Mogul 3D - The Isometric City Builder" />

            {/* Ambient Background Lights */}
            <div className="pointer-events-none fixed top-0 left-1/2 -z-10 h-[500px] w-full max-w-7xl -translate-x-1/2 bg-gradient-to-b from-indigo-600/15 via-amber-500/10 to-transparent blur-3xl" />

            {/* NAVIGATION BAR */}
            <nav className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
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
                                Isometric City Simulation
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <a
                            href="#gameplay"
                            className="hidden text-xs font-semibold text-slate-400 transition-colors hover:text-white md:inline-block"
                        >
                            {t('nav.gameplay')}
                        </a>
                        <a
                            href="#blueprints"
                            className="hidden text-xs font-semibold text-slate-400 transition-colors hover:text-white md:inline-block"
                        >
                            {t('nav.blueprints')}
                        </a>

                        {user ? (
                            <div className="flex items-center gap-3">
                                <Link
                                    href={dashboard()}
                                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:from-amber-400 hover:to-amber-300"
                                >
                                    <Play className="h-3.5 w-3.5 fill-current" />
                                    <span>{t('nav.resume_city')}</span>
                                </Link>
                                <Link
                                    href={profileEdit()}
                                    className="rounded-xl border border-slate-800 p-2 text-slate-400 transition-all hover:bg-slate-900 hover:text-white"
                                    title="Settings"
                                >
                                    <Settings className="h-4 w-4" />
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
                                    onClick={() => openAuthModal('login')}
                                    className="rounded-xl px-3.5 py-2 text-xs font-bold text-slate-300 transition-all hover:bg-slate-900 hover:text-white"
                                >
                                    {t('nav.mayor_login')}
                                </button>
                                <button
                                    onClick={() => openAuthModal('register')}
                                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-md shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-300"
                                >
                                    <span>{t('nav.start_city')}</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative mx-auto max-w-7xl px-4 pt-14 pb-12 text-center sm:px-6 lg:px-8">
                {/* Game Pill Badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-slate-900/90 px-3.5 py-1.5 text-xs font-bold text-amber-300 shadow-inner">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>{t('hero.badge')}</span>
                </div>

                {/* Main Headline */}
                <h1 className="mx-auto mt-6 max-w-4xl text-4xl leading-[1.1] font-black tracking-tight sm:text-5xl lg:text-6xl">
                    {t('hero.title_a')} <br />
                    <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-indigo-400 bg-clip-text text-transparent">
                        {t('hero.title_b')}
                    </span>
                </h1>

                {/* Game Subtitle */}
                <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                    {t('hero.subtitle')}
                </p>

                {/* Action CTAs */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    {user ? (
                        <Link
                            href={dashboard()}
                            className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 px-7 py-3.5 text-sm font-black tracking-wide text-slate-950 shadow-xl shadow-amber-500/30 transition-all hover:from-amber-400 hover:to-yellow-300"
                        >
                            <Play className="h-4 w-4 fill-current" />
                            <span>{t('hero.return_city')}</span>
                        </Link>
                    ) : (
                        <>
                            <button
                                onClick={() => openAuthModal('register')}
                                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 px-7 py-3.5 text-sm font-black tracking-wide text-slate-950 shadow-xl shadow-amber-500/30 transition-all hover:from-amber-400 hover:to-yellow-300"
                            >
                                <Play className="h-4 w-4 fill-current" />
                                <span>{t('hero.start_free')}</span>
                            </button>
                            <button
                                onClick={() => openAuthModal('login')}
                                className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-6 py-3.5 text-sm font-bold text-slate-200 backdrop-blur-sm transition-all hover:bg-slate-800 hover:text-white"
                            >
                                <span>{t('nav.mayor_login')}</span>
                            </button>
                        </>
                    )}
                    <a
                        href="#blueprints"
                        className="flex items-center gap-1.5 rounded-2xl px-5 py-3.5 text-sm font-semibold text-slate-400 transition-colors hover:text-white"
                    >
                        <span>{t('hero.explore_blueprints')}</span>
                        <ArrowRight className="h-4 w-4" />
                    </a>
                </div>

                {/* Quick Spec Highlights */}
                <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                        <Gamepad2 className="h-4 w-4 text-indigo-400" />
                        <span>{t('hero.spec_viewport')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-emerald-400" />
                        <span>{t('hero.spec_rent')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-amber-400" />
                        <span>{t('hero.spec_audio')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-purple-400" />
                        <span>{t('hero.spec_save')}</span>
                    </div>
                </div>

                {/* GAMEPLAY SHOWCASE CENTERPIECE */}
                <div className="mx-auto mt-12 max-w-5xl">
                    <div className="overflow-hidden rounded-3xl border border-slate-800/90 bg-slate-900/90 shadow-2xl ring-1 ring-amber-500/20 backdrop-blur-xl">
                        {/* Simulation Viewport Header Bar */}
                        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-4 py-3 sm:px-6">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                                <span className="ml-2 hidden font-mono text-xs font-semibold text-slate-400 sm:inline">
                                    {t('showcase.engine')}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-400">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                                    {t('showcase.active')}
                                </span>
                                <span className="font-mono text-xs font-extrabold text-amber-400">
                                    $2,050 {t('showcase.treasury')}
                                </span>
                            </div>
                        </div>

                        {/* Gameplay Screen Image */}
                        <div className="group relative overflow-hidden bg-slate-950">
                            <img
                                src="/images/gameplay-demo.png"
                                alt="Metro Mogul 3D Gameplay Session"
                                className="h-auto w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
                            />

                            {/* Floating Visual Annotations */}
                            <div className="pointer-events-none absolute top-4 left-4 hidden rounded-xl border border-slate-700/80 bg-slate-950/85 px-3 py-1.5 text-left text-xs font-bold text-slate-200 shadow-xl backdrop-blur-md md:block">
                                <div className="text-[10px] font-semibold text-amber-400 uppercase">
                                    {t('showcase.tag_3d')}
                                </div>
                                <div className="text-white">{t('showcase.procedural')}</div>
                            </div>

                            <div className="pointer-events-none absolute bottom-16 right-4 hidden rounded-xl border border-emerald-500/30 bg-slate-950/85 px-3 py-1.5 text-left text-xs font-bold text-slate-200 shadow-xl backdrop-blur-md md:block">
                                <div className="text-[10px] font-semibold text-emerald-400 uppercase">
                                    {t('showcase.harvest')}
                                </div>
                                <div className="text-white">{t('showcase.coins_ready')}</div>
                            </div>

                            {/* Center Hover Action for Guests */}
                            {!user && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
                                    <button
                                        onClick={() => openAuthModal('register')}
                                        className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-3 text-xs font-black tracking-wider text-slate-950 uppercase shadow-2xl transition-all hover:scale-105"
                                    >
                                        <Play className="h-4 w-4 fill-current" />
                                        <span>{t('hero.build_yours')}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* GAMEPLAY PILLARS SECTION */}
            <section
                id="gameplay"
                className="border-t border-slate-800/60 bg-slate-950/40 py-20"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto mb-14 max-w-2xl text-center">
                        <div className="mb-1 text-xs font-extrabold tracking-widest text-indigo-400 uppercase">
                            {t('pillars.eyebrow')}
                        </div>
                        <h2 className="text-3xl font-black text-white sm:text-4xl">
                            {t('pillars.title')}
                        </h2>
                        <p className="mt-2 text-sm text-slate-400">
                            {t('pillars.subtitle')}
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Pillar 1 */}
                        <div className="group rounded-3xl border border-slate-800/90 bg-slate-900/70 p-7 shadow-xl transition-all hover:border-slate-700 hover:bg-slate-900">
                            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                                <Hammer className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-black text-white">
                                {t('pillars.p1_title')}
                            </h3>
                            <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
                                {t('pillars.p1_body')}
                            </p>
                        </div>

                        {/* Pillar 2 */}
                        <div className="group rounded-3xl border border-slate-800/90 bg-slate-900/70 p-7 shadow-xl transition-all hover:border-slate-700 hover:bg-slate-900">
                            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                                <Coins className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-black text-white">
                                {t('pillars.p2_title')}
                            </h3>
                            <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
                                {t('pillars.p2_body')}
                            </p>
                        </div>

                        {/* Pillar 3 */}
                        <div className="group rounded-3xl border border-slate-800/90 bg-slate-900/70 p-7 shadow-xl transition-all hover:border-slate-700 hover:bg-slate-900">
                            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
                                <Trophy className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-black text-white">
                                {t('pillars.p3_title')}
                            </h3>
                            <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
                                {t('pillars.p3_body')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* BLUEPRINTS CATALOG SECTION */}
            <section
                id="blueprints"
                className="border-t border-slate-800/60 bg-slate-950 py-20"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                        <div>
                            <div className="mb-1 flex items-center gap-1.5 text-xs font-extrabold tracking-widest text-amber-400 uppercase">
                                <Building2 className="h-4 w-4" />
                                <span>{t('blueprints.eyebrow')}</span>
                            </div>
                            <h2 className="text-3xl font-black text-white sm:text-4xl">
                                {t('blueprints.title')}
                            </h2>
                            <p className="mt-2 max-w-xl text-sm text-slate-400">
                                {t('blueprints.subtitle')}
                            </p>
                        </div>

                        <button
                            onClick={() => setShowAllBlueprints(!showAllBlueprints)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 transition-all hover:border-slate-700 hover:text-white"
                        >
                            <span>{showAllBlueprints ? t('blueprints.show_signature') : t('blueprints.show_all')}</span>
                            {showAllBlueprints ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </button>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {displayedBuildings.map((b) => {
                            const Icon = b.icon;
                            return (
                                <div
                                    key={b.id}
                                    className="group flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-900/80 p-5 shadow-xl transition-all hover:border-slate-700"
                                >
                                    <div>
                                        <div className="mb-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white shadow-md"
                                                    style={{ backgroundColor: b.color }}
                                                >
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-white transition-colors group-hover:text-amber-300">
                                                        {t(`building.${b.id}.name`, b.name)}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                            {b.category}
                                                        </span>
                                                        <span className="inline-flex items-center rounded-md border border-amber-400/20 bg-amber-400/10 px-1.5 py-0.2 text-[9px] font-bold text-amber-300">
                                                            {t('blueprints.level')} {b.unlockLevel}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-sm font-extrabold text-emerald-400">
                                                    ${b.cost}
                                                </div>
                                            </div>
                                        </div>

                                        <p className="mb-4 text-xs leading-relaxed text-slate-300">
                                            {t(`building.${b.id}.description`, b.description)}
                                        </p>
                                    </div>

                                    {/* Metrics strip */}
                                    <div className="grid grid-cols-3 gap-1.5 border-t border-slate-800/80 pt-3 text-center">
                                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-1.5">
                                            <div className="text-[9px] font-medium text-slate-400">
                                                {t('blueprints.build')}
                                            </div>
                                            <div className="text-xs font-black text-amber-400">
                                                {formatBuildTime(b.buildTime, t('shop.instant'))}
                                            </div>
                                        </div>
                                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-1.5">
                                            <div className="text-[9px] font-medium text-slate-400">
                                                {t('blueprints.income')}
                                            </div>
                                            <div className="text-xs font-black text-emerald-400">
                                                {b.income > 0 ? `+$${b.income}` : '$0'}
                                            </div>
                                        </div>
                                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-1.5">
                                            <div className="text-[9px] font-medium text-slate-400">
                                                {t('blueprints.citizens')}
                                            </div>
                                            <div className="text-xs font-black text-blue-300">
                                                +{b.population}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION BANNER */}
            <section className="border-t border-slate-800/80 bg-gradient-to-b from-slate-950 to-indigo-950/30 py-16">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 font-black text-slate-950 shadow-xl shadow-amber-500/25">
                        <Crown className="h-7 w-7" />
                    </div>
                    <h2 className="mt-5 text-3xl font-black text-white sm:text-4xl">
                        {t('cta.title')}
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
                        {t('cta.subtitle')}
                    </p>
                    <div className="mt-8 flex justify-center">
                        {user ? (
                            <Link
                                href={dashboard()}
                                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 px-8 py-3.5 text-sm font-black tracking-wide text-slate-950 shadow-xl shadow-amber-500/30 transition-all hover:from-amber-400 hover:to-yellow-300"
                            >
                                <Play className="h-4 w-4 fill-current" />
                                <span>{t('hero.return_city')}</span>
                            </Link>
                        ) : (
                            <button
                                onClick={() => openAuthModal('register')}
                                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 px-8 py-3.5 text-sm font-black tracking-wide text-slate-950 shadow-xl shadow-amber-500/30 transition-all hover:from-amber-400 hover:to-yellow-300"
                            >
                                <Play className="h-4 w-4 fill-current" />
                                <span>{t('cta.found_today')}</span>
                            </button>
                        )}
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
                        <span>{t('footer.built_with')}</span>
                        <a
                            href="#"
                            className="font-bold text-amber-400 hover:text-amber-300"
                        >
                            {t('footer.back_top')}
                        </a>
                    </div>
                </div>
            </footer>

            {/* COMPACT AUTH MODAL */}
            <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
                <DialogContent className="max-w-md border-slate-800 bg-slate-900/95 p-6 text-slate-100 shadow-2xl backdrop-blur-2xl sm:rounded-3xl">
                    <DialogHeader className="space-y-1 text-left">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase">
                            <Crown className="h-4 w-4" />
                            <span>{t('auth.hq')}</span>
                        </div>
                        <DialogTitle className="text-xl font-black text-white">
                            {authTab === 'register' ? t('auth.found_title') : t('auth.access_title')}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-400">
                            {authTab === 'register'
                                ? t('auth.found_desc')
                                : t('auth.access_desc')}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Tab Switcher */}
                    <div className="my-2 flex rounded-2xl border border-slate-800 bg-slate-950/80 p-1">
                        <button
                            type="button"
                            onClick={() => setAuthTab('register')}
                            className={`flex-1 rounded-xl py-2 text-xs font-extrabold transition-all ${
                                authTab === 'register'
                                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {t('auth.tab_found')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setAuthTab('login')}
                            className={`flex-1 rounded-xl py-2 text-xs font-extrabold transition-all ${
                                authTab === 'login'
                                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {t('auth.tab_login')}
                        </button>
                    </div>

                    {authTab === 'register' ? (
                        /* REGISTRATION FORM */
                        <Form
                            {...registerStore.form()}
                            resetOnSuccess={['password', 'password_confirmation']}
                            disableWhileProcessing
                            className="space-y-3.5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="space-y-1">
                                        <Label
                                            htmlFor="modal_reg_name"
                                            className="text-xs font-bold text-slate-300"
                                        >
                                            {t('auth.mayor_name')}
                                        </Label>
                                        <Input
                                            id="modal_reg_name"
                                            name="name"
                                            type="text"
                                            required
                                            autoFocus
                                            placeholder={t('auth.mayor_name_ph')}
                                            className="rounded-xl border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600"
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-1">
                                        <Label
                                            htmlFor="modal_reg_email"
                                            className="text-xs font-bold text-slate-300"
                                        >
                                            {t('auth.email')}
                                        </Label>
                                        <Input
                                            id="modal_reg_email"
                                            name="email"
                                            type="email"
                                            required
                                            placeholder={t('auth.email_ph')}
                                            className="rounded-xl border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label
                                                htmlFor="modal_reg_password"
                                                className="text-xs font-bold text-slate-300"
                                            >
                                                {t('auth.password')}
                                            </Label>
                                            <PasswordInput
                                                id="modal_reg_password"
                                                name="password"
                                                required
                                                autoComplete="new-password"
                                                placeholder="••••••••"
                                                className="rounded-xl border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600"
                                            />
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="space-y-1">
                                            <Label
                                                htmlFor="modal_reg_password_confirmation"
                                                className="text-xs font-bold text-slate-300"
                                            >
                                                {t('auth.confirm')}
                                            </Label>
                                            <PasswordInput
                                                id="modal_reg_password_confirmation"
                                                name="password_confirmation"
                                                required
                                                autoComplete="new-password"
                                                placeholder="••••••••"
                                                className="rounded-xl border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600"
                                            />
                                            <InputError message={errors.password_confirmation} />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="mt-2 w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 py-3 text-xs font-black tracking-wider text-slate-950 uppercase shadow-xl shadow-amber-500/25 transition-all hover:from-amber-400 hover:to-yellow-300"
                                    >
                                        {processing ? (
                                            <Spinner className="mr-2 h-4 w-4" />
                                        ) : (
                                            <Play className="mr-2 h-3.5 w-3.5 fill-current" />
                                        )}
                                        {t('auth.found_metro')}
                                    </Button>
                                </>
                            )}
                        </Form>
                    ) : (
                        /* LOGIN FORM */
                        <Form
                            {...loginStore.form()}
                            resetOnSuccess={['password']}
                            disableWhileProcessing
                            className="space-y-3.5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="space-y-1">
                                        <Label
                                            htmlFor="modal_login_email"
                                            className="text-xs font-bold text-slate-300"
                                        >
                                            {t('auth.email')}
                                        </Label>
                                        <Input
                                            id="modal_login_email"
                                            name="email"
                                            type="email"
                                            required
                                            autoFocus
                                            placeholder={t('auth.email_ph')}
                                            className="rounded-xl border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <Label
                                                htmlFor="modal_login_password"
                                                className="text-xs font-bold text-slate-300"
                                            >
                                                {t('auth.password')}
                                            </Label>
                                        </div>
                                        <PasswordInput
                                            id="modal_login_password"
                                            name="password"
                                            required
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                            className="rounded-xl border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="modal_remember"
                                            name="remember"
                                        />
                                        <Label
                                            htmlFor="modal_remember"
                                            className="text-xs text-slate-400"
                                        >
                                            {t('auth.remember')}
                                        </Label>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="mt-2 w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 py-3 text-xs font-black tracking-wider text-slate-950 uppercase shadow-xl shadow-amber-500/25 transition-all hover:from-amber-400 hover:to-yellow-300"
                                    >
                                        {processing ? (
                                            <Spinner className="mr-2 h-4 w-4" />
                                        ) : (
                                            <Play className="mr-2 h-3.5 w-3.5 fill-current" />
                                        )}
                                        {t('auth.enter_metro')}
                                    </Button>
                                </>
                            )}
                        </Form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
