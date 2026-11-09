<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Support\Present;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The chats. A conversation exists only once the paying side unlocked it, so
 * whoever is in one may write in it, both ways.
 */
class ConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $conversations = Conversation::query()
            ->where(fn ($q) => $q->where('opener_id', $user->id)->orWhere('member_id', $user->id))
            ->with(['opener.employerProfile', 'opener.providerProfile', 'member.employerProfile', 'member.providerProfile', 'jobPost:id,title', 'project:id,title'])
            ->orderByDesc('last_message_at')
            ->latest('id')
            ->limit(200)
            ->get();

        $unread = Message::query()
            ->whereIn('conversation_id', $conversations->pluck('id'))
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->selectRaw('conversation_id, count(*) as n')
            ->groupBy('conversation_id')
            ->pluck('n', 'conversation_id');

        return response()->json(['data' => $conversations->map(fn (Conversation $c) => Present::conversation($c, $user, (int) ($unread[$c->id] ?? 0)))->values()]);
    }

    /** The messages (all, or those after `after`), marking the other side's as read. */
    public function show(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();
        abort_unless($conversation->involves($user), 404);
        $after = (int) $request->query('after', 0);

        $messages = $conversation->messages()
            ->when($after > 0, fn ($q) => $q->where('id', '>', $after))
            ->orderBy('id')
            ->limit(500)
            ->get();

        $conversation->messages()->where('sender_id', '!=', $user->id)->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json([
            'data' => $messages->map(fn (Message $m) => [
                'id' => $m->id,
                'body' => $m->body,
                'mine' => $m->sender_id === $user->id,
                'at' => $m->created_at?->toIso8601String(),
                'read' => $m->read_at !== null,
            ])->values(),
            'conversation' => Present::conversation($conversation->load(['opener.employerProfile', 'opener.providerProfile', 'member.employerProfile', 'member.providerProfile', 'jobPost', 'project']), $user),
        ]);
    }

    public function send(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();
        abort_unless($conversation->involves($user), 404);
        $data = $request->validate(['body' => ['required', 'string', 'max:2000']]);
        $body = trim($data['body']);
        abort_if($body === '', 422, __('El mensaje está vacío.'));

        $message = $conversation->messages()->create(['sender_id' => $user->id, 'body' => $body]);
        $conversation->forceFill(['last_message_at' => $message->created_at])->save();

        return response()->json(['data' => [
            'id' => $message->id,
            'body' => $message->body,
            'mine' => true,
            'at' => $message->created_at?->toIso8601String(),
            'read' => false,
        ]], 201);
    }

    /** What the header's badges count. */
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $unread = Message::query()
            ->whereHas('conversation', fn ($q) => $q->where('opener_id', $user->id)->orWhere('member_id', $user->id))
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->count();

        $newApplications = $user->role === User::EMPLOYER
            ? Application::query()->where('status', 'new')->whereHas('jobPost', fn ($q) => $q->where('employer_id', $user->id))->count()
            : 0;

        return response()->json(['data' => [
            'unread' => $unread,
            'new_applications' => $newApplications,
            'credits' => $user->credits,
            'pass_until' => $user->pass_until?->toIso8601String(),
        ]]);
    }
}
