<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use Laravel\Fortify\Fortify;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        $request = request();

        if ($request instanceof Request && $this->registrationAttemptsExceeded($request)) {
            throw ValidationException::withMessages([
                Fortify::username() => [__('auth.register_throttled')],
            ]);
        }

        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        $user = User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
        ]);

        if ($request instanceof Request) {
            RateLimiter::hit($this->registrationLimiterKey($request), 3600);
        }

        return $user;
    }

    private function registrationAttemptsExceeded(Request $request): bool
    {
        return RateLimiter::tooManyAttempts($this->registrationLimiterKey($request), 5);
    }

    private function registrationLimiterKey(Request $request): string
    {
        return 'register|'.$request->ip();
    }
}
