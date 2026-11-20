import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ChatMessage } from '../../../core/models/chat.model';
import { ChatApiService } from '../../../core/services/chat-api.service';

@Component({
  selector: 'app-ai-coach',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button class="coach-toggle" type="button" (click)="toggle()"
      [attr.aria-expanded]="isOpen()" aria-controls="ai-coach">
      <span class="coach-icon">✳</span>
      <span>{{ isOpen() ? 'Cerrar entrenador' : 'Entrenador IA' }}</span>
      <span class="online-dot"></span>
    </button>

    <aside class="coach-window" id="ai-coach" aria-label="Chat con el entrenador FranzFit"
      [hidden]="!isOpen()">
      <header class="coach-header">
        <div class="coach-avatar">✳</div>
        <div class="coach-title">
          <strong>Tu entrenador FranzFit</strong>
          <span><i></i> IA local · Gemma 3</span>
        </div>
        <button class="close-button" type="button" aria-label="Cerrar chat" (click)="isOpen.set(false)">×</button>
      </header>

      <div class="chat-messages" aria-live="polite" aria-relevant="additions text">
        @if (messages().length === 0) {
          <div class="welcome-message">
            <span>✳</span>
            <strong>¡Hola! ¿Qué entrenamos hoy?</strong>
            <p>Puedo ayudarte con rutinas, ejercicios y consejos generales para tu sesión.</p>
            <button type="button" (click)="askSuggestion()">Sugiere una rutina para hoy</button>
          </div>
        }
        @for (message of messages(); track $index) {
          <div class="message-row" [class.user-row]="message.role === 'user'"
            [class.error-row]="message.role === 'error'">
            <div class="message-bubble">{{ message.content }}</div>
          </div>
        }
        @if (isSending()) {
          <div class="message-row">
            <div class="message-bubble typing" aria-label="Gemma está escribiendo">
              <span></span><span></span><span></span>
            </div>
          </div>
        }
      </div>

      <form class="chat-form" (ngSubmit)="sendMessage()">
        <label class="sr-only" for="chat-message">Escribe tu mensaje para el entrenador</label>
        <textarea id="chat-message" name="message" [(ngModel)]="draft"
          placeholder="Pregúntame lo que necesites..." maxlength="2000" rows="2"
          [disabled]="isSending()" (keydown)="onKeyDown($event)"></textarea>
        <div class="chat-form-footer">
          <span>Consejos generales, no reemplaza a un profesional de salud.</span>
          <button type="submit" [disabled]="isSending() || !draft.trim()" aria-label="Enviar mensaje">↑</button>
        </div>
      </form>
    </aside>
  `,
  styles: [`
    :host { position: fixed; left: 260px; bottom: 28px; z-index: 11; }
    .coach-toggle { display: flex; align-items: center; gap: 9px; border: 1px solid #40503b; border-radius: 999px; padding: 11px 15px; background: #20281f; color: #f3f5ed; font: inherit; font-size: 12px; font-weight: 650; cursor: pointer; box-shadow: 0 10px 35px #0005; }
    .coach-icon { color: #c5f36b; font-size: 17px; }
    .online-dot,.coach-title i { width: 7px; height: 7px; border-radius: 50%; background: #c5f36b; box-shadow: 0 0 9px #c5f36b88; }
    .coach-window { position: absolute; left: 0; bottom: 55px; display: flex; width: min(370px,calc(100vw - 28px)); height: min(520px,calc(100vh - 190px)); min-height: 360px; flex-direction: column; overflow: hidden; border: 1px solid #364138; border-radius: 18px; background: #171d18; box-shadow: 0 18px 60px #0009; color: #f3f5ed; }
    .coach-window[hidden] { display: none; }
    .coach-header { display: flex; align-items: center; gap: 10px; padding: 15px; border-bottom: 1px solid #2c352d; }
    .coach-avatar { display: grid; width: 35px; height: 35px; place-items: center; border-radius: 50%; background: #2b3824; color: #c5f36b; font-size: 18px; }
    .coach-title { flex: 1; }
    .coach-title strong,.coach-title span { display: block; }
    .coach-title strong { font-size: 12px; }
    .coach-title span { display: flex; align-items: center; gap: 6px; margin-top: 5px; color: #92a08d; font-size: 9px; }
    .coach-title i { width: 5px; height: 5px; list-style: none; }
    .close-button { border: 0; background: transparent; color: #a5afa4; font-size: 24px; cursor: pointer; }
    .chat-messages { display: flex; flex: 1; flex-direction: column; gap: 11px; overflow-y: auto; padding: 16px 13px; }
    .welcome-message { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; padding: 10px; text-align: center; }
    .welcome-message > span { display: grid; width: 39px; height: 39px; place-items: center; margin-bottom: 12px; border-radius: 50%; background: #2b3824; color: #c5f36b; font-size: 19px; }
    .welcome-message strong { font-size: 14px; }
    .welcome-message p { max-width: 260px; color: #9ca69b; font-size: 11px; line-height: 1.6; }
    .welcome-message button { margin-top: 6px; border: 1px solid #41513a; border-radius: 9px; padding: 9px 11px; background: #222b20; color: #c5f36b; font: inherit; font-size: 10px; cursor: pointer; }
    .message-row { display: flex; justify-content: flex-start; }
    .message-row.user-row { justify-content: flex-end; }
    .message-bubble { max-width: 88%; padding: 10px 12px; border: 1px solid #303a30; border-radius: 12px 12px 12px 3px; background: #222923; color: #e0e6dc; font-size: 11px; line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; }
    .user-row .message-bubble { border-color: #3b4b30; border-radius: 12px 12px 3px 12px; background: #2b3824; color: #f0f3eb; }
    .error-row .message-bubble { border-color: #62403a; background: #352522; color: #ffc0b3; }
    .typing { display: flex; gap: 4px; padding: 13px; }
    .typing span { width: 5px; height: 5px; border-radius: 50%; background: #c5f36b; animation: pulse 1s infinite alternate; }
    .typing span:nth-child(2) { animation-delay: .2s; }
    .typing span:nth-child(3) { animation-delay: .4s; }
    @keyframes pulse { to { opacity: .25; transform: translateY(-3px); } }
    .chat-form { padding: 11px; border-top: 1px solid #2c352d; }
    textarea { display: block; width: 100%; resize: none; border: 1px solid #374239; border-radius: 10px; padding: 10px; background: #202821; color: #eef1e9; font: inherit; font-size: 11px; line-height: 1.5; }
    textarea:focus { outline: 1px solid #c5f36b; }
    textarea::placeholder { color: #7e8a7d; }
    .chat-form-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; }
    .chat-form-footer > span { color: #748073; font-size: 8px; }
    .chat-form-footer button { width: 32px; height: 32px; border: 0; border-radius: 8px; background: #c5f36b; color: #1c2517; font-size: 19px; font-weight: 700; cursor: pointer; }
    .chat-form-footer button:disabled { opacity: .4; cursor: not-allowed; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    @media (max-width: 1120px) { :host { left: 225px; } }
    @media (max-width: 850px) { :host { left: 82px; } }
    @media (max-width: 520px) { :host { left: 14px; bottom: 20px; } .coach-window { height: min(500px,calc(100vh - 170px)); } }
  `],
})
export class AiCoachComponent {
  private readonly chatApi = inject(ChatApiService);

  readonly isOpen = signal(false);
  readonly isSending = signal(false);
  readonly messages = signal<ChatMessage[]>([]);
  private readonly conversationId = signal<string | undefined>(undefined);
  draft = '';

  toggle(): void {
    this.isOpen.update((open) => !open);
  }

  askSuggestion(): void {
    this.draft = 'Sugiere una rutina para hoy.';
    this.sendMessage();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(): void {
    const message = this.draft.trim();
    if (!message || this.isSending()) return;

    this.messages.update((items) => [...items, { role: 'user', content: message }]);
    this.draft = '';
    this.isSending.set(true);

    this.chatApi
      .sendMessage({ message, conversationId: this.conversationId() })
      .pipe(finalize(() => this.isSending.set(false)))
      .subscribe({
        next: (response) => {
          this.conversationId.set(response.conversationId);
          this.messages.update((items) => [...items, { role: 'assistant', content: response.reply }]);
        },
        error: (error: unknown) => {
          const errorMessage = this.getErrorMessage(error);
          this.messages.update((items) => [...items, { role: 'error', content: errorMessage }]);
        },
      });
  }

  private getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const body = error.error;
      if (typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string') {
        return body.error;
      }
    }
    return 'No se pudo contactar al backend. Verifica que la API, Ollama y MySQL estén iniciados.';
  }
}
