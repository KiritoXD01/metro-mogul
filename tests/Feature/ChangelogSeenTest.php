<?php

use App\Models\User;

test('dashboard shares unseen changelog releases for new users', function () {
    $user = User::factory()->create(['changelog_seen_id' => null]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('changelogUnseen', 1)
            ->where('changelogUnseen.0.id', '2026-10-07-gameplay-ux')
        );
});

test('marking changelog seen updates the user record', function () {
    $user = User::factory()->create(['changelog_seen_id' => null]);

    $response = $this->actingAs($user)
        ->post(route('changelog.seen'));

    $response->assertRedirect();

    expect($user->fresh()->changelog_seen_id)->toBe('2026-10-07-gameplay-ux');
});

test('dashboard omits changelog releases already seen', function () {
    $user = User::factory()->create(['changelog_seen_id' => '2026-10-07-gameplay-ux']);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('changelogUnseen', [])
        );
});

test('dashboard changelog follows the active locale', function () {
    $user = User::factory()->create([
        'changelog_seen_id' => null,
        'locale' => 'es',
    ]);

    app()->setLocale('es');

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('changelogUnseen.0.title', 'Gameplay, UX y rendimiento')
        );
});
