import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

interface YouTubePlayer {
  loadVideoById(videoId: string): void;
  pauseVideo(): void;
  destroy(): void;
}

interface YouTubePlayerErrorEvent {
  data: number;
}

interface YouTubePlayerApi {
  Player: new (
    target: HTMLElement,
    options: {
      videoId: string;
      playerVars: Record<string, string | number>;
      events: {
        onReady: () => void;
        onError: (event: YouTubePlayerErrorEvent) => void;
      };
    },
  ) => YouTubePlayer;
}

declare global {
  interface Window {
    YT?: YouTubePlayerApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubePlayerApi> | undefined;

@Component({
  selector: 'app-youtube-drawer',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button class="music-toggle" type="button" (click)="toggleDrawer()"
      [attr.aria-expanded]="isOpen()" aria-controls="music-drawer">
      <span class="music-icon">♫</span>
      <span>{{ isOpen() ? 'Cerrar rinconcito' : 'El rinconcito' }}</span>
      <span class="live-dot"></span>
    </button>

      <aside class="drawer" id="music-drawer" aria-label="Reproductor de YouTube" [hidden]="!isOpen()">
        <div class="drawer-heading">
          <div>
            <span class="eyebrow">TU BANDA SONORA</span>
            <h2>El rinconcito</h2>
          </div>
          <button type="button" class="close-button" aria-label="Cerrar reproductor"
            (click)="closeDrawer()">×</button>
        </div>
        <p class="drawer-copy">Empieza con Syn Cole — Feel Good (NCS) o pega otro enlace de YouTube.</p>
        <form class="url-form" (ngSubmit)="loadVideo()">
          <label for="youtube-url">Enlace de YouTube</label>
          <div class="url-input-row">
            <input id="youtube-url" name="youtubeUrl" [(ngModel)]="youtubeUrl"
              placeholder="Pega aquí el enlace" autocomplete="url">
            <button type="submit" aria-label="Cargar enlace">↗</button>
          </div>
          @if (error()) {
            <p class="error-message" role="alert">{{ error() }}</p>
          }
        </form>
        <div class="player-frame">
          @if (videoId()) {
            <div #playerHost class="player-host"></div>
            @if (!playerReady() && !playerError()) {
              <div class="player-loading" role="status">Conectando con YouTube...</div>
            }
            @if (playerError(); as message) {
              <div class="player-error" role="alert">
                <strong>No se pudo reproducir aquí</strong>
                <span>{{ message }}</span>
                @if (watchUrl(); as url) {
                  <a [href]="url" target="_blank" rel="noopener noreferrer">Abrir en YouTube ↗</a>
                }
              </div>
            }
          } @else {
            <div class="player-empty">
              <span>♫</span>
              <strong>Tu música, a tu ritmo</strong>
              <small>Pega un enlace de YouTube para empezar.</small>
            </div>
          }
        </div>
        <p class="player-note">Algunos videos no permiten reproducción incrustada.
          @if (watchUrl(); as url) {
            <a [href]="url" target="_blank" rel="noopener noreferrer">Abrir este video en YouTube ↗</a>
          }
        </p>
      </aside>
  `,
  styles: [`
    :host { position: fixed; right: 28px; bottom: 28px; z-index: 10; }
    .music-toggle { display: flex; align-items: center; gap: 10px; border: 1px solid #40503b; border-radius: 999px; padding: 12px 17px; background: #20281f; color: #f3f5ed; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 10px 35px #0005; }
    .music-icon { color: #c5f36b; font-size: 20px; line-height: 1; }
    .live-dot { width: 7px; height: 7px; border-radius: 50%; background: #c5f36b; box-shadow: 0 0 10px #c5f36b; }
    .drawer { position: absolute; right: 0; bottom: 64px; width: min(355px, calc(100vw - 32px)); padding: 23px; border: 1px solid #364138; border-radius: 20px; background: #171d18; box-shadow: 0 18px 60px #0009; color: #f3f5ed; }
    .drawer[hidden] { display: none; }
    .drawer-heading { display: flex; justify-content: space-between; align-items: flex-start; }
    .eyebrow { color: #c5f36b; font-size: 9px; font-weight: 700; letter-spacing: .17em; }
    h2 { margin: 5px 0 0; font-size: 22px; letter-spacing: -.04em; }
    .close-button { border: 0; background: transparent; color: #a5afa4; font-size: 25px; cursor: pointer; }
    .drawer-copy,.player-note { color: #9ca69b; font-size: 12px; line-height: 1.6; }
    .url-form { margin: 18px 0 13px; }
    label { display: block; margin-bottom: 8px; color: #c9d1c6; font-size: 11px; font-weight: 600; }
    .url-input-row { display: flex; gap: 7px; }
    input { width: 100%; min-width: 0; border: 1px solid #374239; border-radius: 10px; padding: 11px; background: #202821; color: #eef1e9; font: inherit; font-size: 12px; }
    input:focus { outline: 1px solid #c5f36b; }
    .url-input-row button { width: 42px; border: 0; border-radius: 10px; background: #c5f36b; color: #1c2517; font-size: 18px; cursor: pointer; }
    .error-message { margin: 7px 0 0; color: #ff9e8f; font-size: 11px; }
    .player-frame { position: relative; overflow: hidden; aspect-ratio: 16 / 9; border-radius: 12px; background: #0c100d; }
    .player-host { width: 100%; height: 100%; }
    .player-host iframe { width: 100%; height: 100%; border: 0; }
    .player-loading { position: absolute; inset: 0; display: grid; place-items: center; background: #0c100de8; color: #aab4a7; font-size: 11px; }
    .player-error { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 9px; padding: 22px; background: #0c100de8; text-align: center; }
    .player-error strong { color: #f0f3eb; font-size: 13px; }
    .player-error span { color: #aab4a7; font-size: 11px; line-height: 1.5; }
    .player-error a { color: #c5f36b; font-size: 11px; text-decoration: none; }
    .player-error a:hover { text-decoration: underline; }
    .player-empty { display: flex; height: 100%; flex-direction: column; align-items: center; justify-content: center; gap: 7px; color: #c5f36b; }
    .player-empty > span { font-size: 24px; }
    .player-empty strong { color: #e9eee4; font-size: 12px; font-weight: 600; }
    .player-empty small { color: #8d998a; font-size: 10px; }
    .player-note { margin-bottom: 0; font-size: 10px; }
    .player-note a { display: inline-block; margin-top: 5px; color: #c5f36b; text-decoration: none; }
    .player-note a:hover { text-decoration: underline; }
    @media (max-width: 520px) { :host { right: 16px; bottom: 16px; } }
  `],
})
export class YoutubeDrawerComponent implements OnDestroy {
  private readonly videoId = signal<string | undefined>('q1ULJ92aldE');
  private playerContainer: HTMLElement | undefined;
  private player: YouTubePlayer | undefined;
  private playerInitializing = false;

  readonly isOpen = signal(false);
  readonly error = signal('');
  readonly playerError = signal('');
  readonly playerReady = signal(false);
  readonly watchUrl = computed(() => {
    const videoId = this.videoId();
    return videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined;
  });
  youtubeUrl = '';

  @ViewChild('playerHost')
  set playerHost(ref: ElementRef<HTMLDivElement> | undefined) {
    this.playerContainer = ref?.nativeElement;
    if (this.playerContainer && this.isOpen() && this.videoId() && !this.player) {
      void this.initializePlayer();
    }
  }

  toggleDrawer(): void {
    this.isOpen.update((open) => !open);
    if (this.isOpen()) {
      void this.initializePlayer();
    } else {
      this.player?.pauseVideo();
    }
  }

  closeDrawer(): void {
    this.isOpen.set(false);
    this.player?.pauseVideo();
  }

  ngOnDestroy(): void {
    this.playerContainer = undefined;
    this.player?.destroy();
    this.player = undefined;
  }

  loadVideo(): void {
    const videoId = this.extractVideoId(this.youtubeUrl.trim());
    if (!videoId) {
      this.error.set('Pega un enlace válido de YouTube (youtube.com o youtu.be).');
      return;
    }
    this.playerError.set('');
    const playerIsReady = this.player !== undefined;
    this.videoId.set(videoId);
    this.playerReady.set(playerIsReady);
    if (playerIsReady && this.player) this.player.loadVideoById(videoId);
    else if (this.isOpen()) void this.initializePlayer();
    this.youtubeUrl = '';
    this.error.set('');
  }

  private async initializePlayer(): Promise<void> {
    const container = this.playerContainer;
    if (!container || !this.videoId() || this.player || this.playerInitializing) return;
    this.playerInitializing = true;
    this.playerReady.set(false);

    try {
      const api = await this.loadYouTubeApi();
      const videoId = this.videoId();
      if (container !== this.playerContainer || !videoId || this.player) return;
      this.player = new api.Player(container, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          enablejsapi: 1,
          origin: window.location.origin,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            this.playerReady.set(true);
            this.playerError.set('');
          },
          onError: (event) => this.handlePlayerError(event.data),
        },
      });
    } catch (error: unknown) {
      console.error('No se pudo cargar la API del reproductor de YouTube.', error);
      this.playerError.set('No se pudo conectar con YouTube. Revisa tu conexión o abre el video en YouTube.');
    } finally {
      this.playerInitializing = false;
    }
  }

  private loadYouTubeApi(): Promise<YouTubePlayerApi> {
    if (window.YT) return Promise.resolve(window.YT);
    if (youtubeApiPromise) return youtubeApiPromise;

    youtubeApiPromise = new Promise<YouTubePlayerApi>((resolve, reject) => {
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        try {
          previousCallback?.();
          if (window.YT) resolve(window.YT);
          else reject(new Error('YouTube cargó sin exponer la API del reproductor.'));
        } catch (error: unknown) {
          reject(error);
        }
      };

      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => reject(new Error('No se pudo descargar la API del reproductor de YouTube.'));
      document.head.appendChild(script);
    }).catch((error: unknown) => {
      youtubeApiPromise = undefined;
      throw error;
    });

    return youtubeApiPromise;
  }

  private handlePlayerError(code: number): void {
    this.playerReady.set(false);
    const messages: Record<number, string> = {
      2: 'El enlace no contiene un identificador de video válido.',
      5: 'El reproductor de YouTube no pudo decodificar este video. Puede depender del formato o del navegador; prueba abrirlo directamente en YouTube.',
      100: 'El video fue eliminado, es privado o no está disponible.',
      101: 'El propietario del video no permite reproducirlo dentro de otras páginas.',
      150: 'El propietario del video no permite reproducirlo dentro de otras páginas.',
      153: 'YouTube no pudo identificar el sitio. Revisa la configuración de privacidad o bloqueadores del navegador.',
    };
    this.playerError.set(
      messages[code] ?? `YouTube rechazó la reproducción (código ${code}). Prueba abrir el video directamente.`,
    );
  }

  private extractVideoId(value: string): string | undefined {
    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase();
      if (host === 'youtu.be') return this.validId(url.pathname.split('/').filter(Boolean)[0] ?? '');
      if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
        return undefined;
      }
      const path = url.pathname.split('/').filter(Boolean);
      const id = url.searchParams.get('v') ?? (['embed', 'shorts', 'live'].includes(path[0] ?? '') ? path[1] : undefined);
      return id ? this.validId(id) : undefined;
    } catch {
      return undefined;
    }
  }

  private validId(value: string): string | undefined {
    return /^[A-Za-z0-9_-]{11}$/.test(value) ? value : undefined;
  }
}
