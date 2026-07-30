export type DiffPartType = 'equal' | 'added' | 'deleted';

export type DiffPart = {
    type: DiffPartType;
    value: string;
};

export type DiffStats = {
    /** Characters added (non-whitespace). */
    added: number;
    /** Characters deleted (non-whitespace). */
    deleted: number;
};

/**
 * Sum of non-whitespace characters marked added / deleted.
 * Used for GitHub-style +N −N badges next to Title / Body.
 */
export function computeDiffStats(before: string, after: string): DiffStats {
    const parts = computeTextDiff(before, after);
    let added = 0;
    let deleted = 0;

    for (const part of parts) {
        const units = countMeaningfulChars(part.value);

        if (part.type === 'added') {
            added += units;
        } else if (part.type === 'deleted') {
            deleted += units;
        }
    }

    return { added, deleted };
}

function countMeaningfulChars(value: string): number {
    return value.replace(/\s/g, '').length;
}

/**
 * Word-level text diff for green (added) / red (deleted) rendering.
 * Strip HTML first so TipTap bodies compare as readable text.
 */
export function computeTextDiff(before: string, after: string): DiffPart[] {
    const left = tokenize(stripHtml(before));
    const right = tokenize(stripHtml(after));

    if (left.length === 0 && right.length === 0) {
        return [];
    }

    if (left.length === 0) {
        return right.length === 0 ? [] : [{ type: 'added', value: right.join('') }];
    }

    if (right.length === 0) {
        return [{ type: 'deleted', value: left.join('') }];
    }

    const pairs = lcsPairs(left, right);
    const parts: DiffPart[] = [];
    let i = 0;
    let j = 0;
    let pairIndex = 0;

    while (i < left.length || j < right.length) {
        const pair = pairs[pairIndex];

        if (pair && pair.left === i && pair.right === j) {
            pushPart(parts, 'equal', left[i]);
            i += 1;
            j += 1;
            pairIndex += 1;
            continue;
        }

        if (pair && pair.left === i) {
            pushPart(parts, 'added', right[j]);
            j += 1;
            continue;
        }

        if (pair && pair.right === j) {
            pushPart(parts, 'deleted', left[i]);
            i += 1;
            continue;
        }

        if (!pair) {
            while (i < left.length) {
                pushPart(parts, 'deleted', left[i]);
                i += 1;
            }
            while (j < right.length) {
                pushPart(parts, 'added', right[j]);
                j += 1;
            }
            break;
        }

        if (pair.left > i) {
            pushPart(parts, 'deleted', left[i]);
            i += 1;
            continue;
        }

        pushPart(parts, 'added', right[j]);
        j += 1;
    }

    return parts;
}

/** Strip tags for plain-text comparison of HTML bodies. */
export function stripHtml(value: string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    return value
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+\n/g, '\n')
        .replace(/\n\s+/g, '\n')
        .trim();
}

function tokenize(text: string): string[] {
    if (text === '') {
        return [];
    }

    // Keep whitespace attached to the preceding word so joins stay readable.
    return text.match(/\S+\s*|\s+/g) ?? [text];
}

function pushPart(parts: DiffPart[], type: DiffPartType, value: string): void {
    const last = parts[parts.length - 1];

    if (last && last.type === type) {
        last.value += value;
        return;
    }

    parts.push({ type, value });
}

type LcsPair = { left: number; right: number };

/**
 * Longest common subsequence index pairs (greedy DP for moderate token counts).
 */
function lcsPairs(left: string[], right: string[]): LcsPair[] {
    const m = left.length;
    const n = right.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = m - 1; i >= 0; i -= 1) {
        for (let j = n - 1; j >= 0; j -= 1) {
            if (left[i] === right[j]) {
                dp[i][j] = dp[i + 1][j + 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
            }
        }
    }

    const pairs: LcsPair[] = [];
    let i = 0;
    let j = 0;

    while (i < m && j < n) {
        if (left[i] === right[j]) {
            pairs.push({ left: i, right: j });
            i += 1;
            j += 1;
        } else if (dp[i + 1][j] >= dp[i][j + 1]) {
            i += 1;
        } else {
            j += 1;
        }
    }

    return pairs;
}
