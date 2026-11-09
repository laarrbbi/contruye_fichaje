<?php

namespace App\Services;

use App\Models\CreditMovement;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Contact credits (employers) and lead credits (providers). Every change is a
 * line in the ledger, written in the same transaction as the balance, under a
 * row lock: two clicks never spend the same credit twice.
 */
class Credits
{
    public static function grant(User $user, int $amount, string $reason, ?int $orderId = null, ?string $reference = null): void
    {
        DB::transaction(function () use ($user, $amount, $reason, $orderId, $reference) {
            $locked = User::query()->lockForUpdate()->findOrFail($user->id);
            $locked->increment('credits', $amount);
            CreditMovement::create([
                'user_id' => $user->id,
                'delta' => $amount,
                'reason' => $reason,
                'order_id' => $orderId,
                'reference' => $reference,
            ]);
        });
        $user->refresh();
    }

    /**
     * Spend credits, or throw when the balance is short. Call inside the
     * transaction that creates what was paid for, so both happen or neither.
     */
    public static function spend(User $user, int $amount, string $reason, string $reference): void
    {
        $locked = User::query()->lockForUpdate()->findOrFail($user->id);
        if ($locked->credits < $amount) {
            throw new RuntimeException('insufficient_credits');
        }
        $locked->decrement('credits', $amount);
        CreditMovement::create([
            'user_id' => $user->id,
            'delta' => -$amount,
            'reason' => $reason,
            'reference' => $reference,
        ]);
        $user->credits = $locked->credits;
    }
}
