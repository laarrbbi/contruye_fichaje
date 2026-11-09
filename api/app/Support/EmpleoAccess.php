<?php

namespace App\Support;

use App\Models\Application;
use App\Models\Conversation;
use App\Models\JobPost;
use App\Models\User;
use App\Models\WorkerContact;

/**
 * Which workers an employer has paid to reach. A worker is unlocked for a
 * company when the company already has a chat with them, contacted them from
 * the directory with a credit, or the worker applied to one of the company's
 * offers while that offer is unlocked (paid, or under the company's pass).
 */
class EmpleoAccess
{
    /**
     * @param  list<int>  $workerIds
     * @return array<int, int|null> unlocked worker id => conversation id (or null)
     */
    public static function unlocked(User $employer, array $workerIds): array
    {
        if ($workerIds === []) {
            return [];
        }

        $result = [];

        Conversation::query()
            ->where('platform', 'empleo')
            ->where('opener_id', $employer->id)
            ->whereIn('member_id', $workerIds)
            ->get(['id', 'member_id'])
            ->each(function ($c) use (&$result) {
                $result[$c->member_id] = $c->id;
            });

        WorkerContact::query()
            ->where('employer_id', $employer->id)
            ->whereIn('worker_id', $workerIds)
            ->pluck('worker_id')
            ->each(function ($id) use (&$result) {
                $result[$id] ??= null;
            });

        $passActive = $employer->hasActivePass();
        Application::query()
            ->whereIn('worker_id', $workerIds)
            ->whereHas('jobPost', function ($q) use ($employer, $passActive) {
                $q->where('employer_id', $employer->id);
                if (! $passActive) {
                    $q->where('unlocked_until', '>', now());
                }
            })
            ->pluck('worker_id')
            ->each(function ($id) use (&$result) {
                $result[$id] ??= null;
            });

        return $result;
    }

    public static function isUnlocked(User $employer, User $worker): bool
    {
        return array_key_exists($worker->id, self::unlocked($employer, [$worker->id]));
    }

    public static function owns(User $employer, JobPost $post): bool
    {
        return $post->employer_id === $employer->id;
    }
}
