<?php

namespace Canvas\Interfaces;

interface InterfaceAbstract
{
    /**
     * @return mixed
     */
    public function all();

    /**
     * @param $id
     * @return mixed
     */
    public function find($id);

    /**
     * @param array $data
     * @return mixed
     */
    public function create(array $data = []);

    /**
     * @param $id
     * @param array $data
     * @return mixed
     */
    public function update($id, array $data = []);

    /**
     * @param $id
     * @return mixed
     */
    public function delete($id);
}
