@if ($paginator->hasPages())
    <nav role="navigation" aria-label="Pagination" class="flex items-center justify-between gap-4 text-sm">
        <div>
            @if ($paginator->onFirstPage())
                <span class="text-gray-300 cursor-not-allowed">&larr; Previous</span>
            @else
                <a href="{{ $paginator->previousPageUrl() }}"
                   class="text-gray-500 hover:text-gray-700">&larr; Previous</a>
            @endif
        </div>

        <span class="text-gray-400">
            {{ $paginator->currentPage() }} / {{ $paginator->lastPage() }}
        </span>

        <div>
            @if ($paginator->hasMorePages())
                <a href="{{ $paginator->nextPageUrl() }}"
                   class="text-gray-500 hover:text-gray-700">Next &rarr;</a>
            @else
                <span class="text-gray-300 cursor-not-allowed">Next &rarr;</span>
            @endif
        </div>
    </nav>
@endif