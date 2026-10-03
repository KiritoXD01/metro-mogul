import { Form, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import AppearanceTabs from '@/components/appearance-tabs';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import LanguageSwitcher from '@/components/language-switcher';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { logout } from '@/routes';
import { send } from '@/routes/verification';
import { useTranslation } from '@/hooks/use-translation';
import type { Auth } from '@/types';
import {
    Crown,
    LogOut,
    Palette,
    ShieldCheck,
    Trash2,
    User,
    X,
} from 'lucide-react';

type SettingsTab = 'profile' | 'security' | 'appearance' | 'delete';

type ProfileSettingsModalProps = {
    mustVerifyEmail: boolean;
    status?: string;
    passwordRules: string;
    onClose: () => void;
};

const tabs: { value: SettingsTab; labelKey: string; icon: typeof User }[] = [
    { value: 'profile', labelKey: 'settings.tab_profile', icon: User },
    { value: 'security', labelKey: 'settings.tab_security', icon: ShieldCheck },
    { value: 'appearance', labelKey: 'settings.tab_appearance', icon: Palette },
    { value: 'delete', labelKey: 'settings.tab_delete', icon: Trash2 },
];

const inputClassName =
    'mt-1 block w-full border-slate-700 bg-slate-800 text-white placeholder:text-slate-500';
const labelClassName = 'text-slate-200';

function ModalHeading({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="mb-4">
            <h4 className="text-base font-bold text-white">{title}</h4>
            <p className="text-xs text-slate-400">{description}</p>
        </div>
    );
}

function ProfileTab({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            <ModalHeading
                title={t('settings.profile')}
                description={t('settings.profile_desc')}
            />

            <Form
                {...ProfileController.update.form()}
                options={{
                    preserveScroll: true,
                }}
                onSuccess={() => toast.success(t('settings.profile_updated'))}
                className="space-y-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="name" className={labelClassName}>
                                {t('settings.name')}
                            </Label>

                            <Input
                                id="name"
                                className={inputClassName}
                                defaultValue={auth.user.name}
                                name="name"
                                required
                                autoComplete="name"
                                placeholder={t('settings.full_name')}
                            />

                            <InputError
                                className="mt-2"
                                message={errors.name}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email" className={labelClassName}>
                                {t('settings.email_address')}
                            </Label>

                            <Input
                                id="email"
                                type="email"
                                className={inputClassName}
                                defaultValue={auth.user.email}
                                name="email"
                                required
                                autoComplete="username"
                                placeholder={t('settings.email_address')}
                            />

                            <InputError
                                className="mt-2"
                                message={errors.email}
                            />
                        </div>

                        {mustVerifyEmail &&
                            auth.user.email_verified_at === null && (
                                <div>
                                    <p className="-mt-4 text-sm text-slate-400">
                                        {t('settings.unverified')}{' '}
                                        <Link
                                            href={send()}
                                            as="button"
                                            className="text-indigo-300 underline decoration-slate-500 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current!"
                                        >
                                            {t('settings.resend')}
                                        </Link>
                                    </p>

                                    {status === 'verification-link-sent' && (
                                        <div className="mt-2 text-sm font-medium text-emerald-400">
                                            {t('settings.link_sent')}
                                        </div>
                                    )}
                                </div>
                            )}

                        <div className="flex items-center gap-4">
                            <Button
                                disabled={processing}
                                data-test="update-profile-button"
                            >
                                {t('settings.save')}
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </div>
    );
}

function SecurityTab({ passwordRules }: { passwordRules: string }) {
    const { t } = useTranslation();
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-8">
            <div className="space-y-6">
                <ModalHeading
                    title={t('settings.update_password')}
                    description={t('settings.update_password_desc')}
                />

                <Form
                    {...SecurityController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    resetOnError={[
                        'password',
                        'password_confirmation',
                        'current_password',
                    ]}
                    resetOnSuccess
                    onError={(errors) => {
                        if (errors.password) {
                            passwordInput.current?.focus();
                        }

                        if (errors.current_password) {
                            currentPasswordInput.current?.focus();
                        }
                    }}
                    onSuccess={() => toast.success(t('settings.password_updated'))}
                    className="space-y-6"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="current_password"
                                    className={labelClassName}
                                >
                                    {t('settings.current_password')}
                                </Label>

                                <PasswordInput
                                    id="current_password"
                                    ref={currentPasswordInput}
                                    name="current_password"
                                    className={inputClassName}
                                    autoComplete="current-password"
                                    placeholder={t('settings.current_password')}
                                />

                                <InputError message={errors.current_password} />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="password"
                                    className={labelClassName}
                                >
                                    {t('settings.new_password')}
                                </Label>

                                <PasswordInput
                                    id="password"
                                    ref={passwordInput}
                                    name="password"
                                    className={inputClassName}
                                    autoComplete="new-password"
                                    placeholder={t('settings.new_password')}
                                    passwordrules={passwordRules}
                                />

                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="password_confirmation"
                                    className={labelClassName}
                                >
                                    {t('settings.confirm_password')}
                                </Label>

                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    className={inputClassName}
                                    autoComplete="new-password"
                                    placeholder={t('settings.confirm_password')}
                                    passwordrules={passwordRules}
                                />

                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-password-button"
                                >
                                    {t('settings.save')}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </div>
    );
}

function AppearanceTab() {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            <ModalHeading
                title={t('settings.appearance')}
                description={t('settings.appearance_desc')}
            />
            <AppearanceTabs />
            <div className="space-y-3">
                <ModalHeading
                    title={t('settings.language')}
                    description={t('settings.language_desc')}
                />
                <LanguageSwitcher />
            </div>
        </div>
    );
}

export default function ProfileSettingsModal({
    mustVerifyEmail,
    status,
    passwordRules,
    onClose,
}: ProfileSettingsModalProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div
            className="dark fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-2 font-bold text-slate-950 shadow-md">
                            <Crown className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">
                                {t('settings.mayor_settings')}
                            </h3>
                            <p className="text-[11px] text-slate-400">
                                {t('settings.manage_desc')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                        aria-label={t('settings.close')}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-6 flex gap-1 rounded-xl border border-slate-700/60 bg-slate-800/60 p-1">
                    {tabs.map(({ value, labelKey, icon: Icon }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setActiveTab(value)}
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                                activeTab === value
                                    ? 'bg-slate-700 text-white shadow'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{t(labelKey)}</span>
                        </button>
                    ))}
                </div>

                {activeTab === 'profile' && (
                    <ProfileTab
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                    />
                )}

                {activeTab === 'security' && (
                    <SecurityTab passwordRules={passwordRules} />
                )}

                {activeTab === 'appearance' && <AppearanceTab />}

                {activeTab === 'delete' && <DeleteUser />}

                <div className="mt-6 flex items-center justify-between border-t border-slate-700/60 pt-4">
                    <Link
                        href={logout()}
                        as="button"
                        onClick={() => router.flushAll()}
                        data-test="logout-button"
                        className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-400 transition-all hover:bg-slate-800 hover:text-rose-300"
                    >
                        <LogOut className="h-4 w-4" />
                        {t('settings.sign_out')}
                    </Link>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-slate-700 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-slate-600"
                    >
                        {t('settings.done')}
                    </button>
                </div>
            </div>
        </div>
    );
}
