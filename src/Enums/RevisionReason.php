<?php

declare(strict_types=1);

namespace Canvas\Enums;

/**
 * Why a post content checkpoint was recorded (not stored as a DB column day one).
 */
enum RevisionReason: string
{
    case Origin = 'origin';
    case Published = 'published';
    case Scheduled = 'scheduled';
    case Unpublished = 'unpublished';
    case Updated = 'updated';
    case Manual = 'manual';
    /** Editor session ended (navigate away / close) with content to capture. */
    case Left = 'left';
    case Restored = 'restored';
}
