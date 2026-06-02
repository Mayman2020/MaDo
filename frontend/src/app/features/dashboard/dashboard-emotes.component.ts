import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/services/auth.service';

interface EmoteRow {
  id: string;
  name: string;
  code: string;
  imageUrl: string;
  isActive: boolean;
  tierRequired: string | null;
  isSubscriberOnly: boolean;
}

@Component({
  selector: 'mado-dashboard-emotes',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <h1 class="mado-heading">Emotes</h1>

      <section class="mado-card block">
        <h2>My Emotes</h2>
        @if (emotes.length === 0) {
          <p class="muted">No emotes uploaded yet.</p>
        } @else {
          <div class="emote-grid">
            @for (e of emotes; track e.id) {
              <div class="em-card mado-card">
                <img [src]="e.imageUrl" [alt]="e.code" class="em-img" />
                <span class="em-code">:{{ e.code }}:</span>
                <span class="em-tier">{{ e.tierRequired || 'Free' }}</span>
                <div class="em-actions">
                  <button class="btn danger small" (click)="removeEmote(e.id)">Delete</button>
                </div>
              </div>
            }
          </div>
        }
      </section>

      <section class="mado-card block">
        <h2>Upload New Emote</h2>
        <div class="col">
          <div class="field">
            <label>Name</label>
            <input [(ngModel)]="newName" placeholder="PogChamp" />
          </div>
          <div class="field">
            <label>Code (used in chat)</label>
            <input [(ngModel)]="newCode" placeholder="mado_Pog" />
          </div>
          <div class="field">
            <label>Image URL (PNG, square)</label>
            <input [(ngModel)]="newUrl" placeholder="https://cdn.example.com/emote.png" />
          </div>
          <div class="field">
            <label>Tier</label>
            <select [(ngModel)]="newTier">
              <option value="">Free (all viewers)</option>
              <option value="TIER1">Tier 1</option>
              <option value="TIER2">Tier 2</option>
              <option value="TIER3">Tier 3</option>
            </select>
          </div>
          @if (newUrl) {
            <div class="preview">
              <img [src]="newUrl" alt="preview" class="preview-img" />
              <span class="preview-label">Preview</span>
            </div>
          }
          <button class="btn" (click)="addEmote()" [disabled]="!newCode || !newUrl">Upload Emote</button>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { max-width: 800px; margin: 0 auto; padding: 1rem 1rem 3rem; }
    h1 { color: var(--accent); font-size: 2rem; margin: 0 0 1.25rem; }
    h2 { font-size: 1.1rem; margin: 0 0 .75rem; }
    .block { padding: 1.25rem; margin-bottom: 1rem; }
    .muted { color: var(--text-muted); }
    .emote-grid { display: flex; flex-wrap: wrap; gap: .75rem; }
    .em-card { padding: .75rem; display: flex; flex-direction: column; align-items: center; gap: .35rem; min-width: 96px; }
    .em-img { width: 64px; height: 64px; object-fit: contain; border-radius: 8px; background: var(--bg-tertiary); }
    .em-code { font-size: .78rem; color: var(--accent); font-family: monospace; }
    .em-tier { font-size: .72rem; color: var(--text-muted); }
    .col { display: flex; flex-direction: column; gap: .75rem; max-width: 420px; }
    .field { display: grid; gap: .3rem; }
    label { font-size: .85rem; color: var(--text-secondary); }
    input, select { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); padding: .5rem .65rem; font-family: inherit; }
    .preview { display: flex; align-items: center; gap: .75rem; }
    .preview-img { width: 64px; height: 64px; object-fit: contain; border-radius: 8px; background: var(--bg-tertiary); }
    .preview-label { font-size: .85rem; color: var(--text-muted); }
    .btn { border: none; border-radius: 8px; background: var(--accent); color: #000; font-weight: 700; padding: .5rem 1rem; cursor: pointer; font-family: inherit; }
    .btn:disabled { opacity: .5; cursor: default; }
    .btn.danger { background: transparent; border: 1px solid var(--danger); color: var(--danger); }
    .btn.small { padding: .25rem .6rem; font-size: .78rem; }
  `]
})
export class DashboardEmotesComponent implements OnInit {
  emotes: EmoteRow[] = [];
  newName = '';
  newCode = '';
  newUrl = '';
  newTier = '';

  constructor(
    private readonly auth: AuthService,
    private readonly http: HttpClient,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const u = this.auth.currentUser$.value;
    if (!u) return;
    this.http.get<EmoteRow[]>(`/api/channels/${u.username}/emotes`).subscribe({
      next: (e) => (this.emotes = e ?? []),
      error: () => {}
    });
  }

  addEmote(): void {
    const u = this.auth.currentUser$.value;
    if (!u || !this.newCode || !this.newUrl) return;
    const body = { name: this.newName || this.newCode, code: this.newCode, imageUrl: this.newUrl, tierRequired: this.newTier || null };
    this.http.post<EmoteRow>(`/api/channels/${u.username}/emotes`, body).subscribe({
      next: (e) => {
        this.emotes.push(e);
        this.newName = ''; this.newCode = ''; this.newUrl = ''; this.newTier = '';
        this.toastr.success('Emote added');
      },
      error: () => this.toastr.error('Could not add emote')
    });
  }

  removeEmote(id: string): void {
    const u = this.auth.currentUser$.value;
    if (!u || !confirm('Delete this emote?')) return;
    this.http.delete(`/api/channels/${u.username}/emotes/${id}`).subscribe({
      next: () => {
        this.emotes = this.emotes.filter(e => e.id !== id);
        this.toastr.success('Emote removed');
      },
      error: () => this.toastr.error('Could not remove emote')
    });
  }
}
