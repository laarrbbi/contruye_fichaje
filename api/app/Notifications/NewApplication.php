<?php

namespace App\Notifications;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** To an employer: someone applied to one of their offers. */
class NewApplication extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Application $application) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $post = $this->application->jobPost;
        $url = rtrim((string) config('app.frontend_url'), '/').'/empresa/ofertas/'.$post->id;

        return (new MailMessage)
            ->subject(__('Nueva candidatura: :title', ['title' => $post->title]))
            ->greeting(__('Hola, :name', ['name' => strtok($notifiable->name, ' ')]))
            ->line(__(':worker se ha inscrito en tu oferta «:title».', [
                'worker' => $this->application->worker->shortName(),
                'title' => $post->title,
            ]))
            ->action(__('Ver candidatos'), $url);
    }
}
