<?php

namespace App\Http\Controllers;

use App\Support\Changelog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ChangelogController extends Controller
{
    /** Mark the latest changelog release as seen for the authenticated user. */
    public function seen(Request $request): RedirectResponse
    {
        $latestId = Changelog::latestId();

        if (! is_string($latestId) || $latestId === '') {
            return back();
        }

        $user = $request->user();

        if ($user) {
            $user->changelog_seen_id = $latestId;
            $user->save();
        }

        return back();
    }
}
