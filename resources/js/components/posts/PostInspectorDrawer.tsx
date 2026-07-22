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
    onDiscard?: () => void | Promise<void>;
    onUnpublish: () => void | Promise<void>;
    onChangeSchedule?: () => void;
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
    onDiscard,
    onUnpublish,
    onChangeSchedule,
    onDelete,
}: PostInspectorDrawerProps) {
    const { t } = useCanvas();
    const drawerTitle =
        section === 'seo' ? t('editor.seo_settings', 'SEO Settings') : t('editor.general_settings', 'General Settings');

    return (
        <SideDrawer open={open} onClose={onClose} title={drawerTitle}>
            <div
                className="sticky top-0 z-10 border-b border-canvas-border bg-canvas-panel px-5 py-3 dark:border-canvas-border-dark dark:bg-canvas-panel-dark"
                data-post-inspector-nav="true"
            >
                <PillNav value={section} onChange={onSectionChange} aria-label={drawerTitle} className="w-full">
                    <PillNavItem value="post" className="flex-1 justify-center">
                        {t('editor.inspector_post', 'General')}
                    </PillNavItem>
                    <PillNavItem value="seo" className="flex-1 justify-center">
                        {t('editor.seo')}
                    </PillNavItem>
                </PillNav>
            </div>

            {section === 'post' ? (
                <div className="min-w-0 space-y-6 overflow-x-hidden px-5 py-5" data-post-inspector-section="post">
                    <div className="min-w-0">
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

                    <div className="min-w-0">
                        <Heading level={3} className="text-base/7">
                            {t('editor.publishing_section', 'Publishing')}
                        </Heading>
                        <div className="mt-4 min-w-0">
                            <PublishPanel
                                form={form}
                                hasPendingChanges={hasPendingChanges}
                                disabled={disabled}
                                deleting={deleting}
                                onDiscard={onDiscard}
                                onUnpublish={onUnpublish}
                                onChangeSchedule={onChangeSchedule}
                                onDelete={onDelete}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="min-w-0 overflow-x-hidden px-5 py-5" data-post-inspector-section="seo">
                    <PostSeoPanel form={form} fieldErrors={fieldErrors} disabled={disabled} onChange={onChange} />
                </div>
            )}
        </SideDrawer>
    );
}
