<?php

use App\Models\User;

test('dashboard shares unseen changelog releases for new users', function () {
    $user = User::factory()->create(['changelog_seen_id' => null]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('changelogUnseen', 2)
            ->where('changelogUnseen.0.id', '2026-10-28-missions-balance')
        );
});

test('marking changelog seen updates the user record', function () {
    $user = User::factory()->create(['changelog_seen_id' => null]);

    $response = $this->actingAs($user)
        ->post(route('changelog.seen'));

    $response->assertRedirect();

    expect($user->fresh()->changelog_seen_id)->toBe('2026-10-28-missions-balance');
});

test('dashboard omits changelog releases already seen', function () {
    $user = User::factory()->create(['changelog_seen_id' => '2026-10-28-missions-balance']);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('changelogUnseen', [])
        );
});

test('dashboard still shows releases newer than the last one the mayor saw', function () {
    $user = User::factory()->create(['changelog_seen_id' => '2026-10-07-gameplay-ux']);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('changelogUnseen', 1)
            ->where('changelogUnseen.0.id', '2026-10-28-missions-balance')
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
            ->where('changelogUnseen.0.title', 'Misiones, ciudad y tiempos de obra')
        );
});
