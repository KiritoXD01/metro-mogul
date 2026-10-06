<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreFeedbackRequest;
use App\Models\Feedback;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class FeedbackController extends Controller
{
    /**
     * Store player feedback for later review in the database.
     */
    public function store(StoreFeedbackRequest $request): RedirectResponse
    {
        Feedback::query()->create([
            'user_id' => $request->user()->id,
            'description' => $request->validated('description'),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('feedback.sent')]);

        return back();
    }
}
