<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Present;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Sign up as one side of one platform. A company signs up with its name,
     * so its profile exists from the first screen; a worker picks a trade.
     */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'role' => ['required', Rule::in(User::SIGNUP_ROLES)],
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'string', 'email', 'max:190', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:32', 'regex:/^\+?[0-9 ]{9,20}$/'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'province' => ['required', Rule::in(array_keys(config('provinces')))],
            'city' => ['nullable', 'string', 'max:120'],
            'locale' => ['nullable', Rule::in(config('app.supported_locales'))],
            'company_name' => [Rule::requiredIf(in_array($request->input('role'), [User::EMPLOYER, User::PROVIDER], true)), 'nullable', 'string', 'max:160'],
            'trade' => [Rule::requiredIf($request->input('role') === User::WORKER), 'nullable', Rule::in(self::trades())],
            'categories' => [Rule::requiredIf($request->input('role') === User::PROVIDER), 'nullable', 'array', 'min:1'],
            'categories.*' => [Rule::in(config('obras.categories'))],
        ]);

        $user = DB::transaction(function () use ($data) {
            $user = User::create([
                'role' => $data['role'],
                'name' => $data['name'],
                'email' => mb_strtolower($data['email']),
                'phone' => preg_replace('/\s+/', '', $data['phone']),
                'password' => $data['password'],
                'province' => $data['province'],
                'city' => $data['city'] ?? null,
                'locale' => $data['locale'] ?? 'es',
            ]);

            match ($user->role) {
                User::WORKER => $user->workerProfile()->create(['trade' => $data['trade']]),
                User::EMPLOYER => $user->employerProfile()->create(['company_name' => $data['company_name']]),
                User::PROVIDER => $user->providerProfile()->create([
                    'company_name' => $data['company_name'],
                    'categories' => array_values(array_unique($data['categories'])),
                    'provinces' => [$data['province']],
                ]),
                default => null,
            };

            return $user;
        });

        Auth::guard('web')->login($user);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json(['data' => Present::user($user->fresh())], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);
        $credentials['email'] = mb_strtolower($credentials['email']);

        if (! Auth::guard('web')->attempt($credentials, true)) {
            throw ValidationException::withMessages(['email' => __('El e-mail o la contraseña no son correctos.')]);
        }

        $user = Auth::guard('web')->user();
        if ($user->blocked_at !== null) {
            Auth::guard('web')->logout();
            throw ValidationException::withMessages(['email' => __('Esta cuenta está bloqueada.')]);
        }

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json(['data' => Present::user($user)]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(null, 204);
    }

    public function me(Request $request): JsonResponse
    {
        $user = Auth::guard('sanctum')->user();
        if (! $user || $user->blocked_at !== null) {
            return response()->json(['data' => null]);
        }

        return response()->json(['data' => Present::user($user)]);
    }

    /** The account's own details, shared by every role. */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'phone' => ['sometimes', 'string', 'max:32', 'regex:/^\+?[0-9 ]{9,20}$/'],
            'province' => ['sometimes', Rule::in(array_keys(config('provinces')))],
            'city' => ['sometimes', 'nullable', 'string', 'max:120'],
            'locale' => ['sometimes', Rule::in(config('app.supported_locales'))],
        ]);
        if (isset($data['phone'])) {
            $data['phone'] = preg_replace('/\s+/', '', $data['phone']);
        }
        $user->update($data);

        return response()->json(['data' => Present::user($user->fresh())]);
    }

    /** @return list<string> */
    public static function trades(): array
    {
        return array_merge(...array_values(config('trades.groups')));
    }
}
