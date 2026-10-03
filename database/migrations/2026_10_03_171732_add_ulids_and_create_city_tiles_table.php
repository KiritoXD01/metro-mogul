<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('cities', function (Blueprint $table) {
            $table->ulid('ulid')->nullable()->unique()->after('id');
        });

        DB::table('cities')->whereNull('ulid')->orderBy('id')->eachById(function (object $city) {
            DB::table('cities')->where('id', $city->id)->update(['ulid' => (string) Str::ulid()]);
        });

        Schema::create('city_tiles', function (Blueprint $table) {
            $table->id();
            $table->ulid('ulid')->unique();
            $table->foreignId('city_id')->constrained()->cascadeOnDelete();
            $table->string('tile_key', 20);
            $table->json('data')->nullable();
            $table->timestamps();

            $table->unique(['city_id', 'tile_key']);
            $table->index('city_id');
        });

        DB::table('cities')->select(['id', 'grid_data'])->orderBy('id')->eachById(function (object $city) {
            if ($city->grid_data === null) {
                return;
            }

            $grid = is_string($city->grid_data) ? json_decode($city->grid_data, true) : $city->grid_data;

            if (! is_array($grid) || $grid === []) {
                return;
            }

            $now = now()->toDateTimeString();

            foreach ($grid as $tileKey => $tileData) {
                DB::table('city_tiles')->insert([
                    'ulid' => (string) Str::ulid(),
                    'city_id' => $city->id,
                    'tile_key' => (string) $tileKey,
                    'data' => json_encode($tileData),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        });

        Schema::table('cities', function (Blueprint $table) {
            $table->dropColumn('grid_data');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cities', function (Blueprint $table) {
            $table->json('grid_data')->nullable();
        });

        DB::table('city_tiles')->select(['city_id', 'tile_key', 'data'])->orderBy('id')->eachById(function (object $tile) {
            $city = DB::table('cities')->where('id', $tile->city_id)->first();

            if (! $city) {
                return;
            }

            $grid = $city->grid_data !== null && is_string($city->grid_data)
                ? json_decode($city->grid_data, true)
                : ($city->grid_data ?? []);

            if (! is_array($grid)) {
                $grid = [];
            }

            $tileData = is_string($tile->data) ? json_decode($tile->data, true) : ($tile->data ?? []);
            $grid[$tile->tile_key] = $tileData;

            DB::table('cities')->where('id', $tile->city_id)->update([
                'grid_data' => json_encode($grid),
            ]);
        });

        Schema::dropIfExists('city_tiles');

        Schema::table('cities', function (Blueprint $table) {
            $table->dropColumn('ulid');
        });
    }
};
