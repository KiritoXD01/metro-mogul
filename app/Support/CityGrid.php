<?php

namespace App\Support;

class CityGrid
{
    public static function gridSizeFor(int $mapExpansions): int
    {
        return (int) config('game.base_grid_size')
            + ($mapExpansions * (int) config('game.grid_expansion_step'));
    }

    /**
     * @return array{0: int, 1: int}|null
     */
    public static function parseTileKey(string $tileKey): ?array
    {
        if (! preg_match('/^(\d+),(\d+)$/', $tileKey, $matches)) {
            return null;
        }

        return [(int) $matches[1], (int) $matches[2]];
    }

    public static function tileKeyInBounds(string $tileKey, int $gridSize): bool
    {
        $coords = self::parseTileKey($tileKey);

        if ($coords === null) {
            return false;
        }

        [$x, $z] = $coords;

        return $x >= 0 && $x < $gridSize && $z >= 0 && $z < $gridSize;
    }

    /**
     * @param  array<string, mixed>|null  $grid
     */
    public static function gridDataWithinBounds(?array $grid, int $gridSize): bool
    {
        $grid = $grid ?? [];

        foreach (array_keys($grid) as $tileKey) {
            if (! self::tileKeyInBounds((string) $tileKey, $gridSize)) {
                return false;
            }
        }

        return true;
    }
}
