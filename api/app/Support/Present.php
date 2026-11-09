<?php

namespace App\Support;

use App\Models\Application;
use App\Models\Conversation;
use App\Models\JobPost;
use App\Models\Order;
use App\Models\Project;
use App\Models\ProviderProfile;
use App\Models\User;

/**
 * The JSON shapes the SPA reads. What crosses the paywall is decided here:
 * a locked worker or client never carries a full name, a phone or an e-mail.
 */
class Present
{
    public static function user(User $user): array
    {
        $profile = match ($user->role) {
            User::WORKER => $user->workerProfile ? self::workerProfile($user) : null,
            User::EMPLOYER => $user->employerProfile?->only(['company_name', 'cif', 'sector', 'size', 'description', 'website']),
            User::PROVIDER => $user->providerProfile?->only(['company_name', 'cif', 'categories', 'provinces', 'description', 'founded_year', 'website', 'listed']),
            default => null,
        };

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'platform' => $user->platform(),
            'locale' => $user->locale,
            'province' => $user->province,
            'city' => $user->city,
            'credits' => $user->credits,
            'pass_until' => $user->pass_until?->toIso8601String(),
            'profile' => $profile,
        ];
    }

    private static function workerProfile(User $user): array
    {
        $p = $user->workerProfile;

        return [
            'trade' => $p->trade,
            'other_trades' => $p->other_trades ?? [],
            'years_experience' => $p->years_experience,
            'headline' => $p->headline,
            'bio' => $p->bio,
            'availability' => $p->availability,
            'has_tpc' => $p->has_tpc,
            'prl_training' => $p->prl_training,
            'driving_license' => $p->driving_license,
            'own_vehicle' => $p->own_vehicle,
            'work_permit' => $p->work_permit,
            'willing_to_travel' => $p->willing_to_travel,
            'languages' => $p->languages ?? [],
            'visible' => $p->visible,
        ];
    }

    /**
     * A worker as a company sees them. Locked: first name and initial, the
     * trade and the experience, the presentation with any contact masked.
     * Unlocked: the full name, phone and e-mail too.
     */
    public static function worker(User $worker, bool $unlocked, ?int $conversationId = null): array
    {
        $profile = $worker->workerProfile ? self::workerProfile($worker) : null;
        if ($profile && ! $unlocked) {
            $profile['bio'] = Redact::contacts($profile['bio']);
            $profile['headline'] = Redact::contacts($profile['headline']);
        }
        unset($profile['visible']);

        return [
            'id' => $worker->id,
            'name' => $unlocked ? $worker->name : $worker->shortName(),
            'initials' => self::initials($worker->name),
            'province' => $worker->province,
            'city' => $worker->city,
            'profile' => $profile,
            'unlocked' => $unlocked,
            'phone' => $unlocked ? $worker->phone : null,
            'email' => $unlocked ? $worker->email : null,
            'conversation_id' => $conversationId,
            'member_since' => $worker->created_at?->toDateString(),
        ];
    }

    public static function job(JobPost $post, array $extra = []): array
    {
        $employer = $post->employer;
        $company = $employer?->employerProfile;

        return [
            'id' => $post->id,
            'title' => $post->title,
            'trade' => $post->trade,
            'province' => $post->province,
            'city' => $post->city,
            'contract_type' => $post->contract_type,
            'workday' => $post->workday,
            'salary_min' => $post->salary_min,
            'salary_max' => $post->salary_max,
            'salary_period' => $post->salary_period,
            'start' => $post->start,
            'vacancies' => $post->vacancies,
            'experience_min' => $post->experience_min,
            'description' => $post->description,
            'requirements' => $post->requirements,
            'requires_tpc' => $post->requires_tpc,
            'requires_license' => $post->requires_license,
            'accommodation' => $post->accommodation,
            'status' => $post->status,
            'featured' => $post->isFeatured(),
            'published_at' => $post->created_at?->toIso8601String(),
            'expires_at' => $post->expires_at?->toIso8601String(),
            'company' => [
                'name' => $company?->company_name ?? $employer?->name,
                'sector' => $company?->sector,
                'size' => $company?->size,
                'description' => $company?->description,
                'website' => $company?->website,
            ],
        ] + $extra;
    }

    /** An offer as its own company sees it, with the paywall's state. */
    public static function ownJob(JobPost $post): array
    {
        return self::job($post, [
            'unlocked' => $post->isUnlocked(),
            'unlocked_until' => $post->unlocked_until?->toIso8601String(),
            'featured_until' => $post->featured_until?->toIso8601String(),
            'applications_count' => (int) ($post->applications_count ?? $post->applications()->count()),
            'new_applications_count' => (int) ($post->new_applications_count ?? $post->applications()->where('status', 'new')->count()),
            'views' => $post->views,
        ]);
    }

    public static function application(Application $application, bool $unlocked, ?int $conversationId = null): array
    {
        return [
            'id' => $application->id,
            'status' => $application->status,
            'message' => $unlocked ? $application->message : Redact::contacts($application->message),
            'applied_at' => $application->created_at?->toIso8601String(),
            'worker' => self::worker($application->worker, $unlocked, $conversationId),
        ];
    }

    /**
     * A request as a company sees it. Locked: the work, the area, the budget,
     * the client's first name. Unlocked: who they are and how to reach them.
     */
    public static function lead(Project $project, bool $unlocked, ?int $conversationId = null): array
    {
        $client = $project->client;

        return [
            'id' => $project->id,
            'title' => $project->title,
            'category' => $project->category,
            'description' => $unlocked ? $project->description : Redact::contacts($project->description),
            'province' => $project->province,
            'city' => $project->city,
            'postal_code' => $unlocked ? $project->postal_code : null,
            'property_type' => $project->property_type,
            'budget' => $project->budget,
            'timing' => $project->timing,
            'status' => $project->status,
            'published_at' => $project->created_at?->toIso8601String(),
            'unlocks_count' => $project->unlocks_count,
            'max_unlocks' => (int) config('obras.max_unlocks'),
            'cost' => $project->cost(),
            'full' => $project->isFull(),
            'unlocked' => $unlocked,
            'conversation_id' => $conversationId,
            'client' => [
                'name' => $unlocked ? $client->name : strtok($client->name, ' '),
                'initials' => self::initials($client->name),
                'phone' => $unlocked ? $client->phone : null,
                'email' => $unlocked ? $client->email : null,
            ],
        ];
    }

    /** A request as the person who wrote it sees it. */
    public static function ownProject(Project $project): array
    {
        return [
            'id' => $project->id,
            'title' => $project->title,
            'category' => $project->category,
            'description' => $project->description,
            'province' => $project->province,
            'city' => $project->city,
            'postal_code' => $project->postal_code,
            'property_type' => $project->property_type,
            'budget' => $project->budget,
            'timing' => $project->timing,
            'status' => $project->status,
            'published_at' => $project->created_at?->toIso8601String(),
            'expires_at' => $project->expires_at?->toIso8601String(),
            'unlocks_count' => $project->unlocks_count,
            'max_unlocks' => (int) config('obras.max_unlocks'),
        ];
    }

    public static function provider(ProviderProfile $profile): array
    {
        return [
            'id' => $profile->user_id,
            'company_name' => $profile->company_name,
            'categories' => $profile->categories ?? [],
            'provinces' => $profile->provinces ?? [],
            'description' => Redact::contacts($profile->description),
            'founded_year' => $profile->founded_year,
            'initials' => self::initials($profile->company_name),
        ];
    }

    public static function conversation(Conversation $conversation, User $viewer, int $unread = 0): array
    {
        $other = $conversation->otherParty($viewer);
        $company = $other->employerProfile?->company_name ?? $other->providerProfile?->company_name;
        $last = $conversation->messages()->latest('id')->first();

        return [
            'id' => $conversation->id,
            'platform' => $conversation->platform,
            'other' => [
                'id' => $other->id,
                'name' => $company ?? $other->name,
                'person' => $other->name,
                'role' => $other->role,
                'initials' => self::initials($company ?? $other->name),
                'phone' => $other->phone,
                'email' => $other->email,
            ],
            'context' => $conversation->jobPost
                ? ['type' => 'job', 'id' => $conversation->job_post_id, 'title' => $conversation->jobPost->title]
                : ($conversation->project
                    ? ['type' => 'project', 'id' => $conversation->project_id, 'title' => $conversation->project->title]
                    : null),
            'last_message' => $last ? [
                'body' => mb_strimwidth($last->body, 0, 140, '…'),
                'mine' => $last->sender_id === $viewer->id,
                'at' => $last->created_at?->toIso8601String(),
            ] : null,
            'unread' => $unread,
            'last_message_at' => $conversation->last_message_at?->toIso8601String(),
            'created_at' => $conversation->created_at?->toIso8601String(),
        ];
    }

    public static function order(Order $order): array
    {
        return [
            'id' => $order->id,
            'product' => $order->product,
            'job_post' => $order->jobPost ? ['id' => $order->jobPost->id, 'title' => $order->jobPost->title] : null,
            'amount_c' => $order->amount_c,
            'base_c' => $order->base_c,
            'vat_c' => $order->vat_c,
            'status' => $order->status,
            'method' => $order->method,
            'created_at' => $order->created_at?->toIso8601String(),
            'paid_at' => $order->paid_at?->toIso8601String(),
        ];
    }

    public static function initials(string $name): string
    {
        $words = array_values(array_filter(preg_split('/\s+/u', trim($name)) ?: []));
        $picked = count($words) > 1 ? [$words[0], $words[count($words) - 1]] : $words;

        return implode('', array_map(fn ($w) => mb_strtoupper(mb_substr($w, 0, 1)), $picked));
    }
}
