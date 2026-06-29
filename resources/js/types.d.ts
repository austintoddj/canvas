declare global {
    interface Window {
        Canvas: {
            path: string;
            user: {
                name: string;
                email: string;
                default_avatar: string;
            };
        };
    }
}

export {};
