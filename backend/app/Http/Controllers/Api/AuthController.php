<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful',
            'user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email],
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate(['email' => 'required|email', 'password' => 'required']);
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages(['email' => ['The provided credentials are incorrect.']]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => ['id' => $user->id, 'name' => $user->name, 'username' => $user->username, 'email' => $user->email, 'bio' => $user->bio, 'profile_photo' => $user->profile_photo],
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout successful']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'user' => ['id' => $user->id, 'name' => $user->name, 'username' => $user->username, 'email' => $user->email, 'bio' => $user->bio, 'profile_photo' => $user->profile_photo, 'posts_count' => $user->posts()->count()],
        ]);
    }
}