export type CanvasProfile = {
    role: number | null;
    username: string | null;
    summary: string | null;
    avatar: string | null;
    avatar_url: string;
    website: string | null;
    social: Record<string, string>;
    locale: string;
    timezone: string;
    theme: 'system' | 'light' | 'dark';
    digest: boolean;
    preferences: {
        onboarding: { complete: boolean };
    };
};

export type UserResource = {
    id: number;
    name: string;
    email: string;
    avatar_url: string;
    posts_count?: number;
    canvas?: CanvasProfile;
};

export type CanvasBoot = {
    path: string;
    languageCodes: string[];
    maxUpload: number;
    roles: Record<number, string>;
    timezone: string;
    translations: string;
    unsplash: string | null;
    version: string;
    user: UserResource;
};
