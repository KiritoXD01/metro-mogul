<?php

namespace App\Models;

use Database\Factories\CityTileFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $ulid
 * @property int $city_id
 * @property string $tile_key
 * @property array<string, mixed>|null $data
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read City $city
 */
#[Fillable(['city_id', 'tile_key', 'data', 'ulid'])]
class CityTile extends Model
{
    /** @use HasFactory<CityTileFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'city_id' => 'integer',
            'data' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (CityTile $tile) {
            if (empty($tile->ulid)) {
                $tile->ulid = (string) Str::ulid();
            }
        });
    }

    /**
     * Use the ULID for route model binding.
     */
    public function getRouteKeyName(): string
    {
        return 'ulid';
    }

    /**
     * Get the city that owns the tile.
     *
     * @return BelongsTo<City, $this>
     */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }
}
