<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    public function index()
    {
        $posts = Post::with(['user', 'comments.user'])
            ->withCount('likes', 'comments')
            ->latest()
            ->paginate(20);

        $posts->getCollection()->transform(function ($post) {
            return $this->formatPost($post);
        });

        return response()->json($posts);
    }

    public function store(Request $request)
    {
        $request->validate([
            'caption' => 'nullable|string|max:2000',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:51200',
        ]);

        $imagePath = $request->file('image')->store('posts', 'public');

        $post = Post::create([
            'user_id' => $request->user()->id,
            'caption' => $request->caption,
            'image_path' => $imagePath,
        ]);

        $post->load(['user', 'comments.user']);

        return response()->json([
            'message' => 'Post created successfully',
            'post' => $this->formatPost($post),
        ], 201);
    }

    public function show(Post $post)
    {
        $post->load(['user', 'comments.user'])
            ->loadCount('likes', 'comments');

        return response()->json([
            'post' => $this->formatPost($post),
        ]);
    }

    public function update(Request $request, Post $post)
    {
        $this->authorize('update', $post);

        $request->validate([
            'caption' => 'nullable|string|max:2000',
        ]);

        $post->update([
            'caption' => $request->caption,
        ]);

        return response()->json([
            'message' => 'Post updated successfully',
            'post' => $this->formatPost($post),
        ]);
    }

    public function destroy(Post $post)
    {
        $this->authorize('delete', $post);

        if ($post->image_path) {
            Storage::disk('public')->delete($post->image_path);
        }

        $post->delete();

        return response()->json([
            'message' => 'Post deleted successfully',
        ]);
    }

    public function userPosts($userId)
    {
        $posts = Post::where('user_id', $userId)
            ->with(['user', 'comments.user'])
            ->withCount('likes', 'comments')
            ->latest()
            ->paginate(20);

        $posts->getCollection()->transform(function ($post) {
            return $this->formatPost($post);
        });

        return response()->json($posts);
    }

    private function formatPost($post)
    {
        $user = auth('sanctum')->user();
        
        return [
            'id' => $post->id,
            'caption' => $post->caption,
            'image_url' => url('storage/' . $post->image_path),
            'likes_count' => $post->likes_count ?? $post->likes()->count(),
            'comments_count' => $post->comments_count ?? $post->comments()->count(),
            'is_liked' => $user ? $post->isLikedBy($user->id) : false,
            'created_at' => $post->created_at->diffForHumans(),
            'user' => [
                'id' => $post->user->id,
                'name' => $post->user->name,
                'username' => $post->user->username,
                'profile_photo' => $post->user->profile_photo,
            ],
            'comments' => $post->comments->take(3)->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'content' => $comment->content,
                    'created_at' => $comment->created_at->diffForHumans(),
                    'user' => [
                        'id' => $comment->user->id,
                        'name' => $comment->user->name,
                        'username' => $comment->user->username,
                    ],
                ];
            }),
        ];
    }
}