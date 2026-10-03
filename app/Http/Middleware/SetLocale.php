<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * Resolution order: authenticated user's saved locale > session >
     * locale cookie > Accept-Language header > app fallback.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $available = config('app.available_locales', ['en']);

        $locale = null;

        if ($request->user()?->locale && in_array($request->user()->locale, $available, true)) {
            $locale = $request->user()->locale;
        }

        if ($locale === null && $request->session()->has('locale')) {
            $sessionLocale = $request->session()->get('locale');

            if (in_array($sessionLocale, $available, true)) {
                $locale = $sessionLocale;
            }
        }

        if ($locale === null && $request->cookie('locale') !== null) {
            $cookieLocale = $request->cookie('locale');

            if (in_array($cookieLocale, $available, true)) {
                $locale = $cookieLocale;
            }
        }

        if ($locale === null) {
            $locale = $request->getPreferredLanguage($available) ?? config('app.fallback_locale', 'en');
        }

        App::setLocale($locale);

        return $next($request);
    }
}
