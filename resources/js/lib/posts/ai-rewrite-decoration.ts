import { Extension } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export type AiRewriteDecorationPhase = 'pending' | 'settled' | null;

export type AiRewriteDecorationState = {
    from: number;
    to: number;
    phase: Exclude<AiRewriteDecorationPhase, null>;
};

export const AI_REWRITE_PENDING_CLASS = 'canvas-ai-rewrite-pending';
export const AI_REWRITE_SETTLED_CLASS = 'canvas-ai-rewrite-settled';
export const AI_REWRITE_SETTLE_MS = 750;

/** SEO / form field shimmer — same tokens as body rewrite, applied to control wrappers. */
export const AI_FIELD_PENDING_CLASS = 'canvas-ai-field-pending';
export const AI_FIELD_SETTLED_CLASS = 'canvas-ai-field-settled';

export const aiRewriteDecorationKey = new PluginKey<AiRewriteDecorationState | null>('canvasAiRewriteDecoration');

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        aiRewriteDecoration: {
            setAiRewriteDecoration: (
                from: number,
                to: number,
                phase: Exclude<AiRewriteDecorationPhase, null>
            ) => ReturnType;
            clearAiRewriteDecoration: () => ReturnType;
        };
    }
}

function decorationSet(doc: ProseMirrorNode, state: AiRewriteDecorationState | null): DecorationSet {
    if (state === null || state.from >= state.to) {
        return DecorationSet.empty;
    }

    const max = doc.content.size;
    const from = Math.max(0, Math.min(state.from, max));
    const to = Math.max(from, Math.min(state.to, max));

    if (from >= to) {
        return DecorationSet.empty;
    }

    const className = state.phase === 'pending' ? AI_REWRITE_PENDING_CLASS : AI_REWRITE_SETTLED_CLASS;

    return DecorationSet.create(doc, [
        Decoration.inline(from, to, {
            class: className,
        }),
    ]);
}

/**
 * ProseMirror decorations for AI rewrite pending shimmer and settle fade.
 * Controlled via editor commands — not a mark stored in the document.
 */
export const AiRewriteDecoration = Extension.create({
    name: 'aiRewriteDecoration',

    addCommands() {
        return {
            setAiRewriteDecoration:
                (from, to, phase) =>
                ({ tr, dispatch }) => {
                    if (dispatch) {
                        tr.setMeta(aiRewriteDecorationKey, { from, to, phase } satisfies AiRewriteDecorationState);
                        dispatch(tr);
                    }

                    return true;
                },
            clearAiRewriteDecoration:
                () =>
                ({ tr, dispatch }) => {
                    if (dispatch) {
                        tr.setMeta(aiRewriteDecorationKey, null);
                        dispatch(tr);
                    }

                    return true;
                },
        };
    },

    addProseMirrorPlugins() {
        return [
            new Plugin<AiRewriteDecorationState | null>({
                key: aiRewriteDecorationKey,
                state: {
                    init: () => null,
                    apply(tr, value) {
                        const meta = tr.getMeta(aiRewriteDecorationKey) as AiRewriteDecorationState | null | undefined;

                        if (meta !== undefined) {
                            return meta;
                        }

                        if (value === null || !tr.docChanged) {
                            return value;
                        }

                        return {
                            from: tr.mapping.map(value.from),
                            to: tr.mapping.map(value.to),
                            phase: value.phase,
                        };
                    },
                },
                props: {
                    decorations(state) {
                        const value = aiRewriteDecorationKey.getState(state) ?? null;

                        return decorationSet(state.doc, value);
                    },
                },
            }),
        ];
    },
});

/** Map a plain-text insert over a selection into the resulting document range. */
export function rangeAfterPlainTextReplace(from: number, nextText: string): { from: number; to: number } {
    return { from, to: from + nextText.length };
}
