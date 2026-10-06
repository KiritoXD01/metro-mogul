<?php

use App\Models\Feedback;
use App\Models\User;

test('guests cannot submit feedback', function () {
    $response = $this->post(route('feedback.store'), [
        'description' => 'Great game!',
    ]);

    $response->assertRedirect(route('login'));
    $this->assertDatabaseCount('feedbacks', 0);
});

test('authenticated user can submit feedback', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from(route('dashboard'))
        ->post(route('feedback.store'), [
            'description' => 'Love the subway builder!',
        ]);

    $response->assertRedirect(route('dashboard'));

    $this->assertDatabaseHas('feedbacks', [
        'user_id' => $user->id,
        'description' => 'Love the subway builder!',
    ]);
});

test('description is required', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from(route('dashboard'))
        ->post(route('feedback.store'), [
            'description' => '',
        ]);

    $response->assertSessionHasErrors('description');
    $this->assertDatabaseCount('feedbacks', 0);
});

test('description cannot exceed 2000 characters', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from(route('dashboard'))
        ->post(route('feedback.store'), [
            'description' => str_repeat('a', 2001),
        ]);

    $response->assertSessionHasErrors('description');
    $this->assertDatabaseCount('feedbacks', 0);
});

test('feedback submissions are rate limited per user', function () {
    $user = User::factory()->create();

    for ($i = 0; $i < 5; $i++) {
        $this
            ->actingAs($user)
            ->from(route('dashboard'))
            ->post(route('feedback.store'), [
                'description' => "Message {$i}",
            ])
            ->assertRedirect(route('dashboard'));
    }

    $this->assertDatabaseCount('feedbacks', 5);

    $response = $this
        ->actingAs($user)
        ->from(route('dashboard'))
        ->post(route('feedback.store'), [
            'description' => 'One too many',
        ]);

    $response->assertRedirect(route('dashboard'));
    $this->assertDatabaseCount('feedbacks', 5);
    expect(Feedback::query()->where('description', 'One too many')->exists())->toBeFalse();
});
