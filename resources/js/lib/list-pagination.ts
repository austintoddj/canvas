export function parsePageParam(searchParams: URLSearchParams): number {
    return Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
}

export function pageQueryParam(page: number): number | undefined {
    return page > 1 ? page : undefined;
}

export function paginationWindow(currentPage: number, lastPage: number): (number | 'gap')[] {
    if (lastPage <= 7) {
        return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, lastPage, currentPage, currentPage - 1, currentPage + 1]);
    const sorted = [...pages].filter((page) => page >= 1 && page <= lastPage).sort((a, b) => a - b);
    const result: (number | 'gap')[] = [];

    for (let index = 0; index < sorted.length; index += 1) {
        const page = sorted[index];
        const previous = sorted[index - 1];

        if (index > 0 && previous !== undefined && page - previous > 1) {
            result.push('gap');
        }

        result.push(page);
    }

    return result;
}

export function shouldGoToPreviousPageAfterDelete(itemCountOnPage: number, currentPage: number): boolean {
    return itemCountOnPage === 1 && currentPage > 1;
}
