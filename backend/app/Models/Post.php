<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    protected $fillable = ['user_id', 'caption', 'image_path', 'likes_count', 'comments_count'];
    protected $casts = ['likes_count' => 'integer', 'comments_count' => 'integer'];
    protected $with = ['user'];

    public function user() { return $this->belongsTo(User::class); }
    public function likes() { return $this->hasMany(Like::class); }
    public function comments() { return $this->hasMany(Comment::class)->latest(); }
    public function isLikedBy($userId) { return $this->likes()->where('user_id', $userId)->exists(); }
}