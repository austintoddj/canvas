import type { CanvasProfile, UserResource } from '@/types/boot';

export type PaginatedLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    first_page_url: string;
    last_page_url: string;
    next_page_url: string | null;
    prev_page_url: string | null;
    path: string;
    links: PaginatedLink[];
};

export type PostMeta = {
    title?: string;
    description?: string;
    canonical_link?: string;
};

export type TaxonomyOption = {
    name: string;
    slug: string;
};

export type PostListItem = {
    id: string;
    title: string | null;
    summary: string | null;
    featured_image: string | null;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    views_count: number;
    /** Live snapshot has unpublished editor changes waiting to be promoted. */
    has_pending_changes?: boolean;
};

export type PostPending = {
    title?: string;
    slug?: string;
    summary?: string | null;
    body?: string | null;
    featured_image?: string | null;
    featured_image_caption?: string | null;
    meta?: PostMeta | null;
    tags?: TaxonomyOption[];
    topic?: TaxonomyOption | null;
};

/** Display-only author on post show/store responses (never written back). */
export type PostAuthor = {
    id: number;
    name: string | null;
    username: string | null;
    avatar_url: string | null;
};

export type Post = PostListItem & {
    slug: string;
    body: string | null;
    featured_image_caption: string | null;
    user_id: number | null;
    topic_id: string | null;
    meta: PostMeta | null;
    pending?: PostPending | null;
    has_pending_changes?: boolean;
    read_time?: string;
    tags?: TaxonomyOption[];
    topic?: TaxonomyOption & { id: string };
    /** Present on show/store/discard; omit from list rows. */
    user?: PostAuthor | null;
};

export type PostsIndexResponse = {
    posts: Paginated<PostListItem>;
    draftCount: number;
    publishedCount: number;
};

export type PostCreateResponse = {
    post: Pick<Post, 'id' | 'slug'>;
    tags: TaxonomyOption[];
    topics: TaxonomyOption[];
};

export type PostShowResponse = {
    post: Post;
    tags: TaxonomyOption[];
    topics: TaxonomyOption[];
};

export type PostStorePayload = {
    slug: string;
    title: string;
    summary?: string | null;
    body?: string | null;
    /** Absolute ISO-8601 instant with Z/offset, or null. */
    published_at?: string | null;
    featured_image?: string | null;
    featured_image_caption?: string | null;
    meta?: PostMeta | null;
    tags?: TaxonomyOption[];
    topic?: TaxonomyOption[];
    /** When true on a live post, write the public snapshot and clear pending. */
    promote?: boolean;
    /** Schedule for a future published_at (server requires after:now). */
    schedule?: boolean;
    /** Server stamps published_at = now(); client published_at is ignored. */
    publish_now?: boolean;
};

export type MonthOverMonth = {
    direction: 'up' | 'down';
    percentage: string;
    /** False when the prior period has no baseline (avoids nonsense % growth). */
    comparable: boolean;
};

export type PostStatsResponse = {
    post: Post;
    readTime: string;
    popularReadingTimes: Record<string, string>;
    topReferers: Record<string, number>;
    topBrowsers: Record<string, number>;
    monthlyViews: number;
    totalViews: number;
    monthlyVisits: number;
    monthOverMonthViews: MonthOverMonth;
    monthOverMonthVisits: MonthOverMonth;
    graph: {
        views: string;
        visits: string;
    };
};

export type PostsIndexParams = {
    type?: 'draft';
    scope?: 'user' | 'all';
    page?: number;
};

/** Display-only uploader on media show/store responses. */
export type MediaUploader = {
    id: number;
    name: string | null;
    username: string | null;
    avatar_url: string | null;
};

export type Media = {
    id: string;
    user_id: number;
    path: string;
    filename: string;
    original_name: string | null;
    mime_type: string;
    size: number;
    width: number | null;
    height: number | null;
    alt: string | null;
    caption: string | null;
    url: string;
    type: string | null;
    created_at: string;
    updated_at: string;
    /** Present on show/store/update; omit from list rows. */
    user?: MediaUploader | null;
};

export type MediaCreateResponse = {
    id: string;
};

export type MediaUpdatePayload = {
    alt?: string | null;
    caption?: string | null;
    original_name?: string | null;
};

export type MediaStoreOptions = {
    alt?: string | null;
    caption?: string | null;
    original_name?: string | null;
};

export type MediaIndexParams = {
    scope?: 'user' | 'all';
    search?: string;
    mime?: string;
    /** Default is newest (created_at desc). Only send when oldest. */
    sort?: 'newest' | 'oldest';
    page?: number;
};

export type UserCreateResponse = {
    canvas: CanvasProfile;
};

export type UserLookupResult = {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    has_canvas_access: boolean;
    role: number | null;
};

export type UserLookupParams = {
    q: string;
};

export type UserStorePayload = {
    username?: string | null;
    summary?: string | null;
    avatar?: string | null;
    website?: string | null;
    social?: Record<string, string> | null;
    locale?: string | null;
    timezone?: string | null;
    theme?: 'system' | 'light' | 'dark' | null;
    digest?: boolean | null;
    preferences?: Record<string, unknown> | null;
    role?: number | null;
};

export type UserStoreResponse = {
    user: UserResource;
};

export type UsersIndexParams = {
    page?: number;
};

export type UserPostsParams = {
    page?: number;
};

export type DashboardLibrary = {
    published: number;
    drafts: number;
    scheduled: number;
    pending_updates: number;
};

export type DashboardPipelinePost = {
    id: string;
    title: string;
    published_at: string | null;
    updated_at: string;
};

export type DashboardPipeline = {
    drafts: DashboardPipelinePost[];
    scheduled: DashboardPipelinePost[];
    pending: DashboardPipelinePost[];
};

export type DashboardRecentPost = PostListItem;

export type DashboardTopPost = {
    id: string;
    title: string;
    views: number;
};

export type DashboardInsights = {
    views: number;
    visits: number;
    /** Resolved analytics window in days (7 | 30 | 90 | 365). */
    days?: number;
    graph: {
        views: string;
        visits: string;
    };
    monthOverMonthViews: MonthOverMonth;
    monthOverMonthVisits: MonthOverMonth;
    topReferers: Record<string, number>;
    library: DashboardLibrary;
    pipeline: DashboardPipeline;
    recent_posts: DashboardRecentPost[];
    top_posts: DashboardTopPost[];
};

export type DashboardRangeDays = 7 | 30 | 90 | 365;

export type StatsIndexParams = {
    scope?: 'user' | 'all';
    days?: DashboardRangeDays;
};

export type PostSearchResult = {
    id: string;
    title: string;
    type: 'Post';
    route: 'edit-post';
};

export type TagSearchResult = {
    id: string;
    name: string;
    type: 'Tag';
    route: 'edit-tag';
};

export type TopicSearchResult = {
    id: string;
    name: string;
    type: 'Topic';
    route: 'edit-topic';
};

export type UserSearchResult = {
    id: number;
    name: string;
    email: string;
    username: string | null;
    avatar_url: string | null;
    type: 'User';
    route: 'edit-user';
};

export type SearchResult = PostSearchResult | TagSearchResult | TopicSearchResult | UserSearchResult;

export type SearchParams = {
    q?: string;
    type?: 'post' | 'tag' | 'topic' | 'user';
};

export type Tag = {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    posts_count?: number;
};

export type TagCreateResponse = {
    id: string;
};

export type TagStorePayload = {
    name: string;
    slug: string;
};

export type TagsIndexParams = {
    page?: number;
    search?: string;
    sort?: 'newest' | 'posts' | 'name';
};

export type TagPostsParams = {
    page?: number;
};

export type Topic = {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    posts_count?: number;
};

export type TopicCreateResponse = {
    id: string;
};

export type TopicStorePayload = {
    name: string;
    slug: string;
};

export type TopicsIndexParams = {
    page?: number;
    search?: string;
    sort?: 'newest' | 'posts' | 'name';
};

export type TopicPostsParams = {
    page?: number;
};

export type UnsplashPhotoUrls = {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
};

export type UnsplashPhoto = {
    id: string;
    width: number;
    height: number;
    urls: UnsplashPhotoUrls;
    alt_description: string | null;
    description: string | null;
    user: {
        name: string;
        links: { html: string };
    };
};

export type UnsplashSearchResponse = {
    total: number;
    total_pages: number;
    results: UnsplashPhoto[];
};

export type UnsplashErrorResponse = {
    error: string;
};

export type UnsplashParams = {
    query?: string;
    page?: number;
    per_page?: number;
};

export function searchResultLabel(result: SearchResult): string {
    return result.type === 'Post' ? result.title : result.name;
}

export function searchResultPath(result: SearchResult): string {
    switch (result.route) {
        case 'edit-post':
            return `/posts/${result.id}`;
        case 'edit-tag':
            return `/organize?tab=tags&detail=${encodeURIComponent(result.id)}`;
        case 'edit-topic':
            return `/organize?tab=topics&detail=${encodeURIComponent(result.id)}`;
        case 'edit-user':
            return `/users?detail=${encodeURIComponent(String(result.id))}`;
    }
}
