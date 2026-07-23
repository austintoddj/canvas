import { Subheading } from '@/components/heading';
import { Text } from '@/components/text';
import { resolveMediaUrl } from '@/lib/media/list';
import { resolvePostSeo, type PostSeoInput } from '@/lib/seo';

type SeoPreviewProps = {
    post: PostSeoInput;
};

function SerpPreview({ post }: SeoPreviewProps) {
    const seo = resolvePostSeo(post);
    let hostname = 'example.com';

    try {
        hostname = new URL(seo.canonicalUrl).hostname;
    } catch {
        // Keep fallback hostname for invalid preview URLs.
    }

    return (
        <div className="min-w-0 overflow-hidden rounded-lg border border-zinc-950/10 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03] dark:ring-1 dark:ring-white/5">
            <Text className="truncate text-xs text-canvas-muted dark:text-canvas-muted-dark">{hostname}</Text>
            <p className="mt-1 break-all text-base text-blue-700 dark:text-blue-400">{seo.canonicalUrl}</p>
            <p className="mt-1 line-clamp-1 break-words text-lg text-blue-800 dark:text-blue-300">{seo.title}</p>
            <p className="mt-1 line-clamp-2 break-words text-sm text-zinc-600 dark:text-zinc-300">{seo.description}</p>
        </div>
    );
}

function SocialPreview({ post }: SeoPreviewProps) {
    const seo = resolvePostSeo(post);

    return (
        <div className="min-w-0 overflow-hidden rounded-lg border border-zinc-950/10 bg-white dark:border-white/10 dark:bg-white/[0.03] dark:ring-1 dark:ring-white/5">
            {seo.imageUrl ? (
                <img
                    src={resolveMediaUrl(seo.imageUrl)}
                    alt={seo.imageAlt}
                    className="aspect-[1.91/1] w-full max-w-full object-cover"
                />
            ) : (
                <div className="flex aspect-[1.91/1] items-center justify-center bg-zinc-100 text-sm text-zinc-500 dark:bg-white/[0.04] dark:text-zinc-400">
                    No image selected
                </div>
            )}
            <div className="min-w-0 space-y-1 p-3">
                <Text className="line-clamp-1 break-all text-xs uppercase tracking-wide text-canvas-muted dark:text-canvas-muted-dark">
                    {(() => {
                        try {
                            return new URL(seo.canonicalUrl).hostname;
                        } catch {
                            return 'example.com';
                        }
                    })()}
                </Text>
                <p className="line-clamp-2 break-words text-sm font-semibold text-zinc-950 dark:text-white">
                    {seo.title}
                </p>
                <p className="line-clamp-2 break-words text-xs text-zinc-600 dark:text-zinc-300">{seo.description}</p>
            </div>
        </div>
    );
}

export default function SeoPreview({ post }: SeoPreviewProps) {
    return (
        <div className="space-y-4">
            <div>
                <Subheading level={4} className="text-sm/6">
                    Search preview
                </Subheading>
                <div className="mt-2">
                    <SerpPreview post={post} />
                </div>
            </div>

            <div>
                <Subheading level={4} className="text-sm/6">
                    Social preview
                </Subheading>
                <div className="mt-2">
                    <SocialPreview post={post} />
                </div>
            </div>
        </div>
    );
}
