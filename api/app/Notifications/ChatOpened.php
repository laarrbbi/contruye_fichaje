<?php

namespace App\Notifications;

use App\Models\Conversation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** To a worker or a client: a company has opened a chat with them. */
class ChatOpened extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Conversation $conversation) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $opener = $this->conversation->opener;
        $company = $opener->employerProfile?->company_name ?? $opener->providerProfile?->company_name ?? $opener->name;
        $url = rtrim((string) config('app.frontend_url'), '/').'/mensajes/'.$this->conversation->id;

        return (new MailMessage)
            ->subject(__(':company quiere hablar contigo', ['company' => $company]))
            ->greeting(__('Hola, :name', ['name' => strtok($notifiable->name, ' ')]))
            ->line($this->conversation->platform === 'empleo'
                ? __(':company ha abierto un chat contigo en Construye Fichaje por una oferta de trabajo.', ['company' => $company])
                : __(':company ha abierto un chat contigo en Construye Fichaje por tu solicitud de obra.', ['company' => $company]))
            ->action(__('Abrir el chat'), $url);
    }
}
