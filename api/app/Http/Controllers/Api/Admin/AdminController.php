<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\JobPost;
use App\Models\Order;
use App\Models\Project;
use App\Models\ProjectUnlock;
use App\Models\User;
use App\Services\Credits;
use App\Support\Like;
use App\Support\Present;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** The owner's panel: figures, accounts, payments, offers and requests. */
class AdminController extends Controller
{
    public function stats(): JsonResponse
    {
        $monthStart = now()->startOfMonth();
        $paid = Order::query()->where('status', 'paid');

        return response()->json(['data' => [
            'users' => User::query()->selectRaw('role, count(*) as n')->groupBy('role')->pluck('n', 'role'),
            'jobs_live' => JobPost::query()->live()->count(),
            'jobs_unlocked' => JobPost::query()->where('unlocked_until', '>', now())->count(),
            'applications' => Application::query()->count(),
            'applications_month' => Application::query()->where('created_at', '>=', $monthStart)->count(),
            'projects_open' => Project::query()->open()->count(),
            'project_unlocks' => ProjectUnlock::query()->count(),
            'revenue_c' => (int) (clone $paid)->sum('amount_c'),
            'revenue_month_c' => (int) (clone $paid)->where('paid_at', '>=', $monthStart)->sum('amount_c'),
            'revenue_by_product' => (clone $paid)->selectRaw('product, sum(amount_c) as c, count(*) as n')->groupBy('product')->get(),
        ]]);
    }

    public function users(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:80'],
            'role' => ['nullable', Rule::in([...User::SIGNUP_ROLES, User::ADMIN])],
        ]);
        $query = User::query()->with(['employerProfile', 'providerProfile', 'workerProfile']);
        if (! empty($filters['q'])) {
            $term = Like::contains($filters['q']);
            $query->where(fn ($q) => $q->where('name', 'like', $term)->orWhere('email', 'like', $term));
        }
        if (! empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }
        $page = $query->latest('id')->paginate(30);

        return response()->json([
            'data' => $page->getCollection()->map(fn (User $u) => Present::user($u) + [
                'blocked' => $u->blocked_at !== null,
                'created_at' => $u->created_at?->toIso8601String(),
            ])->values(),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
        ]);
    }

    public function block(Request $request, User $user): JsonResponse
    {
        abort_if($user->isAdmin(), 422, __('Una cuenta de administración no se bloquea desde aquí.'));
        $data = $request->validate(['blocked' => ['required', 'boolean']]);
        $user->forceFill(['blocked_at' => $data['blocked'] ? now() : null])->save();
        if ($data['blocked']) {
            $user->tokens()->delete();
        }

        return response()->json(['data' => ['id' => $user->id, 'blocked' => $user->blocked_at !== null]]);
    }

    public function grant(Request $request, User $user): JsonResponse
    {
        abort_unless(in_array($user->role, [User::EMPLOYER, User::PROVIDER], true), 422);
        $data = $request->validate(['credits' => ['required', 'integer', 'min:1', 'max:500'], 'note' => ['nullable', 'string', 'max:64']]);
        Credits::grant($user, $data['credits'], 'grant', null, $data['note'] ?? 'admin:'.$request->user()->id);

        return response()->json(['data' => ['id' => $user->id, 'credits' => $user->fresh()->credits]]);
    }

    public function orders(Request $request): JsonResponse
    {
        $status = $request->validate(['status' => ['nullable', Rule::in(['pending', 'paid', 'cancelled'])]])['status'] ?? null;
        $page = Order::query()->with(['user', 'jobPost:id,title'])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->latest('id')->paginate(30);

        return response()->json([
            'data' => $page->getCollection()->map(fn (Order $o) => Present::order($o) + [
                'user' => ['id' => $o->user->id, 'name' => $o->user->name, 'email' => $o->user->email, 'role' => $o->user->role],
            ])->values(),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
        ]);
    }

    public function jobs(Request $request): JsonResponse
    {
        $page = JobPost::query()->with('employer.employerProfile')->withCount('applications')->latest('id')->paginate(30);

        return response()->json([
            'data' => $page->getCollection()->map(fn (JobPost $p) => Present::ownJob($p))->values(),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
        ]);
    }

    public function closeJob(JobPost $job): JsonResponse
    {
        $job->update(['status' => 'closed']);

        return response()->json(['data' => ['id' => $job->id, 'status' => 'closed']]);
    }

    public function projects(Request $request): JsonResponse
    {
        $page = Project::query()->with('client')->latest('id')->paginate(30);

        return response()->json([
            'data' => $page->getCollection()->map(fn (Project $p) => Present::ownProject($p) + [
                'client' => ['id' => $p->client->id, 'name' => $p->client->name, 'email' => $p->client->email],
            ])->values(),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
        ]);
    }

    public function closeProject(Project $project): JsonResponse
    {
        $project->update(['status' => 'closed']);

        return response()->json(['data' => ['id' => $project->id, 'status' => 'closed']]);
    }
}
