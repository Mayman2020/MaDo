import { Injectable } from '@angular/core';
import Hls from 'hls.js';

@Injectable({ providedIn: 'root' })
export class VideoPlayerService {
  private hls: Hls | null = null;

  initHls(video: HTMLVideoElement, src: string): void {
    this.destroy();
    if (Hls.isSupported()) {
      this.hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      this.hls.loadSource(src);
      this.hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    }
  }

  setQuality(level: number): void {
    if (this.hls && this.hls.levels[level]) {
      this.hls.currentLevel = level;
    }
  }

  getQualities(): { height: number; name: string }[] {
    if (!this.hls) {
      return [];
    }
    return this.hls.levels.map((l, i) => ({ height: l.height, name: l.height ? `${l.height}p` : `Level ${i}` }));
  }

  destroy(): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
  }
}
