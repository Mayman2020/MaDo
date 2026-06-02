import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService, UserPublicDto } from '../../core/services/user.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'mado-settings-profile',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h2 class="section-title">Profile</h2>

    @if (me) {
      <!-- Banner -->
      <section class="mado-card block">
        <h3>Profile Banner</h3>
        <div class="banner-wrap" (click)="bannerInput.click()">
          @if (bannerPreview || me.bannerUrl) {
            <img class="banner-img" [src]="bannerPreview || me.bannerUrl" alt="Banner" />
          } @else {
            <div class="banner-ph">
              <span class="ph-icon">🖼</span>
              <span>Click to upload a banner image</span>
            </div>
          }
          <div class="banner-overlay">Change Banner</div>
        </div>
        <input #bannerInput type="file" accept="image/*" class="hidden-input" (change)="onBannerPick($event)" />
        @if (bannerFile) {
          <div class="file-actions">
            <span class="fname">{{ bannerFile.name }}</span>
            <button class="btn-sm" [disabled]="uploadingBanner" (click)="saveBanner()">
              {{ uploadingBanner ? 'Uploading…' : 'Upload Banner' }}
            </button>
            <button class="btn-sm secondary" (click)="cancelBanner()">Cancel</button>
          </div>
        }
      </section>

      <!-- Avatar -->
      <section class="mado-card block">
        <h3>Profile Picture</h3>
        <div class="avatar-row">
          <div class="avatar-wrap" (click)="avatarInput.click()">
            @if (avatarPreview || me.avatarUrl) {
              <img class="avatar-img" [src]="avatarPreview || me.avatarUrl" alt="Avatar" />
            } @else {
              <div class="avatar-ph">
                <span>{{ (me.displayName || me.username).charAt(0).toUpperCase() }}</span>
              </div>
            }
            <div class="avatar-overlay">Change</div>
          </div>
          <div class="avatar-info">
            <div class="name">{{ me.displayName || me.username }}</div>
            <p class="muted">Click the avatar to pick a new image (JPG, PNG, GIF — max 5 MB).</p>
            @if (avatarFile) {
              <div class="file-actions">
                <span class="fname">{{ avatarFile.name }}</span>
                <button class="btn-sm" [disabled]="uploadingAvatar" (click)="saveAvatar()">
                  {{ uploadingAvatar ? 'Uploading…' : 'Upload Avatar' }}
                </button>
                <button class="btn-sm secondary" (click)="cancelAvatar()">Cancel</button>
              </div>
            }
          </div>
        </div>
        <input #avatarInput type="file" accept="image/*" class="hidden-input" (change)="onAvatarPick($event)" />
      </section>

      <!-- Display name -->
      <section class="mado-card block">
        <h3>Display Name</h3>
        <input type="text" [(ngModel)]="displayName" maxlength="50" class="inp" placeholder="Your display name" />
      </section>

      <!-- Bio -->
      <section class="mado-card block">
        <h3>Bio</h3>
        <textarea [(ngModel)]="bio" rows="4" maxlength="2000" class="inp ta"
                  placeholder="Tell viewers about your channel"></textarea>
        <div class="char-count">{{ bio.length }}/2000</div>
      </section>

      <button type="button" class="btn" [disabled]="saving" (click)="save()">
        {{ saving ? 'Saving…' : 'Save Changes' }}
      </button>
    }
  `,
  styles: [`
    .section-title { font-size: 1.35rem; margin: 0 0 1rem; color: var(--text-primary); }
    h3 { font-size: 1rem; margin: 0 0 .75rem; color: var(--text-secondary); font-weight: 600; }
    .block { padding: 1.25rem; margin-bottom: 1rem; }
    .hidden-input { display: none; }

    /* Banner */
    .banner-wrap {
      position: relative; width: 100%; max-width: 760px; aspect-ratio: 5/1; border-radius: 12px;
      overflow: hidden; cursor: pointer; border: 2px dashed var(--border);
      background: var(--bg-tertiary);
    }
    .banner-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .banner-ph {
      width: 100%; height: 100%; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: .5rem;
      color: var(--text-muted); font-size: .9rem;
    }
    .ph-icon { font-size: 2rem; }
    .banner-overlay {
      position: absolute; inset: 0; background: rgba(0,0,0,.5); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: .95rem; opacity: 0; transition: opacity .2s;
    }
    .banner-wrap:hover .banner-overlay { opacity: 1; }

    /* Avatar */
    .avatar-row { display: flex; align-items: flex-start; gap: 1.5rem; flex-wrap: wrap; }
    .avatar-wrap {
      position: relative; width: 96px; height: 96px; border-radius: 50%;
      cursor: pointer; flex-shrink: 0; overflow: hidden;
      border: 3px solid var(--border);
    }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; }
    .avatar-ph {
      width: 100%; height: 100%; background: var(--bg-tertiary);
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem; font-weight: 800; color: var(--accent);
    }
    .avatar-overlay {
      position: absolute; inset: 0; background: rgba(0,0,0,.55); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: .78rem; opacity: 0; transition: opacity .2s;
    }
    .avatar-wrap:hover .avatar-overlay { opacity: 1; }
    .avatar-info { flex: 1; }
    .name { font-weight: 800; font-size: 1.05rem; margin-bottom: .25rem; }
    .muted { color: var(--text-secondary); margin: 0 0 .75rem; font-size: .88rem; }

    /* File actions */
    .file-actions { display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; margin-top: .6rem; }
    .fname { font-size: .82rem; color: var(--text-muted); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .btn-sm {
      background: var(--accent); color: #000; border: none; border-radius: 8px;
      font-weight: 800; padding: .35rem .85rem; cursor: pointer; font-family: inherit; font-size: .85rem;
    }
    .btn-sm.secondary { background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border); }
    .btn-sm:disabled { opacity: .5; cursor: not-allowed; }

    /* Form inputs */
    .inp {
      width: 100%; max-width: 540px; background: var(--bg-tertiary);
      border: 1px solid var(--border); border-radius: 10px;
      padding: .55rem .75rem; color: var(--text-primary); font-family: inherit;
      outline: none; transition: border-color .2s;
    }
    .inp:focus { border-color: var(--accent); }
    .ta { resize: vertical; min-height: 100px; max-width: 100%; }
    .char-count { font-size: .78rem; color: var(--text-muted); margin-top: .35rem; }

    .btn {
      background: var(--accent); color: #000; border: none; border-radius: 10px;
      font-weight: 800; padding: .6rem 1.5rem; cursor: pointer; font-family: inherit; font-size: 1rem;
    }
    .btn:disabled { opacity: .6; cursor: not-allowed; }
  `]
})
export class SettingsProfileComponent implements OnInit {
  @ViewChild('avatarInput') avatarInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('bannerInput') bannerInputRef!: ElementRef<HTMLInputElement>;

  me: UserPublicDto | null = null;
  displayName = '';
  bio = '';
  saving = false;

  avatarFile: File | null = null;
  avatarPreview: string | null = null;
  uploadingAvatar = false;

  bannerFile: File | null = null;
  bannerPreview: string | null = null;
  uploadingBanner = false;

  constructor(
    private readonly auth: AuthService,
    private readonly users: UserService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const u = this.auth.currentUser$.value;
    if (!u) return;
    this.users.getByUsername(u.username).subscribe({
      next: (r) => {
        this.me = r;
        this.displayName = r.displayName ?? '';
        this.bio = r.bio ?? '';
      },
      error: () => {
        this.me = {
          id: u.id, username: u.username, email: u.email,
          displayName: u.displayName, avatarUrl: u.avatarUrl ?? null,
          bannerUrl: null, bio: null, role: u.role, isVerified: u.isVerified
        };
        this.displayName = u.displayName ?? '';
        this.bio = '';
      }
    });
  }

  onAvatarPick(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.toastr.error('Image must be under 5 MB'); return; }
    this.avatarFile = file;
    const reader = new FileReader();
    reader.onload = (e) => this.avatarPreview = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  onBannerPick(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.toastr.error('Image must be under 5 MB'); return; }
    this.bannerFile = file;
    const reader = new FileReader();
    reader.onload = (e) => this.bannerPreview = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  saveAvatar(): void {
    const u = this.auth.currentUser$.value;
    if (!u || !this.avatarFile) return;
    this.uploadingAvatar = true;
    this.users.uploadAvatar(u.username, this.avatarFile).subscribe({
      next: (r) => {
        this.me = { ...this.me!, avatarUrl: r.avatarUrl };
        this.avatarPreview = null;
        this.avatarFile = null;
        this.uploadingAvatar = false;
        this.auth.updateLocalUser({ ...u, avatarUrl: r.avatarUrl ?? undefined });
        this.toastr.success('Avatar updated!');
      },
      error: () => { this.uploadingAvatar = false; this.toastr.error('Upload failed'); }
    });
  }

  saveBanner(): void {
    const u = this.auth.currentUser$.value;
    if (!u || !this.bannerFile) return;
    this.uploadingBanner = true;
    this.users.uploadBanner(u.username, this.bannerFile).subscribe({
      next: (r) => {
        this.me = { ...this.me!, bannerUrl: r.bannerUrl ?? null };
        this.bannerPreview = null;
        this.bannerFile = null;
        this.uploadingBanner = false;
        this.toastr.success('Banner updated!');
      },
      error: () => { this.uploadingBanner = false; this.toastr.error('Upload failed'); }
    });
  }

  cancelAvatar(): void {
    this.avatarFile = null;
    this.avatarPreview = null;
    if (this.avatarInputRef) this.avatarInputRef.nativeElement.value = '';
  }

  cancelBanner(): void {
    this.bannerFile = null;
    this.bannerPreview = null;
    if (this.bannerInputRef) this.bannerInputRef.nativeElement.value = '';
  }

  save(): void {
    const u = this.auth.currentUser$.value;
    if (!u) return;
    this.saving = true;
    this.users.patchProfile(u.username, { displayName: this.displayName, bio: this.bio }).subscribe({
      next: (r) => {
        this.me = { ...this.me!, displayName: r.displayName, bio: r.bio };
        this.saving = false;
        this.toastr.success('Profile updated');
        const cur = this.auth.currentUser$.value;
        if (cur) this.auth.updateLocalUser({ ...cur, displayName: r.displayName ?? cur.displayName });
      },
      error: () => { this.saving = false; this.toastr.error('Could not save'); }
    });
  }
}
