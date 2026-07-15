<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Enums\AiWritingAction;
use Canvas\Http\Requests\AiRewriteRequest;
use Canvas\Support\Ai;
use Canvas\Support\AiWritingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use RuntimeException;

class AiRewriteController extends Controller
{
    public function __invoke(AiRewriteRequest $request, AiWritingService $writer): JsonResponse
    {
        if (! Ai::configured()) {
            return response()->json(['error' => 'AI is not configured.'], 422);
        }

        /** @var string $action */
        $action = $request->input('action');
        /** @var string $text */
        $text = $request->input('text');
        /** @var string|null $instruction */
        $instruction = $request->input('instruction');
        /** @var string|null $title */
        $title = $request->input('title');

        try {
            $result = $writer->rewrite(
                AiWritingAction::from($action),
                $text,
                $instruction,
                $title,
            );
        } catch (RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json(['text' => $result]);
    }
}
