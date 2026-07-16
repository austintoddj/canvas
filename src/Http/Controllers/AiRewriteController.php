<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Enums\AiWritingAction;
use Canvas\Exceptions\AiWritingException;
use Canvas\Http\Requests\AiRewriteRequest;
use Canvas\Support\Ai;
use Canvas\Support\AiWritingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class AiRewriteController extends Controller
{
    public function __invoke(AiRewriteRequest $request, AiWritingService $writer): JsonResponse
    {
        if (! Ai::configured()) {
            return response()->json([
                'error' => 'AI is not configured.',
                'code' => AiWritingException::CodeNotConfigured,
            ], 422);
        }

        // Allow provider I/O + one retry without hitting web max_execution_time fatals.
        if (function_exists('set_time_limit')) {
            set_time_limit(60);
        }

        /** @var string $action */
        $action = $request->input('action');
        /** @var string $text */
        $text = $request->input('text');
        /** @var string|null $instruction */
        $instruction = $request->input('instruction');
        /** @var string|null $title */
        $title = $request->input('title');

        $writingAction = AiWritingAction::from($action);

        try {
            $result = $writer->rewrite(
                $writingAction,
                $text,
                $instruction,
                $title,
            );
        } catch (AiWritingException $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'code' => $e->errorCode,
            ], 422);
        }

        if ($writingAction->isSeoSuggest() && is_array($result)) {
            return response()->json([
                'title' => $result['title'],
                'description' => $result['description'],
            ]);
        }

        return response()->json(['text' => $result]);
    }
}
