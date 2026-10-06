<?php

use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
});

test('registration is rate limited by ip', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->post(route('register.store'), [
            'name' => "User {$i}",
            'email' => "user{$i}@example.com",
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect();

        $this->post(route('logout'));
    }

    $this->post(route('register.store'), [
        'name' => 'User Six',
        'email' => 'user6@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertSessionHasErrors('email');
});
