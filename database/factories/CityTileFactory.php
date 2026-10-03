<?php

namespace Database\Factories;

use App\Models\City;
use App\Models\CityTile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CityTile>
 */
class CityTileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'city_id' => City::factory(),
            'tile_key' => fake()->numberBetween(0, 11).','.fake()->numberBetween(0, 11),
            'data' => [
                'type' => 'small_house',
                'harvestReadyAt' => fake()->unixTime(),
                'isReady' => false,
                'createdAt' => fake()->unixTime(),
            ],
        ];
    }
}
