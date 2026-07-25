import { describe, expect, it } from 'vitest';

import {
    AI_PROVIDER_OPTIONS,
    integrationsAiMeta,
    modelIdForTier,
    modelTierLabel,
    resolveModelTier,
} from '@/lib/integrations/ai-providers';

describe('AI model presets', () => {
    it('ships Default / Fast / Expert presets for every provider', () => {
        for (const option of AI_PROVIDER_OPTIONS) {
            expect(option.presets.map((preset) => preset.tier)).toEqual(['auto', 'fast', 'expert']);
            expect(option.presets[0]?.labelKey).toBe('integrations.model_tier_auto');
            expect(option.presets[0]?.labelFallback).toBe('Default');
            expect(option.presets[0]?.model).toBeNull();
            expect(option.presets[1]?.model).toBe(option.defaultModel);
            expect(option.presets[2]?.model).toBe(option.expertModel);
        }
    });

    it('uses current non-retired xAI defaults', () => {
        const xai = AI_PROVIDER_OPTIONS.find((option) => option.value === 'xai');

        expect(xai?.defaultModel).toBe('grok-4.3');
        expect(xai?.expertModel).toBe('grok-4.5');
    });

    it('exposes developer website metadata for each provider', () => {
        for (const option of AI_PROVIDER_OPTIONS) {
            expect(option.developer.name.length).toBeGreaterThan(0);
            expect(option.developer.websiteUrl).toMatch(/^https:\/\//);
            expect(option.developer.websiteLabel.length).toBeGreaterThan(0);
        }
    });

    it('resolves stored overrides to tiers', () => {
        expect(resolveModelTier('xai', null)).toBe('auto');
        expect(resolveModelTier('xai', '')).toBe('auto');
        expect(resolveModelTier('xai', 'grok-4.3')).toBe('fast');
        expect(resolveModelTier('xai', 'grok-4.5')).toBe('expert');
        expect(resolveModelTier('xai', 'some-custom-model')).toBe('custom');
        expect(resolveModelTier('openai', 'gpt-4o-mini')).toBe('fast');
        expect(resolveModelTier('anthropic', 'claude-sonnet-5')).toBe('expert');
    });

    it('maps tiers back to model ids for save', () => {
        expect(modelIdForTier('xai', 'auto', '')).toBeNull();
        expect(modelIdForTier('xai', 'fast', '')).toBe('grok-4.3');
        expect(modelIdForTier('xai', 'expert', '')).toBe('grok-4.5');
        expect(modelIdForTier('xai', 'custom', '  my-model  ')).toBe('my-model');
        expect(modelIdForTier('xai', 'custom', '   ')).toBeNull();
        expect(modelIdForTier(null, 'fast', '')).toBeNull();
    });

    it('labels tiers without SKUs except Custom', () => {
        expect(modelTierLabel('xai', null)).toBe('Default');
        expect(modelTierLabel('xai', 'grok-4.3')).toBe('Fast');
        expect(modelTierLabel('xai', 'grok-4.5')).toBe('Expert');
        expect(modelTierLabel('xai', 'custom-sku')).toBe('Custom · custom-sku');

        expect(integrationsAiMeta('openai', null)).toBe('ChatGPT (OpenAI) · Default');
        expect(integrationsAiMeta('anthropic', 'claude-sonnet-5')).toBe('Claude (Anthropic) · Expert');
        expect(integrationsAiMeta('xai', 'weird-id')).toBe('Grok (xAI) · Custom · weird-id');
        expect(integrationsAiMeta(null, null)).toBeUndefined();
    });
});
