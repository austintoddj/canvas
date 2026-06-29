declare global {
    interface Window {
        Canvas: {
            path: string;
            languageCodes: string[];
            maxUpload: number;
            roles: Record<number, string>;
            timezone: string;
            translations: string;
            unsplash: string | null;
            version: string;
            user: {
                id: string;
                name: string;
                email: string;
                avatar_url: string;
                posts_count?: number;
                canvas?: {
                    role: number | null;
                    username: string | null;
                    summary: string | null;
                    avatar: string | null;
                    avatar_url: string;
                    website: string | null;
                    social: Record<string, string>;
                    locale: string;
                    timezone: string;
                    dark_mode: boolean;
                    digest: boolean;
                    preferences: {
                        onboarding: {
                            complete: boolean;
                        };
                    };
                };
            };
        };
    }
}

export {};
