<?php

namespace Canvas\Models;

class Feed
{
    private $name;

    private $link;

    private $data = [];

    private $updated;

    public static function make()
    {
        return new self;
    }

    public function as($name)
    {
        $this->name = $name;

        return $this;
    }

    public function at($path)
    {
        $this->link = $path;

        return $this;
    }

    public function with($data)
    {
        $this->data = $data;

        return $this;
    }

    public function on($date)
    {
        $this->updated = $date;

        return $this;
    }

    public function get()
    {
        return collect([
            'name' => $this->name,
            'link' => $this->link,
            'data' => $this->data,
            'updated' => $this->updated,
        ])->toArray();
    }
}
