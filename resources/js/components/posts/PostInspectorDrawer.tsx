import FeaturedImagePicker from '@/components/posts/FeaturedImagePicker';
import PostSeoPanel from '@/components/posts/PostSeoPanel';
import PostSidebar from '@/components/posts/PostSidebar';
import PublishPanel from '@/components/posts/PublishPanel';
import { Divider } from '@/components/divider';
import { Heading } from '@/components/heading';
import { PillNav, PillNavItem } from '@/components/pill-nav';
import { SideDrawer } from '@/components/SideDrawer';
import { PageDescription } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import type { LaravelValidationErrors } from '@/lib/api';
import type { PostFormState } from '@/lib/posts/form';
import type { TaxonomyOption } from '@/types/api';

export type PostInspectorSection = 'post' | 'seo';

type PostInspectorDrawerProps = {
    open: boolean;
    section: PostInspectorSection;
    onClose: () => void;
    onSectionChange: (section: PostInspectorSection) => void;
    form: PostFormState;
    onChange: (form: PostFormState) => void;
    availableTags: TaxonomyOption[];
    availableTopics: TaxonomyOption[];
    fieldErrors: LaravelValidationErrors;
    disabled?: boolean;
    hasPendingChanges?: boolean;
    deleting?: boolean;
    onSlugManualEdit?: () => void;
    onPublish: () => void | Promise<void>;
    onUpdate?: () => void | Promise<void>;
    onDiscard?: () => void | Promise<void>;
    onSchedule: (datetimeLocal: string) => void | Promise<void>;
    onUnpublish: () => void | Promise<void>;
    onDelete?: () => void;
};

export default function PostInspectorDrawer({
    open,
    section,
    onClose,
    onSectionChange,
    form,
    onChange,
    availableTags,
    availableTopics,
    fieldErrors,
    disabled = false,
    hasPendingChanges = false,
    deleting = false,
    onSlugManualEdit,
    onPublish,
    onUpdate,
    onDiscard,
    onSchedule,
    onUnpublish,
    onDelete,
}: PostInspectorDrawerProps) {
    const { t } = useCanvas();

    return (
        <SideDrawer open={open} onClose={onClose} title={t('editor.post_settings')}>
            <div
                className="sticky top-0 z-10 border-b border-canvas-border bg-canvas-panel px-5 py-3 dark:border-canvas-border-dark dark:bg-canvas-panel-dark"
                data-post-inspector-nav="true"
            >
                <PillNav
                    value={section}
                    onChange={onSectionChange}
                    aria-label={t('editor.post_settings')}
                    className="w-full"
                >
                    <PillNavItem value="post" className="flex-1 justify-center">
                        {t('editor.inspector_post', 'Post')}
                    </PillNavItem>
                    <PillNavItem value="seo" className="flex-1 justify-center">
                        {t('editor.seo')}
                    </PillNavItem>
                </PillNav>
            </div>

            {section === 'post' ? (
                <div className="min-w-0 space-y-6 overflow-x-hidden px-5 py-5" data-post-inspector-section="post">
                    <div className="min-w-0">
                        <Heading level={3} className="text-base/7">
                            {t('editor.details')}
                        </Heading>
                        <PageDescription>{t('editor.details_help')}</PageDescription>
                        <div className="mt-4 min-w-0">
                            <PostSidebar
                                form={form}
                                availableTags={availableTags}
                                availableTopics={availableTopics}
                                fieldErrors={fieldErrors}
                                disabled={disabled}
                                onChange={onChange}
                                onSlugManualEdit={onSlugManualEdit}
                            />
                        </div>
                    </div>

                    <Divider soft />

                    <div className="min-w-0">
                        <Heading level={3} className="text-base/7">
                            {t('editor.featured_image')}
                        </Heading>
                        <PageDescription>{t('editor.featured_image_help')}</PageDescription>
                        <div className="mt-4 min-w-0">
                            <FeaturedImagePicker form={form} disabled={disabled} onChange={onChange} />
                        </div>
                    </div>

                    <Divider soft />

                    <PublishPanel
                        form={form}
                        hasPendingChanges={hasPendingChanges}
                        disabled={disabled}
                        deleting={deleting}
                        onPublish={onPublish}
                        onUpdate={onUpdate}
                        onDiscard={onDiscard}
                        onSchedule={onSchedule}
                        onUnpublish={onUnpublish}
                        onDelete={onDelete}
                    />
                </div>
            ) : (
                <div className="min-w-0 overflow-x-hidden px-5 py-5" data-post-inspector-section="seo">
                    <PostSeoPanel form={form} fieldErrors={fieldErrors} disabled={disabled} onChange={onChange} />
                </div>
            )}
        </SideDrawer>
    );
}
