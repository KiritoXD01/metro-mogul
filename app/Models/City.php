<?php

namespace App\Models;

use Database\Factories\CityFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $ulid
 * @property int $user_id
 * @property string $name
 * @property int $money
 * @property int $population
 * @property int $xp
 * @property int $level
 * @property array<string, mixed> $grid_data
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 * @property-read Collection<int, CityTile> $tiles
 */
#[Fillable(['user_id', 'name', 'money', 'population', 'xp', 'level', 'grid_data', 'ulid'])]
class City extends Model
{
    /** @use HasFactory<CityFactory> */
    use HasFactory;

    /** @var array<string, mixed>|null */
    protected ?array $pendingGridData = null;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'money' => 'integer',
            'population' => 'integer',
            'xp' => 'integer',
            'level' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (City $city) {
            if (empty($city->ulid)) {
                $city->ulid = (string) Str::ulid();
            }
        });

        static::created(function (City $city) {
            $city->savePendingGridData();
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
     * Get the user that owns the city.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the tiles that belong to the city.
     *
     * @return HasMany<CityTile, $this>
     */
    public function tiles(): HasMany
    {
        return $this->hasMany(CityTile::class);
    }

    /**
     * Assemble the grid blob from the city_tiles table.
     *
     * @return array<string, mixed>
     */
    public function getGridDataAttribute(): array
    {
        $tiles = $this->relationLoaded('tiles') ? $this->tiles : $this->tiles()->get();

        /** @var array<string, mixed> $grid */
        $grid = [];
        foreach ($tiles as $tile) {
            $grid[$tile->tile_key] = $tile->data ?? [];
        }

        return $grid;
    }

    /**
     * Sync the city_tiles table from a grid blob.
     *
     * @param  array<string, mixed>|null  $grid
     */
    public function setGridDataAttribute(?array $grid): void
    {
        $grid = $grid ?? [];

        if (! $this->exists) {
            $this->pendingGridData = $grid;

            return;
        }

        $this->syncTiles($grid);
    }

    /**
     * Persist pending grid data queued before the city existed.
     */
    protected function savePendingGridData(): void
    {
        $pending = $this->pendingGridData;
        $this->pendingGridData = null;

        if (is_array($pending) && $pending !== []) {
            $this->syncTiles($pending);
            $this->unsetRelation('tiles');
        }
    }

    /**
     * Replace tile rows to match the given grid blob.
     *
     * @param  array<string, mixed>  $grid
     */
    public function syncTiles(array $grid): void
    {
        $now = now()->toDateTimeString();
        $upserts = [];

        foreach ($grid as $tileKey => $tileData) {
            $upserts[] = [
                'city_id' => $this->getKey(),
                'tile_key' => (string) $tileKey,
                'data' => json_encode($tileData),
                'ulid' => (string) Str::ulid(),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        $this->tiles()->when(
            array_keys($grid) !== [],
            fn ($query) => $query->whereNotIn('tile_key', array_keys($grid)),
        )->delete();

        if ($upserts !== []) {
            CityTile::upsert(
                $upserts,
                ['city_id', 'tile_key'],
                ['data', 'updated_at']
            );
            $this->unsetRelation('tiles');
        }
    }

    /**
     * Get a single tile row by its grid key.
     */
    public function tile(string $tileKey): ?CityTile
    {
        return $this->tiles()->where('tile_key', $tileKey)->first();
    }
}
