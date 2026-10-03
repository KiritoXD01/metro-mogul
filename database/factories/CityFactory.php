<?php

namespace Database\Factories;

use App\Models\City;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<City>
 */
class CityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->city(),
            'money' => 2500,
            'population' => 0,
            'xp' => 0,
            'level' => 1,
        ];
    }

    /**
     * Add tiles to the city after creation.
     *
     * @param  array<string, mixed>  $grid
     */
    public function withTiles(array $grid = []): static
    {
        return $this->afterCreating(function (City $city) use ($grid) {
            $grid = $grid !== [] ? $grid : [
                '5,5' => [
                    'type' => 'small_house',
                    'harvestReadyAt' => fake()->unixTime(),
                    'isReady' => false,
                    'createdAt' => fake()->unixTime(),
                ],
            ];

            $city->syncTiles($grid);
        });
    }
}
