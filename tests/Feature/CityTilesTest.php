<?php

use App\Models\City;
use App\Models\CityTile;
use App\Models\User;

test('cities and tiles automatically receive ulids', function () {
    $city = City::factory()->create();

    expect($city->ulid)->not->toBeNull();

    $city->syncTiles(['2,2' => ['type' => 'road']]);

    $tile = $city->tile('2,2');

    expect($tile)->not->toBeNull()
        ->and($tile->ulid)->not->toBeNull();

    $this->assertDatabaseHas('cities', ['id' => $city->id, 'ulid' => $city->ulid]);
    $this->assertDatabaseHas('city_tiles', ['city_id' => $city->id, 'tile_key' => '2,2']);
});

test('saving city progress syncs the city_tiles table', function () {
    $user = User::factory()->create();
    $city = City::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)->putJson(route('city.update'), [
        'name' => 'Tile Town',
        'money' => 2000,
        'population' => 10,
        'xp' => 5,
        'level' => 2,
        'grid_data' => [
            '1,1' => ['type' => 'road'],
            '1,2' => ['type' => 'park'],
        ],
    ])->assertOk();

    expect($city->refresh()->tile('1,1'))->not->toBeNull()
        ->and($city->refresh()->tile('1,2'))->not->toBeNull();

    $this->actingAs($user)->putJson(route('city.update'), [
        'name' => 'Tile Town',
        'money' => 2000,
        'population' => 10,
        'xp' => 5,
        'level' => 2,
        'grid_data' => [
            '1,2' => ['type' => 'park'],
        ],
    ])->assertOk();

    expect($city->refresh()->tile('1,1'))->toBeNull()
        ->and($city->refresh()->tile('1,2'))->not->toBeNull();
});

test('resetting a city clears its tiles', function () {
    $user = User::factory()->create();
    $city = City::factory()->create(['user_id' => $user->id]);
    $city->syncTiles(['3,3' => ['type' => 'villa']]);

    $this->actingAs($user)->postJson(route('city.reset'), ['name' => 'Fresh Start'])->assertOk();

    expect($city->refresh()->tiles()->count())->toBe(0)
        ->and($city->refresh()->grid_data)->toBeEmpty();
});

test('city resolves by ulid and rejects other users', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $city = City::factory()->create(['user_id' => $owner->id]);

    $this->actingAs($owner)->get(route('cities.show', $city))->assertOk();

    $this->actingAs($intruder)->get(route('cities.show', $city))->assertNotFound();
});

test('tile resolves by ulid scoped to its parent city', function () {
    $user = User::factory()->create();
    $city = City::factory()->create(['user_id' => $user->id]);
    $city->syncTiles(['4,4' => ['type' => 'road']]);
    $tile = $city->refresh()->tile('4,4');

    expect($tile)->not->toBeNull();

    $this->actingAs($user)
        ->getJson(route('cities.tiles.show', [$city, $tile]))
        ->assertOk()
        ->assertJsonPath('tile_key', '4,4');

    $otherCity = City::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->getJson(route('cities.tiles.show', [$otherCity, $tile]))
        ->assertNotFound();
});

test('tile ulids are unique across cities', function () {
    $city = City::factory()->create();
    $city->syncTiles(['0,0' => ['type' => 'road']]);
    $other = City::factory()->create();
    $other->syncTiles(['0,0' => ['type' => 'road']]);

    $tile = $city->refresh()->tile('0,0');
    $otherTile = $other->refresh()->tile('0,0');

    expect($tile->ulid)->not->toBe($otherTile->ulid);
    expect(CityTile::where('ulid', $tile->ulid)->count())->toBe(1);
});
