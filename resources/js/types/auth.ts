export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    locale?: 'en' | 'es';
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};
