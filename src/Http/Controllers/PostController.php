<?php

namespace Canvas\Http\Controllers;

use Exception;
use Illuminate\View\View;
use Canvas\Interfaces\TagInterface;
use Canvas\Interfaces\PostInterface;
use Illuminate\Http\RedirectResponse;
use Canvas\Http\Requests\Posts\CreateRequest;

class PostController extends Controller
{
    /**
     * @var PostInterface
     */
    protected $postInterface;

    /**
     * @var TagInterface
     */
    protected $tagInterface;

    /**
     * PostController constructor.
     *
     * @param PostInterface $postInterface
     * @param TagInterface $tagInterface
     */
    public function __construct(PostInterface $postInterface, TagInterface $tagInterface)
    {
        parent::__construct();
        $this->postInterface = $postInterface;
        $this->tagInterface = $tagInterface;
    }

    /**
     * Show all the posts.
     *
     * @return View
     */
    public function index(): View
    {
        $data = [
            'posts' => $this->postInterface->getByUserId(auth()->user()->id)->sortByDesc('created_at'),
        ];

        return view('canvas::canvas.posts.index', compact('data'));
    }

    /**
     * Show the new post creation page.
     *
     * @return View
     */
    public function create(): View
    {
        $data = [
            'tags' => $this->tagInterface->all(),
        ];

        return view('canvas::canvas.posts.create', compact('data'));
    }

    /**
     * @param CreateRequest $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(CreateRequest $request): RedirectResponse
    {
        try {
            $this->postInterface->create($request->all());

            return back()->with('success', 'Post has been created');
        } catch (Exception $e) {
            return back()->with('error', 'Post has not been created');
        }
    }
}
