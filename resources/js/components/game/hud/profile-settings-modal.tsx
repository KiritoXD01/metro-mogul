import { Form, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import AppearanceTabs from '@/components/appearance-tabs';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import ManagePasskeys from '@/components/manage-passkeys';
import type { Props as ManagePasskeysProps } from '@/components/manage-passkeys';
import ManageTwoFactor from '@/components/manage-two-factor';
import type { Props as ManageTwoFactorProps } from '@/components/manage-two-factor';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { logout } from '@/routes';
import { send } from '@/routes/verification';
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
} & ManagePasskeysProps &
    ManageTwoFactorProps;

const tabs: { value: SettingsTab; label: string; icon: typeof User }[] = [
    { value: 'profile', label: 'Profile', icon: User },
    { value: 'security', label: 'Security', icon: ShieldCheck },
    { value: 'appearance', label: 'Appearance', icon: Palette },
    { value: 'delete', label: 'Delete', icon: Trash2 },
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

    return (
        <div className="space-y-6">
            <ModalHeading
                title="Profile"
                description="Update your name and email address"
            />

            <Form
                {...ProfileController.update.form()}
                options={{
                    preserveScroll: true,
                }}
                onSuccess={() => toast.success('Profile updated.')}
                className="space-y-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="name" className={labelClassName}>
                                Name
                            </Label>

                            <Input
                                id="name"
                                className={inputClassName}
                                defaultValue={auth.user.name}
                                name="name"
                                required
                                autoComplete="name"
                                placeholder="Full name"
                            />

                            <InputError
                                className="mt-2"
                                message={errors.name}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email" className={labelClassName}>
                                Email address
                            </Label>

                            <Input
                                id="email"
                                type="email"
                                className={inputClassName}
                                defaultValue={auth.user.email}
                                name="email"
                                required
                                autoComplete="username"
                                placeholder="Email address"
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
                                        Your email address is unverified.{' '}
                                        <Link
                                            href={send()}
                                            as="button"
                                            className="text-indigo-300 underline decoration-slate-500 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current!"
                                        >
                                            Click here to re-send the
                                            verification email.
                                        </Link>
                                    </p>

                                    {status === 'verification-link-sent' && (
                                        <div className="mt-2 text-sm font-medium text-emerald-400">
                                            A new verification link has been
                                            sent to your email address.
                                        </div>
                                    )}
                                </div>
                            )}

                        <div className="flex items-center gap-4">
                            <Button
                                disabled={processing}
                                data-test="update-profile-button"
                            >
                                Save
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </div>
    );
}

function SecurityTab(
    props: ManagePasskeysProps &
        ManageTwoFactorProps & { passwordRules: string },
) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-8">
            <div className="space-y-6">
                <ModalHeading
                    title="Update password"
                    description="Ensure your account is using a long, random password to stay secure"
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
                    onSuccess={() => toast.success('Password updated.')}
                    className="space-y-6"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="current_password"
                                    className={labelClassName}
                                >
                                    Current password
                                </Label>

                                <PasswordInput
                                    id="current_password"
                                    ref={currentPasswordInput}
                                    name="current_password"
                                    className={inputClassName}
                                    autoComplete="current-password"
                                    placeholder="Current password"
                                />

                                <InputError message={errors.current_password} />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="password"
                                    className={labelClassName}
                                >
                                    New password
                                </Label>

                                <PasswordInput
                                    id="password"
                                    ref={passwordInput}
                                    name="password"
                                    className={inputClassName}
                                    autoComplete="new-password"
                                    placeholder="New password"
                                    passwordrules={props.passwordRules}
                                />

                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="password_confirmation"
                                    className={labelClassName}
                                >
                                    Confirm password
                                </Label>

                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    className={inputClassName}
                                    autoComplete="new-password"
                                    placeholder="Confirm password"
                                    passwordrules={props.passwordRules}
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
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <ManageTwoFactor
                canManageTwoFactor={props.canManageTwoFactor}
                requiresConfirmation={props.requiresConfirmation}
                twoFactorEnabled={props.twoFactorEnabled}
            />

            <ManagePasskeys
                canManagePasskeys={props.canManagePasskeys}
                passkeys={props.passkeys}
            />
        </div>
    );
}

function AppearanceTab() {
    return (
        <div className="space-y-6">
            <ModalHeading
                title="Appearance settings"
                description="Update the appearance settings for your account"
            />
            <AppearanceTabs />
        </div>
    );
}

export default function ProfileSettingsModal({
    mustVerifyEmail,
    status,
    passwordRules,
    canManageTwoFactor,
    canManagePasskeys,
    passkeys,
    twoFactorEnabled,
    requiresConfirmation,
    onClose,
}: ProfileSettingsModalProps) {
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
                                Mayor Settings
                            </h3>
                            <p className="text-[11px] text-slate-400">
                                Manage your profile and account settings
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                        aria-label="Close settings"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-6 flex gap-1 rounded-xl border border-slate-700/60 bg-slate-800/60 p-1">
                    {tabs.map(({ value, label, icon: Icon }) => (
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
                            <span className="hidden sm:inline">{label}</span>
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
                    <SecurityTab
                        passwordRules={passwordRules}
                        canManageTwoFactor={canManageTwoFactor}
                        requiresConfirmation={requiresConfirmation}
                        twoFactorEnabled={twoFactorEnabled}
                        canManagePasskeys={canManagePasskeys}
                        passkeys={passkeys}
                    />
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
                        Sign out
                    </Link>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-slate-700 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-slate-600"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
