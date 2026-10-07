<?php

namespace App\Support;

class MapExpansion
{
    public static function allowedCountForLevel(int $level): int
    {
        return intdiv(max(0, $level), 5);
    }

    public static function minLevelForNextExpansion(int $mapExpansions): int
    {
        return ($mapExpansions + 1) * 5;
    }

    public static function canExpand(int $level, int $mapExpansions): bool
    {
        if ($mapExpansions >= self::allowedCountForLevel($level)) {
            return false;
        }

        return $level >= self::minLevelForNextExpansion($mapExpansions);
    }
}
