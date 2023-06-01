<?php

declare(strict_types=1);

namespace Canvas\Models;

use Illuminate\Database\Eloquent\Model;

abstract class AbstractCanvasModel extends Model
{
    /**
     * Get the current connection name for the model.
     *
     * @return string
     */
    public function getConnectionName()
    {
        return config('canvas.database_connection');
    }
}
