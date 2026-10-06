<?php

use App\Events\BuildingCompletedEvent;
use App\Jobs\NotifyBuildingCompletedJob;
use App\Models\City;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;

test('guests are redirected from dashboard to login', function () {
    $response = $this->get(route('dashboard'));

    $response->assertRedirect(route('login'));
});

test('authenticated user visits dashboard and automatically initializes a city', function () {
    $user = User::factory()->create(['name' => 'Alexander']);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();
    $this->assertDatabaseHas('cities', [
        'user_id' => $user->id,
        'money' => 2500,
        'population' => 0,
        'level' => 1,
    ]);

    expect($user->fresh()->city)->not->toBeNull()
        ->and($user->city->money)->toBe(2500)
        ->and($user->city->level)->toBe(1);
});

test('authenticated user can save city progress', function () {
    $user = User::factory()->create();
    $city = City::factory()->create([
        'user_id' => $user->id,
        'name' => 'Metro Prime',
        'money' => 2500,
        'population' => 0,
        'xp' => 0,
        'level' => 1,
        'grid_data' => [],
    ]);

    $newGrid = [
        '5,5' => [
            'type' => 'small_house',
            'harvestReadyAt' => 1700000000000,
            'isReady' => false,
            'createdAt' => 1699999990000,
        ],
    ];

    $response = $this->actingAs($user)
        ->putJson(route('city.update'), [
            'name' => 'Metro Prime',
            'money' => 2350,
            'population' => 5,
            'xp' => 15,
            'level' => 1,
            'grid_data' => $newGrid,
        ]);

    $response->assertOk()
        ->assertJsonPath('status', 'saved')
        ->assertJsonPath('city.money', 2350)
        ->assertJsonPath('city.population', 5)
        ->assertJsonPath('city.xp', 15);

    $city->refresh();
    expect($city->money)->toBe(2350)
        ->and($city->population)->toBe(5)
        ->and($city->xp)->toBe(15)
        ->and($city->grid_data)->toHaveKey('5,5');
});

test('updating city validates required fields', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->putJson(route('city.update'), [
            'money' => -10, // Invalid: min:0
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['money', 'population', 'xp', 'level', 'grid_data']);
});

test('updating city rejects money above the treasury cap', function () {
    $user = User::factory()->create();
    City::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)
        ->putJson(route('city.update'), [
            'name' => 'Metro',
            'money' => 500_001,
            'population' => 0,
            'xp' => 0,
            'level' => 1,
            'grid_data' => [],
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['money']);
});

test('updating city rejects level above the mayor cap', function () {
    $user = User::factory()->create();
    City::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)
        ->putJson(route('city.update'), [
            'name' => 'Metro',
            'money' => 2500,
            'population' => 0,
            'xp' => 0,
            'level' => 41,
            'grid_data' => [],
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['level']);
});

test('updating city rejects tiles outside the current grid bounds', function () {
    $user = User::factory()->create();
    City::factory()->create(['user_id' => $user->id, 'map_expansions' => 0]);

    $response = $this->actingAs($user)
        ->putJson(route('city.update'), [
            'name' => 'Metro',
            'money' => 2500,
            'population' => 0,
            'xp' => 0,
            'level' => 1,
            'grid_data' => [
                '15,15' => ['type' => 'road'],
            ],
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['grid_data']);
});

test('authenticated user can expand the map once when requirements are met', function () {
    $user = User::factory()->create();
    City::factory()->create([
        'user_id' => $user->id,
        'money' => 100_000,
        'level' => 8,
        'map_expansions' => 0,
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('city.expand-map'));

    $response->assertOk()
        ->assertJsonPath('status', 'expanded')
        ->assertJsonPath('city.gridSize', 16)
        ->assertJsonPath('city.mapExpansions', 1)
        ->assertJsonPath('city.money', 25_000);

    expect($user->fresh()->city->map_expansions)->toBe(1)
        ->and($user->fresh()->city->gridSize())->toBe(16);
});

test('cannot expand the map without sufficient funds or twice', function () {
    $user = User::factory()->create();
    City::factory()->create([
        'user_id' => $user->id,
        'money' => 10_000,
        'level' => 10,
        'map_expansions' => 0,
    ]);

    $this->actingAs($user)
        ->postJson(route('city.expand-map'))
        ->assertUnprocessable();

    City::query()->where('user_id', $user->id)->update([
        'money' => 200_000,
        'map_expansions' => 1,
    ]);

    $this->actingAs($user)
        ->postJson(route('city.expand-map'))
        ->assertUnprocessable();
});

test('authenticated user can reset their city to start a new metropolis', function () {
    $user = User::factory()->create();
    City::factory()->create([
        'user_id' => $user->id,
        'name' => 'Old Town',
        'money' => 50000,
        'population' => 450,
        'xp' => 2000,
        'level' => 8,
        'grid_data' => ['1,1' => ['type' => 'apartment']],
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('city.reset'), [
            'name' => 'Neo Tokyo',
        ]);

    $response->assertOk()
        ->assertJsonPath('status', 'reset')
        ->assertJsonPath('city.name', 'Neo Tokyo')
        ->assertJsonPath('city.money', 2500)
        ->assertJsonPath('city.population', 0)
        ->assertJsonPath('city.level', 1);

    $city = $user->fresh()->city;
    expect($city->name)->toBe('Neo Tokyo')
        ->and($city->money)->toBe(2500)
        ->and($city->population)->toBe(0)
        ->and($city->level)->toBe(1)
        ->and($city->map_expansions)->toBe(0)
        ->and($city->grid_data)->toBeEmpty();
});

test('starting construction dispatches NotifyBuildingCompletedJob with proper delay', function () {
    Queue::fake();

    $user = User::factory()->create();
    City::factory()->create([
        'user_id' => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('city.construction.start'), [
            'tile_key' => '4,4',
            'building_type' => 'small_house',
            'building_name' => 'Cozy Cottage',
            'duration_seconds' => 60,
        ]);

    $response->assertOk()
        ->assertJsonPath('status', 'construction_started')
        ->assertJsonPath('building_name', 'Cozy Cottage')
        ->assertJsonPath('duration_seconds', 60);

    Queue::assertPushed(NotifyBuildingCompletedJob::class, function ($job) use ($user) {
        return $job->userId === $user->id
            && $job->buildingType === 'small_house'
            && $job->buildingName === 'Cozy Cottage'
            && $job->tileKey === '4,4'
            && $job->delay !== null;
    });
});

test('starting construction validates payload fields', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->postJson(route('city.construction.start'), [
            'tile_key' => '',
            'duration_seconds' => -5,
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['tile_key', 'building_type', 'building_name', 'duration_seconds']);
});

test('cannot start construction on buildings above mayor level', function () {
    $user = User::factory()->create();
    City::factory()->create([
        'user_id' => $user->id,
        'level' => 1,
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('city.construction.start'), [
            'tile_key' => '3,3',
            'building_type' => 'villa',
            'building_name' => 'Luxury Villa',
            'duration_seconds' => 300,
        ]);

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'Requires Mayor Level 4 to construct.');
});

test('can start construction when mayor level is sufficient', function () {
    Queue::fake();

    $user = User::factory()->create();
    City::factory()->create([
        'user_id' => $user->id,
        'level' => 4,
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('city.construction.start'), [
            'tile_key' => '3,3',
            'building_type' => 'villa',
            'building_name' => 'Luxury Villa',
            'duration_seconds' => 300,
        ]);

    $response->assertOk()
        ->assertJsonPath('status', 'construction_started')
        ->assertJsonPath('building_name', 'Luxury Villa');
});

test('NotifyBuildingCompletedJob marks building constructed and dispatches broadcast event', function () {
    Event::fake([BuildingCompletedEvent::class]);

    $user = User::factory()->create();
    $city = City::factory()->create([
        'user_id' => $user->id,
        'grid_data' => [
            '3,7' => [
                'type' => 'villa',
                'isConstructed' => false,
                'createdAt' => 1700000000000,
            ],
        ],
    ]);

    $job = new NotifyBuildingCompletedJob(
        userId: $user->id,
        cityId: $city->id,
        buildingType: 'villa',
        buildingName: 'Luxury Villa',
        tileKey: '3,7',
    );

    $job->handle();

    $city->refresh();
    expect($city->grid_data['3,7']['isConstructed'])->toBeTrue();

    Event::assertDispatched(BuildingCompletedEvent::class, function (BuildingCompletedEvent $event) use ($user, $city) {
        return $event->userId === $user->id
            && $event->cityId === $city->id
            && $event->buildingType === 'villa'
            && $event->buildingName === 'Luxury Villa'
            && $event->tileKey === '3,7'
            && $event->broadcastAs() === 'building.completed';
    });
});
