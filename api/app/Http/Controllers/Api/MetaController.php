<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobPost;
use App\Services\Catalog;
use App\Services\StripeService;
use Illuminate\Http\JsonResponse;

/** The reference lists every screen needs: trades, provinces, prices. */
class MetaController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $products = [];
        foreach (Catalog::all() as $key => $product) {
            $products[] = Catalog::present($key, $product);
        }

        return response()->json(['data' => [
            'trade_groups' => config('trades.groups'),
            'provinces' => collect(config('provinces'))->map(fn ($name, $code) => ['code' => (string) $code, 'name' => $name])->values(),
            'contract_types' => JobPost::CONTRACT_TYPES,
            'workdays' => JobPost::WORKDAYS,
            'salary_periods' => JobPost::SALARY_PERIODS,
            'starts' => JobPost::STARTS,
            'obras' => [
                'categories' => config('obras.categories'),
                'property_types' => config('obras.property_types'),
                'timings' => config('obras.timings'),
                'budgets' => config('obras.budgets'),
                'max_unlocks' => (int) config('obras.max_unlocks'),
            ],
            'products' => $products,
            'vat_rate' => (int) config('catalog.vat_rate'),
            'payments' => [
                'stripe' => StripeService::isConfigured(),
                'simulated' => StripeService::simulationAllowed(),
            ],
        ]]);
    }
}
