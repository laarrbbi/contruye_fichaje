<?php

namespace App\Http\Controllers\Api\Empleo;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\JobPost;
use App\Services\Chat;
use App\Support\EmpleoAccess;
use App\Support\Present;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * A company hiring: its profile, its offers (free to publish), who applied,
 * and the chat with them, which opens once the offer is unlocked.
 */
class EmployerController extends Controller
{
    public function profile(Request $request): JsonResponse
    {
        return response()->json(['data' => Present::user($request->user()->load('employerProfile'))]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company_name' => ['required', 'string', 'max:160'],
            'cif' => ['nullable', 'string', 'max:16', 'regex:/^[A-Za-z0-9]{8,10}$/'],
            'sector' => ['required', Rule::in(['obra_nueva', 'reformas', 'obra_civil', 'instalaciones', 'ett', 'otros'])],
            'size' => ['nullable', Rule::in(['1-9', '10-49', '50-249', '250+'])],
            'description' => ['nullable', 'string', 'max:2000'],
            'website' => ['nullable', 'url', 'max:255'],
        ]);
        $user = $request->user();
        $user->employerProfile()->updateOrCreate(['user_id' => $user->id], $data);

        return response()->json(['data' => Present::user($user->fresh('employerProfile'))]);
    }

    public function jobs(Request $request): JsonResponse
    {
        $posts = $request->user()->jobPosts()
            ->with('employer.employerProfile')
            ->withCount(['applications', 'applications as new_applications_count' => fn ($q) => $q->where('status', 'new')])
            ->latest('id')
            ->get();

        return response()->json(['data' => $posts->map(fn (JobPost $p) => Present::ownJob($p))->values()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['expires_at'] = now()->addDays((int) config('catalog.offer_days'));
        $data['status'] = 'active';
        $post = $request->user()->jobPosts()->create($data);

        return response()->json(['data' => Present::ownJob($post->load('employer.employerProfile'))], 201);
    }

    public function show(Request $request, JobPost $job): JsonResponse
    {
        $this->authorizeOwn($request, $job);

        return response()->json(['data' => Present::ownJob($job->load('employer.employerProfile'))]);
    }

    public function update(Request $request, JobPost $job): JsonResponse
    {
        $this->authorizeOwn($request, $job);
        $job->update($this->validated($request));

        return response()->json(['data' => Present::ownJob($job->fresh('employer.employerProfile'))]);
    }

    public function close(Request $request, JobPost $job): JsonResponse
    {
        $this->authorizeOwn($request, $job);
        $job->update(['status' => 'closed']);

        return response()->json(['data' => Present::ownJob($job->fresh('employer.employerProfile'))]);
    }

    /** Publish again: free, for another period if it had run out. */
    public function reopen(Request $request, JobPost $job): JsonResponse
    {
        $this->authorizeOwn($request, $job);
        $job->status = 'active';
        if ($job->expires_at->isPast()) {
            $job->expires_at = now()->addDays((int) config('catalog.offer_days'));
        }
        $job->save();

        return response()->json(['data' => Present::ownJob($job->fresh('employer.employerProfile'))]);
    }

    /**
     * Who applied. Always visible as a summary (the free tier); the full
     * name, phone, e-mail and the chat only once the offer is unlocked.
     */
    public function applications(Request $request, JobPost $job): JsonResponse
    {
        $this->authorizeOwn($request, $job);
        $employer = $request->user();

        $applications = $job->applications()->with('worker.workerProfile')->latest('id')->get();
        $access = EmpleoAccess::unlocked($employer, $applications->pluck('worker_id')->all());

        // Opening the list is the company seeing them.
        $job->applications()->where('status', 'new')->update(['status' => 'seen']);

        return response()->json([
            'data' => $applications->map(function (Application $a) use ($access) {
                $unlocked = array_key_exists($a->worker_id, $access);

                return Present::application($a, $unlocked, $access[$a->worker_id] ?? null);
            })->values(),
            'meta' => ['unlocked' => $job->isUnlocked(), 'unlocked_until' => $job->unlocked_until?->toIso8601String()],
        ]);
    }

    public function updateApplication(Request $request, Application $application): JsonResponse
    {
        abort_unless($application->jobPost->employer_id === $request->user()->id, 404);
        $data = $request->validate(['status' => ['required', Rule::in(['seen', 'shortlisted', 'rejected', 'hired'])]]);
        $application->update($data);

        return response()->json(['data' => ['id' => $application->id, 'status' => $application->status]]);
    }

    /** Open the chat with an applicant: only on an unlocked offer. */
    public function openChat(Request $request, Application $application): JsonResponse
    {
        $employer = $request->user();
        $post = $application->jobPost;
        abort_unless($post->employer_id === $employer->id, 404);

        if (! $post->isUnlocked() && ! EmpleoAccess::isUnlocked($employer, $application->worker)) {
            return response()->json(['message' => __('Activa la oferta para chatear con sus candidatos.'), 'code' => 'offer_locked'], 402);
        }

        $conversation = Chat::open('empleo', $employer, $application->worker, $post->id);

        return response()->json(['data' => ['conversation_id' => $conversation->id]]);
    }

    private function authorizeOwn(Request $request, JobPost $job): void
    {
        abort_unless($job->employer_id === $request->user()->id, 404);
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'min:5', 'max:140'],
            'trade' => ['required', Rule::in(AuthController::trades())],
            'province' => ['required', Rule::in(array_keys(config('provinces')))],
            'city' => ['nullable', 'string', 'max:120'],
            'contract_type' => ['required', Rule::in(JobPost::CONTRACT_TYPES)],
            'workday' => ['required', Rule::in(JobPost::WORKDAYS)],
            'salary_min' => ['nullable', 'integer', 'min:0', 'max:500000'],
            'salary_max' => ['nullable', 'integer', 'min:0', 'max:500000', 'gte:salary_min'],
            'salary_period' => ['required', Rule::in(JobPost::SALARY_PERIODS)],
            'start' => ['required', Rule::in(JobPost::STARTS)],
            'vacancies' => ['required', 'integer', 'min:1', 'max:500'],
            'experience_min' => ['required', 'integer', 'min:0', 'max:40'],
            'description' => ['required', 'string', 'min:30', 'max:5000'],
            'requirements' => ['nullable', 'string', 'max:3000'],
            'requires_tpc' => ['boolean'],
            'requires_license' => ['boolean'],
            'accommodation' => ['boolean'],
        ]);

        return $data;
    }
}
