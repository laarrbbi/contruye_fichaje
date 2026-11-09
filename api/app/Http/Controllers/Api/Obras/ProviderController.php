<?php

namespace App\Http\Controllers\Api\Obras;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Project;
use App\Models\ProjectUnlock;
use App\Models\User;
use App\Services\Chat;
use App\Services\Credits;
use App\Support\Present;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use RuntimeException;

/**
 * A company that does the work: the requests of its trades and areas, which
 * it reads for free and unlocks with credits.
 */
class ProviderController extends Controller
{
    public function profile(Request $request): JsonResponse
    {
        return response()->json(['data' => Present::user($request->user()->load('providerProfile'))]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company_name' => ['required', 'string', 'max:160'],
            'cif' => ['nullable', 'string', 'max:16', 'regex:/^[A-Za-z0-9]{8,10}$/'],
            'categories' => ['required', 'array', 'min:1'],
            'categories.*' => [Rule::in(config('obras.categories'))],
            'provinces' => ['required', 'array', 'min:1'],
            'provinces.*' => [Rule::in(array_keys(config('provinces')))],
            'description' => ['nullable', 'string', 'max:2000'],
            'founded_year' => ['nullable', 'integer', 'min:1900', 'max:'.now()->year],
            'website' => ['nullable', 'url', 'max:255'],
            'listed' => ['boolean'],
        ]);
        $data['categories'] = array_values(array_unique($data['categories']));
        $data['provinces'] = array_values(array_unique(array_map('strval', $data['provinces'])));

        $user = $request->user();
        $user->providerProfile()->updateOrCreate(['user_id' => $user->id], $data);

        return response()->json(['data' => Present::user($user->fresh('providerProfile'))]);
    }

    /** Open requests. `matching=1` (the default screen): only the company's trades and areas. */
    public function leads(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'category' => ['nullable', 'string', 'max:32'],
            'province' => ['nullable', 'string', 'size:2'],
            'matching' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);
        $provider = $request->user();
        $profile = $provider->providerProfile;

        $query = Project::query()->open()->with('client');
        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        } elseif (! empty($filters['matching']) && $profile) {
            $query->whereIn('category', $profile->categories ?? []);
        }
        if (! empty($filters['province'])) {
            $query->where('province', $filters['province']);
        } elseif (! empty($filters['matching']) && $profile) {
            $query->whereIn('province', $profile->provinces ?? []);
        }

        $page = $query->latest('id')->paginate(20);
        $access = $this->access($provider, $page->pluck('id')->all());

        return response()->json([
            'data' => $page->getCollection()->map(fn (Project $p) => Present::lead($p, isset($access[$p->id]), $access[$p->id] ?? null))->values(),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total(), 'credits' => $provider->credits],
        ]);
    }

    public function lead(Request $request, Project $project): JsonResponse
    {
        $access = $this->access($request->user(), [$project->id]);
        $unlocked = isset($access[$project->id]);
        abort_if(! $unlocked && ! $project->isOpen(), 404);

        return response()->json(['data' => Present::lead($project->load('client'), $unlocked, $access[$project->id] ?? null)]);
    }

    /** Unlock a request: credits spent, the client's contact shown, the chat opened. */
    public function unlock(Request $request, Project $project): JsonResponse
    {
        $provider = $request->user();

        try {
            DB::transaction(function () use ($provider, $project) {
                $locked = Project::query()->lockForUpdate()->findOrFail($project->id);
                if (ProjectUnlock::query()->where('project_id', $locked->id)->where('provider_id', $provider->id)->exists()) {
                    return;
                }
                if (! $locked->isOpen()) {
                    throw new RuntimeException('closed');
                }
                if ($locked->isFull()) {
                    throw new RuntimeException('full');
                }
                $cost = $locked->cost();
                Credits::spend($provider, $cost, 'unlock', 'project:'.$locked->id);
                ProjectUnlock::create(['project_id' => $locked->id, 'provider_id' => $provider->id, 'credits' => $cost]);
                $locked->increment('unlocks_count');
            });
        } catch (RuntimeException $e) {
            return match ($e->getMessage()) {
                'insufficient_credits' => response()->json(['message' => __('No tienes créditos suficientes para esta solicitud.'), 'code' => 'insufficient_credits'], 402),
                'full' => response()->json(['message' => __('Esta solicitud ya ha recibido el máximo de empresas.'), 'code' => 'full'], 409),
                'closed' => response()->json(['message' => __('Esta solicitud ya está cerrada.'), 'code' => 'closed'], 409),
                default => throw $e,
            };
        }

        $conversation = Chat::open('obras', $provider, $project->client, null, $project->id);
        $project->refresh()->load('client');

        return response()->json(['data' => Present::lead($project, true, $conversation->id) + ['credits' => $provider->fresh()->credits]]);
    }

    public function unlocked(Request $request): JsonResponse
    {
        $provider = $request->user();
        $unlocks = ProjectUnlock::query()->where('provider_id', $provider->id)->with('project.client')->latest('id')->get();
        $access = $this->access($provider, $unlocks->pluck('project_id')->all());

        return response()->json(['data' => $unlocks->map(fn (ProjectUnlock $u) => Present::lead($u->project, true, $access[$u->project_id] ?? null) + [
            'unlocked_at' => $u->created_at?->toIso8601String(),
            'credits_spent' => $u->credits,
        ])->values()]);
    }

    /**
     * @param  list<int>  $projectIds
     * @return array<int, int|null> unlocked project id => conversation id
     */
    private function access(User $provider, array $projectIds): array
    {
        if ($projectIds === []) {
            return [];
        }
        $unlocked = ProjectUnlock::query()->where('provider_id', $provider->id)->whereIn('project_id', $projectIds)
            ->with('project:id,client_id')->get();
        $chats = Conversation::query()->where('platform', 'obras')->where('opener_id', $provider->id)
            ->whereIn('member_id', $unlocked->pluck('project.client_id'))->pluck('id', 'member_id');

        $result = [];
        foreach ($unlocked as $u) {
            $result[$u->project_id] = $chats[$u->project->client_id] ?? null;
        }

        return $result;
    }
}
