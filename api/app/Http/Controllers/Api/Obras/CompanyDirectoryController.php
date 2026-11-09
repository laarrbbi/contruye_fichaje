<?php

namespace App\Http\Controllers\Api\Obras;

use App\Http\Controllers\Controller;
use App\Models\ProviderProfile;
use App\Support\Present;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The public list of companies that do the work, for people to browse. No
 * contact on it: a person reaches companies by publishing their request.
 */
class CompanyDirectoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'category' => ['nullable', 'string', 'max:32'],
            'province' => ['nullable', 'string', 'size:2'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = ProviderProfile::query()
            ->where('listed', true)
            ->whereHas('user', fn ($q) => $q->whereNull('blocked_at'));
        if (! empty($filters['category'])) {
            $query->whereJsonContains('categories', $filters['category']);
        }
        if (! empty($filters['province'])) {
            $query->whereJsonContains('provinces', $filters['province']);
        }

        $page = $query->orderBy('company_name')->paginate(24);

        return response()->json([
            'data' => $page->getCollection()->map(fn (ProviderProfile $p) => Present::provider($p))->values(),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
        ]);
    }
}
