<?php

namespace App\Http\Controllers\Api\Obras;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Project;
use App\Models\ProjectUnlock;
use App\Support\Present;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** A person who wants a company: their requests and who answered. Always free. */
class ClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $projects = $request->user()->projects()->latest('id')->get();

        return response()->json(['data' => $projects->map(fn (Project $p) => Present::ownProject($p))->values()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['status'] = 'open';
        $data['expires_at'] = now()->addDays((int) config('obras.request_days'));
        $project = $request->user()->projects()->create($data);

        return response()->json(['data' => Present::ownProject($project)], 201);
    }

    /** The request, and the companies that unlocked it (they are the ones who will call). */
    public function show(Request $request, Project $project): JsonResponse
    {
        $this->authorizeOwn($request, $project);

        $unlocks = $project->unlocks()->with('provider.providerProfile')->latest('id')->get();
        $chats = Conversation::query()
            ->where('platform', 'obras')
            ->where('member_id', $request->user()->id)
            ->whereIn('opener_id', $unlocks->pluck('provider_id'))
            ->pluck('id', 'opener_id');

        return response()->json(['data' => Present::ownProject($project) + [
            'companies' => $unlocks->map(fn (ProjectUnlock $u) => [
                'unlocked_at' => $u->created_at?->toIso8601String(),
                'conversation_id' => $chats[$u->provider_id] ?? null,
                'company' => $u->provider->providerProfile ? Present::provider($u->provider->providerProfile) : ['id' => $u->provider_id, 'company_name' => $u->provider->name],
            ])->values(),
        ]]);
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $this->authorizeOwn($request, $project);
        $project->update($this->validated($request));

        return response()->json(['data' => Present::ownProject($project->fresh())]);
    }

    public function close(Request $request, Project $project): JsonResponse
    {
        $this->authorizeOwn($request, $project);
        $project->update(['status' => 'closed']);

        return response()->json(['data' => Present::ownProject($project->fresh())]);
    }

    private function authorizeOwn(Request $request, Project $project): void
    {
        abort_unless($project->client_id === $request->user()->id, 404);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'min:5', 'max:140'],
            'category' => ['required', Rule::in(config('obras.categories'))],
            'description' => ['required', 'string', 'min:30', 'max:5000'],
            'province' => ['required', Rule::in(array_keys(config('provinces')))],
            'city' => ['required', 'string', 'max:120'],
            'postal_code' => ['nullable', 'regex:/^\d{5}$/'],
            'property_type' => ['required', Rule::in(config('obras.property_types'))],
            'budget' => ['required', Rule::in(array_keys(config('obras.budgets')))],
            'timing' => ['required', Rule::in(config('obras.timings'))],
        ]);
    }
}
