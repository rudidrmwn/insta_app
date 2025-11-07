<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\LikeController;
use App\Http\Controllers\Api\PostController;


// Public routes
Route::controller(AuthController::class)->group(function(){
    Route::post('/register', 'register');
    Route::post('/login', 'login');
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Posts
    Route::get('/posts', [PostController::class, 'index']);
    Route::post('/posts', [PostController::class, 'store']);
    Route::get('/posts/{post}', [PostController::class, 'show']);
    Route::put('/posts/{post}', [PostController::class, 'update']);
    Route::delete('/posts/{post}', [PostController::class, 'destroy']);
    Route::get('/users/{userId}/posts', [PostController::class, 'userPosts']);

    // Likes
    Route::post('/posts/{post}/like', [LikeController::class, 'toggle']);

    // Comments
    Route::get('/posts/{post}/comments', [CommentController::class, 'index']);
    Route::post('/posts/{post}/comments', [CommentController::class, 'store']);
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);
});