<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\User;
use App\Notifications\ChatOpened;

/**
 * Opens (or finds) the one conversation between a paying side and the other.
 * Callers check the right to open it first: this only creates it.
 */
class Chat
{
    public static function open(string $platform, User $opener, User $member, ?int $jobPostId = null, ?int $projectId = null): Conversation
    {
        $conversation = Conversation::query()->firstOrCreate(
            ['opener_id' => $opener->id, 'member_id' => $member->id, 'platform' => $platform],
            ['job_post_id' => $jobPostId, 'project_id' => $projectId],
        );

        if ($conversation->wasRecentlyCreated) {
            $member->notify(new ChatOpened($conversation));
        }

        return $conversation;
    }
}
