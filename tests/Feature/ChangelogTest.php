<?php

use App\Support\Changelog;

test('changelog parser reads english markdown releases', function () {
    $releases = Changelog::releases('en');

    expect($releases)->toHaveCount(2)
        ->and($releases[0]['id'])->toBe('2026-10-28-missions-balance')
        ->and($releases[0]['title'])->toBe('Missions, city look, and build times')
        ->and($releases[0]['items'][0]['icon'])->toBe('📜')
        ->and($releases[1]['id'])->toBe('2026-10-07-gameplay-ux')
        ->and($releases[1]['items'])->toHaveCount(4);
});

test('changelog parser reads spanish markdown releases', function () {
    $releases = Changelog::releases('es');

    expect($releases[0]['title'])->toBe('Misiones, ciudad y tiempos de obra')
        ->and($releases[1]['items'][1]['title'])->toBe('Reembolso al demoler');
});

test('changelog latest id matches the newest release file', function () {
    expect(Changelog::latestId('en'))->toBe('2026-10-28-missions-balance');
});
