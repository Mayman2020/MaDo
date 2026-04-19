import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { VideoPlayerService } from '../../../core/services/video-player.service';

@Component({
  selector: 'mado-video-player',
  standalone: true,
  template: `
    <div class="wrap">
      <video #video class="video" controls playsinline></video>
    </div>
  `,
  styles: [`
    .wrap { background: #000; border-radius: 12px; overflow: hidden; }
    .video { width: 100%; max-height: 70vh; display: block; }
  `]
})
export class VideoPlayerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @Input({ required: true }) src!: string;

  constructor(private readonly player: VideoPlayerService) {}

  ngAfterViewInit(): void {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] && this.videoRef) {
      this.load();
    }
  }

  private load(): void {
    if (this.videoRef?.nativeElement && this.src) {
      this.player.initHls(this.videoRef.nativeElement, this.src);
    }
  }

  ngOnDestroy(): void {
    this.player.destroy();
  }
}
