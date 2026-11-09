<?php

namespace App\Http\Controllers\Api\Empleo;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\WorkerContact;
use App\Services\Chat;
use App\Services\Credits;
use App\Support\EmpleoAccess;
use App\Support\Like;
use App\Support\Present;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * The workers' directory, for companies: search for free, contact with a
 * credit. Only workers who chose to be visible are in it.
 */
class DirectoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:80'],
            'trade' => ['nullable', 'string', 'max:40'],
            'province' => ['nullable', 'string', 'size:2'],
            'availability' => ['nullable', 'string', 'max:16'],
            'has_tpc' => ['nullable', 'boolean'],
            'min_years' => ['nullable', 'integer', 'min:0', 'max:60'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = User::query()
            ->where('role', User::WORKER)
            ->whereNull('blocked_at')
            ->whereHas('workerProfile', function ($q) use ($filters) {
                $q->where('visible', true);
                if (! empty($filters['trade'])) {
                    $q->where(fn ($t) => $t->where('trade', $filters['trade'])->orWhereJsonContains('other_trades', $filters['trade']));
                }
                if (! empty($filters['availability'])) {
                    $q->where('availability', $filters['availability']);
                }
                if (! empty($filters['has_tpc'])) {
                    $q->where('has_tpc', true);
                }
                if (! empty($filters['min_years'])) {
                    $q->where('years_experience', '>=', (int) $filters['min_years']);
                }
                if (! empty($filters['q'])) {
                    $term = Like::contains($filters['q']);
                    $q->where(fn ($t) => $t->where('headline', 'like', $term)->orWhere('bio', 'like', $term));
                }
            })
            ->with('workerProfile');

        if (! empty($filters['province'])) {
            $query->where('province', $filters['province']);
        }

        $page = $query->latest('id')->paginate(20);
        $access = EmpleoAccess::unlocked($request->user(), $page->pluck('id')->all());

        return response()->json([
            'data' => $page->getCollection()->map(fn (User $w) => Present::worker($w, array_key_exists($w->id, $access), $access[$w->id] ?? null))->values(),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
        ]);
    }

    public function show(Request $request, User $worker): JsonResponse
    {
        $this->ensureListed($worker);
        $access = EmpleoAccess::unlocked($request->user(), [$worker->id]);

        return response()->json(['data' => Present::worker($worker->load('workerProfile'), array_key_exists($worker->id, $access), $access[$worker->id] ?? null)]);
    }

    /** Spend one contact credit (unless already unlocked) and open the chat. */
    public function contact(Request $request, User $worker): JsonResponse
    {
        $this->ensureListed($worker);
        $employer = $request->user();

        if (! EmpleoAccess::isUnlocked($employer, $worker)) {
            try {
                DB::transaction(function () use ($employer, $worker) {
                    $contact = WorkerContact::query()->firstOrCreate(['employer_id' => $employer->id, 'worker_id' => $worker->id]);
                    if ($contact->wasRecentlyCreated) {
                        Credits::spend($employer, 1, 'contact', 'worker:'.$worker->id);
                    }
                });
            } catch (RuntimeException $e) {
                if ($e->getMessage() !== 'insufficient_credits') {
                    throw $e;
                }

                return response()->json(['message' => __('No te quedan contactos. Compra un pack para contactar con este trabajador.'), 'code' => 'insufficient_credits'], 402);
            }
        }

        $conversation = Chat::open('empleo', $employer, $worker);

        return response()->json(['data' => ['conversation_id' => $conversation->id, 'credits' => $employer->fresh()->credits]]);
    }

    private function ensureListed(User $worker): void
    {
        abort_unless($worker->role === User::WORKER && $worker->blocked_at === null && $worker->workerProfile?->visible, 404);
    }
}
