<?php

namespace App\Http\Controllers\Api\Empleo;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\JobPost;
use App\Models\User;
use App\Support\Like;
use App\Support\Present;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** The public job board: anyone can search and read; workers apply. */
class JobController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:80'],
            'trade' => ['nullable', 'string', 'max:40'],
            'province' => ['nullable', 'string', 'size:2'],
            'contract_type' => ['nullable', 'string', 'max:20'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = JobPost::query()->live()->with('employer.employerProfile');

        if (! empty($filters['q'])) {
            $term = Like::contains($filters['q']);
            $query->where(fn ($q) => $q->where('title', 'like', $term)->orWhere('description', 'like', $term)->orWhere('city', 'like', $term));
        }
        foreach (['trade', 'province', 'contract_type'] as $field) {
            if (! empty($filters[$field])) {
                $query->where($field, $filters[$field]);
            }
        }

        // Premium offers first while their seal lasts, then the newest.
        $page = $query
            ->orderByRaw('CASE WHEN featured_until > ? THEN 0 ELSE 1 END', [now()])
            ->latest('id')
            ->paginate(20);

        $applied = $this->appliedIds($request->user(), $page->pluck('id')->all());

        return response()->json([
            'data' => $page->getCollection()->map(fn (JobPost $post) => Present::job($post, [
                'applied' => in_array($post->id, $applied, true),
            ]))->values(),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
        ]);
    }

    public function show(Request $request, JobPost $job): JsonResponse
    {
        $user = $request->user();
        $own = $user && $job->employer_id === $user->id;

        if (! $job->isLive() && ! $own && ! $user?->isAdmin()) {
            abort(404);
        }
        if (! $own) {
            JobPost::query()->whereKey($job->id)->increment('views');
        }

        $application = $user?->role === User::WORKER
            ? Application::query()->where('job_post_id', $job->id)->where('worker_id', $user->id)->first()
            : null;

        $job->load('employer.employerProfile');

        return response()->json(['data' => Present::job($job, [
            'applied' => $application !== null,
            'application_status' => $application?->status,
            'own' => $own,
        ])]);
    }

    /** @return list<int> */
    private function appliedIds(?User $user, array $jobIds): array
    {
        if ($user?->role !== User::WORKER || $jobIds === []) {
            return [];
        }

        return Application::query()->where('worker_id', $user->id)->whereIn('job_post_id', $jobIds)->pluck('job_post_id')->all();
    }
}
