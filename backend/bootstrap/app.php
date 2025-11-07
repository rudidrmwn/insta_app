<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route; // Add this line

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
        using: function () {
            Route::middleware('web')
                ->namespace('App\\Http\\Controllers')
                ->group(base_path('routes/web.php'));

            Route::middleware('api') // Ensure this is present
                ->namespace('App\\Http\\Controllers')
                ->prefix('api')
                ->group(base_path('routes/api.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
