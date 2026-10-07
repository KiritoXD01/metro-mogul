<?php

use App\Http\Controllers\ChangelogController;
use App\Http\Controllers\CityController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\LocaleController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::post('locale', LocaleController::class)->name('locale.update');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [CityController::class, 'show'])->name('dashboard');
    Route::put('city', [CityController::class, 'update'])->name('city.update');
    Route::post('city/reset', [CityController::class, 'reset'])->name('city.reset');
    Route::post('city/expand-map', [CityController::class, 'expandMap'])
        ->middleware('throttle:10,1')
        ->name('city.expand-map');
    Route::post('city/construction/start', [CityController::class, 'startConstruction'])->name('city.construction.start');

    Route::post('changelog/seen', [ChangelogController::class, 'seen'])
        ->name('changelog.seen');

    Route::post('feedback', [FeedbackController::class, 'store'])
        ->middleware('throttle:feedback')
        ->name('feedback.store');

    Route::get('cities/{city}', [CityController::class, 'showByUlid'])->name('cities.show');
    Route::put('cities/{city}', [CityController::class, 'updateByUlid'])->name('cities.update');
    Route::get('cities/{city}/tiles/{tile}', [CityController::class, 'showTile'])->name('cities.tiles.show');
});

require __DIR__.'/settings.php';
