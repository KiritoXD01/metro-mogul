<?php

use App\Support\Changelog;

test('changelog parser reads english markdown releases', function () {
    $releases = Changelog::releases('en');

    expect($releases)->toHaveCount(1)
        ->and($releases[0]['id'])->toBe('2026-10-07-gameplay-ux')
        ->and($releases[0]['title'])->toBe('Gameplay, UX & Performance')
        ->and($releases[0]['items'][0]['icon'])->toBe('🖱️')
        ->and($releases[0]['items'])->toHaveCount(4);
});

test('changelog parser reads spanish markdown releases', function () {
    $releases = Changelog::releases('es');

    expect($releases[0]['title'])->toBe('Gameplay, UX y rendimiento')
        ->and($releases[0]['items'][1]['title'])->toBe('Reembolso al demoler');
});

test('changelog latest id matches the newest release file', function () {
    expect(Changelog::latestId('en'))->toBe('2026-10-07-gameplay-ux');
});
