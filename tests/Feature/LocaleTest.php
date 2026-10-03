<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guest can switch locale and it persists in session and cookie', function () {
    $response = $this
        ->from(route('home'))
        ->post(route('locale.update'), ['locale' => 'es']);

    $response
        ->assertSessionHas('locale', 'es')
        ->assertRedirect(route('home'));

    $response->assertCookie('locale', 'es');
});

test('locale switch rejects unsupported locales', function () {
    $response = $this
        ->from(route('home'))
        ->post(route('locale.update'), ['locale' => 'fr']);

    $response->assertSessionHasErrors('locale');
});

test('authenticated user locale choice is saved to their profile', function () {
    $user = User::factory()->create(['locale' => 'en']);

    $this
        ->actingAs($user)
        ->from(route('home'))
        ->post(route('locale.update'), ['locale' => 'es'])
        ->assertSessionHas('locale', 'es')
        ->assertRedirect(route('home'));

    expect($user->refresh()->locale)->toBe('es');
});

test('authenticated user saved locale takes precedence over session', function () {
    $user = User::factory()->create(['locale' => 'es']);

    $response = $this
        ->actingAs($user)
        ->withSession(['locale' => 'en'])
        ->get(route('home'));

    $response->assertInertia(fn (Assert $page) => $page
        ->where('locale', 'es')
        ->has('translations')
        ->where('translations', fn ($translations) => ($translations['nav.start_city'] ?? null) === 'Crear ciudad'));
});

test('session locale is shared with the frontend for guests', function () {
    $response = $this
        ->withSession(['locale' => 'es'])
        ->get(route('home'));

    $response->assertInertia(fn (Assert $page) => $page
        ->where('locale', 'es')
        ->where('translations', fn ($translations) => ($translations['hud.save'] ?? null) === 'Guardar'));
});

test('accept language header is used as a fallback', function () {
    $response = $this
        ->withHeaders(['Accept-Language' => 'es-ES,es;q=0.9,en;q=0.8'])
        ->get(route('home'));

    $response->assertInertia(fn (Assert $page) => $page
        ->where('locale', 'es'));
});

test('profile update accepts a locale change', function () {
    $user = User::factory()->create(['locale' => 'en']);

    $this
        ->actingAs($user)
        ->from(route('profile.edit'))
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'locale' => 'es',
        ])
        ->assertSessionHasNoErrors();

    expect($user->refresh()->locale)->toBe('es');
});
