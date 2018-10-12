<?php

namespace Canvas\Repositories\Eloquent;

abstract class EloquentAbstract
{
    protected $model;

    /**
     * Get all of the models from the database.
     *
     * @return \Illuminate\Database\Eloquent\Collection|static[]
     */
    public function all()
    {
        return $this->model->all();
    }

    /**
     * Find a model by ID.
     *
     * @param $id
     * @return \Illuminate\Database\Eloquent\Collection|static[]
     */
    public function find($id)
    {
        return $this->model->findOrFail($id);
    }

    /**
     * Save a new model and return the instance.
     *
     * @param array $data
     * @return \Illuminate\Database\Eloquent\Model|$this
     */
    public function create(array $data = [])
    {
        return $this->model->create($data);
    }

    /**
     * Update a record in the database.
     *
     * @param $id
     * @param array $data
     * @return mixed
     */
    public function update($id, array $data = [])
    {
        $object = $this->find($id);

        return $object->update($data);
    }

    /**
     * Delete a record from the database.
     *
     * @param $id
     * @return mixed
     */
    public function delete($id)
    {
        $object = $this->find($id);

        return $object->delete();
    }
}
