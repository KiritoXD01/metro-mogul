<?php

namespace App\Http\Controllers;

use App\Jobs\NotifyBuildingCompletedJob;
use App\Models\City;
use App\Models\CityTile;
use App\Models\User;
use App\Support\CityGrid;
use App\Support\MapExpansion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class CityController extends Controller
{
    /**
     * Unlock levels required for each building type.
     *
     * @var array<string, int>
     */
    public const BUILDING_UNLOCK_LEVELS = [
        'small_house' => 1,
        'road' => 1,
        'park' => 2,
        'coffee_shop' => 2,
        'fountain' => 3,
        'villa' => 4,
        'supermarket' => 5,
        'apartment' => 6,
        'tech_office' => 7,
    ];

    /**
     * Resolve the authenticated user's city, creating it when missing.
     */
    private function cityFor(User $user): City
    {
        /** @var City $city */
        $city = $user->city()->with('tiles')->firstOrCreate(
            ['user_id' => $user->id],
            [
                'name' => $user->name ? "{$user->name}'s City" : 'Metropolis',
                'money' => 2500,
                'population' => 0,
                'xp' => 0,
                'level' => 1,
                'grid_data' => [],
            ]
        );

        return $city->loadMissing('tiles');
    }

    /**
     * Ensure the ULID-bound city belongs to the authenticated user.
     */
    private function authorizeCity(Request $request, City $city): void
    {
        /** @var User $user */
        $user = $request->user();

        if ($city->user_id !== $user->id) {
            throw new NotFoundHttpException;
        }
    }

    /**
     * Serialize a city for Inertia/JSON responses.
     *
     * @return array<string, mixed>
     */
    private function cityPayload(City $city): array
    {
        $city->loadMissing('tiles');

        return [
            'id' => $city->id,
            'ulid' => $city->ulid,
            'name' => $city->name,
            'money' => $city->money,
            'population' => $city->population,
            'xp' => $city->xp,
            'level' => $city->level,
            'mapExpansions' => (int) $city->map_expansions,
            'gridSize' => $city->gridSize(),
            'gridData' => $city->grid_data ?? [],
            'updatedAt' => $city->updated_at?->toISOString(),
            'limits' => $this->limitsPayload($city),
        ];
    }

    /**
     * @return array<string, int|bool>
     */
    private function limitsPayload(City $city): array
    {
        $level = (int) $city->level;
        $mapExpansions = (int) $city->map_expansions;

        return [
            'maxLevel' => (int) config('game.max_level'),
            'mapExpansionCost' => (int) config('game.map_expansion_cost'),
            'allowedMapExpansions' => MapExpansion::allowedCountForLevel($level),
            'nextExpansionLevel' => MapExpansion::minLevelForNextExpansion($mapExpansions),
            'canExpand' => $city->canExpandMap(),
            'demolishRefundPercent' => (int) config('game.demolish_refund_percent'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function validateCityUpdate(Request $request, City $city): array
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:100'],
            'money' => ['required', 'integer', 'min:0'],
            'population' => ['required', 'integer', 'min:0'],
            'xp' => ['required', 'integer', 'min:0'],
            'level' => ['required', 'integer', 'min:1', 'max:'.config('game.max_level')],
            'grid_data' => ['present', 'nullable', 'array'],
        ]);

        $grid = $validated['grid_data'] ?? [];

        if (! CityGrid::gridDataWithinBounds(is_array($grid) ? $grid : [], $city->gridSize())) {
            throw ValidationException::withMessages([
                'grid_data' => [__('game.invalid_tile')],
            ]);
        }

        return $validated;
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function persistCityUpdate(City $city, array $validated): void
    {
        $city->update([
            'name' => $validated['name'] ?? $city->name,
            'money' => $validated['money'],
            'population' => $validated['population'],
            'xp' => $validated['xp'],
            'level' => $validated['level'],
            'grid_data' => $validated['grid_data'] ?? [],
        ]);
    }

    /**
     * Shared settings props for the in-game profile modal.
     * Mirrors ProfileController::edit and SecurityController::edit so the
     * dashboard can render every settings tab without leaving the game.
     *
     * @return array<string, mixed>
     */
    private function settingsProps(Request $request): array
    {
        /** @var User $user */
        $user = $request->user();

        $props = [
            'mustVerifyEmail' => false,
            'status' => $request->session()->get('status'),
            'canManageTwoFactor' => Features::canManageTwoFactorAuthentication(),
            'canManagePasskeys' => Features::canManagePasskeys(),
            'passkeys' => Features::canManagePasskeys()
                ? $user
                    ->passkeys()
                    ->select(['id', 'name', 'credential', 'created_at', 'last_used_at'])
                    ->latest()
                    ->get()
                    ->map(fn ($passkey) => [
                        'id' => $passkey->id,
                        'name' => $passkey->name,
                        'authenticator' => $passkey->authenticator,
                        'created_at_diff' => $passkey->created_at->diffForHumans(),
                        'last_used_at_diff' => $passkey->last_used_at?->diffForHumans(),
                    ])
                    ->values()
                    ->all()
                : [],
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ];

        if (Features::canManageTwoFactorAuthentication()) {
            $props['twoFactorEnabled'] = $user->hasEnabledTwoFactorAuthentication();
            $props['requiresConfirmation'] = Features::optionEnabled(Features::twoFactorAuthentication(), 'confirm');
        }

        return $props;
    }

    /**
     * Display the city builder dashboard.
     */
    public function show(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $city = $this->cityFor($user);

        return Inertia::render('dashboard', array_merge([
            'city' => $this->cityPayload($city),
        ], $this->settingsProps($request)));
    }

    /**
     * Display the city builder dashboard for a ULID-bound city.
     */
    public function showByUlid(Request $request, City $city): Response
    {
        $this->authorizeCity($request, $city);

        return Inertia::render('dashboard', array_merge([
            'city' => $this->cityPayload($city),
        ], $this->settingsProps($request)));
    }

    /**
     * Show a single tile bound by ULID, scoped to its parent city.
     */
    public function showTile(Request $request, City $city, CityTile $tile): JsonResponse
    {
        $this->authorizeCity($request, $city);

        if ($tile->city_id !== $city->id) {
            throw new NotFoundHttpException;
        }

        return response()->json([
            'ulid' => $tile->ulid,
            'tile_key' => $tile->tile_key,
            'data' => $tile->data ?? [],
        ]);
    }

    /**
     * Update the city state.
     */
    public function update(Request $request): JsonResponse|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $city = $this->cityFor($user);

        $validated = $this->validateCityUpdate($request, $city);

        $this->persistCityUpdate($city, $validated);

        if ($request->wantsJson()) {
            return response()->json([
                'status' => 'saved',
                'city' => $this->cityPayload($city->refresh()),
            ]);
        }

        return back()->with('status', 'City saved');
    }

    /**
     * Update a ULID-bound city.
     */
    public function updateByUlid(Request $request, City $city): JsonResponse|RedirectResponse
    {
        $this->authorizeCity($request, $city);

        $validated = $this->validateCityUpdate($request, $city);

        $this->persistCityUpdate($city, $validated);

        if ($request->wantsJson()) {
            return response()->json([
                'status' => 'saved',
                'city' => $this->cityPayload($city->refresh()),
            ]);
        }

        return back()->with('status', 'City saved');
    }

    /**
     * Reset the city to starting conditions.
     */
    public function reset(Request $request): JsonResponse|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:100'],
        ]);

        $city = $this->cityFor($user);

        $cityName = ! empty($validated['name'])
            ? $validated['name']
            : ($user->name ? "{$user->name}'s City" : 'Metropolis');

        $city->update([
            'name' => $cityName,
            'money' => 2500,
            'population' => 0,
            'xp' => 0,
            'level' => 1,
            'map_expansions' => 0,
            'grid_data' => [],
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'status' => 'reset',
                'city' => $this->cityPayload($city->refresh()),
            ]);
        }

        return redirect()->route('dashboard')->with('status', 'New city founded');
    }

    /**
     * Expand the buildable map grid (authoritative purchase).
     */
    public function expandMap(Request $request): JsonResponse|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $city = $this->cityFor($user);

        if (! $city->canExpandMap()) {
            return response()->json([
                'message' => __('game.map_expansion_max_reached'),
            ], 422);
        }

        $minLevel = MapExpansion::minLevelForNextExpansion((int) $city->map_expansions);
        if ($city->level < $minLevel) {
            return response()->json([
                'message' => __('game.map_expansion_level_required', ['level' => $minLevel]),
            ], 422);
        }

        $cost = (int) config('game.map_expansion_cost');
        if ($city->money < $cost) {
            return response()->json([
                'message' => __('game.map_expansion_insufficient_funds'),
            ], 422);
        }

        DB::transaction(function () use ($city, $cost): void {
            $city->update([
                'money' => $city->money - $cost,
                'map_expansions' => (int) $city->map_expansions + 1,
            ]);
        });

        if ($request->wantsJson()) {
            return response()->json([
                'status' => 'expanded',
                'city' => $this->cityPayload($city->refresh()),
            ]);
        }

        return back()->with('status', 'Map expanded');
    }

    /**
     * Start building construction and queue notification job.
     */
    public function startConstruction(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'tile_key' => ['required', 'string', 'max:20'],
            'building_type' => ['required', 'string', 'max:50'],
            'building_name' => ['required', 'string', 'max:100'],
            'duration_seconds' => ['required', 'integer', 'min:0'],
        ]);

        $city = $this->cityFor($user);

        $requiredLevel = self::BUILDING_UNLOCK_LEVELS[$validated['building_type']] ?? 1;
        if ($city->level < $requiredLevel) {
            return response()->json([
                'message' => "Requires Mayor Level {$requiredLevel} to construct.",
            ], 422);
        }

        $duration = max(0, $validated['duration_seconds']);

        if ($duration > 0) {
            NotifyBuildingCompletedJob::dispatch(
                $user->id,
                $city->id,
                $validated['building_type'],
                $validated['building_name'],
                $validated['tile_key'],
            )->delay(now()->addSeconds($duration));
        } else {
            NotifyBuildingCompletedJob::dispatchSync(
                $user->id,
                $city->id,
                $validated['building_type'],
                $validated['building_name'],
                $validated['tile_key'],
            );
        }

        return response()->json([
            'status' => 'construction_started',
            'tile_key' => $validated['tile_key'],
            'building_name' => $validated['building_name'],
            'duration_seconds' => $duration,
        ]);
    }
}
