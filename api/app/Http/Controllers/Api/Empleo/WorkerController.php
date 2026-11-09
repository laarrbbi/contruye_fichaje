<?php

namespace App\Http\Controllers\Api\Empleo;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Conversation;
use App\Models\JobPost;
use App\Notifications\NewApplication;
use App\Support\Present;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** A worker's own side: their profile, applying, their applications. Always free. */
class WorkerController extends Controller
{
    public function profile(Request $request): JsonResponse
    {
        return response()->json(['data' => Present::user($request->user()->load('workerProfile'))]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $trades = AuthController::trades();
        $data = $request->validate([
            'trade' => ['required', Rule::in($trades)],
            'other_trades' => ['nullable', 'array', 'max:5'],
            'other_trades.*' => [Rule::in($trades)],
            'years_experience' => ['required', 'integer', 'min:0', 'max:60'],
            'headline' => ['nullable', 'string', 'max:120'],
            'bio' => ['nullable', 'string', 'max:1500'],
            'availability' => ['required', Rule::in(['immediate', 'two_weeks', 'month', 'employed'])],
            'has_tpc' => ['boolean'],
            'prl_training' => ['nullable', Rule::in(['none', '20h', '60h', '300h'])],
            'driving_license' => ['boolean'],
            'own_vehicle' => ['boolean'],
            'work_permit' => ['boolean'],
            'willing_to_travel' => ['boolean'],
            'languages' => ['nullable', 'array', 'max:8'],
            'languages.*' => ['string', 'max:24'],
            'visible' => ['boolean'],
        ]);
        $data['other_trades'] = array_values(array_diff(array_unique($data['other_trades'] ?? []), [$data['trade']]));

        $user = $request->user();
        $user->workerProfile()->updateOrCreate(['user_id' => $user->id], $data);

        return response()->json(['data' => Present::user($user->fresh('workerProfile'))]);
    }

    /** One tap: the worker's profile is the CV. */
    public function apply(Request $request, JobPost $job): JsonResponse
    {
        $data = $request->validate(['message' => ['nullable', 'string', 'max:600']]);
        $worker = $request->user();

        if (! $job->isLive()) {
            abort(422, __('Esta oferta ya no admite candidaturas.'));
        }
        if (! $worker->workerProfile) {
            abort(422, __('Completa tu perfil antes de inscribirte.'));
        }

        $application = Application::query()->firstOrCreate(
            ['job_post_id' => $job->id, 'worker_id' => $worker->id],
            ['message' => $data['message'] ?? null, 'status' => 'new'],
        );

        if ($application->wasRecentlyCreated) {
            $job->employer->notify(new NewApplication($application));
        }

        return response()->json(['data' => ['id' => $application->id, 'status' => $application->status]], $application->wasRecentlyCreated ? 201 : 200);
    }

    public function applications(Request $request): JsonResponse
    {
        $worker = $request->user();
        $applications = Application::query()
            ->where('worker_id', $worker->id)
            ->with('jobPost.employer.employerProfile')
            ->latest('id')
            ->get();

        $chats = Conversation::query()
            ->where('platform', 'empleo')
            ->where('member_id', $worker->id)
            ->pluck('id', 'opener_id');

        return response()->json(['data' => $applications->map(fn (Application $a) => [
            'id' => $a->id,
            'status' => $a->status,
            'message' => $a->message,
            'applied_at' => $a->created_at?->toIso8601String(),
            'conversation_id' => $chats[$a->jobPost->employer_id] ?? null,
            'job' => Present::job($a->jobPost),
        ])->values()]);
    }

    public function withdraw(Request $request, Application $application): JsonResponse
    {
        abort_unless($application->worker_id === $request->user()->id, 404);
        $application->delete();

        return response()->json(null, 204);
    }
}
