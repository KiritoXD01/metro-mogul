<?php

namespace App\Jobs;

use App\Events\BuildingCompletedEvent;
use App\Models\City;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class NotifyBuildingCompletedJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $userId,
        public int $cityId,
        public string $buildingType,
        public string $buildingName,
        public string $tileKey,
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $city = City::where('id', $this->cityId)
            ->where('user_id', $this->userId)
            ->first();

        $tile = $city?->tile($this->tileKey);

        if ($tile) {
            $data = $tile->data ?? [];

            if (! ($data['isConstructed'] ?? false)) {
                $data['isConstructed'] = true;
                $tile->update(['data' => $data]);
            }
        }

        event(new BuildingCompletedEvent(
            $this->userId,
            $this->cityId,
            $this->buildingType,
            $this->buildingName,
            $this->tileKey,
        ));
    }
}
