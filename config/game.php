<?php

return [

    'max_level' => 40,

    'base_grid_size' => 12,

    'grid_expansion_step' => 4,

    'map_expansion_cost' => 75_000,

    'demolish_refund_percent' => 50,

    /*
    | Build times follow cost: about 0.4s per dollar for income buildings,
    | about 0.2s per dollar for decoration, and a short wait for roads.
    */
    'buildings' => [
        'small_house' => ['name' => 'Cozy Cottage', 'unlock_level' => 1, 'build_time' => 60],
        'road' => ['name' => 'Asphalt Road', 'unlock_level' => 1, 'build_time' => 5],
        'park' => ['name' => 'Community Park', 'unlock_level' => 2, 'build_time' => 40],
        'coffee_shop' => ['name' => 'Bean & Brew Cafe', 'unlock_level' => 2, 'build_time' => 120],
        'fountain' => ['name' => 'Grand Fountain', 'unlock_level' => 3, 'build_time' => 90],
        'villa' => ['name' => 'Luxury Villa', 'unlock_level' => 4, 'build_time' => 240],
        'supermarket' => ['name' => 'Mega Mart', 'unlock_level' => 5, 'build_time' => 400],
        'apartment' => ['name' => 'Highrise Apartments', 'unlock_level' => 6, 'build_time' => 720],
        'tech_office' => ['name' => 'Tech Innovation Hub', 'unlock_level' => 7, 'build_time' => 1400],
    ],

    'missions' => [
        ['id' => 'pave_roads', 'metric' => 'buildings', 'building' => 'road', 'count' => 4, 'money' => 200, 'xp' => 25],
        ['id' => 'first_cottage', 'metric' => 'buildings', 'building' => 'small_house', 'count' => 1, 'money' => 150, 'xp' => 20],
        ['id' => 'collect_rent', 'metric' => 'collects', 'count' => 5, 'money' => 250, 'xp' => 30],
        ['id' => 'grow_population', 'metric' => 'population', 'count' => 20, 'money' => 400, 'xp' => 40],
        ['id' => 'open_cafe', 'metric' => 'buildings', 'building' => 'coffee_shop', 'count' => 1, 'money' => 300, 'xp' => 35],
        ['id' => 'plant_park', 'metric' => 'buildings', 'building' => 'park', 'count' => 1, 'money' => 200, 'xp' => 25],
        ['id' => 'mayor_rank', 'metric' => 'level', 'count' => 3, 'money' => 500, 'xp' => 50],
        ['id' => 'expand_map', 'metric' => 'expansions', 'count' => 1, 'money' => 1000, 'xp' => 80],
    ],

];
